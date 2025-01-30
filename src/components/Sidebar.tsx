import { useTheme } from '@/lib/theme-context';
import Link from 'next/link';
import { Moon, Sun, Home, Search, Settings } from 'lucide-react';
import { useState } from 'react';
import { SettingsPanel } from './SettingsPanel';

export function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col h-full">
          <div className="flex items-center mb-8">
            <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
              DeepSearch
            </Link>
          </div>

          <nav className="flex-1">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <Home className="w-5 h-5 mr-3" />
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <Search className="w-5 h-5 mr-3" />
                  Search
                </Link>
              </li>
            </ul>
          </nav>

          <div className="mt-auto space-y-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center px-4 py-2 w-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center px-4 py-2 w-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 mr-3" />
              ) : (
                <Moon className="w-5 h-5 mr-3" />
              )}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      </div>
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
