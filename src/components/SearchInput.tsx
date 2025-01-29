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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  useEffect(() => {
    if (showSuggestions && query.trim()) {
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
  }, [query, showSuggestions]);

  return (
    <div className="max-w-3xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to know?"
            className="w-full px-4 py-3 pl-12 pr-32 text-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => {/* TODO: Implement voice search */}}
            >
              <Mic className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => {/* TODO: Implement image search */}}
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </form>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
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
