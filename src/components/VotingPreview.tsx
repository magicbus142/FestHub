import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Vote, Trophy } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useFestival } from '@/contexts/FestivalContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export function VotingPreview() {
  const { t } = useLanguage();
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();

  const { selectedFestival } = useFestival();

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions-preview', currentOrganization?.id, selectedFestival?.id],
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
    enabled: !!currentOrganization && !!selectedFestival?.id,
  });

  const totalCompetitions = competitions.length;
  const liveCompetitions = competitions.filter((c: any) => c.status !== 'closed').length;
  
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-purple-600" />
            {t('ఓటింగ్ పోటీలు', 'Voting Games')}
          </CardTitle>
          <CardDescription>
            {t('పోటీల నిర్వహణ', 'Manage Competitions')}
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/org/${currentOrganization?.slug}/voting`)}
        >
          {t('అన్నీ చూడండి', 'View All')}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-purple-600">
                {liveCompetitions}
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                {t('లైవ్ పోటీలు', 'Live Now')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-slate-400">
                {totalCompetitions}
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                {t('మొత్తం పోటీలు', 'Total')}
              </p>
            </div>
          </div>

          <div>
             <h4 className="text-sm font-medium text-muted-foreground mb-2">
               {t('ఇటీవలి పోటీలు', 'Recent Games')}
             </h4>
             {competitions.length > 0 ? (
               <div className="space-y-2">
                 {competitions.slice(0, 2).map((comp: any) => (
                   <div key={comp.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                     <div className="flex items-center gap-2">
                       <Trophy className="h-4 w-4 text-yellow-500" />
                       <p className="font-medium text-sm">{comp.name}</p>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('పోటీలు లేవు', 'No competitions yet')}
                </p>
             )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
