'use client';

import { useEffect, useState, useRef } from 'react';
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
  tavilyImages: { url: string; title: string }[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const { apiProvider } = useSettings();
  const searchInProgress = useRef<string | null>(null);
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    refinedQuery: '',
    answer: '',
    sources: [],
    reasoning: '',
    isLoading: false,
    error: null,
    relatedSearches: [],
    tavilyImages: [],
  });

  const handleSearch = async (query: string) => {
    // Skip if this exact search is already in progress
    if (searchInProgress.current === query) {
      return;
    }
    searchInProgress.current = query;

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
      tavilyImages: [],
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

      const refined_query = refineData.refined_query.trim();
      const refineExplanation = refineData.explanation;

      // Then perform the search with the refined query
      const searchResponse = await fetch('/api/tavily/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: refined_query }),
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

      // Start both summarization and image scraping in parallel
      const [summarizeResponse, imagesResponse] = await Promise.all([
        fetch(`/api/${apiProvider}/summarize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: refined_query,
            results: searchData.results,
            refinedQuery: refined_query,
            reasoning: refineExplanation
          }),
        }),
        fetch('/api/scrape/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            urls: searchData.results.map((source: Source) => source.url)
          }),
        })
      ]);

      // Parse responses in parallel
      const [summaryData, imagesData] = await Promise.all([
        summarizeResponse.json(),
        imagesResponse.ok ? imagesResponse.json() : { results: [] }
      ]);

      if (!summarizeResponse.ok) {
        const errorMsg = summaryData.error || 'Failed to summarize results';
        console.error('Summarize error:', {
          status: summarizeResponse.status,
          error: errorMsg,
          query: refined_query
        });
        throw new Error(errorMsg);
      }

      // Process source images if available
      const sourcesWithImages = imagesResponse.ok 
        ? searchData.results.map((source: Source) => {
            const imageResult = imagesData.results.find((r: any) => r.url === source.url);
            return {
              ...source,
              images: imageResult?.images || [],
            };
          })
        : searchData.results;

      // Update state with all results at once
      setSearchState(prev => ({
        ...prev,
        refinedQuery: refined_query,
        reasoning: refineExplanation,
        answer: summaryData.answer,
        sources: sourcesWithImages,
        relatedSearches: summaryData.relatedSearches || [],
        tavilyImages: searchData.images || [],
        isLoading: false,
      }));

    } catch (error) {
      console.error('Search workflow error:', error);
      setSearchState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        isLoading: false,
      }));
    } finally {
      searchInProgress.current = null;
    }
  };

  useEffect(() => {
    const query = searchParams.get('q');
    if (query && !searchInProgress.current) {
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
                tavilyImages={searchState.tavilyImages}
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
