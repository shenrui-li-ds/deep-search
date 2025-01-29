'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchInput } from '@/components/SearchInput';
import { SearchResults } from '@/components/SearchResults';
import { Sidebar } from '@/components/Sidebar';

interface Source {
  title: string;
  url: string;
  snippet: string;
}

interface SearchState {
  query: string;
  refinedQuery: string;
  answer: string;
  sources: Source[];
  reasoning: string;
  isLoading: boolean;
  error: string | null;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    refinedQuery: '',
    answer: '',
    sources: [],
    reasoning: '',
    isLoading: false,
    error: null,
  });

  const handleSearch = async (query: string) => {
    setSearchState(prev => ({ 
      ...prev, 
      query,
      refinedQuery: '',
      isLoading: true, 
      error: null,
      answer: '',
      sources: [],
      reasoning: '' 
    }));

    try {
      // First, refine the query
      const refineResponse = await fetch('/api/openai/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, model: 'gpt-4o' }),
      });

      if (!refineResponse.ok) {
        throw new Error('Failed to refine query');
      }

      const { refinedQuery } = await refineResponse.json();
      
      setSearchState(prev => ({
        ...prev,
        refinedQuery
      }));

      // Then, get search results from Tavily
      const searchResponse = await fetch('/api/tavily/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: refinedQuery }),
      });

      if (!searchResponse.ok) {
        throw new Error('Failed to fetch search results');
      }

      const searchData = await searchResponse.json();

      // Choose the API endpoint based on the model
      const model = 'o1-mini';
      const summaryEndpoint = model.startsWith('o1') ? '/api/openai/summarize' : '/api/deepseek/summarize';
      
      // Get the summary from the appropriate API
      const summaryResponse = await fetch(summaryEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          searchResults: searchData.results,
          model: model
        }),
      });

      if (!summaryResponse.ok) {
        throw new Error('Failed to generate summary');
      }

      const { summary, reasoning } = await summaryResponse.json();

      setSearchState(prev => ({
        ...prev,
        isLoading: false,
        answer: summary || '',
        sources: searchData.results.map((result: any) => ({
          title: result.title,
          url: result.url,
          snippet: result.content
        })),
        reasoning: reasoning || '',
      }));
    } catch (error) {
      console.error('Search error:', error);
      setSearchState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  };

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      handleSearch(query);
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 ml-64">
        <div className="max-w-3xl mx-auto px-4 py-8 pb-32">
          {searchState.error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 rounded-lg">
              {searchState.error}
            </div>
          )}
          
          {(searchState.answer || searchState.isLoading) && (
            <div className="mb-8">
              <SearchResults
                query={searchState.query}
                refinedQuery={searchState.refinedQuery}
                answer={searchState.answer}
                sources={searchState.sources}
                reasoning={searchState.reasoning}
                isLoading={searchState.isLoading}
              />
            </div>
          )}

          <div className="fixed bottom-8 left-64 right-0 px-4">
            <div className="max-w-3xl mx-auto">
              <SearchInput
                onSearch={handleSearch}
                isLoading={searchState.isLoading}
                showSuggestions={true}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
