'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ApiProvider = 'openai' | 'deepseek' | 'alibabacloud';

interface SettingsContextType {
  apiProvider: ApiProvider;
  setApiProvider: (provider: ApiProvider) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [apiProvider, setApiProvider] = useState<ApiProvider>('openai');

  useEffect(() => {
    // Check for stored preference
    const storedProvider = localStorage.getItem('apiProvider') as ApiProvider | null;
    if (storedProvider) {
      setApiProvider(storedProvider);
    }
  }, []);

  const updateApiProvider = (provider: ApiProvider) => {
    setApiProvider(provider);
    localStorage.setItem('apiProvider', provider);
  };

  return (
    <SettingsContext.Provider value={{ apiProvider, setApiProvider: updateApiProvider }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
