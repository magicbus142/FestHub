import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, PartyPopper, CreditCard } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { OrganizationSettingsTab } from '@/components/settings/OrganizationSettingsTab';
import { FestivalSettingsTab } from '@/components/settings/FestivalSettingsTab';
import { SubscriptionTab } from '@/components/settings/SubscriptionTab';
import { useFestival } from '@/contexts/FestivalContext';
import { useEffect } from 'react';
import { YearBadge } from '@/components/YearBadge';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { ActivityLog } from '@/components/ActivityLog';

export default function Settings() {
  const { currentOrganization } = useOrganization();
  const { selectedFestival } = useFestival();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'organization';

  const handleTabChange = (value: string) => {
      setSearchParams({ tab: value });
  };

  useEffect(() => {
    if (!currentOrganization) {
        navigate('/');
    }
  }, [currentOrganization, navigate]);

  if (!currentOrganization) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:pb-8">
        {/* Unified Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-2 bg-slate-100/50 w-fit px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-slate-200/50">
             <span>Home</span>
             <span className="opacity-30">/</span>
             <span className="text-primary truncate max-w-[100px]">{selectedFestival?.name || 'Festival'}</span>
             <span className="opacity-30">/</span>
             <span className="text-foreground">Settings</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
               <h1 className="text-4xl font-black text-foreground tracking-tight mb-1">
                 {t('సెట్టింగ్‌లు', 'Settings')}
               </h1>
               <p className="text-sm text-muted-foreground font-medium">
                  {t('అన్ని సెట్టింగ్‌లను ఒకే చోట నిర్వహించండి', 'Manage all settings in one place')}
               </p>
            </div>

            <div className="flex items-center gap-2">
               <div className="flex items-center bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                  <BackButton 
                    variant="ghost" 
                    size="sm"
                    className="h-9 rounded-xl bg-slate-50 border-none shadow-none text-slate-600 hover:bg-slate-100 hover:text-primary transition-all" 
                  />
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
            </div>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full space-y-6">
          <TabsList className="w-full grid grid-cols-2 p-1 bg-muted/60 backdrop-blur rounded-xl h-12">
            <TabsTrigger 
                value="organization" 
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300 gap-2 h-10 font-bold"
            >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">{t('సంస్థ', 'Organization')}</span>
            </TabsTrigger>
            <TabsTrigger 
                value="festival" 
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300 gap-2 h-10 font-bold"
            >
                <PartyPopper className="h-4 w-4" />
                <span className="hidden sm:inline">{t('ఉత్సవం', 'Festival')}</span>
            </TabsTrigger>
            {/* 
            <TabsTrigger 
                value="subscription" 
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300 gap-2 h-10 font-bold"
            >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">{t('సబ్‌స్క్రిప్షన్', 'Subscription')}</span>
            </TabsTrigger>
            <TabsTrigger 
                value="activity" 
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300 gap-2 h-10 font-bold"
            >
                <div className="flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12"/><path d="M3 3v9h9"/></svg>
                   <span className="hidden sm:inline">Activity</span>
                </div>
            </TabsTrigger>
            */}
          </TabsList>

          <TabsContent value="organization" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
             <OrganizationSettingsTab />
          </TabsContent>

          <TabsContent value="festival" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
             <FestivalSettingsTab />
          </TabsContent>

          {/*
          <TabsContent value="subscription" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
             <SubscriptionTab />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
             <ActivityLog organizationId={currentOrganization.id} />
          </TabsContent>
          */}
        </Tabs>
      </div>
    </div>
  );
}
