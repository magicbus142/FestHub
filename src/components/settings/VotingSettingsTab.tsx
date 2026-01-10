import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Copy, ExternalLink, Vote, Calendar, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ManageCompetitionDialog } from '@/components/ManageCompetitionDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { CustomLimitDialog } from '@/components/voting/CustomLimitDialog';

export function VotingSettingsTab() {
  const { currentOrganization } = useOrganization();
  const { selectedFestival } = useFestival();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAddCompOpen, setIsAddCompOpen] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompLimit, setNewCompLimit] = useState('5');
  const [newCompLayout, setNewCompLayout] = useState('grid');
  const [selectedCompForManage, setSelectedCompForManage] = useState<{id: string, name: string} | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [customLimitOpen, setCustomLimitOpen] = useState(false);
  const [activeCompForLimit, setActiveCompForLimit] = useState<{ id: string; current: number | null } | null>(null);
  const [isNewCompLimitCustom, setIsNewCompLimitCustom] = useState(false);
  const [editingComp, setEditingComp] = useState<any>(null);
  const [isEditCompOpen, setIsEditCompOpen] = useState(false);

  // Fetch competitions
  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions', currentOrganization?.id, selectedFestival?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      // Ideally we should link competition to festival_id, but schema uses organization_id.
      // We can filter by name convention or just show all org competitions for now.
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('festival_id', selectedFestival?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization && !!selectedFestival?.id
  });

  const createCompMutation = useMutation({
    mutationFn: async () => {
       if (!currentOrganization) throw new Error('No org');
       const { error } = await supabase
         .from('competitions')
         .insert({
           organization_id: currentOrganization.id,
           festival_id: selectedFestival?.id,
           name: newCompName,
           vote_limit_per_user: newCompLimit === 'unlimited' ? null : parseInt(newCompLimit),
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
    },
    onError: (err) => {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

  const handleAddCompetition = (e: React.FormEvent) => {
    e.preventDefault();
    createCompMutation.mutate();
  };

  const updateCompMutation = useMutation({
    mutationFn: async ({ id, name, description, show_results, layout, results_date, vote_limit_per_user }: { id: string; name?: string; description?: string; show_results?: boolean; layout?: string; results_date?: string | null; vote_limit_per_user?: number | null }) => {
       const updates: any = {};
       if (name !== undefined) updates.name = name;
       if (description !== undefined) updates.description = description;
       if (show_results !== undefined) updates.show_results = show_results;
       if (layout !== undefined) updates.layout = layout;
       if (results_date !== undefined) updates.results_date = results_date;
       if (vote_limit_per_user !== undefined) updates.vote_limit_per_user = vote_limit_per_user;

       const { error } = await supabase
         .from('competitions')
         .update(updates)
         .eq('id', id);
       if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      setIsEditCompOpen(false);
      setEditingComp(null);
      toast({ title: t('సెట్టింగ్‌లు సేవ్ చేయబడ్డాయి', 'Settings Saved') });
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

  const deleteCompMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('competitions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      toast({ title: t('పోటీ తొలగించబడింది', 'Competition Deleted') });
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

  const handleDeleteComp = (id: string) => {
    if (window.confirm(t('మీరు ఈ పోటీని తొలగించాలనుకుంటున్నారా? ఇది శాశ్వతంగా తొలగించబడుతుంది.', 'Are you sure you want to delete this competition? This action cannot be undone.'))) {
      deleteCompMutation.mutate(id);
    }
  };

  const handleEditComp = (comp: any) => {
    setEditingComp({ ...comp });
    setIsEditCompOpen(true);
  };

  const copyVoteLink = async (compId: string) => {
     const url = `${window.location.origin}/org/${currentOrganization?.slug}/vote/${compId}/login`;
     
     try {
       if (navigator.clipboard && window.isSecureContext) {
         await navigator.clipboard.writeText(url);
         toast({ title: t('లింక్ కాపీ చేయబడింది', 'Link Copied') });
       } else {
         throw new Error('Clipboard API unavailable or non-secure context');
       }
     } catch (err) {
       // Fallback for mobile/non-secure contexts/older browsers
       const textArea = document.createElement("textarea");
       textArea.value = url;
       
       // Ensure textarea is not visible but part of DOM
       textArea.style.position = "fixed";
       textArea.style.left = "-9999px";
       textArea.style.top = "0";
       document.body.appendChild(textArea);
       
       textArea.focus();
       textArea.select();
       
       try {
         const successful = document.execCommand('copy');
         if (successful) {
           toast({ title: t('లింక్ కాపీ చేయబడింది', 'Link Copied') });
         } else {
           throw new Error('execCommand copy failed');
         }
       } catch (copyErr) {
         console.error('Fallback copy failed', copyErr);
         toast({ title: 'Error', description: 'Please copy manually: ' + url, variant: 'destructive' });
       }
       
       document.body.removeChild(textArea);
     }
  };

  if (!selectedFestival) {
      return (
          <div className="p-8 text-center text-muted-foreground bg-card/50 rounded-lg">
             {t('దయచేసి ఉత్సవాన్ని ఎంచుకోండి', 'Please select a festival first')}
          </div>
      );
  }

  return (
    <>
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
                    <div key={comp.id} className="flex flex-col gap-3 p-4 border rounded-lg bg-card/40 hover:bg-card/60 transition-colors">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-semibold text-base">{comp.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Limit: {comp.vote_limit_per_user} votes • Layout: {comp.layout}
                                </p>
                            </div>
                                    {/* Actions Menu */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted/50 border-0 rounded-full">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-border/50">
                                            <DropdownMenuItem onClick={() => handleEditComp(comp)} className="gap-2 cursor-pointer py-2 rounded-lg">
                                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-sm font-medium">{t('సవరించండి', 'Edit')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => copyVoteLink(comp.id)} className="gap-2 cursor-pointer py-2 rounded-lg">
                                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-sm font-medium">{t('లింక్ కాపీ', 'Copy Link')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => navigate(`/org/${currentOrganization?.slug}/vote/${comp.id}/gallery`)} className="gap-2 cursor-pointer py-2 rounded-lg">
                                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-sm font-medium">{t('గ్యాలరీ', 'View Gallery')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteComp(comp.id)} className="gap-2 cursor-pointer py-2 rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50">
                                                <Trash2 className="h-3.5 w-3.5" />
                                                <span className="text-sm font-medium">{t('తొలగించు', 'Delete')}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-md">
                                <span className="text-sm font-medium">{t('ఫలితాలను చూపించు', 'Show Results')}</span>
                                <Switch 
                                    checked={comp.show_results} 
                                    onCheckedChange={(checked) => updateCompMutation.mutate({ id: comp.id, show_results: checked })}
                                    disabled={updateCompMutation.isPending}
                                />
                            </div>
                            
                            <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-md group/date">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap">{t('ఫలితాల తేదీ', 'Results Date')}:</Label>
                                <div className="flex items-center gap-1.5 flex-1 cursor-pointer" onClick={(e) => {
                                    const input = e.currentTarget.querySelector('input');
                                    if (input) input.showPicker();
                                }}>
                                    <Calendar className="h-3.5 w-3.5 text-primary" />
                                    <Input 
                                        type="datetime-local" 
                                        className="h-7 text-xs bg-transparent border-none p-0 focus-visible:ring-0 shadow-none font-semibold cursor-pointer w-full"
                                        value={comp.results_date ? new Date(comp.results_date).toISOString().slice(0, 16) : ''}
                                        onChange={(e) => updateCompMutation.mutate({ id: comp.id, results_date: e.target.value || null })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap">Layout:</Label>
                                <Select 
                                    value={comp.layout || 'grid'} 
                                    onValueChange={(val) => updateCompMutation.mutate({ id: comp.id, layout: val })}
                                    disabled={updateCompMutation.isPending}
                                >
                                    <SelectTrigger className="h-7 w-full text-xs bg-transparent border-none p-0 focus:ring-0">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="grid">Grid</SelectItem>
                                        <SelectItem value="list">List</SelectItem>
                                        <SelectItem value="large">Big Cards</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-md group/limit">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap">{t('ఓటు పరిమితి', 'Vote Limit')}:</Label>
                                <div className="flex items-center gap-1.5 flex-1">
                                    <Vote className="h-3.5 w-3.5 text-primary" />
                                    <Select 
                                        value={comp.vote_limit_per_user === null ? '0' : [5, 10].includes(comp.vote_limit_per_user) ? comp.vote_limit_per_user.toString() : 'custom'} 
                                        onValueChange={(val) => {
                                            if (val === 'custom') {
                                                setActiveCompForLimit({ id: comp.id, current: comp.vote_limit_per_user });
                                                setCustomLimitOpen(true);
                                            } else {
                                                updateCompMutation.mutate({ id: comp.id, vote_limit_per_user: val === '0' ? null : parseInt(val) });
                                            }
                                        }}
                                        disabled={updateCompMutation.isPending}
                                    >
                                        <SelectTrigger className="h-7 w-full text-xs bg-transparent border-none p-0 focus:ring-0 shadow-none font-semibold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5">5 {t('ఓట్లు', 'Votes')}</SelectItem>
                                            <SelectItem value="10">10 {t('ఓట్లు', 'Votes')}</SelectItem>
                                            <SelectItem value="0">{t('పరిమితి లేదు', 'No Limit')}</SelectItem>
                                            <SelectItem value="custom">{t('కస్టమ్', 'Custom')}...</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-1"
                            onClick={() => {
                                setSelectedCompForManage(comp);
                                setIsManageDialogOpen(true);
                            }}
                        >
                            Manage Questions & Entries
                        </Button>
                    </div>
                ))
                )}
            </div>
        </CardContent>
      </Card>

      <Dialog open={isAddCompOpen} onOpenChange={setIsAddCompOpen}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>{t('కొత్త పోటీని సృష్టించండి', 'Create New Competition')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCompetition} className="space-y-4">
            <div className="space-y-2">
                <Label>{t('పేరు', 'Name')}</Label>
                <Input value={newCompName} onChange={(e) => setNewCompName(e.target.value)} required />
            </div>
                    <div className="space-y-2">
                         <Label>{t('ఓటు పరిమితి', 'Vote Limit')}</Label>
                         <Select 
                            value={newCompLimit === 'unlimited' ? '0' : ['5', '10'].includes(newCompLimit) ? newCompLimit : 'custom'} 
                            onValueChange={(val) => {
                                if (val === 'custom') {
                                    setIsNewCompLimitCustom(true);
                                    setCustomLimitOpen(true);
                                } else if (val === '0') {
                                    setNewCompLimit('unlimited');
                                } else {
                                    setNewCompLimit(val);
                                }
                            }}
                         >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="5">5 Votes</SelectItem>
                        <SelectItem value="10">10 Votes</SelectItem>
                        <SelectItem value="0">No Limit</SelectItem>
                        <SelectItem value="custom">Custom...</SelectItem>
                    </SelectContent>
                 </Select>
                 {newCompLimit !== '5' && newCompLimit !== '10' && newCompLimit !== 'unlimited' && (
                    <p className="text-xs text-muted-foreground mt-1">Selected: {newCompLimit} votes</p>
                 )}
            </div>
            <div className="space-y-2">
                 <Label>{t('లేఅవుట్', 'Layout')}</Label>
                 <Select value={newCompLayout} onValueChange={setNewCompLayout}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                    </SelectContent>
                 </Select>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={createCompMutation.isPending}>{t('జోడించు', 'Add')}</Button>
            </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      <ManageCompetitionDialog 
        competition={selectedCompForManage}
        open={isManageDialogOpen}
        onOpenChange={setIsManageDialogOpen}
      />

      <CustomLimitDialog 
        open={customLimitOpen}
        onOpenChange={(open) => {
            setCustomLimitOpen(open);
            if (!open) {
                setActiveCompForLimit(null);
                setIsNewCompLimitCustom(false);
            }
        }}
        initialValue={isNewCompLimitCustom ? '15' : activeCompForLimit?.current?.toString() || '15'}
        onConfirm={(val) => {
            if (isNewCompLimitCustom) {
                setNewCompLimit(val.toString());
            } else if (activeCompForLimit) {
                updateCompMutation.mutate({ id: activeCompForLimit.id, vote_limit_per_user: val });
            }
        }}
      />

      {/* Edit Competition Dialog */}
      <Dialog open={isEditCompOpen} onOpenChange={setIsEditCompOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('పోటీని సవరించండి', 'Edit Competition')}</DialogTitle>
                </DialogHeader>
                {editingComp && (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('పేరు', 'Name')}</Label>
                            <Input 
                                value={editingComp.name} 
                                onChange={(e) => setEditingComp({ ...editingComp, name: e.target.value })} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('వివరణ', 'Description')}</Label>
                            <Input 
                                value={editingComp.description || ''} 
                                onChange={(e) => setEditingComp({ ...editingComp, description: e.target.value })} 
                                placeholder={t('పోటీ వివరాలు...', 'Competition details...')}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditCompOpen(false)}>{t('రద్దు', 'Cancel')}</Button>
                            <Button 
                                onClick={() => updateCompMutation.mutate({ 
                                    id: editingComp.id, 
                                    name: editingComp.name, 
                                    description: editingComp.description 
                                })}
                                disabled={updateCompMutation.isPending}
                            >
                                {t('సేవ్ చెయ్', 'Save')}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    </>
  );
}
