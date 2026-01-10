import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFestival } from '@/contexts/FestivalContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
    ArrowLeft, Plus, Loader2, Search, Trash2, Edit2, 
    Trophy, Users, Vote, ImageIcon, MoreVertical 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ManageCompetitionPage() {
  const { slug, competitionId } = useParams<{ slug: string; competitionId: string }>();
  const { selectedFestival } = useFestival();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'high-to-low' | 'low-to-high'>('high-to-low');

  // Fetch Competition Details
  const { data: competition, isLoading: isLoadingComp } = useQuery({
    queryKey: ['competition-details', competitionId, selectedFestival?.id],
    queryFn: async () => {
        if (!competitionId) return null;
        const { data, error } = await supabase
            .from('competitions')
            .select('*')
            .eq('id', competitionId)
            .single();
        if (error) throw error;
        return data;
    },
    enabled: !!competitionId
  });
  
  // Update Competition Mutation (Status)
  const updateCompMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
        if (!competitionId) throw new Error("No competition ID");
        const { error } = await supabase
            .from('competitions')
            .update({ status })
            .eq('id', competitionId);
        if (error) throw error;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['competition-details', competitionId] });
        toast({ title: 'Status Updated', description: 'Competition status changed successfully.' });
    },
    onError: (error) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Fetch Participants
  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['participants', competitionId, selectedFestival?.id],
    queryFn: async () => {
      if (!competitionId) return [];
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('competition_id', competitionId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!competitionId
  });

  // Stats Calculation
  const totalEntries = participants.length;
  const totalVotes = participants.reduce((acc: number, p: any) => acc + (p.vote_count || 0), 0);
  const topParticipant = participants.reduce((prev: any, current: any) => 
    (prev?.vote_count || 0) > (current?.vote_count || 0) ? prev : current
  , null);

  // Add/Edit Participant Mutation
  const mutation = useMutation({
    mutationFn: async () => {
      if (!competitionId || (!editingId && !selectedFile) || !formData.name) throw new Error("Missing data");

      let imageUrl = null;

      // 1. Upload Image (if new file selected)
      if (selectedFile) {
          const fileExt = selectedFile.name.split('.').pop();
          const fileName = `competition-entries/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('user-images') 
            .upload(fileName, selectedFile);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('user-images')
            .getPublicUrl(fileName);
            
          imageUrl = publicUrl;
      }

      if (editingId) {
          // Update existing
          const updateData: any = { name: formData.name };
          if (imageUrl) updateData.image_url = imageUrl;

          const { error } = await supabase
              .from('participants')
              .update(updateData)
              .eq('id', editingId);
          if (error) throw error;
      } else {
          // Create new
          if (!imageUrl) throw new Error("Image is required for new entries");
          const { error } = await supabase
            .from('participants')
            .insert({
              competition_id: competitionId,
              festival_id: selectedFestival?.id,
              name: formData.name,
              image_url: imageUrl
            });
          if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants', competitionId] });
      handleClose();
      toast({ 
          title: editingId ? 'Entry Updated' : 'Entry Added',
          description: editingId ? 'Participant details updated.' : 'New participant added successfully.' 
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  // Delete Participant Mutation
  const deleteMutation = useMutation({
    mutationFn: async (participantId: string) => {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', participantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants', competitionId] });
      toast({ title: 'Entry Deleted' });
    },
    onError: (error) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleClose = () => {
      setIsOpen(false);
      setEditingId(null);
      setFormData({ name: '' });
      setSelectedFile(null);
  };

  const handleEdit = (participant: any) => {
      setEditingId(participant.id);
      setFormData({ name: participant.name });
      setIsOpen(true);
  };

  const filteredParticipants = participants.filter((p: any) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoadingComp) {
    return <div className="flex h-[50vh] justify-center items-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-32 min-h-screen bg-slate-50/50">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
             <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="bg-white hover:bg-slate-100 border border-slate-200 rounded-full h-10 w-10 text-slate-700 shadow-sm">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Manage Entries</h1>
                    <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                        <Trophy className="h-3.5 w-3.5 text-primary" />
                        {competition?.name}
                        <Badge className={cn(
                            "ml-2 font-semibold border-0",
                            competition?.status === 'closed' ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                        )} variant="outline">
                            {competition?.status === 'closed' ? 'Closed' : 'Live'}
                        </Badge>
                    </p>
                </div>
             </div>
             
             <div className="flex items-center gap-5 self-end md:self-auto">
                <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-full border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Status</span>
                    <Switch 
                        checked={competition?.status !== 'closed'} 
                        onCheckedChange={(checked) => updateCompMutation.mutate({ status: checked ? 'live' : 'closed' })}
                        disabled={updateCompMutation.isPending}
                        className="scale-90"
                    />
                </div>
                <ThemeSwitcher />
                <Button 
                    onClick={() => setIsOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 h-11 text-sm font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                </Button>
             </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Card className="p-4 border-none shadow-sm bg-white/80 backdrop-blur flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Users className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500">Total Entries</p>
                    <h3 className="text-2xl font-bold text-slate-900">{totalEntries}</h3>
                </div>
            </Card>
            
            <Card className="p-4 border-none shadow-sm bg-white/80 backdrop-blur flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                    <Vote className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500">Total Votes</p>
                    <h3 className="text-2xl font-bold text-slate-900">{totalVotes.toLocaleString()}</h3>
                </div>
            </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="gallery" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <TabsList className="bg-slate-100 p-1 rounded-full border border-slate-200 w-full sm:w-auto h-auto flex gap-1">
                    <TabsTrigger value="gallery" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all flex-1 sm:flex-none">
                        <ImageIcon className="h-4 w-4 mr-2" /> Gallery
                    </TabsTrigger>
                    <TabsTrigger value="leaderboard" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all flex-1 sm:flex-none">
                        <Trophy className="h-4 w-4 mr-2" /> Leaderboard
                    </TabsTrigger>
                </TabsList>

                {/* Search - Shared across tabs */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search entries..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 bg-white border-slate-200 rounded-lg focus-visible:ring-primary"
                    />
                </div>
            </div>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="mt-0">

        {isLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : filteredParticipants.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No entries yet</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                    Get started by adding the first participant to this competition.
                </p>
                <Button onClick={() => setIsOpen(true)} variant="outline">
                    Add First Entry
                </Button>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredParticipants.map((p: any) => (
                    <div key={p.id} className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
                        {/* Image Area */}
                        <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                            <img 
                                src={p.image_url} 
                                alt={p.name} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                            
                            {/* Actions Menu */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 border-0 text-white">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                        <DropdownMenuItem onClick={() => handleEdit(p)}>
                                            <Edit2 className="h-4 w-4 mr-2" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                            onClick={() => {
                                                if (confirm('Delete this entry?')) deleteMutation.mutate(p.id);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Vote Badge */}
                            <div className="absolute top-3 left-3">
                                <Badge className="bg-black/30 backdrop-blur-md hover:bg-black/40 border-0 text-white font-semibold">
                                    <Vote className="h-3 w-3 mr-1 text-primary" />
                                    {p.vote_count} Votes
                                </Badge>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="relative p-4">
                            <h4 className="font-bold text-slate-900 truncate text-lg pr-4" title={p.name}>{p.name}</h4>
                            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-1">
                                ID: #ENTRY-{p.id.slice(0, 4)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        )}
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" /> 
                        Identify Winners
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 whitespace-nowrap">Sort by:</span>
                        <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                            <SelectTrigger className="w-[180px] h-9 bg-white">
                                <SelectValue placeholder="Sort order" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="high-to-low">Highest Votes First</SelectItem>
                                <SelectItem value="low-to-high">Lowest Votes First</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {filteredParticipants
                        .sort((a: any, b: any) => {
                            if (sortOrder === 'high-to-low') return (b.vote_count || 0) - (a.vote_count || 0);
                            return (a.vote_count || 0) - (b.vote_count || 0);
                        })
                        .map((p: any, index: number) => (
                        <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                            <div className="flex-shrink-0 w-8 text-center font-bold text-slate-400">
                                #{index + 1}
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 relative">
                                <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 truncate">{p.name}</h4>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-primary text-lg">{p.vote_count}</div>
                                <div className="text-xs text-slate-500 font-medium">Votes</div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(p)}>Edit</DropdownMenuItem>
                                        <DropdownMenuItem 
                                            className="text-red-600"
                                            onClick={() => {
                                                if (confirm('Delete this entry?')) deleteMutation.mutate(p.id);
                                            }}
                                        >
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                    
                    {filteredParticipants.length === 0 && (
                         <div className="p-8 text-center text-slate-500">
                            No entries found matching your search.
                        </div>
                    )}
                </div>
            </div>
        </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingId ? 'Edit Entry' : 'Add New Entry'}</DialogTitle>
                </DialogHeader>
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        mutation.mutate();
                    }} 
                    className="space-y-4 py-4"
                >
                    <div className="space-y-2">
                        <Label>Participant Name</Label>
                        <Input 
                            value={formData.name} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                            required 
                            placeholder="Enter name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Photo {editingId && '(Optional)'}</Label>
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors group cursor-pointer relative">
                             <Input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                required={!editingId}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex flex-col items-center justify-center gap-2">
                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <ImageIcon className="h-5 w-5 text-slate-500 group-hover:text-primary transition-colors" />
                                </div>
                                <div className="text-sm font-medium text-slate-600">
                                    {selectedFile ? selectedFile.name : (editingId ? 'Click to change photo' : 'Click to upload photo')}
                                </div>
                                {!selectedFile && <p className="text-xs text-slate-400">JPG, PNG supported</p>}
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                        <Button 
                            type="submit" 
                            className="bg-primary hover:bg-primary/90 text-primary-foreground" 
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {editingId ? 'Updating...' : 'Adding...'}</>
                            ) : (
                                editingId ? 'Save Changes' : 'Add Entry'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
