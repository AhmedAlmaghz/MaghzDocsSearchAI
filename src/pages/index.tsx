import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import styles from '../styles/Home.module.css';
import { SearchDialog } from '../components/SearchDialog';
import { ThemeToggle } from '../components/ThemeToggle';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  return (
    <>
      <Head>
        <title>قالب Next.js مع OpenAI</title>
        <meta
          name="description"
          content="قالب Next.js لبناء تطبيقات OpenAI مع Supabase."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <div className={styles.center}>
          <SearchDialog />
        </div>

        <div className="py-8 w-full flex items-center justify-center space-x-6">
          <div className="opacity-75 transition hover:opacity-100">
            <Link href="https://supabase.com" className="flex items-center justify-center">
              <span className="text-base ml-2">مدعوم بواسطة Supabase</span>
              <Image src="/supabase.svg" width={20} height={20} alt="شعار Supabase" priority />
            </Link>
          </div>
          <div className="border-l border-gray-300 w-1 h-4" aria-hidden="true" />
          <div className="flex items-center justify-center space-x-4">
            <Link
              href="https://github.com/supabase/supabase"
              className="opacity-75 transition hover:opacity-100"
              aria-label="Supabase على GitHub"
            >
              <Image src="/github.svg" width={20} height={20} alt="شعار GitHub" priority />
            </Link>
            <Link
              href="https://twitter.com/supabase"
              className="opacity-75 transition hover:opacity-100"
              aria-label="Supabase على Twitter"
            >
              <Image src="/twitter.svg" width={20} height={20} alt="شعار Twitter" priority />
            </Link>
          </div>
        </div>

        <div className="fixed top-4 right-4">
          <ThemeToggle />
        </div>
      </main>
    </>
  )
}