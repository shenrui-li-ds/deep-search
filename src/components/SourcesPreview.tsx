'use client';

import { Link as LinkIcon } from 'lucide-react';

interface Source {
  title: string;
  url: string;
  snippet: string;
  domain?: string;
  images?: { src: string; alt: string }[];
}

interface SourcesPreviewProps {
  sources: Source[];
  onExpand: () => void;
  isExpanded: boolean;
}

export function SourcesPreview({ sources, onExpand, isExpanded }: SourcesPreviewProps) {
  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sources</h3>
        <button
          onClick={onExpand}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {isExpanded ? 'Hide Sources' : 'View All'}
        </button>
      </div>
      <div className="space-y-4">
        {sources.slice(0, 3).map((source, index) => (
          <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-none w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 mb-1"
                >
                  <span className="text-sm font-medium truncate">{source.title || getDomain(source.url)}</span>
                  <LinkIcon className="h-4 w-4 flex-shrink-0" />
                </a>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {source.snippet}
                </p>
              </div>
            </div>
          </div>
        ))}
        {!isExpanded && sources.length > 3 && (
          <button
            onClick={onExpand}
            className="w-full p-3 text-sm text-blue-600 dark:text-blue-400 hover:underline text-center"
          >
            Show {sources.length - 3} more sources
          </button>
        )}
      </div>
    </div>
  );
}
