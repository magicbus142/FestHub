import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/contexts/OrganizationContext';
import { deleteFestival, updateFestival } from '@/lib/festivals';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Share2, Lock, Eye, EyeOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Festival } from '@/lib/festivals';
import { Badge } from '@/components/ui/badge';

interface FestivalCardProps {
  festival: Festival;
  onClick?: () => void;
}

export function FestivalCard({ festival, onClick }: FestivalCardProps) {
  const { currentOrganization, isAuthenticated } = useOrganization();
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

  const updateVisibilityMutation = useMutation({
    mutationFn: (hidden: boolean) => updateFestival(festival.id!, { is_hidden: hidden }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['festivals'] });
      toast({
        title: 'Success',
        description: 'Festival visibility updated',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update visibility',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (festival.id && window.confirm('Are you sure you want to delete this festival?')) {
      deleteMutation.mutate(festival.id);
    }
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !festival.id) return;
    updateVisibilityMutation.mutate(!festival.is_hidden);
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
      className="relative overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] aspect-[4/3] group border-0 ring-1 ring-white/20"
      onClick={onClick}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {festival.background_image ? (
          <img 
            src={festival.background_image} 
            alt={festival.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full text-white">
        
        {/* Hidden Badge */}
        {festival.is_hidden && (
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-black/50 text-white border-none backdrop-blur-md font-semibold px-3 py-1">
              <EyeOff className="h-3 w-3 mr-1 inline-block" />
              {t('దాచబడింది', 'Hidden')}
            </Badge>
          </div>
        )}

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          {/* Share button - always visible */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-white hover:bg-white/20 hover:text-white transition-colors bg-black/20 backdrop-blur-sm"
            title="Copy shareable link"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          
          {isAuthenticated && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleVisibility}
                    disabled={updateVisibilityMutation.isPending}
                    className="text-white hover:bg-white/20 hover:text-white transition-colors bg-black/20 backdrop-blur-sm"
                  >
                    {festival.is_hidden ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{festival.is_hidden ? t('కనిపించేలా చేయండి', 'Make Visible') : t('దాచు', 'Hide')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

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
                  className="text-white hover:bg-red-500/80 hover:text-white transition-colors bg-black/20 backdrop-blur-sm"
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
        
        {/* Festival info with Glassmorphic Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/40 backdrop-blur-md border-t border-white/10 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-2xl font-bold mb-1 drop-shadow-sm text-white flex items-center gap-2">
            {festival.name}
            {festival.is_hidden && <Lock className="h-4 w-4 text-white/50" />}
          </h3>
          <p className="text-sm font-medium text-white/90">
            {festival.year}
          </p>
        </div>
      </div>
    </Card>
  );
}
