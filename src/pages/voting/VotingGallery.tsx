import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFestival } from '@/contexts/FestivalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Heart, ArrowLeft, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have utility class merger
import { Badge } from '@/components/ui/badge'; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';
import { Calendar, Maximize2, Download, X } from 'lucide-react';
import { format } from 'date-fns'; 
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog"; 

interface Participant {
  id: string;
  name: string;
  image_url: string;
  vote_count: number;
}

export default function VotingGallery() {
  const { slug, competitionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { selectedFestival } = useFestival();
  const deviceId = localStorage.getItem('device_id');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Tabs State
  const [activeTab, setActiveTab] = useState("entries");
  
  // Image View State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDownload = async (imageUrl: string, name: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: "Image saved to device." });
    } catch (error) {
      console.error('Download failed:', error);
      window.open(imageUrl, '_blank');
    }
  };

  // Redirect if no device ID (should auto-login via VotingLogin)
  useEffect(() => {
    if (!deviceId) {
      navigate(`/org/${slug}/vote/${competitionId}/login`);
    }
  }, [deviceId, navigate, slug, competitionId]);

  // Fetch Competition Details (for name and limit)
  const { data: competition } = useQuery({
    queryKey: ['competition', competitionId, selectedFestival?.id],
    queryFn: async () => {
      let query = supabase
        .from('competitions')
        .select('*')
        .eq('id', competitionId);
      
      // Only filter by festival if we have a selected one (e.g. from admin side)
      // For public shared links, competition_id is sufficient.
      if (selectedFestival?.id) {
        query = query.eq('festival_id', selectedFestival.id);
      }
      
      const { data, error } = await query.single();
      if (error) throw error;
      return data;
    },
    enabled: !!competitionId
  });

  // Fetch Participants
  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['participants', competitionId, selectedFestival?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('competition_id', competitionId)
        .order('created_at', { ascending: true }); 
      if (error) throw error;
      return data as Participant[];
    },
    enabled: !!competitionId
  });

  // Fetch User Votes
  const { data: userVotes = [] } = useQuery({
    queryKey: ['userVotes', competitionId, deviceId], // Use deviceId
    queryFn: async () => {
       const { data, error } = await supabase
         .from('votes')
         .select('participant_id')
         .eq('competition_id', competitionId)
         .eq('mobile_number', deviceId); // Schema still uses 'mobile_number' column
       if (error) throw error;
       return data.map(v => v.participant_id);
    },
    enabled: !!deviceId
  });

  // Check limits
  const VOTE_LIMIT = competition?.vote_limit_per_user;
  const votesCast = userVotes.length;
  const isUnlimited = VOTE_LIMIT === null;
  const votesRemaining = isUnlimited ? Infinity : (VOTE_LIMIT || 5) - votesCast;

  // Vote Mutation
  const voteMutation = useMutation({
    mutationFn: async (participantId: string) => {
      const { data, error } = await supabase.rpc('cast_vote', {
        comp_id: competitionId,
        part_id: participantId,
        mobile: deviceId // Passing deviceId as 'mobile' argument to RPC
      });

      if (error) throw error;
      if (!data.success) {
        throw new Error(data.message || 'Failed to vote');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
      queryClient.invalidateQueries({ queryKey: ['userVotes'] });
      toast({
        title: "Vote Cast!",
        description: "Your vote has been counted.",
        variant: "default" // or success style
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Voting Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleVote = (participantId: string) => {
    if (competition?.status === 'closed') {
        toast({ title: "Voting Closed", description: "This competition is no longer accepting votes.", variant: "destructive"});
        return;
    }
    if (userVotes.includes(participantId)) {
        toast({ title: "Already Voted", description: "You have already voted for this entry."});
        return;
    }
    if (votesRemaining <= 0) {
        toast({ title: "Limit Reached", description: "You have used all your votes!", variant: "destructive"});
        return;
    }
    voteMutation.mutate(participantId);
  };

  const handleShare = async () => {
      const shareData = {
          title: competition?.name || "Vote Now",
          text: `Check out the entries for ${competition?.name} and vote for your favorite!`,
          url: window.location.href
      };

      if (navigator.share) {
          try {
              await navigator.share(shareData);
              return;
          } catch (err) {
              console.log('Share failed, falling back to copy');
          }
      } 
      
      // Copy to clipboard fallback
      const url = window.location.href;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
          toast({ title: t('లింక్ కాపీ చేయబడింది', 'Link Copied'), description: t('ఓటింగ్ లింక్ క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది.', 'Voting link copied to clipboard.') });
        } else {
          throw new Error('Clipboard API unavailable');
        }
      } catch (err) {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            toast({ title: t('లింక్ కాపీ చేయబడింది', 'Link Copied'), description: t('ఓటింగ్ లింక్ క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది.', 'Voting link copied to clipboard.') });
          } else {
            throw new Error('copy failed');
          }
        } catch (copyErr) {
          toast({ title: 'Error', description: 'Copy failed. Please copy the URL from your browser.', variant: 'destructive' });
        }
        document.body.removeChild(textArea);
      }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const now = new Date();
  const resultsDate = competition?.results_date ? new Date(competition.results_date) : null;
  const isResultsTime = !resultsDate || now >= resultsDate;
  const shouldShowResults = competition?.show_results && isResultsTime;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container px-4 py-3 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
               <div>
                  <h1 className="text-lg font-bold leading-tight">{competition?.name || 'Loading...'}</h1>
                  <p className="text-xs text-muted-foreground">{participants.length} Entries</p>
               </div>
            </div>
            
            <div className="flex items-center gap-2">
              {competition?.status === 'closed' ? (
                <Badge variant="destructive" className="animate-pulse">
                   {t('ఓటింగ్ ముగిసింది', 'Voting Closed')}
                </Badge>
              ) : (
                <Badge variant={votesRemaining > 0 || isUnlimited ? "default" : "secondary"}>
                   {isUnlimited ? t('అపరిమిత ఓట్లు', 'Unlimited Votes') : `${t('మిగిలిన ఓట్లు', 'Votes Left')}: ${votesRemaining}`}
                </Badge>
              )}
              <Button variant="ghost" size="icon" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
             <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/60 backdrop-blur rounded-xl h-11">
                <TabsTrigger 
                  value="entries"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300 font-semibold"
                >
                  Entries
                </TabsTrigger>
                <TabsTrigger 
                  value="results"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300 font-semibold"
                >
                  Results
                </TabsTrigger>
             </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="container px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
           <TabsContent value="entries" className="mt-0">
             <div className={cn(
               "grid gap-6",
               competition?.layout === 'list' 
                 ? "grid-cols-1" 
                 : competition?.layout === 'large' 
                   ? "grid-cols-1 md:grid-cols-2" 
                   : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
             )}>
              {participants
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((participant) => {
                const isVoted = userVotes.includes(participant.id);
                
                return (
                  <Card key={participant.id} className={cn(
                    "overflow-hidden group",
                    competition?.layout === 'list' && "flex flex-row h-32"
                  )}>
                    <div className={cn(
                      "relative bg-muted",
                      competition?.layout === 'list' ? "w-32 h-full aspect-square" : "aspect-[4/3]"
                    )}>
                      <img 
                        src={participant.image_url} 
                        alt={'Participant'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {competition?.layout !== 'list' && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                      
                      {/* Overlay Actions */}
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 border-none" onClick={() => setSelectedImage(participant.image_url)}>
                           <Maximize2 className="h-4 w-4" />
                         </Button>
                         <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 border-none" onClick={() => handleDownload(participant.image_url, `Entry_${participant.id}`)}>
                           <Download className="h-4 w-4" />
                         </Button>
                      </div>
                    </div>
                    
                    <div className={cn(
                      "p-4 flex flex-1",
                       competition?.layout === 'list' ? "items-center justify-between" : "flex-col justify-between gap-4"
                    )}>
                      <div>
                        <h3 className={cn(
                          "font-semibold",
                           competition?.layout === 'large' && "text-xl mb-1"
                        )}>
                          {shouldShowResults ? participant.name : `Entry #${participant.id.slice(0, 4)}`}
                        </h3>
                        {/* Always hide votes in Entries tab as per user request flow implies mystery until results */}
                      </div>
                      
                      <div className={cn(
                         "flex items-center",
                         competition?.layout !== 'list' && "justify-end w-full"
                      )}>
                        <Button
                          size={competition?.layout === 'large' ? "default" : "sm"}
                          variant={isVoted ? "secondary" : "default"}
                          className={cn(
                              "gap-2 transition-all",
                              isVoted && "bg-green-100 text-green-700 hover:bg-green-200",
                              competition?.layout !== 'list' && "w-full sm:w-auto"
                          )}
                          onClick={() => handleVote(participant.id)}
                          disabled={voteMutation.isPending || competition?.status === 'closed' || (!isVoted && votesRemaining <= 0)}
                        >
                          <Heart className={cn("h-4 w-4", isVoted && "fill-current")} />
                          {isVoted ? "Voted" : "Vote"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
             </div>

             {/* Pagination */}
             {participants.length > itemsPerPage && (
                <div className="mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.ceil(participants.length / itemsPerPage) }).map((_, i) => (
                         <PaginationItem key={i}>
                           <PaginationLink 
                              href="#" 
                              isActive={currentPage === i + 1}
                              onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}
                           >
                              {i + 1}
                           </PaginationLink>
                         </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext 
                          href="#"
                          onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(Math.ceil(participants.length / itemsPerPage), p + 1)); }}
                           className={currentPage === Math.ceil(participants.length / itemsPerPage) ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
             )}
           </TabsContent>

           <TabsContent value="results" className="mt-6">
              {(() => {
                 // Use variables from component scope


                 if (!shouldShowResults) {
                   return (
                     <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="p-4 bg-muted rounded-full">
                       <Calendar className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Results Coming Soon</h2>
                      <p className="text-muted-foreground mt-2">
                        {competition?.results_date 
                          ? `Results will be announced on ${format(new Date(competition.results_date), 'PPP p')}`
                          : "The results haven't been published yet. Stay tuned!"}
                      </p>
                    </div>
                 </div>
                   );
                 }

              return (
                <div className={cn(
                   "grid gap-6",
                   competition?.layout === 'list' 
                     ? "grid-cols-1" 
                     : competition?.layout === 'large' 
                       ? "grid-cols-1 md:grid-cols-2" 
                       : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                 )}>
                   {/* Sorted by votes */}
                  {[...participants].sort((a, b) => b.vote_count - a.vote_count).map((participant, index) => (
                    <Card key={participant.id} className={cn(
                      "overflow-hidden group border-2",
                      index === 0 ? "border-yellow-500" : index === 1 ? "border-gray-400" : index === 2 ? "border-amber-700" : "border-transparent",
                       competition?.layout === 'list' && "flex flex-row h-32"
                    )}>
                       <div className={cn(
                        "relative bg-muted",
                        competition?.layout === 'list' ? "w-32 h-full aspect-square" : "aspect-[4/3]"
                      )}>
                        <img 
                          src={participant.image_url} 
                          alt={participant.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                         {index < 3 && (
                            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                               <span className={cn(
                                 "w-2 h-2 rounded-full",
                                 index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-amber-700"
                               )} />
                               Rank #{index + 1}
                            </div>
                         )}
                      </div>
                      
                      <div className="p-4 flex flex-col justify-center gap-1">
                        <h3 className="font-semibold text-lg">{participant.name}</h3>
                        <div className="flex items-center gap-2">
                           <Badge variant="secondary" className="font-mono">
                             {participant.vote_count} Votes
                           </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              );
              })()}
           </TabsContent>
        </Tabs>
      </div>

       {/* Image Viewer Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/90 border-none overflow-hidden h-[90vh] flex items-center justify-center">
           <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 focus:outline-none">
             <X className="h-4 w-4" />
           </DialogClose>
           {selectedImage && (
             <img 
               src={selectedImage} 
               alt="Full View" 
               className="max-h-full max-w-full object-contain"
             />
           )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
