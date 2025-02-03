'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark');

  // Function to get system theme
  const getSystemTheme = () => 
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  // Function to update the effective theme
  const updateEffectiveTheme = (newTheme: Theme) => {
    const effective = newTheme === 'system' ? getSystemTheme() : newTheme;
    setEffectiveTheme(effective);
    document.documentElement.classList.toggle('dark', effective === 'dark');
  };

  useEffect(() => {
    // Get stored theme or use dark as default
    const storedTheme = (localStorage.getItem('theme') as Theme) || 'dark';
    setTheme(storedTheme);
    updateEffectiveTheme(storedTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateEffectiveTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update effective theme whenever theme changes
  useEffect(() => {
    updateEffectiveTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = effectiveTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setThemeWithStorage = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeWithStorage, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
