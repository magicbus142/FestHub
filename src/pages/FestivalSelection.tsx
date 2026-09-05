import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFestival } from '@/contexts/FestivalContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { FestivalCard } from '@/components/FestivalCard';
import { Button } from '@/components/ui/button';
import { AddFestivalDialog } from '@/components/AddFestivalDialog';
import { PasscodeDialog } from '@/components/PasscodeDialog';
import { ShareDialog } from '@/components/ShareDialog'; // Import ShareDialog
import { Plus, ArrowLeft, Share2, Lock, Home, LogOut } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import type { Festival } from '@/lib/festivals';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { PageHeader } from '@/components/PageHeader';

export default function FestivalSelection() {
  const { t, language, setLanguage } = useLanguage();
  const { setSelectedFestival } = useFestival();
  const { currentOrganization, isAuthenticated, authenticate, logout } = useOrganization();
  const { signOut } = useSupabaseAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAddFestivalOpen, setIsAddFestivalOpen] = useState(false);
  const [isPasscodeOpen, setIsPasscodeOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleShareOrganization = () => {
    setIsShareDialogOpen(true);
  };

  const handleSignOut = async () => {
    try {
      logout();
      await signOut();
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem('currentOrganization');
      localStorage.removeItem('selectedFestival');
      localStorage.removeItem('orgAuthenticated');
      localStorage.removeItem('orgAuthId');
      sessionStorage.clear();
      toast({
        title: t('లాగ్అవుట్ అయ్యారు', 'Signed Out'),
        description: t('సంస్థ నుండి విజయవంతంగా లాగ్‌అవుట్ అయ్యారు', 'Successfully signed out of organization'),
      });
      navigate('/');
    }
  };

  const { data: festivals = [] } = useQuery({
    queryKey: ['festivals', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      
      let fetchedFestivals: any[] = [];

      try {
        const { data, error } = await supabase
          .from('festivals')
          .select(`
            *,
            background_image_rel:images!festivals_background_image_id_fkey(image_url)
          `)
          .or(`organization_id.eq.${currentOrganization.id},organization_id.is.null`)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        fetchedFestivals = data || [];
      } catch {
        // Fallback: If FK relationship fails (400 Bad Request), run standard select
        const { data, error } = await supabase
          .from('festivals')
          .select('*')
          .or(`organization_id.eq.${currentOrganization.id},organization_id.is.null`)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        fetchedFestivals = data || [];
      }
      
      // Get images for each festival to use as background when no specific background is set
      const festivalsWithImages = await Promise.all(
        fetchedFestivals.map(async (festival: any) => {
          // First check if festival has a specific background image
          const rel = festival.background_image_rel;
          let backgroundImage = (Array.isArray(rel) ? rel?.[0]?.image_url : rel?.image_url) || festival.background_image;
          
          // If no specific background, get the latest image from this festival
          if (!backgroundImage) {
            try {
              const { data: festivalImages } = await supabase
                .from('images')
                .select('image_url')
                .eq('festival_name', festival.name)
                .eq('festival_year', festival.year)
                .order('created_at', { ascending: false })
                .limit(1);
              
              backgroundImage = festivalImages?.[0]?.image_url || null;
            } catch {
              // ignore
            }
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

  // Filter festivals based on 'festivals' query param and visibility
  const displayedFestivals = festivals.filter(festival => {
    if (festival.is_hidden && !isAuthenticated) return false;

    const sharedIds = searchParams.get('festivals');
    if (!sharedIds) return true; // If no param, show all
    const allowedIds = sharedIds.split(',');
    return allowedIds.includes(festival.id);
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
    <div className="min-h-screen bg-slate-50/50 relative overflow-hidden">
       {/* Small Decorative Elements */}
       <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />

      <div className="container mx-auto px-4 py-6 relative z-10">
        
        {/* Header */}
        <PageHeader
          title={currentOrganization?.name}
          description={t('ఉత్సవాన్ని ఎంచుకోండి', 'Select Festival')}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleShareOrganization} 
            className="h-9 w-9 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors shadow-2xs"
            title={t('భాగస్వామ్యం చేయండి', 'Share')}
          >
            <Share2 className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => {
              if (isAuthenticated) {
                setIsAddFestivalOpen(true);
              } else {
                setIsPasscodeOpen(true);
              }
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold h-9 px-4 rounded-xl text-xs shadow-md transition-all active:scale-[0.95] flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>{t('ఉత్సవాన్ని జోడించండి', 'Add Festival')}</span>
          </Button>
        </PageHeader>

        {/* Control Bar: Festival Count + Language Switcher */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6 p-4 sm:p-5">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <span className="text-sm font-extrabold text-blue-600 border-b-2 border-blue-600 pb-1.5 -mb-2 tracking-tight">
                   {t('ఉత్సవాలు', 'Festivals')}
                 </span>
                 <span className="inline-flex items-center justify-center h-5.5 min-w-[22px] px-2 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    {displayedFestivals.length}
                 </span>
              </div>

              <Button
                 variant="outline"
                 onClick={() => setLanguage(language === 'telugu' ? 'english' : 'telugu')}
                 className="h-10 w-10 p-0 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-blue-600 font-bold text-xs flex-shrink-0 shadow-2xs cursor-pointer"
                 title={t('భాష మార్చండి', 'Switch Language')}
              >
                 <span className="text-xs font-extrabold">{language === 'telugu' ? 'తె' : 'EN'}</span>
              </Button>
           </div>
        </div>

        {/* Festival Cards Grid */}
        {displayedFestivals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto mb-16">
            {displayedFestivals.map((festival) => (
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
              {t('ఇంకా ఉత్సవాలు జోడించబడలేదు (లేదా ఏదీ భాగస్వామ్యం చేయబడలేదు)', 'No festivals available (or none shared)')}
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

        {/* Share Dialog */}
        <ShareDialog 
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          organizationSlug={currentOrganization?.slug || ''}
          festivals={festivals} // Pass all festivals so user can choose what to share
        />
      </div>
    </div>
  );
}