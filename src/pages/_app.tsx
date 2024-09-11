import { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import { Inter } from 'next/font/google';
import Head from 'next/head';
import '../styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <main className={`${inter.variable} font-sans`}>
          <Component {...pageProps} />
        </main>
      </ThemeProvider>
    </>
  )
}