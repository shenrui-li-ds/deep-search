import { useState, type ComponentPropsWithoutRef } from 'react';
import { ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react';
import ReactMarkdown, { type ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FloatingSourcesPanel } from './FloatingSourcesPanel';
import { SourcesPreview } from './SourcesPreview';
import { SourceIcon } from './SourceIcon'; // Import SourceIcon

interface Source {
  title: string;
  url: string;
  snippet: string;
  domain?: string;
  images?: { src: string; alt: string }[];
}

interface RelatedSearch {
  query: string;
}

interface SearchResultsProps {
  query: string;
  refinedQuery: string;
  answer: string;
  sources: Source[];
  reasoning?: string;
  isLoading?: boolean;
  relatedTopics?: string[];
  relatedSearches?: RelatedSearch[];
  error?: string;
}

export function SearchResults({ 
  query, 
  refinedQuery,
  answer, 
  sources, 
  reasoning, 
  isLoading,
  relatedTopics = [],
  relatedSearches = [],
  error,
}: SearchResultsProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [hoveredCitation, setHoveredCitation] = useState<number | null>(null);
  const [showSourcesPanel, setShowSourcesPanel] = useState(false);

  // Function to extract domain from URL
  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  const handleRelatedSearch = (query: string) => {
    // Implement logic to handle related search
  };

  const handleCopyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(answer);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy answer:', err);
    }
  };

  const handleDownloadAnswer = () => {
    try {
      // Create a blob with the markdown content
      const blob = new Blob([answer], { type: 'text/markdown;charset=utf-8' });
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      
      // Generate filename based on the query
      const sanitizedQuery = query.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const maxLength = 50; // Maximum length for the query part of the filename
      const truncatedQuery = sanitizedQuery.length > maxLength 
        ? `${sanitizedQuery.slice(0, maxLength)}` 
        : sanitizedQuery;
      const timestamp = new Date().toISOString().split('T')[0]; // Add date for uniqueness
      const filename = `${truncatedQuery}-${timestamp}.md`;
      
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Failed to download answer:', err);
    }
  };

  return (
    <div className="relative w-full">
      <div className="w-full space-y-8">
        {/* Query Refinement */}
        {refinedQuery && refinedQuery !== query && reasoning && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Query Refinement</h2>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex flex-col gap-2">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Original Query: </span>
                  <span className="text-gray-600 dark:text-gray-400">{query}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Refined Query: </span>
                  <span className="text-gray-600 dark:text-gray-400">{refinedQuery}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sources Preview */}
            <div>
              <SourcesPreview 
                sources={sources} 
                onExpand={() => setShowSourcesPanel(!showSourcesPanel)}
                isExpanded={showSourcesPanel}
              />
            </div>

            {/* Reasoning Process */}
            {reasoning && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Reasoning Process</h2>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowReasoning(!showReasoning)}
                    className="flex items-center justify-between w-full p-4 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="font-medium text-gray-900 dark:text-white">View Reasoning</span>
                    </div>
                    {showReasoning ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showReasoning && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-mono">
                        {reasoning}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Answer */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Answer</h2>
              <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="prose dark:prose-invert max-w-none space-y-6">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1 {...props} className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white" />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 {...props} className="text-xl font-bold mt-6 mb-4 text-gray-900 dark:text-white" />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 {...props} className="text-lg font-bold mt-5 mb-3 text-gray-900 dark:text-white" />
                      ),
                      p: ({ node, ...props }) => (
                        <p {...props} className="mb-4 last:mb-0 text-gray-700 dark:text-gray-300 leading-relaxed" />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul {...props} className="list-disc pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300" />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol {...props} className="list-decimal pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300" />
                      ),
                      li: ({ node, ...props }) => (
                        <li {...props} className="text-gray-700 dark:text-gray-300" />
                      ),
                      a: ({ node, ...props }) => {
                        const href = props.href || '';
                        const childContent = props.children && Array.isArray(props.children) 
                          ? props.children[0]?.toString() 
                          : props.children?.toString() || '';
                        const isCitation = /^\[\d+(?:,\s*\d+)*\]$/.test(childContent);
                        
                        if (isCitation) {
                          const citations = childContent
                            .replace(/[\[\]]/g, '')
                            .split(',')
                            .map((num: string) => parseInt(num.trim()));
                          
                          return (
                            <span className="inline-flex gap-1">
                              {citations.map((citation: number, index: number) => {
                                const source = sources[citation - 1];
                                return (
                                  <span
                                    key={index}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded text-sm cursor-pointer relative group"
                                    onMouseEnter={() => setHoveredCitation(citation)}
                                    onMouseLeave={() => setHoveredCitation(null)}
                                    onClick={() => setShowSourcesPanel(!showSourcesPanel)}
                                  >
                                    <SourceIcon url={source?.url || ''} size={12} />
                                    <span>{citation}</span>
                                    <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-white dark:bg-gray-800 rounded shadow-lg text-sm z-10">
                                      {source?.title || getDomain(source?.url || '')}
                                    </div>
                                  </span>
                                );
                              })}
                            </span>
                          );
                        }
                        
                        return (
                          <a 
                            {...props} 
                            className="text-purple-500 hover:text-purple-600 dark:text-purple-400 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        );
                      },
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          {...props}
                          className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 my-4 italic text-gray-700 dark:text-gray-300"
                        />
                      ),
                      code: ({ node, inline, children, ...props }: ComponentPropsWithoutRef<'code'> & { 
                        node?: any;
                        inline?: boolean;
                      }) => {
                        if (inline) {
                          return (
                            <code
                              {...props}
                              className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm"
                            >
                              {children}
                            </code>
                          );
                        }
                        return (
                          <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                            <code {...props} className="text-sm">
                              {children}
                            </code>
                          </pre>
                        );
                      },
                    }}
                  >
                    {answer}
                  </ReactMarkdown>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleCopyAnswer}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy Answer
                  </button>
                  <button
                    onClick={handleDownloadAnswer}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Markdown
                  </button>
                </div>

                {/* Related Topics */}
                {relatedTopics.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Related Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {relatedTopics.map((topic, index) => (
                        <button
                          key={index}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Searches */}
                {relatedSearches.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Related Searches</h3>
                    <div className="flex flex-wrap gap-2">
                      {relatedSearches.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleRelatedSearch(item.query)}
                          className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                        >
                          {item.query}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Sources Panel */}
      <FloatingSourcesPanel 
        sources={sources} 
        isOpen={showSourcesPanel}
      />
    </div>
  );
}
