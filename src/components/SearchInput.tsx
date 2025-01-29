import { useState, useEffect, useRef } from 'react';
import { Search, Mic, Camera } from 'lucide-react';

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  showSuggestions?: boolean;
}

export function SearchInput({ onSearch, isLoading = false, showSuggestions = false }: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isShowingSuggestions, setIsShowingSuggestions] = useState(showSuggestions);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  useEffect(() => {
    if (isShowingSuggestions && query.trim()) {
      // Here you could integrate with a real search suggestions API
      const demoSuggestions = [
        `${query} definition`,
        `${query} examples`,
        `${query} tutorial`,
        `${query} vs`,
      ].slice(0, 4);
      setSuggestions(demoSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [query, isShowingSuggestions]);

  return (
    <div className="max-w-3xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsShowingSuggestions(true)}
            placeholder="Ask any question"
            className="w-full px-6 py-3 bg-gray-800 text-white rounded-full shadow-lg shadow-black/20 border-2 border-gray-700 ring-4 ring-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            )}
          </button>
        </div>
      </form>

      {/* Search Suggestions */}
      {isShowingSuggestions && suggestions.length > 0 && (
        <div className="absolute w-full mt-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                setQuery(suggestion);
                onSearch(suggestion);
              }}
              className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            >
              <div className="flex items-center">
                <Search className="h-4 w-4 mr-3 text-gray-400" />
                {suggestion}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
