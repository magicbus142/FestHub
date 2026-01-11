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
        <PageHeader
          pageName="Settings"
          pageNameTelugu="సెట్టింగ్‌లు"
          description="Manage all settings in one place"
          descriptionTelugu="అన్ని సెట్టింగ్‌లను ఒకే చోట నిర్వహించండి"
        >
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <BackButton className="rounded-xl shadow-sm bg-accent/50 text-primary hover:bg-accent border-0" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLanguage(language === 'telugu' ? 'english' : 'telugu')}
              className="h-10 w-10 rounded-full border-slate-200"
            >
              {language === 'telugu' ? 'EN' : 'తె'}
            </Button>
            <ThemeSwitcher />
          </div>
        </PageHeader>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full space-y-6">
          <TabsList className="w-full grid grid-cols-4 p-1 bg-muted/60 backdrop-blur rounded-xl h-12">
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
          </TabsList>

          <TabsContent value="organization" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
             <OrganizationSettingsTab />
          </TabsContent>

          <TabsContent value="festival" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
             <FestivalSettingsTab />
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
             <SubscriptionTab />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
             <ActivityLog organizationId={currentOrganization.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
