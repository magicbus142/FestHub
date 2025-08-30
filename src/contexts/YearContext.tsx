import { createContext, useContext, useState, ReactNode, useMemo } from 'react';

interface YearContextType {
  year: number;
  setYear: (year: number) => void;
}

const YearContext = createContext<YearContextType | undefined>(undefined);

export const useYear = () => {
  const ctx = useContext(YearContext);
  if (!ctx) throw new Error('useYear must be used within a YearProvider');
  return ctx;
};

export const YearProvider = ({ children }: { children: ReactNode }) => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [year, setYear] = useState<number>(currentYear);

  return (
    <YearContext.Provider value={{ year, setYear }}>
      {children}
    </YearContext.Provider>
  );
};
