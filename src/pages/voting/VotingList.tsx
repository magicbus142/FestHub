import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useFestival } from '@/contexts/FestivalContext';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Vote, Calendar, Trophy, Settings as SettingsIcon, Plus, Copy, ExternalLink, Trash2, ArrowLeft, Pencil, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { BackButton } from '@/components/BackButton';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CustomLimitDialog } from '@/components/voting/CustomLimitDialog';
export default function VotingList() {
  const { currentOrganization, isAuthenticated } = useOrganization();
  const { selectedFestival } = useFestival();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddCompOpen, setIsAddCompOpen] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompLimit, setNewCompLimit] = useState('5');
  const [newCompLayout, setNewCompLayout] = useState('grid');
  const [customLimitOpen, setCustomLimitOpen] = useState(false);
  const [activeCompForLimit, setActiveCompForLimit] = useState<{ id: string; current: number | null } | null>(null);
  const [isNewCompLimitCustom, setIsNewCompLimitCustom] = useState(false);
  const [editingComp, setEditingComp] = useState<any>(null);
  const [isEditCompOpen, setIsEditCompOpen] = useState(false);


  // Fetch competitions
  const { data: competitions, isLoading } = useQuery({
    queryKey: ['competitions-list', currentOrganization?.id, selectedFestival?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
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

  // Admin Mutations
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
      queryClient.invalidateQueries({ queryKey: ['competitions-list'] });
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
    mutationFn: async ({ id, name, description, show_results, layout, results_date, status, vote_limit_per_user }: { id: string; name?: string; description?: string; show_results?: boolean; layout?: string; results_date?: string | null; status?: string; vote_limit_per_user?: number | null }) => {
       const updates: any = {};
       if (name !== undefined) updates.name = name;
       if (description !== undefined) updates.description = description;
       if (show_results !== undefined) updates.show_results = show_results;
       if (layout !== undefined) updates.layout = layout;
       if (results_date !== undefined) updates.results_date = results_date;
       if (status !== undefined) updates.status = status;
       if (vote_limit_per_user !== undefined) updates.vote_limit_per_user = vote_limit_per_user;

       const { error } = await supabase
         .from('competitions')
         .update(updates)
         .eq('id', id);
       if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions-list'] });
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
      queryClient.invalidateQueries({ queryKey: ['competitions-list'] });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-32">
        <div className="flex items-center justify-between gap-4 mb-8 pt-2">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="bg-slate-50 hover:bg-slate-100 border-0 rounded-full h-10 w-10 text-slate-700">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                   <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('పోటీలు', 'Competitions')}</h1>
                   <p className="text-xs text-slate-500 font-medium">Manage events</p>
                </div>
            </div>
            
            {isAuthenticated && (
                <Button 
                    onClick={() => setIsAddCompOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 h-10 text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus className="h-4 w-4 mr-1.5" />
                    {t('కొత్తది', 'New')}
                </Button>
            )}
        </div>

        {competitions && competitions.length > 0 ? (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {competitions.map((comp: any, index: number) => (
                        <motion.div
                            key={comp.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-all duration-300">
                                {/* Header Row */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-accent/50 flex items-center justify-center flex-shrink-0 text-primary">
                                            <Trophy className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 leading-tight">{comp.name}</h3>
                                             <div className="mt-1">
                                                 <span className={cn(
                                                     "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                     comp.status === 'closed' ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                                                 )}>
                                                     {comp.status === 'closed' ? 'Voting Closed' : 'Live Now'}
                                                 </span>
                                             </div>
                                        </div>
                                    </div>
                                    {isAuthenticated && (
                                        <div className="-mt-1 -mr-1">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-50 border-0 rounded-full">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-slate-100">
                                                    <DropdownMenuItem onClick={() => handleEditComp(comp)} className="gap-2 cursor-pointer py-2 rounded-lg">
                                                        <Pencil className="h-3.5 w-3.5 text-slate-500" />
                                                        <span className="text-sm font-medium">{t('సవరించండి', 'Edit')}</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => copyVoteLink(comp.id)} className="gap-2 cursor-pointer py-2 rounded-lg text-slate-600">
                                                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                                                        <span className="text-sm font-medium">{t('లింక్ కాపీ', 'Copy Link')}</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteComp(comp.id)} className="gap-2 cursor-pointer py-2 rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        <span className="text-sm font-medium">{t('తొలగించు', 'Delete')}</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    )}
                                </div>

                                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                    {comp.description || t('ఈ పోటీలో పాల్గొని మీ ప్రతిభను నిరూపించుకోండి.', 'Join now to vote based on talent and creativity.')}
                                </p>

                                {/* Stats Block */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-slate-50 rounded-xl p-3">
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Vote Limit</p>
                                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                                            <Vote className="h-4 w-4 text-primary" />
                                            <span>{comp.vote_limit_per_user === null ? t('పరిమితి లేదు', 'No Limit') : `${comp.vote_limit_per_user} ${t('ఓట్లు', 'Votes')}`}</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3">
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Results</p>
                                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                                            <Calendar className="h-4 w-4 text-primary" />
                                            <span>{comp.results_date ? new Date(comp.results_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Controls & Actions */}
                                <div className="mt-auto space-y-4">
                                    {isAuthenticated && (
                                        <div className="grid grid-cols-1 gap-3 pt-3 pb-3 border-t border-slate-100">
                                             <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                 <span className="text-xs font-semibold text-slate-700">Show Results</span>
                                                 <Switch 
                                                     checked={comp.show_results} 
                                                     onCheckedChange={(checked) => updateCompMutation.mutate({ id: comp.id, show_results: checked })}
                                                     disabled={updateCompMutation.isPending}
                                                     className="scale-90"
                                                 />
                                             </div>

                                             <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                 <span className="text-xs font-semibold text-slate-700">Accepting Votes</span>
                                                 <Switch 
                                                     checked={comp.status !== 'closed'} 
                                                     onCheckedChange={(checked) => updateCompMutation.mutate({ id: comp.id, status: checked ? 'live' : 'closed' })}
                                                     disabled={updateCompMutation.isPending}
                                                     className="scale-90"
                                                 />
                                             </div>
                                            
                                             <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-100">
                                                 <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 group/date relative">
                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('ఫలితాల తేదీ', 'Results Date')}</Label>
                                                    <div className="flex items-center gap-1.5 cursor-pointer" onClick={(e) => {
                                                        const input = e.currentTarget.querySelector('input');
                                                        if (input) input.showPicker();
                                                    }}>
                                                        <Calendar className="h-3.5 w-3.5 text-primary group-hover/date:scale-110 transition-transform" />
                                                        <Input 
                                                            type="datetime-local" 
                                                            className="h-6 text-[11px] font-bold text-slate-700 bg-transparent border-none p-0 focus-visible:ring-0 shadow-none cursor-pointer w-full"
                                                            value={comp.results_date ? new Date(comp.results_date).toISOString().slice(0, 16) : ''}
                                                            onChange={(e) => updateCompMutation.mutate({ id: comp.id, results_date: e.target.value || null })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 group/limit">
                                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('ఓటు పరిమితి', 'Vote Limit')}</Label>
                                                    <div className="flex items-center gap-1.5">
                                                        <Vote className="h-3.5 w-3.5 text-primary group-hover/limit:scale-110 transition-transform" />
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
                                                            <SelectTrigger className="h-6 w-full text-[11px] font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 shadow-none">
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

                                            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                                                <div className="flex items-center gap-2">
                                                    <SettingsIcon className="h-3.5 w-3.5 text-primary" />
                                                    <span className="text-xs font-semibold text-slate-700">{t('లేఅవుట్', 'Layout')}</span>
                                                </div>
                                                <Select 
                                                    value={comp.layout || 'grid'} 
                                                    onValueChange={(val) => updateCompMutation.mutate({ id: comp.id, layout: val })}
                                                    disabled={updateCompMutation.isPending}
                                                >
                                                    <SelectTrigger className="h-6 w-24 text-[11px] font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 shadow-none justify-end">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="grid">Grid</SelectItem>
                                                        <SelectItem value="list">List</SelectItem>
                                                        <SelectItem value="large">Big Cards</SelectItem>
                                                        <SelectItem value="compact">Compact</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            
                                            <Button 
                                                variant="outline" 
                                                className="w-full rounded-xl border-slate-200 h-9 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 mt-1"
                                                onClick={() => {
                                                    navigate(`/org/${currentOrganization?.slug}/voting/${comp.id}/manage`);
                                                }}
                                            >
                                                Manage Entries
                                            </Button>
                                        </div>
                                    )}

                                    <Button 
                                        className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
                                        onClick={() => navigate(`/org/${currentOrganization?.slug}/vote/${comp.id}/login`)}
                                    >
                                        {t('ఓటు వేయండి', 'Vote Now')} &nbsp; →
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>


            </div>
        ) : (
            <div className="text-center py-16 bg-white rounded-[32px] border-2 border-dashed border-slate-100 mt-4">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Vote className="h-10 w-10 text-indigo-400 opacity-80" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{t('పోటీలు లేవు', 'No Active Competitions')}</h3>
                <p className="text-slate-500 max-w-xs mx-auto mb-8">
                    {t('త్వరలో కొత్త పోటీలు జోడించబడతాయి', 'New competitions will be launched soon. Stay tuned!')}
                </p>
                {isAuthenticated && (
                    <Button onClick={() => setIsAddCompOpen(true)} className="rounded-full px-8 bg-black text-white hover:bg-slate-800">
                        {t('మొదటి పోటీని జోడించండి', 'Add First Competition')}
                    </Button>
                )}
            </div>
        )}

        {/* Add Competition Dialog */}
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
                                <SelectItem value="0">{t('పరిమితి లేదు', 'No Limit')}</SelectItem>
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
                                <SelectItem value="large">Big Cards</SelectItem>
                                <SelectItem value="compact">Compact</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={createCompMutation.isPending}>{t('జోడించు', 'Add')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        {/* Custom Limit Dialog */}
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
    </div>
  );
}
