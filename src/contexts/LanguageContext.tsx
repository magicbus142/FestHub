import { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'telugu' | 'english';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (telugu: string, english: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>('telugu');
  
  const t = (telugu: string, english: string) => {
    return language === 'telugu' ? telugu : english;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};