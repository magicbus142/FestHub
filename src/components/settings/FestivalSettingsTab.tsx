import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useFestival } from '@/contexts/FestivalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageSelector, PageOption } from '@/components/PageSelector';
import { Save, Loader2, Sparkles, MessageSquare, FileText } from 'lucide-react';
import { PasscodeDialog } from '@/components/PasscodeDialog';
import { ReceiptSettings } from '@/components/settings/ReceiptSettings';
import { WhatsAppMessageSettings } from '@/components/settings/WhatsAppMessageSettings';

export function FestivalSettingsTab() {
  const { currentOrganization, isAuthenticated, authenticate } = useOrganization();
  const { selectedFestival, setSelectedFestival } = useFestival();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [enabledPages, setEnabledPages] = useState<PageOption[]>(['dashboard', 'chandas', 'expenses', 'images']);
  const [isPasscodeDialogOpen, setIsPasscodeDialogOpen] = useState(false);

  // Fetch all festivals for the switcher
  const { data: festivals = [] } = useQuery({
    queryKey: ['festivals', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      const { data, error } = await supabase
        .from('festivals')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .order('year', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization
  });

  // Initialize form with selected festival data
  useEffect(() => {
    if (selectedFestival) {
      setName(selectedFestival.name);
      setDescription(selectedFestival.description || '');
      setYear(selectedFestival.year);
      const pages = (selectedFestival.enabled_pages as unknown as PageOption[]) || ['dashboard', 'chandas', 'expenses', 'images'];
      setEnabledPages(pages);
    }
  }, [selectedFestival]);

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; year: number; enabled_pages: PageOption[] }) => {
      if (!selectedFestival) throw new Error('No festival selected');

      const { error } = await supabase
        .from('festivals')
        .update({
          name: data.name,
          description: data.description,
          year: data.year,
          enabled_pages: data.enabled_pages
        })
        .eq('id', selectedFestival.id);

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (selectedFestival) {
        setSelectedFestival({
          ...selectedFestival,
          name: data.name,
          description: data.description,
          year: data.year,
          enabled_pages: data.enabled_pages
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['festivals'] });
      
      toast({
        title: t('సెట్టింగ్‌లు అప్‌డేట్ అయ్యాయి', 'Settings updated'),
        description: t('ఉత్సవ సెట్టింగ్‌లు సేవ్ చేయబడ్డాయి', 'Festival settings saved successfully'),
      });
    },
    onError: (error) => {
      toast({
        title: t('దోషం', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setIsPasscodeDialogOpen(true);
      return;
    }

    updateMutation.mutate({
      name,
      description,
      year,
      enabled_pages: enabledPages
    });
  };

  const handleAuthenticate = (enteredPasscode: string) => {
    const result = authenticate(enteredPasscode);
    if (result && selectedFestival) {
       updateMutation.mutate({
        name,
        description,
        year,
        enabled_pages: enabledPages
      });
    }
    return result;
  };

  if (!selectedFestival) {
      return (
          <div className="p-8 text-center text-muted-foreground bg-card/50 rounded-lg">
             {t('దయచేసి ఉత్సవాన్ని ఎంచుకోండి', 'Please select a festival first')}
          </div>
      );
  }

  return (
    <div className="space-y-6">
      {/* Switch Festival Bar */}
      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-primary" />
                {t('ఉత్సవాలను మార్చండి', 'Switch Festival')}
              </CardTitle>
              <CardDescription>
                {t('మరో ఉత్సవాన్ని ఎంచుకోండి', 'Select another festival to manage')}
              </CardDescription>
            </div>
            <div className="w-full sm:w-64">
              <Select 
                value={selectedFestival?.id || ''} 
                onValueChange={(id) => {
                  const festival = festivals.find(f => f.id === id);
                  if (festival) setSelectedFestival(festival);
                }}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder={t('ఉత్సవాన్ని ఎంచుకోండి', 'Select a festival')} />
                </SelectTrigger>
                <SelectContent>
                  {festivals.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} ({f.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Sub-Tabs Navigation for Festival Settings */}
      <Tabs defaultValue="details" className="w-full space-y-6">
        <TabsList className="w-full grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl h-12">
          <TabsTrigger 
            value="details" 
            className="rounded-xl font-extrabold text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-primary shadow-xs transition-all gap-1.5 sm:gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span className="truncate">{t('ఉత్సవ వివరాలు', 'Festival Details')}</span>
          </TabsTrigger>

          <TabsTrigger 
            value="whatsapp" 
            className="rounded-xl font-extrabold text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-600 shadow-xs transition-all gap-1.5 sm:gap-2"
          >
            <MessageSquare className="h-4 w-4 text-emerald-500" />
            <span className="truncate">{t('వాట్సాప్ మెసేజ్', 'WhatsApp Message')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Festival Details */}
        <TabsContent value="details" className="space-y-4 focus-visible:outline-none">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>
                {t('ఉత్సవ వివరాలు', 'Festival Details')}
              </CardTitle>
              <CardDescription>
                {t('పండుగ ప్రాథమిక సమాచారాన్ని సవరించండి', 'Edit basic festival information')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="festival-name">{t('ఉత్సవ పేరు', 'Festival Name')}</Label>
                  <Input
                    id="festival-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="festival-year">{t('సంవత్సరం', 'Year')}</Label>
                  <Input
                    id="festival-year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    required
                    min="2000"
                    max="2100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="festival-description">{t('వివరణ', 'Description')}</Label>
                  <Textarea
                    id="festival-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="pt-4 border-t">
                  <PageSelector 
                    value={enabledPages} 
                    onChange={setEnabledPages} 
                    label={t('ప్రదర్శించాల్సిన పేజీలు', 'Visible Pages')} 
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('సేవ్ అవుతోంది...', 'Saving...')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t('సేవ్ చేయండి', 'Save Changes')}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: WhatsApp Message Settings */}
        <TabsContent value="whatsapp" className="space-y-4 focus-visible:outline-none">
          <WhatsAppMessageSettings festival={selectedFestival} organizationName={currentOrganization?.name} />
        </TabsContent>
      </Tabs>

      <PasscodeDialog
        open={isPasscodeDialogOpen}
        onOpenChange={setIsPasscodeDialogOpen}
        onAuthenticate={handleAuthenticate}
        organizationName={currentOrganization?.name || ''}
      />
    </div>
  );
}

