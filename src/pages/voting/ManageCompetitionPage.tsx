import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Users, Trophy, BarChart, Settings as SettingsIcon, Info, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ManageCompetitionPage() {
  const { slug, competitionId } = useParams();
  const navigate = useNavigate();

  const { data: competition, isLoading: isLoadingComp } = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', competitionId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: participants, isLoading: isLoadingParts } = useQuery({
    queryKey: ['participants', competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('competition_id', competitionId)
        .order('vote_count', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoadingComp || isLoadingParts) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full animate-pulse" />
            <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">Loading dashboard details...</p>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="text-center p-20 bg-muted/20 rounded-3xl border border-dashed flex flex-col items-center gap-6">
        <div className="p-4 bg-primary/10 rounded-full">
           <Info className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Competition Not Found</h3>
          <p className="text-muted-foreground mt-2">The competition you're looking for doesn't exist or you don't have access.</p>
        </div>
        <Button variant="default" className="rounded-full px-8" onClick={() => navigate(`/org/${slug}/voting`)}>
          Back to List
        </Button>
      </div>
    );
  }

  const totalVotes = participants?.reduce((acc, p) => acc + (p.vote_count || 0), 0) || 0;

  return (
    <div className="space-y-8 pb-20">
      {/* Premium Header Container */}
      <div className="relative rounded-3xl overflow-hidden bg-card border border-primary/10 shadow-sm p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 blur-[100px] -ml-32 -mb-32 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-2xl border-primary/10 hover:border-primary/30 transition-all active:scale-95" 
                onClick={() => navigate(`/org/${slug}/voting`)}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
                   {competition.name}
                </h2>
                <Badge className={cn(
                    "rounded-full px-4 h-6 text-[10px] font-bold tracking-widest uppercase",
                    competition.status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-muted text-muted-foreground border-transparent"
                )}>
                    {competition.status}
                </Badge>
              </div>
              <p className="text-muted-foreground font-medium">Control center for entries and real-time voting analytics.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
                variant="outline" 
                className="rounded-xl border-primary/20 hover:bg-primary/5 gap-2 px-6"
                onClick={() => navigate(`/org/${slug}/vote/${competitionId}/gallery`)}
            >
                <ExternalLink className="h-4 w-4" />
                Live Preview
            </Button>
            <Button className="rounded-xl shadow-lg shadow-primary/20 gap-2 px-6" disabled>
                <SettingsIcon className="h-4 w-4" />
                Edit Event
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Analytics Summary */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
                { label: 'Participants', value: participants?.length || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Total Votes', value: totalVotes, icon: BarChart, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { label: 'Top Vote Count', value: participants?.[0]?.vote_count || 0, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' }
            ].map((stat, i) => (
                <Card key={i} className="p-6 border-primary/10 bg-card/50 backdrop-blur-sm group hover:border-primary/30 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                            <stat.icon className={cn("h-5 w-5", stat.color)} />
                        </div>
                        <div className="h-1 w-8 bg-muted rounded-full overflow-hidden">
                            <div className={cn("h-full animate-progress-glow", stat.bg.replace('/10', ''))} style={{ width: '40%' }} />
                        </div>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-black">{stat.value.toLocaleString()}</p>
                </Card>
            ))}
          </div>

          {/* Detailed Leaderboard */}
          <Card className="p-0 overflow-hidden border-primary/10 shadow-xl rounded-3xl bg-card/30 backdrop-blur-md">
            <div className="p-6 border-b border-primary/5 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
                        <Trophy className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-xl tracking-tight">Leaderboard Ranking</h3>
                </div>
                <Badge variant="outline" className="rounded-full bg-background/50 border-primary/10">Real-time Sync Off</Badge>
            </div>
            
            <div className="p-2">
              <div className="space-y-1">
                {participants?.map((p, index) => (
                  <div 
                    key={p.id} 
                    className={cn(
                        "group flex items-center justify-between p-4 rounded-2xl transition-all duration-300",
                        index === 0 ? "bg-primary/5 border border-primary/10" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-6">
                      <div className="relative flex items-center justify-center w-8 text-lg font-black italic text-muted-foreground/30 group-hover:text-primary/40 transition-colors">
                        {index + 1}
                      </div>

                      <div className="relative group/avatar">
                        <div className={cn(
                            "w-14 h-14 rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-500 rotate-1 group-hover:rotate-0",
                            index === 0 ? "ring-2 ring-amber-400 ring-offset-2" : 
                            index === 1 ? "ring-2 ring-gray-300 ring-offset-2" :
                            index === 2 ? "ring-2 ring-amber-700/50 ring-offset-2" : ""
                        )}>
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover transform transition-transform duration-700 group-hover/avatar:scale-110" />
                        </div>
                        {index < 3 && (
                            <div className={cn(
                                "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-background",
                                index === 0 ? "bg-amber-400" : index === 1 ? "bg-gray-300" : "bg-amber-700"
                            )}>
                                <Trophy className="h-3 w-3 text-white" />
                            </div>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <p className="font-bold text-lg group-hover:text-primary transition-colors">{p.name}</p>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded uppercase tracking-wider">
                                ID: {p.id.slice(0, 8)}
                            </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                       <div className="flex items-center gap-2">
                           <span className="text-2xl font-black tabular-nums">{p.vote_count}</span>
                           <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Votes</span>
                       </div>
                       <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden flex-shrink-0">
                           <div 
                             className={cn(
                                "h-full transition-all duration-1000 ease-out",
                                index === 0 ? "bg-gradient-to-r from-amber-400 to-yellow-500" : "bg-primary/40"
                             )} 
                             style={{ width: `${(p.vote_count / (participants[0]?.vote_count || 1)) * 100}%` }} 
                           />
                       </div>
                    </div>
                  </div>
                ))}

                {(!participants || participants.length === 0) && (
                    <div className="p-20 text-center space-y-3">
                        <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto scale-90 opacity-50">
                            <Users className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium">No participants have entered this competition yet.</p>
                    </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Settings & Info */}
        <div className="space-y-8">
          <Card className="p-8 border-primary/10 bg-card/50 backdrop-blur-sm rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <SettingsIcon className="h-20 w-20" />
            </div>
            
            <h3 className="font-bold text-xl mb-6 tracking-tight flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                Event Configuration
            </h3>
            
            <div className="space-y-8">
              <div className="group/item">
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-2 group-hover/item:text-primary transition-colors">Description</p>
                <div className="p-4 rounded-2xl bg-muted/40 text-sm leading-relaxed border border-transparent group-hover/item:border-primary/10 transition-all">
                    {competition.description || 'Provide a compelling description in settings to attract more participants.'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="group/item">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-2 group-hover/item:text-primary transition-colors">Vote Limit</p>
                  <p className="font-black text-2xl tracking-tighter">
                    {competition.vote_limit_per_user || '∞'} 
                    <span className="text-[10px] text-muted-foreground tracking-normal block -mt-1 font-bold">Per Voter</span>
                  </p>
                </div>
                <div className="group/item">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-2 group-hover/item:text-primary transition-colors">Results</p>
                  <Badge variant={competition.show_results ? "default" : "secondary"} className="rounded-xl h-8 px-4 font-bold tracking-widest uppercase">
                    {competition.show_results ? 'Visible' : 'Secret'}
                  </Badge>
                </div>
              </div>

              <div className="pt-6 border-t border-primary/5">
                <Button className="w-full rounded-2xl h-14 font-bold text-base shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all group-hover:scale-[1.02] active:scale-[0.98]" disabled>
                  Edit Competition
                </Button>
                <p className="text-[10px] text-center mt-4 text-muted-foreground/60 font-medium">Management tools are currently in view-only mode.</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-dashed border-2 border-primary/10 bg-transparent rounded-3xl">
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2 opacity-60">
                <Info className="h-4 w-4" />
                Quick Actions
            </h4>
            <div className="space-y-3">
                {[
                    'Export Standings (CSV)',
                    'Reset All Votes',
                    'Announce Winners',
                    'Share Updates'
                ].map((action, i) => (
                    <Button key={i} variant="outline" className="w-full justify-start rounded-xl h-10 text-xs font-semibold opacity-50 cursor-not-allowed group" disabled>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:bg-primary transition-colors mr-3" />
                        {action}
                    </Button>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
