import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { codeBlock, oneLine } from 'common-tags';
import GPT3Tokenizer from 'gpt3-tokenizer';
import {
  Configuration,
  OpenAIApi,
  CreateModerationResponse,
  CreateEmbeddingResponse,
  ChatCompletionRequestMessage,
} from 'openai-edge';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { ApplicationError, UserError } from '../../lib/errors';

// Constants
const EMBEDDING_MODEL = 'text-embedding-ada-002';
const CHAT_MODEL = 'gpt-4-mini';
const MAX_TOKENS = 512;
const TEMPERATURE = 0;
const MATCH_THRESHOLD = 0.78;
const MATCH_COUNT = 10;
const MIN_CONTENT_LENGTH = 50;

// OpenAI Configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

// Supabase Configuration
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'edge';

async function moderateContent(query: string): Promise<void> {
  const moderationResponse: CreateModerationResponse = await openai
    .createModeration({ input: query })
    .then((res) => res.json())

  const [results] = moderationResponse.results;

  if (results.flagged) {
    throw new UserError('Flagged content', {
      flagged: true,
      categories: results.categories,
    });
  }
}

async function createEmbedding(query: string): Promise<CreateEmbeddingResponse> {
  const embeddingResponse = await openai.createEmbedding({
    model: EMBEDDING_MODEL,
    input: query.replaceAll('\n', ' '),
  });

  if (embeddingResponse.status !== 200) {
    throw new ApplicationError('Failed to create embedding for question', embeddingResponse);
  }

  return embeddingResponse.json();
}

async function matchPageSections(embedding: number[]) {
  const { error: matchError, data: pageSections } = await supabaseClient.rpc(
    'match_page_sections',
    {
      embedding,
      match_threshold: MATCH_THRESHOLD,
      match_count: MATCH_COUNT,
      min_content_length: MIN_CONTENT_LENGTH,
    }
  );

  if (matchError) {
    throw new ApplicationError('Failed to match page sections', matchError);
  }

  return pageSections;
}

function generatePrompt(contextText: string, sanitizedQuery: string): string {
  return codeBlock`
    ${oneLine`
      You are a very enthusiastic Supabase representative who loves
      to help people! Given the following sections from the Supabase
      documentation, answer the question using only that information,
      outputted in markdown format. If you are unsure and the answer
      is not explicitly written in the documentation, say
      "Sorry, I don't know how to help with that."
    `}

    Context sections:
    ${contextText}

    Question: """
    ${sanitizedQuery}
    """

    Answer as markdown (including related code snippets if available):
  `
};

export default async function handler(req: NextRequest) {
  try {
    if (req.method !== 'POST') {
      return new NextResponse('Method Not Allowed', { status: 405 });
    }

    const { prompt: query } = await req.json();

    if (typeof query !== 'string' || query.length === 0) {
      throw new UserError('Invalid query: must be a non-empty string');
    }

    const sanitizedQuery = query.trim();

    await moderateContent(sanitizedQuery);

    const { data: [{ embedding }] } = await createEmbedding(sanitizedQuery);

    const pageSections = await matchPageSections(embedding);

    const tokenizer = new GPT3Tokenizer({ type: 'gpt3' });
    let tokenCount = 0;
    let contextText = '';

    for (let i = 0; i < pageSections.length; i++) {
      const pageSection = pageSections[i];
      const content = pageSection.content;
      const encoded = tokenizer.encode(content);
      tokenCount += encoded.text.length;

      if (tokenCount >= 1500) {
        break;
      }

      contextText += `${content.trim()}\n---\n`;
    }

    const prompt = generatePrompt(contextText, sanitizedQuery);

    const chatMessage: ChatCompletionRequestMessage = {
      role: 'user',
      content: prompt,
    };

    const response = await openai.createChatCompletion({
      model: CHAT_MODEL,
      messages: [chatMessage],
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      stream: true,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApplicationError('Failed to generate completion', error);
    }

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return NextResponse.json(
        {
          error: err.message,
          data: err.data,
        },
        { status: 400 }
      );
    } else if (err instanceof ApplicationError) {
      console.error(`${err.message}: ${JSON.stringify(err.data)}`);
      return NextResponse.json(
        { error: 'There was an error processing your request' },
        { status: 500 }
      );
    } else if (err instanceof Error) {
      console.error(`Unexpected error: ${err.message}`);
      return NextResponse.json(
        { error: 'An unexpected error occurred' },
        { status: 500 }
      );
    } else {
      console.error('An unknown error occurred', err);
      return NextResponse.json(
        { error: 'An unknown error occurred' },
        { status: 500 }
      );
    }
  }
}