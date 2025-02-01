import { useState } from 'react';
import Image from 'next/image';
import { Globe } from 'lucide-react';

interface SourceIconProps {
  url: string;
  size?: number;
  className?: string;
}

export function SourceIcon({ url, size = 16, className = '' }: SourceIconProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-sm ${className}`}
        style={{ width: size, height: size }}
      >
        <Globe size={size * 0.75} className="text-gray-400" />
      </div>
    );
  }

  try {
    const domain = new URL(url).hostname.replace('www.', '');
    // Try to get favicon directly from the site first
    const iconUrl = `https://${domain}/favicon.ico`;

    return (
      <Image 
        src={iconUrl}
        alt={`${domain} icon`}
        width={size}
        height={size}
        className={`rounded-sm ${className}`}
        onError={() => setError(true)}
        unoptimized={true}
      />
    );
  } catch (e) {
    setError(true);
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-sm ${className}`}
        style={{ width: size, height: size }}
      >
        <Globe size={size * 0.75} className="text-gray-400" />
      </div>
    );
  }
}
