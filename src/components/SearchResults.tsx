import { useState, type ComponentPropsWithoutRef } from 'react';
import { ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react';
import ReactMarkdown, { type ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Source {
  title: string;
  url: string;
  snippet: string;
  domain?: string;
  images?: { src: string; alt: string }[];
}

interface SearchResultsProps {
  query: string;
  refinedQuery: string;
  answer: string;
  sources: Source[];
  reasoning?: string;
  isLoading?: boolean;
  relatedTopics?: string[];
}

export function SearchResults({ 
  query, 
  refinedQuery,
  answer, 
  sources, 
  reasoning, 
  isLoading,
  relatedTopics = [] 
}: SearchResultsProps) {
  const [showSources, setShowSources] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [hoveredCitation, setHoveredCitation] = useState<number | null>(null);

  // Function to extract domain from URL
  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="relative w-full">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <div className="space-y-8">
            {/* Query */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Query</h2>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-gray-800 dark:text-gray-200">{refinedQuery || query}</p>
              </div>
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
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  className="prose dark:prose-invert max-w-none space-y-6"
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
                            {citations.map((citation: number, index: number) => (
                              <span
                                key={index}
                                className="inline-block px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded text-sm cursor-pointer relative group"
                                onMouseEnter={() => setHoveredCitation(citation)}
                                onMouseLeave={() => setHoveredCitation(null)}
                              >
                                {citation}
                                <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-white dark:bg-gray-800 rounded shadow-lg text-sm z-10">
                                  <a
                                    href={sources[citation - 1]?.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 no-underline block"
                                  >
                                    {sources[citation - 1]?.title}
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                      {sources[citation - 1]?.url}
                                    </div>
                                  </a>
                                </div>
                              </span>
                            ))}
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
              </div>
            </div>

            {/* Sources Section */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Sources</h3>
              <div className="space-y-4">
                {sources.map((source, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                        >
                          <span>{source.title || getDomain(source.url)}</span>
                          <LinkIcon className="h-4 w-4" />
                        </a>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {source.snippet}
                        </p>
                      </div>
                    </div>
                    
                    {/* Image Gallery */}
                    {source.images && source.images.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {source.images.map((image, imgIndex) => (
                          <div key={imgIndex} className="relative aspect-video">
                            <img
                              src={image.src}
                              alt={image.alt}
                              className="rounded-lg object-cover w-full h-full"
                              onError={(e) => {
                                // Hide image on load error
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
