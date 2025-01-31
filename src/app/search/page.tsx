'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchInput } from '@/components/SearchInput';
import { SearchResults } from '@/components/SearchResults';
import { Sidebar } from '@/components/Sidebar';
import { useSettings } from '@/lib/settings-context';
import { refineSearchQueryPrompt } from '@/lib/prompts';

interface Source {
  title: string;
  url: string;
  snippet: string;
  images?: { src: string; alt: string }[];
}

interface SearchState {
  query: string;
  refinedQuery: string;
  answer: string;
  sources: Source[];
  reasoning: string;
  isLoading: boolean;
  error: string | null;
  relatedSearches: { query: string }[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const { apiProvider } = useSettings();
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    refinedQuery: '',
    answer: '',
    sources: [],
    reasoning: '',
    isLoading: false,
    error: null,
    relatedSearches: [],
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
      reasoning: '',
      relatedSearches: [],
    }));

    try {
      // First, refine the query using the selected provider
      const refineResponse = await fetch(`/api/${apiProvider}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const refineData = await refineResponse.json();

      if (!refineResponse.ok) {
        const errorMsg = refineData.error || 'Failed to refine query';
        console.error('Refine error:', { status: refineResponse.status, error: errorMsg });
        throw new Error(errorMsg);
      }

      if (!refineData.refined_query) {
        console.error('Invalid refine response:', refineData);
        throw new Error('Invalid response from refinement service');
      }

      const refined_query = refineData.refined_query;
      const refineExplanation = refineData.explanation;

      // Then perform the search with the refined query
      const searchResponse = await fetch('/api/tavily/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: refined_query.trim()
        }),
      });

      const searchData = await searchResponse.json();

      if (!searchResponse.ok) {
        const errorMsg = searchData.error || 'Failed to get search results';
        console.error('Search error:', {
          status: searchResponse.status,
          error: errorMsg,
          query: refined_query
        });
        throw new Error(errorMsg);
      }

      if (!searchData.results) {
        console.error('No search results:', {
          response: searchData,
          query: refined_query
        });
        throw new Error('No search results found');
      }

      // Then, summarize the results using the selected provider
      const summarizeResponse = await fetch(`/api/${apiProvider}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: refined_query.trim(),
          results: searchData.results,
          refinedQuery: refined_query,
          reasoning: refineExplanation
        }),
      });

      const summaryData = await summarizeResponse.json();

      if (!summarizeResponse.ok) {
        const errorMsg = summaryData.error || 'Failed to summarize results';
        console.error('Summarize error:', {
          status: summarizeResponse.status,
          error: errorMsg,
          query: refined_query
        });
        throw new Error(errorMsg);
      }

      // Update state with all results at once
      setSearchState(prev => ({
        ...prev,
        refinedQuery: refined_query,
        reasoning: refineExplanation,
        answer: summaryData.answer,
        sources: searchData.results,
        relatedSearches: summaryData.relatedSearches || [],
        isLoading: false,
      }));

      // Fetch images for sources after main state update
      const sourceUrls = searchData.results.map((source: Source) => source.url);
      const imagesResponse = await fetch('/api/scrape/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: sourceUrls }),
      });

      if (imagesResponse.ok) {
        const imagesData = await imagesResponse.json();
        const sourcesWithImages = searchData.results.map((source: Source) => {
          const imageResult = imagesData.results.find((r: any) => r.url === source.url);
          return {
            ...source,
            images: imageResult?.images || [],
          };
        });

        setSearchState(prev => ({
          ...prev,
          sources: sourcesWithImages,
        }));
      } else {
        console.error('Failed to fetch images:', await imagesResponse.text());
      }
    } catch (error) {
      console.error('Search workflow error:', error);
      setSearchState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        isLoading: false,
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
                relatedSearches={searchState.relatedSearches}
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
