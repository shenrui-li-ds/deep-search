import { useState, type ComponentPropsWithoutRef } from 'react';
import { ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react';
import ReactMarkdown, { type ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Source {
  title: string;
  url: string;
  snippet: string;
  domain?: string;
}

interface SearchResultsProps {
  query: string;
  answer: string;
  sources: Source[];
  reasoning?: string;
  onFollowUpQuestion: (question: string) => void;
  isLoading?: boolean;
  relatedTopics?: string[];
}

export function SearchResults({ 
  query, 
  answer, 
  sources, 
  reasoning, 
  onFollowUpQuestion, 
  isLoading,
  relatedTopics = [] 
}: SearchResultsProps) {
  const [showSources, setShowSources] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [hoveredCitation, setHoveredCitation] = useState<number | null>(null);

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (followUpQuestion.trim()) {
      onFollowUpQuestion(followUpQuestion);
      setFollowUpQuestion('');
    }
  };

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
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <div className="space-y-8">
            {/* Query */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Query</h2>
              <div className="p-6">
                <p className="text-gray-700 dark:text-gray-300">{query}</p>
              </div>
            </div>

            {/* Answer */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Answer</h2>
              <div className="p-6">
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
                          onClick={() => onFollowUpQuestion(topic)}
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

            {/* Reasoning Process */}
            {reasoning && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Reasoning Process</h2>
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
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
          </div>

          {/* Sources Section */}
          <div className="hidden lg:block fixed top-24 right-8 w-80 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sources</h2>
              <button
                onClick={() => setShowSources(!showSources)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {showSources ? 'Show Less' : 'Show All'}
                {showSources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Preview Sources Grid */}
            <div className="grid grid-cols-2 gap-4">
              {(showSources ? sources : sources.slice(0, 4)).map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs flex-shrink-0">
                      {getDomain(source.url).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {getDomain(source.url)}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                    {source.title}
                  </h3>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Follow-up Question Form */}
      {!isLoading && (
        <form onSubmit={handleFollowUpSubmit} className="mt-8">
          <div className="flex gap-4 max-w-[900px]">
            <input
              type="text"
              value={followUpQuestion}
              onChange={(e) => setFollowUpQuestion(e.target.value)}
              placeholder="Ask a follow-up question..."
              className="flex-1 min-w-0 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-300 rounded-lg text-white"
            >
              Ask
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
