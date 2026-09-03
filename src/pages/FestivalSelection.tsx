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
        
        {/* Unified Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-2 bg-slate-100/70 hover:bg-slate-200/70 transition-colors w-fit px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 border border-slate-200/80 shadow-2xs">
             <button 
               onClick={() => navigate('/')} 
               className="hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
               title="Go to Home / Organizations"
             >
               <Home className="h-3.5 w-3.5 text-primary" />
               <span>Home</span>
             </button>
             <span className="opacity-40">/</span>
             <button 
               onClick={() => navigate('/')} 
               className="hover:text-primary transition-colors cursor-pointer"
               title="All Organizations"
             >
               Organizations
             </button>
             {currentOrganization?.name && (
               <>
                 <span className="opacity-40">/</span>
                 <span className="text-primary font-extrabold truncate max-w-[120px]">{currentOrganization.name}</span>
               </>
             )}
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

            <div className="flex items-center gap-3 flex-wrap">
               {/* Single Combined Action Pill (Image 1 design) */}
               <div className="flex items-center bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200/80 gap-1">
                  {/* Back Button */}
                  <Button 
                      variant="ghost" 
                      onClick={() => navigate('/')} 
                      className="h-9 px-3 rounded-xl text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 font-semibold text-xs gap-1.5 transition-all cursor-pointer"
                      title={t('వెనుకకు', 'Back')}
                  >
                      <ArrowLeft className="h-4 w-4 text-slate-600" />
                      <span>{t('వెనుకకు', 'Back')}</span>
                  </Button>

                  <div className="w-px h-4 bg-slate-200/60 mx-0.5"></div>

                  {/* Share Button */}
                  <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleShareOrganization} 
                      className="h-9 w-9 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-primary transition-all"
                      title={t('భాగస్వామ్యం చేయండి', 'Share')}
                  >
                      <Share2 className="h-4 w-4" />
                  </Button>

                  {/* Language Switcher */}
                  <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setLanguage(language === 'telugu' ? 'english' : 'telugu')}
                      className="h-9 w-9 rounded-xl hover:bg-blue-50 text-blue-600 font-bold text-xs"
                      title={t('భాష మార్చండి', 'Switch Language')}
                  >
                     {language === 'telugu' ? 'EN' : 'తె'}
                  </Button>

                  {/* Theme Switcher */}
                  <ThemeSwitcher />

                  <div className="w-px h-4 bg-slate-200/60 mx-0.5"></div>

                  {/* Sign Out Button */}
                  <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSignOut}
                      className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
                      title={t('లాగ్అవుట్', 'Sign Out')}
                  >
                      <LogOut className="h-4 w-4 text-red-500" />
                  </Button>
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