'use client'

import * as React from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { useCompletion } from 'ai/react';
import { X, Loader, User, Frown, CornerDownLeft, Search, Wand } from 'lucide-react';
import { useTheme } from 'next-themes';

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState<string>('');
  const { theme } = useTheme();
  const [shortcutKey, setShortcutKey] = React.useState<string>('K');

  const { complete, completion, isLoading, error } = useCompletion({
    api: '/api/vector-search',
  });

  React.useEffect(() => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    setShortcutKey(isMac ? '⌘' : 'Ctrl');
  }, []);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleModalToggle = React.useCallback(() => {
    setOpen((prevOpen) => !prevOpen);
    setQuery('');
  }, []);

  const handleSubmit = React.useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    complete(query);
  }, [complete, query]);

  return (
    <>
      <Button
        onClick={handleModalToggle}
        className="text-base flex gap-2 items-center px-4 py-2 z-50 relative
        text-slate-500 dark:text-slate-400  hover:text-slate-700 dark:hover:text-slate-300
        transition-colors
        rounded-md
        border border-slate-200 dark:border-slate-500 hover:border-slate-300 dark:hover:border-slate-500
        min-w-[300px] "
      >
        <Search className="w-4 h-4" />
        <span className="border border-l h-5"></span>
        <span className="inline-block ml-4">البحث...</span>
        <kbd
          className="absolute right-3 top-2.5
          pointer-events-none inline-flex h-5 select-none items-center gap-1
          rounded border border-slate-100 bg-slate-100 px-1.5
          font-mono text-[10px] font-medium
          text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400
          opacity-100 "
        >
          <span className="text-xs">{shortcutKey}</span>K
        </kbd>{' '}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[850px] max-h-[80vh] overflow-y-auto text-black dark:text-white">
          <DialogHeader>
            <DialogTitle>البحث في الوثائق</DialogTitle>
            <DialogDescription>
              ابحث في وثائق Supabase باستخدام OpenAI.
            </DialogDescription>
            <hr />
            <button
              className="absolute top-0 right-2 p-2"
              onClick={handleModalToggle}
              aria-label="إغلاق"
            >
              <X className="h-4 w-4 dark:text-gray-100" />
            </button>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 text-slate-700 dark:text-slate-300">
              {query && (
                <div className="flex gap-4">
                  <span className="bg-slate-100 dark:bg-slate-700 p-2 w-8 h-8 rounded-full text-center flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </span>
                  <p className="mt-0.5 font-semibold">{query}</p>
                </div>
              )}

              {isLoading && (
                <div className="animate-spin relative flex w-5 h-5 ml-2">
                  <Loader />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-4">
                  <span className="bg-red-100 dark:bg-red-900 p-2 w-8 h-8 rounded-full text-center flex items-center justify-center">
                    <Frown className="w-4 h-4" />
                  </span>
                  <span>
                    عذرًا، حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.
                  </span>
                </div>
              )}

              {completion && !error ? (
                <div className="flex items-center gap-4 dark:text-white">
                  <span className="bg-green-500 p-2 w-8 h-8 rounded-full text-center flex items-center justify-center">
                    <Wand className="w-4 h-4 text-white" />
                  </span>
                  <h3 className="font-semibold">الإجابة:</h3>
                  {completion}
                </div>
              ) : null}

              <div className="relative">
                <Input
                  placeholder="اطرح سؤالاً..."
                  name="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="col-span-3"
                />
                <CornerDownLeft
                  className={`absolute top-3 right-5 h-4 w-4 text-gray-300 transition-opacity ${
                    query ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                أو جرب:{' '}
                <button
                  type="button"
                  className="px-1.5 py-0.5
                  bg-slate-50 dark:bg-gray-800
                  hover:bg-slate-100 dark:hover:bg-gray-700
                  rounded border border-slate-200 dark:border-slate-600
                  transition-colors"
                  onClick={() => setQuery('ما هي التضمينات؟')}
                >
                  ما هي التضمينات؟
                </button>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white">
                بحث
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}