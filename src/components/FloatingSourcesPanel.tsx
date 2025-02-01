'use client';

import { Link as LinkIcon } from 'lucide-react';
import { SourceIcon } from './SourceIcon';
import Image from 'next/image';

interface Source {
  title: string;
  url: string;
  snippet: string;
  domain?: string;
  images?: { src: string; alt: string }[];
}

interface FloatingSourcesPanelProps {
  sources: Source[];
  isOpen: boolean;
}

export function FloatingSourcesPanel({ sources, isOpen }: FloatingSourcesPanelProps) {
  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 w-1/4 min-w-[300px] max-w-[450px] h-screen bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-lg z-50">
      <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sources</h2>
          <span className="text-sm px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
            {sources.length}
          </span>
        </div>
      </div>

      <div className="h-[calc(100vh-5rem)] overflow-y-auto">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {sources.map((source, index) => (
            <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex items-start gap-3">
                <div className="flex-none w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <SourceIcon url={source.url} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 mb-1"
                  >
                    <span className="text-sm font-medium line-clamp-2">{source.title || getDomain(source.url)}</span>
                  </a>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {source.snippet}
                  </p>
                  {source.images && source.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {source.images.map((image, imgIndex) => (
                        <div key={imgIndex} className="relative aspect-video">
                          <Image
                            src={image.src}
                            alt={image.alt}
                            width={320}
                            height={180}
                            className="rounded-lg object-cover w-full h-full"
                            unoptimized={true}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
