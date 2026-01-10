import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'utsav' | 'bhakti' | 'prakriti';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check local storage or default to 'utsav'
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('festival-theme');
      return (savedTheme as Theme) || 'utsav';
    }
    return 'utsav';
  });

  useEffect(() => {
    // Apply theme to document root
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
    
    // Save to local storage
    localStorage.setItem('festival-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
