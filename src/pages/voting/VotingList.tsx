import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFestival } from '@/contexts/FestivalContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, Eye, Trophy, Calendar, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function VotingList() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { selectedFestival } = useFestival();

  const { data: competitions, isLoading } = useQuery({
    queryKey: ['competitions', selectedFestival?.id],
    queryFn: async () => {
      if (!selectedFestival?.id) return [];
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('festival_id', selectedFestival.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedFestival?.id
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse" />
            <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">Fetching competitions...</p>
        </div>
      </div>
    );
  }

  if (!competitions || competitions.length === 0) {
    return (
      <div className="text-center p-16 bg-muted/20 rounded-3xl border-2 border-dashed border-primary/20 backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-all duration-500" />
        
        <div className="relative z-10 max-w-md mx-auto">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:scale-110 transition-transform duration-500 shadow-inner">
            <Trophy className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight mb-3">No Competitions Found</h3>
          <p className="text-muted-foreground mb-8">
            Create engagement with your community! Add your first competition in the organization settings.
          </p>
          <Button 
            className="rounded-full px-8 h-12 text-base font-semibold shadow-lg hover:shadow-primary/20 transition-all active:scale-95" 
            onClick={() => navigate(`/org/${slug}/settings?tab=competitions`)}
          >
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="relative p-8 rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/5 border border-primary/10 shadow-sm">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Trophy className="h-40 w-40" />
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Voting Competitions
          </h2>
          <p className="text-muted-foreground text-lg mt-2 max-w-2xl">
            Monitor engagement, manage entries, and track results for all active competitions in the {selectedFestival?.name} festival.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {competitions.map((competition) => (
          <Card key={competition.id} className="group relative overflow-hidden border-primary/10 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 rounded-2xl bg-card/50 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-xl leading-tight group-hover:text-primary transition-colors">{competition.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Added {new Date(competition.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge 
                  variant={competition.status === 'active' ? 'default' : 'secondary'}
                  className={cn(
                    "rounded-full px-3 py-0.5 font-semibold text-[10px] tracking-wider uppercase shadow-sm",
                    competition.status === 'active' ? 'bg-primary/90' : 'bg-muted/50'
                  )}
                >
                  {competition.status}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-grow leading-relaxed">
                {competition.description || 'No description provided for this competition.'}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-bold">Limit</p>
                  <p className="font-mono text-sm font-bold text-primary">{competition.vote_limit_per_user || '∞'}</p>
                </div>
                <div className="text-center border-l border-primary/10">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-bold">Visibility</p>
                  <p className="text-sm font-bold">{competition.show_results ? 'Public' : 'Hidden'}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  className="w-full gap-2 rounded-xl group/btn hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 h-10"
                  onClick={() => navigate(`/org/${slug}/voting/${competition.id}/manage`)}
                >
                  <Settings className="h-4 w-4 text-muted-foreground group-hover/btn:text-primary group-hover/btn:rotate-90 transition-all" />
                  <span className="font-semibold">Manage Competition</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full gap-2 rounded-xl text-primary/80 hover:text-primary hover:bg-primary/10 transition-all h-10"
                  onClick={() => navigate(`/org/${slug}/vote/${competition.id}/gallery`)}
                >
                  <Eye className="h-4 w-4" />
                  <span className="font-semibold text-sm">Preview Voting Page</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}

        <button 
          onClick={() => navigate(`/org/${slug}/settings?tab=competitions`)}
          className="group relative h-full min-h-[300px] border-2 border-dashed border-primary/20 rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all duration-500 flex flex-col items-center justify-center p-8 text-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
            <Users className="h-8 w-8 text-primary/60 group-hover:text-primary" />
          </div>
          <div>
            <p className="font-bold text-lg">Add New Competition</p>
            <p className="text-sm text-muted-foreground">Go to settings to configure a new voting event.</p>
          </div>
        </button>
      </div>
    </div>
  );
}
