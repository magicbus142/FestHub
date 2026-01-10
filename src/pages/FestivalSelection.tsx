import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFestival } from '@/contexts/FestivalContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { FestivalCard } from '@/components/FestivalCard';
import { Button } from '@/components/ui/button';
import { AddFestivalDialog } from '@/components/AddFestivalDialog';
import { PasscodeDialog } from '@/components/PasscodeDialog';
import { Plus, ArrowLeft, Share2, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import type { Festival } from '@/lib/festivals';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

export default function FestivalSelection() {
  const { t, language, setLanguage } = useLanguage();
  const { setSelectedFestival } = useFestival();
  const { currentOrganization, isAuthenticated, authenticate } = useOrganization();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAddFestivalOpen, setIsAddFestivalOpen] = useState(false);
  const [isPasscodeOpen, setIsPasscodeOpen] = useState(false);
  const { toast } = useToast();

  const handleShareOrganization = () => {
    const shareUrl = `${window.location.origin}/org/${currentOrganization?.slug}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: t('లింక్ కాపీ చేయబడింది', 'Link Copied'),
      description: t('సంస్థ లింక్ క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది', 'Organization link copied to clipboard'),
    });
  };

  const { data: festivals = [] } = useQuery({
    queryKey: ['festivals', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      
      const { data: festivals, error } = await supabase
        .from('festivals')
        .select(`
          *,
          background_image_rel:images!festivals_background_image_id_fkey(image_url)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get images for each festival to use as background when no specific background is set
      const festivalsWithImages = await Promise.all(
        (festivals || []).map(async (festival: any) => {
          // First check if festival has a specific background image
          const rel = festival.background_image_rel;
          let backgroundImage = (Array.isArray(rel) ? rel?.[0]?.image_url : rel?.image_url) || festival.background_image;
          
          // If no specific background, get the latest image from this festival
          if (!backgroundImage) {
            const { data: festivalImages } = await supabase
              .from('images')
              .select('image_url')
              .eq('festival_name', festival.name)
              .eq('festival_year', festival.year)
              .order('created_at', { ascending: false })
              .limit(1);
            
            backgroundImage = festivalImages?.[0]?.image_url || null;
          }
          
          return {
            ...festival,
            background_image: backgroundImage
          };
        })
      );
      
      return festivalsWithImages as Festival[];
    },
    enabled: !!currentOrganization
  });

  // Auto-select festival from URL query parameter (for shared links)
  useEffect(() => {
    const festivalId = searchParams.get('festival');
    if (festivalId && festivals.length > 0) {
      const festival = festivals.find(f => f.id === festivalId);
      if (festival) {
        setSelectedFestival(festival);
        navigate(`/org/${currentOrganization?.slug}/dashboard`, { replace: true });
      }
    }
  }, [searchParams, festivals, currentOrganization?.slug, setSelectedFestival, navigate]);

  const handleFestivalSelect = (festival: any) => {
    setSelectedFestival(festival);
    navigate(`/org/${currentOrganization?.slug}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
       {/* Small Decorative Elements */}
       <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />

      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Organizations
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              {currentOrganization?.name}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {t('ఉత్సవాన్ని ఎంచుకోండి', 'Select Festival')}
            </p>
          </div>
          
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            {/* Language Toggle + Share + Theme */}
            <div className="flex justify-end gap-2 text-accent-foreground">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareOrganization}
                className="px-3"
              >
                <Share2 className="h-4 w-4 mr-1" />
                {t('షేర్', 'Share')}
              </Button>
              <ThemeSwitcher />
            </div>

            {/* Add Festival Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      if (isAuthenticated) {
                        setIsAddFestivalOpen(true);
                      } else {
                        setIsPasscodeOpen(true);
                      }
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    {isAuthenticated ? (
                      <Plus className="h-5 w-5 mr-2" />
                    ) : (
                      <Lock className="h-5 w-5 mr-2" />
                    )}
                    {t('ఉత్సవం జోడించు', 'Add Festival')}
                  </Button>
                </TooltipTrigger>
                {!isAuthenticated && (
                  <TooltipContent>
                    <p>{t('జోడించడానికి లాగిన్ అవసరం', 'Login required to add')}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
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
             <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Plus className="h-10 w-10 text-muted-foreground" />
             </div>
            <p className="text-lg text-muted-foreground">
              {t('ఇంకా ఉత్సవాలు జోడించబడలేదు', 'No festivals available')}
            </p>
          </div>
        )}

        {/* Dialogs */}
        <AddFestivalDialog 
          open={isAddFestivalOpen}
          onOpenChange={setIsAddFestivalOpen}
        />

        <PasscodeDialog
          open={isPasscodeOpen}
          onOpenChange={setIsPasscodeOpen}
          onAuthenticate={authenticate}
          organizationName={currentOrganization?.name || ''}
        />
      </div>
    </div>
  );
}