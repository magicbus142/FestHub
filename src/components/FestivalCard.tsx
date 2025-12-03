import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { deleteFestival } from '@/lib/festivals';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Share2, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Festival } from '@/lib/festivals';

interface FestivalCardProps {
  festival: Festival;
  onClick?: () => void;
}

export function FestivalCard({ festival, onClick }: FestivalCardProps) {
  const { isAuthenticated } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteFestival,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['festivals'] });
      toast({
        title: 'Success',
        description: 'Festival deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete festival',
        variant: 'destructive',
      });
      console.error('Error deleting festival:', error);
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (festival.id && window.confirm('Are you sure you want to delete this festival?')) {
      deleteMutation.mutate(festival.id);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/org/${currentOrganization?.slug}?festival=${festival.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link copied!',
      description: 'Share this link for read-only access to the festival',
    });
  };

  return (
    <Card 
      className="relative overflow-hidden cursor-pointer hover:shadow-festive transition-all duration-300 hover:scale-105 aspect-[4/3] group"
      onClick={onClick}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {festival.background_image ? (
          <img 
            src={festival.background_image} 
            alt={festival.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full bg-gradient-festive"
            style={{
              backgroundColor: festival.background_color || 'hsl(var(--festival-orange))'
            }}
          />
        )}
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full text-white">
        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          {/* Share button - always visible */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-white hover:bg-white/20 hover:text-white transition-colors"
            title="Copy shareable link"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          
          {/* Delete button - show lock for unauthenticated */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAuthenticated) return;
                    handleDelete(e);
                  }}
                  disabled={deleteMutation.isPending}
                  className="text-white hover:bg-red-500/20 hover:text-red-100 transition-colors"
                >
                  {isAuthenticated ? (
                    <Trash2 className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              {!isAuthenticated && (
                <TooltipContent>
                  <p>{t('తొలగించడానికి లాగిన్ అవసరం', 'Login required to delete')}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Festival info */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold mb-1 drop-shadow-lg">
            {festival.name}
          </h3>
          <p className="text-lg font-medium drop-shadow-md">
            {festival.year}
          </p>
        </div>
      </div>
    </Card>
  );
}
