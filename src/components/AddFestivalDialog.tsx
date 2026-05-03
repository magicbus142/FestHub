import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { addFestival } from '@/lib/festivals';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';

import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Sparkles } from 'lucide-react';

interface AddFestivalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddFestivalDialog({ open, onOpenChange }: AddFestivalDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    description: '',
    background_color: 'hsl(var(--festival-orange))',
    background_image: undefined as string | undefined
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const addMutation = useMutation({
    mutationFn: (festival: {
      name: string;
      year: number;
      description: string;
      background_color: string;
      start_date?: string;
      end_date?: string;
      is_active: boolean;
      theme?: string;
      enabled_pages?: string[];
      background_image?: string;
    }) => {
      if (!currentOrganization) throw new Error('No organization selected');
      return addFestival(festival, currentOrganization.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['festivals'] });
      toast({
        title: t('విజయవంతమైంది', 'Success'),
        description: t('కొత్త ఉత్సవం జోడించబడింది', 'New festival added successfully'),
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: t('లోపం', 'Error'),
        description: t('ఉత్సవం జోడించడంలో లోపం', 'Failed to add festival'),
        variant: 'destructive',
      });
      console.error('Error adding festival:', error);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      year: new Date().getFullYear(),
      description: '',
      background_color: 'hsl(var(--festival-orange))',
      background_image: undefined
    });
    setImageFile(null);
    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    let imageUrl = formData.background_image;

    if (imageFile) {
        setIsUploading(true);
        try {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('user-images')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('user-images').getPublicUrl(filePath);
            imageUrl = data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            toast({
                title: 'Error',
                description: 'Failed to upload image',
                variant: 'destructive',
            });
            setIsUploading(false);
            return;
        }
        setIsUploading(false);
    }

    addMutation.mutate({
      name: formData.name,
      year: formData.year,
      description: formData.description,
      background_color: formData.background_color,
      is_active: true,
      background_image: imageUrl
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl border-none p-0 bg-background overflow-hidden rounded-[1.5rem] shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                <Sparkles className="h-6 w-6 text-primary" strokeWidth={2.5} />
              </div>
              <DialogTitle className="text-xl font-extrabold text-foreground tracking-tight">{t('కొత్త ఉత్సవం జోడించండి', 'Add New Festival')}</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed font-medium">
              Fill in the details to announce and manage your upcoming celebration
            </DialogDescription>
          </DialogHeader>
        
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-8 py-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="name" className="text-sm font-bold text-foreground ml-1">{t('ఉత్సవ పేరు', 'Festival Name')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('ఉత్సవ పేరు నమోదు చేయండి', 'Enter festival name')}
                    required
                    className="h-11 px-4 rounded-xl bg-muted/20 border-border focus:border-primary focus:ring-0 transition-all text-base placeholder:text-muted-foreground/50 font-medium"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="year" className="text-sm font-bold text-foreground ml-1">{t('సంవత్సరం', 'Year')}</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    min="2020"
                    max="2030"
                    required
                    className="h-11 px-4 rounded-xl bg-muted/20 border-border focus:border-primary focus:ring-0 transition-all text-base placeholder:text-muted-foreground/50 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="description" className="text-sm font-bold text-foreground ml-1">{t('వివరణ', 'Description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('ఉత్సవ వివరణ', 'Festival description')}
                  rows={2}
                  className="px-4 py-2 rounded-xl bg-muted/20 border-border focus:border-primary focus:ring-0 transition-all text-base placeholder:text-muted-foreground/50 font-medium resize-none min-h-[90px]"
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="image" className="text-sm font-bold text-foreground ml-1">{t('చిత్రం (ఐచ్ఛికం)', 'Festival Poster')}</Label>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Input
                      id="image"
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setImageFile(file);
                      }}
                      className="h-11 px-4 py-1.5 rounded-xl bg-muted/20 border-border focus:border-primary focus:ring-0 transition-all text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-6 pt-4 border-t bg-background/80 backdrop-blur-sm flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 rounded-xl border-border bg-muted/30 hover:bg-muted/50 text-foreground font-bold text-base transition-all"
              onClick={() => onOpenChange(false)}
            >
              {t('రద్దు', 'Cancel')}
            </Button>
            <Button 
              type="submit" 
              className="flex-[1.5] h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
              disabled={addMutation.isPending || isUploading || !formData.name.trim()}
            >
              {addMutation.isPending || isUploading ? t('జోడిస్తున్నాము...', 'Adding...') : t('జోడించు', 'Add Festival')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
