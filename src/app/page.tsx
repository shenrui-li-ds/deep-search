'use client';

import { useState } from 'react';
import { SearchInput } from '@/components/SearchInput';
import { SearchResults } from '@/components/SearchResults';
import { Layout } from '@/components/Layout';
import { useRouter } from 'next/navigation';

interface SearchResult {
  url: string;
  title: string;
  content: string;
  score: number;
}

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-5xl font-bold mb-8 text-gray-900 dark:text-white">
          DeepSearch
        </h1>
        <div className="w-full">
          <SearchInput onSearch={handleSearch} isLoading={isLoading} showSuggestions />
        </div>
        <div className="mt-12 space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Try searching for:
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              "What is quantum computing",
              "Latest AI developments",
              "Climate change solutions",
              "Space exploration news"
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSearch(suggestion)}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
