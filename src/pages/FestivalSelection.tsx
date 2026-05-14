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
import { ShareDialog } from '@/components/ShareDialog'; // Import ShareDialog
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
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false); // State for ShareDialog
  const { toast } = useToast();

  const handleShareOrganization = () => {
    setIsShareDialogOpen(true);
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
        
        {/* Unified Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-2 bg-slate-100/50 w-fit px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-slate-200/50">
             <span>Home</span>
             <span className="opacity-30">/</span>
             <span className="text-primary truncate max-w-[100px]">Organizations</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
               <h1 className="text-4xl font-black text-foreground tracking-tight mb-1">
                 {currentOrganization?.name}
               </h1>
               <p className="text-sm text-muted-foreground font-medium">
                  {t('ఉత్సవాన్ని ఎంచుకోండి', 'Select Festival')}
               </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
               <div className="flex items-center bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                  <Button variant="ghost" size="icon" onClick={handleShareOrganization} className="h-9 w-9 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-primary transition-all">
                      <Share2 className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-4 bg-slate-100 mx-1"></div>
                  <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setLanguage(language === 'telugu' ? 'english' : 'telugu')}
                      className="h-9 w-9 rounded-xl hover:bg-blue-50 text-blue-600 font-bold text-xs"
                  >
                     {language === 'telugu' ? 'EN' : 'తె'}
                  </Button>
                  <ThemeSwitcher />
               </div>
               
               {/* Add Festival Button */}
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <Button
                       onClick={() => {
                         if (isAuthenticated) {
                           setIsAddFestivalOpen(true);
                         } else {
                           setIsPasscodeOpen(true);
                         }
                       }}
                       className="flex bg-primary hover:bg-primary/90 text-primary-foreground font-black h-11 rounded-2xl px-4 sm:px-6 text-sm shadow-xl shadow-primary/20 transition-all active:scale-[0.95] items-center gap-2"
                     >
                       {isAuthenticated ? <Plus className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
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
        </div>

        {/* Festival Cards - Use displayedFestivals instead of festivals */}
        {displayedFestivals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
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