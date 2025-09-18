import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFestival } from '@/contexts/FestivalContext';
import { useAuth } from '@/contexts/AuthContext';
import { getAllFestivals } from '@/lib/festivals';
import { FestivalCard } from '@/components/FestivalCard';
import { Button } from '@/components/ui/button';
import { AddFestivalDialog } from '@/components/AddFestivalDialog';
import { AuthDialog } from '@/components/AuthDialog';
import { Plus } from 'lucide-react';

export default function FestivalSelection() {
  const { t, language, setLanguage } = useLanguage();
  const { setSelectedFestival } = useFestival();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isAddFestivalOpen, setIsAddFestivalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const { data: festivals = [] } = useQuery({
    queryKey: ['festivals'],
    queryFn: getAllFestivals,
  });

  const handleFestivalSelect = (festival: any) => {
    setSelectedFestival(festival);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('ఉత్సవాన్ని ఎంచుకోండి', 'Select Festival')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('మీ ఎంపిక చేసిన ఉత్సవ డేటాను చూడటానికి ఉత్సవాన్ని ఎంచుకోండి', 'Choose a festival to view its data')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (isAuthenticated) {
                  setIsAddFestivalOpen(true);
                } else {
                  setIsAuthOpen(true);
                }
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('ఉత్సవం జోడించు', 'Add Festival')}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setLanguage(language === 'telugu' ? 'english' : 'telugu')}
              className="shrink-0"
            >
              {language === 'telugu' ? 'EN' : 'తె'}
            </Button>
          </div>
        </div>

        {/* Festival Cards */}
        {festivals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {festivals.map((festival) => (
              <FestivalCard 
                key={festival.id} 
                festival={festival}
                onClick={() => handleFestivalSelect(festival)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              {t('ఇంకా ఉత్సవాలు జోడించబడలేదు', 'No festivals available')}
            </p>
          </div>
        )}

        {/* Add Festival Dialog */}
        <AddFestivalDialog 
          open={isAddFestivalOpen}
          onOpenChange={setIsAddFestivalOpen}
        />

        {/* Auth Dialog */}
        <AuthDialog
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={() => setIsAuthOpen(false)}
        />
      </div>
    </div>
  );
}