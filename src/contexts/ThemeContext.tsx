import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'bhakti' | 'utsav' | 'prakriti';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('bhakti');

  useEffect(() => {
    // Force clean professional Blue Theme ('bhakti')
    const root = window.document.documentElement;
    root.setAttribute('data-theme', 'bhakti');
    localStorage.setItem('festival-theme', 'bhakti');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme: 'bhakti', setTheme }}>
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
