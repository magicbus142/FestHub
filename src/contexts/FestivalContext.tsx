import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Festival } from '@/lib/festivals';

interface FestivalContextType {
  selectedFestival: Festival | null;
  setSelectedFestival: (festival: Festival) => void;
  clearSelection: () => void;
}

const FestivalContext = createContext<FestivalContextType | undefined>(undefined);

export const useFestival = () => {
  const ctx = useContext(FestivalContext);
  if (!ctx) throw new Error('useFestival must be used within a FestivalProvider');
  return ctx;
};

export const FestivalProvider = ({ children }: { children: ReactNode }) => {
  const [selectedFestival, setSelectedFestivalState] = useState<Festival | null>(null);

  // Load selected festival from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedFestival');
    if (saved) {
      try {
        setSelectedFestivalState(JSON.parse(saved));
      } catch {
        localStorage.removeItem('selectedFestival');
      }
    }
  }, []);

  const setSelectedFestival = (festival: Festival) => {
    setSelectedFestivalState(festival);
    localStorage.setItem('selectedFestival', JSON.stringify(festival));
  };

  const clearSelection = () => {
    setSelectedFestivalState(null);
    localStorage.removeItem('selectedFestival');
  };

  return (
    <FestivalContext.Provider value={{ 
      selectedFestival, 
      setSelectedFestival, 
      clearSelection 
    }}>
      {children}
    </FestivalContext.Provider>
  );
};