import { useState } from 'react';

interface SourceIconProps {
  url: string;
  size?: number;
  className?: string;
}

export function SourceIcon({ url, size = 16, className = '' }: SourceIconProps) {
  const [error, setError] = useState(false);

  // Get domain from URL
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  };

  const domain = getDomain(url);
  const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;

  if (error || !domain) {
    return (
      <div 
        className={`inline-flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-[8px] text-gray-600 dark:text-gray-300">
          {domain.charAt(0)?.toUpperCase() || '?'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={iconUrl}
      alt={`${domain} icon`}
      width={size}
      height={size}
      className={`rounded-sm ${className}`}
      onError={() => setError(true)}
      style={{ width: size, height: size }}
    />
  );
}
