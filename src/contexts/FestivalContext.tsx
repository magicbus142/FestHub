import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

  // Load selected festival from localStorage on mount and ensure it has an ID
  useEffect(() => {
    const initFestival = async () => {
      const saved = localStorage.getItem('selectedFestival');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          
          // If festival has no ID, we MUST fetch it from DB to make filters work
          if (!parsed.id) {
            const { data: festivals } = await supabase
              .from('festivals')
              .select('*')
              .eq('name', parsed.name)
              .eq('year', parsed.year)
              .limit(1);
            
            if (festivals?.[0]) {
              setSelectedFestivalState(festivals[0]);
              localStorage.setItem('selectedFestival', JSON.stringify(festivals[0]));
              return;
            }
          }
          
          setSelectedFestivalState(parsed);
        } catch {
          localStorage.removeItem('selectedFestival');
        }
      }
    };
    
    initFestival();
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