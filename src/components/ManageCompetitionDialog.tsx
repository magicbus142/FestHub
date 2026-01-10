import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Upload, Plus, Search } from 'lucide-react';

interface ManageCompetitionDialogProps {
  competition: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageCompetitionDialog({ competition, open, onOpenChange }: ManageCompetitionDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch Participants
  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['participants', competition?.id],
    queryFn: async () => {
      if (!competition?.id) return [];
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('competition_id', competition.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!competition?.id
  });

  // Add Participant Mutation
  const addParticipantMutation = useMutation({
    mutationFn: async () => {
      if (!competition?.id || !selectedFile || !newName) throw new Error("Missing data");

      // 1. Upload Image
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `competition-entries/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-images') // Re-using existing bucket
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(fileName);

      // 3. Insert Participant
      const { error: insertError } = await supabase
        .from('participants')
        .insert({
          competition_id: competition.id,
          name: newName,
          image_url: publicUrl
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants', competition?.id] });
      setNewName('');
      setSelectedFile(null);
      toast({ title: 'Entry Added', description: 'Participant has been added successfully.' });
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
  const deleteParticipantMutation = useMutation({
    mutationFn: async (participantId: string) => {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', participantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants', competition?.id] });
      toast({ title: 'Entry Deleted' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addParticipantMutation.mutate();
  };

  const filteredParticipants = participants.filter((p: any) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-0 gap-0">
        <div className="p-6 pb-2">
            <DialogHeader>
            <DialogTitle>Manage Entries: {competition?.name}</DialogTitle>
            <DialogDescription>Add photos and participants for this competition.</DialogDescription>
            </DialogHeader>
        </div>

        <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 pb-6">
                {/* Add New Trigger or Form */}
                {!isAdding ? (
                   <Button 
                     onClick={() => setIsAdding(true)} 
                     className="w-full gap-2 border-dashed border-2 bg-transparent text-primary hover:bg-primary/5 hover:border-primary"
                     variant="outline"
                   >
                      <Plus className="h-4 w-4" /> Add New Entry
                   </Button>
                ) : (
                  <div className="p-4 border rounded-lg bg-muted/30 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium flex items-center gap-2 text-primary">
                        <Plus className="h-4 w-4" /> Add New Entry
                        </h4>
                        <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="h-8 px-2 text-muted-foreground">
                            Cancel
                        </Button>
                    </div>
                    <form onSubmit={handleAdd} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="entry-name">Participant Name / Title</Label>
                        <Input 
                        id="entry-name" 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)} 
                        placeholder="e.g. Beautiful Ganpati" 
                        required 
                        className="bg-background"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="entry-image">Photo</Label>
                        <Input 
                        id="entry-image" 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        required 
                        className="bg-background"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" className="flex-1" disabled={addParticipantMutation.isPending}>
                            {addParticipantMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
                            </>
                            ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" /> Add Entry
                            </>
                            )}
                        </Button>
                    </div>
                    </form>
                </div>
                )}

                {/* List Entries */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                        <h4 className="font-medium">Current Entries ({participants.length})</h4>
                    </div>
                    
                    <div className="relative mb-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search entries..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-muted/20"
                        />
                    </div>

                    {isLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>
                    ) : filteredParticipants.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">
                            {participants.length === 0 ? "No entries yet." : "No matching entries found."}
                        </p>
                    </div>
                    ) : (
                    <div className="grid gap-3">
                        {filteredParticipants.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-3 p-2 border rounded-md bg-card hover:border-primary/50 transition-colors group">
                            <img 
                            src={p.image_url} 
                            alt={p.name} 
                            className="h-12 w-12 rounded object-cover bg-muted" 
                            />
                            <div className="flex-1 min-w-0">
                            <p className="font-medium truncate group-hover:text-primary transition-colors">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.vote_count} votes</p>
                            </div>
                            <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                                if (confirm('Are you sure you want to delete this entry?')) {
                                deleteParticipantMutation.mutate(p.id);
                                }
                            }}
                            >
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        ))}
                    </div>
                    )}
                </div>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
