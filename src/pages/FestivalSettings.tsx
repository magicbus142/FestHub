import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useFestival } from '@/contexts/FestivalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs
import { PageSelector, PageOption } from '@/components/PageSelector';
import { BackButton } from '@/components/BackButton';
import { Navigation } from '@/components/Navigation';
import { Save, Loader2, Trophy, ExternalLink, Plus, Copy } from 'lucide-react';
import { PasscodeDialog } from '@/components/PasscodeDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ManageCompetitionDialog } from '@/components/ManageCompetitionDialog';


export default function FestivalSettings() {
  const { currentOrganization, isAuthenticated, authenticate } = useOrganization();
  const { selectedFestival, setSelectedFestival } = useFestival();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [enabledPages, setEnabledPages] = useState<PageOption[]>(['dashboard', 'chandas', 'expenses', 'images']);
  const [isPasscodeDialogOpen, setIsPasscodeDialogOpen] = useState(false);
  const [isAddCompOpen, setIsAddCompOpen] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompLimit, setNewCompLimit] = useState('5');
  const [newCompLayout, setNewCompLayout] = useState('grid');
  const [selectedCompForManage, setSelectedCompForManage] = useState<{id: string, name: string} | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);

  // Initialize form with selected festival data
  useEffect(() => {
    if (selectedFestival) {
      setName(selectedFestival.name);
      setDescription(selectedFestival.description || '');
      setYear(selectedFestival.year);
      // Type assertion for the generic JSON type from Supabase
      const pages = (selectedFestival.enabled_pages as unknown as PageOption[]) || ['dashboard', 'chandas', 'expenses', 'images'];
      setEnabledPages(pages);
    } else if (currentOrganization) {
      // If no festival selected, redirect to dashboard or selection
      navigate(`/org/${currentOrganization.slug}`);
    }
  }, [selectedFestival, currentOrganization, navigate]);

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
      // Update context
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

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions', selectedFestival?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      // Ideally we should link competition to festival_id, but schema uses organization_id.
      // We can filter by name convention or just show all org competitions for now.
      // Or better: update schema to link to festival. For now, show all org competitions.
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization
  });

  const createCompMutation = useMutation({
    mutationFn: async () => {
       if (!currentOrganization) throw new Error('No org');
       const { error } = await supabase
         .from('competitions')
         .insert({
           organization_id: currentOrganization.id,
           name: newCompName,
           vote_limit_per_user: parseInt(newCompLimit),
           layout: newCompLayout
         });
       if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      setIsAddCompOpen(false);
      setNewCompName('');
      setNewCompLayout('grid');
      toast({ title: t('పోటీ జోడించబడింది', 'Competition Added') });
    }
  });

  const handleAddCompetition = (e: React.FormEvent) => {
    e.preventDefault();
    createCompMutation.mutate();
  };

  const updateCompMutation = useMutation({
    mutationFn: async ({ id, show_results, layout, results_date }: { id: string; show_results?: boolean; layout?: string; results_date?: string | null }) => {
       const updates: any = {};
       if (show_results !== undefined) updates.show_results = show_results;
       if (layout !== undefined) updates.layout = layout;
       if (results_date !== undefined) updates.results_date = results_date;

       const { error } = await supabase
         .from('competitions')
         .update(updates)
         .eq('id', id);
       if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      toast({ title: t('సెట్టింగ్‌లు సేవ్ చేయబడ్డాయి', 'Settings Saved') });
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

  const copyVoteLink = (compId: string) => {
     const url = `${window.location.origin}/org/${currentOrganization?.slug}/vote/${compId}/login`;
     navigator.clipboard.writeText(url);
     toast({ title: t('లింక్ కాపీ చేయబడింది', 'Link Copied') });
  };

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
       // Re-trigger submit if authentication successful
       updateMutation.mutate({
        name,
        description,
        year,
        enabled_pages: enabledPages
      });
    }
    return result;
  };

  if (!selectedFestival || !currentOrganization) {
    return null; // Handle redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
       {/* Use the same navigation as other pages */}
       <div className="hidden md:block">
         <Navigation /> 
       </div>

      <div className="container mx-auto px-4 py-6 pb-24 md:pb-8 max-w-2xl">
        <div className="mb-6">
          <BackButton />
        </div>

        <Tabs defaultValue="settings" className="w-full space-y-4">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">
               {t('సాధారణ సెట్టింగ్‌లు', 'General Settings')}
            </TabsTrigger>
            <TabsTrigger value="competitions" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">
               {t('పోటీలు', 'Voting Games')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
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
                <Label htmlFor="name">{t('ఉత్సవ పేరు', 'Festival Name')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">{t('సంవత్సరం', 'Year')}</Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  required
                  min="2000"
                  max="2100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('వివరణ', 'Description')}</Label>
                <Textarea
                  id="description"
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
                className="w-full"
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

          <TabsContent value="competitions">
             <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle>{t('ఓటింగ్ పోటీలు', 'Voting Games')}</CardTitle>
                    <CardDescription>{t('పోటీలను నిర్వహించండి', 'Manage your competitions')}</CardDescription>
                  </div>
                   <Button size="sm" onClick={() => setIsAddCompOpen(true)} className="gap-2">
                     <Plus className="h-4 w-4" />
                     {t('జోడించు', 'Add New')}
                   </Button>
                </CardHeader>
                <CardContent>


               <div className="space-y-3">
                 {competitions.length === 0 ? (
                   <div className="text-center py-8 bg-muted/30 rounded-lg">
                     <p className="text-muted-foreground">{t('పోటీలు లేవు', 'No competitions found')}</p>
                   </div>
                 ) : (
                   competitions.map((comp: any) => (
                     <div key={comp.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                        <div>
                          <p className="font-medium">{comp.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">Limit: {comp.vote_limit_per_user} votes</p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">{t('ఫలితాలను చూపించు', 'Show Results')}</span>
                              <Switch 
                                checked={comp.show_results} 
                                onCheckedChange={(checked) => updateCompMutation.mutate({ id: comp.id, show_results: checked })}
                                disabled={updateCompMutation.isPending}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">•</span>
                            <Select 
                              value={comp.layout || 'grid'} 
                              onValueChange={(val) => updateCompMutation.mutate({ id: comp.id, layout: val })}
                              disabled={updateCompMutation.isPending}
                            >
                              <SelectTrigger className="h-6 w-[100px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="grid">Grid</SelectItem>
                                <SelectItem value="list">List</SelectItem>
                                <SelectItem value="large">Big Cards</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="mt-2 flex items-center gap-2">
                             <Label className="text-xs text-muted-foreground w-24">Results Date:</Label>
                             <Input 
                                type="datetime-local" 
                                className="h-7 w-48 text-xs"
                                value={comp.results_date ? new Date(comp.results_date).toISOString().slice(0, 16) : ''}
                                onChange={(e) => updateCompMutation.mutate({ id: comp.id, results_date: e.target.value || null })}
                             />
                          </div>
                        </div>
                        <div className="flex gap-2">
                           <Button variant="outline" size="sm" onClick={() => {
                             setSelectedCompForManage(comp);
                             setIsManageDialogOpen(true);
                           }}>
                             Manage Entries
                           </Button>
                           <Button variant="ghost" size="icon" onClick={() => copyVoteLink(comp.id)}>
                             <Copy className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" onClick={() => navigate(`/org/${currentOrganization?.slug}/vote/${comp.id}/gallery`)}>
                             <ExternalLink className="h-4 w-4" />
                           </Button>
                        </div>
                     </div>
                   ))
                 )}
               </div>


          </CardContent>
        </Card>
        </TabsContent>
      </Tabs>
      </div>

       <div className="md:hidden">
         <Navigation /> 
       </div>

      <PasscodeDialog
        open={isPasscodeDialogOpen}
        onOpenChange={setIsPasscodeDialogOpen}
        onAuthenticate={handleAuthenticate}
        organizationName={currentOrganization.name}
      />

      <ManageCompetitionDialog 
        competition={selectedCompForManage}
        open={isManageDialogOpen}
        onOpenChange={setIsManageDialogOpen}
      />
    </div>
  );
}
