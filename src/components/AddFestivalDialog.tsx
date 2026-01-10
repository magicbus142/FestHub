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
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { ThemeSelector, ThemeOption } from '@/components/ThemeSelector';
import { PageSelector, PageOption } from '@/components/PageSelector';
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

    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    background_image: undefined as string | undefined
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [useCustomTheme, setUseCustomTheme] = useState(false);
  const [theme, setTheme] = useState<ThemeOption>('classic');
  const [useCustomPages, setUseCustomPages] = useState(false);
  const [enabledPages, setEnabledPages] = useState<PageOption[]>(['dashboard', 'chandas', 'expenses', 'images', 'organizers', 'voting']);

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
      start_date: undefined,

      end_date: undefined,
      background_image: undefined
    });
    setImageFile(null);
    setIsUploading(false);
    setUseCustomTheme(false);
    setTheme('classic');
    setUseCustomPages(false);
    setEnabledPages(['dashboard', 'chandas', 'expenses', 'images', 'organizers', 'voting']);
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
                .from('images')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('images').getPublicUrl(filePath);
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
      start_date: formData.start_date?.toISOString().split('T')[0],
      end_date: formData.end_date?.toISOString().split('T')[0],
      is_active: true,
      theme: useCustomTheme ? theme : undefined,
      enabled_pages: useCustomPages ? enabledPages : undefined,
      background_image: imageUrl
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl border-none p-0 bg-background overflow-hidden rounded-[2.5rem] shadow-2xl">
        <div className="p-10">
          <DialogHeader className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                <Sparkles className="h-7 w-7 text-primary" strokeWidth={2.5} />
              </div>
              <DialogTitle className="text-[28px] font-extrabold text-foreground tracking-tight">{t('కొత్త ఉత్సవం జోడించండి', 'Add New Festival')}</DialogTitle>
            </div>
            <DialogDescription className="text-lg text-muted-foreground mt-2 leading-relaxed font-medium">
              Fill in the details to announce and manage your upcoming celebration
            </DialogDescription>
          </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4 -mr-4">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label htmlFor="name" className="text-lg font-bold text-foreground ml-1">{t('ఉత్సవ పేరు', 'Festival Name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('ఉత్సవ పేరు నమోదు చేయండి', 'Enter festival name')}
                  required
                  className="h-16 px-8 rounded-3xl bg-muted/20 border-border focus:border-primary focus:ring-0 transition-all text-lg placeholder:text-muted-foreground/50 font-medium"
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="year" className="text-lg font-bold text-foreground ml-1">{t('సంవత్సరం', 'Year')}</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  min="2020"
                  max="2030"
                  required
                  className="h-16 px-8 rounded-3xl bg-muted/20 border-border focus:border-primary focus:ring-0 transition-all text-lg placeholder:text-muted-foreground/50 font-medium"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="description" className="text-lg font-bold text-foreground ml-1">{t('వివరణ', 'Description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('ఉత్సవ వివరణ', 'Festival description')}
                rows={2}
                className="px-8 py-5 rounded-3xl bg-muted/20 border-border focus:border-primary focus:ring-0 transition-all text-lg placeholder:text-muted-foreground/50 font-medium resize-none min-h-[140px]"
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="image" className="text-lg font-bold text-foreground ml-1">{t('చిత్రం (ఐచ్ఛికం)', 'Festival Poster')}</Label>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setImageFile(file);
                    }}
                    className="h-16 px-8 py-4 rounded-3xl bg-muted/20 border-border focus:border-primary focus:ring-0 transition-all text-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-lg font-bold text-foreground ml-1">{t('ప్రారంభ తేదీ', 'Start Date')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-16 rounded-3xl border-border bg-muted/20 hover:bg-muted/30 text-left font-medium px-8 flex items-center justify-between transition-all"
                    >
                      <span className="truncate">{formData.start_date ? format(formData.start_date, "PPP") : t('తేదీ ఎంచుకోండి', 'Pick a date')}</span>
                      <CalendarIcon className="h-6 w-6 text-muted-foreground/50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-[2rem] overflow-hidden border-border shadow-2xl" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) => setFormData(prev => ({ ...prev, start_date: date }))}
                      initialFocus
                      className={cn("p-5 pointer-events-auto bg-background")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-bold text-foreground ml-1">{t('ముగింపు తేదీ', 'End Date')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-16 rounded-3xl border-border bg-muted/20 hover:bg-muted/30 text-left font-medium px-8 flex items-center justify-between transition-all"
                    >
                      <span className="truncate">{formData.end_date ? format(formData.end_date, "PPP") : t('తేదీ ఎంచుకోండి', 'Pick a date')}</span>
                      <CalendarIcon className="h-6 w-6 text-muted-foreground/50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-[2rem] overflow-hidden border-border shadow-2xl" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={formData.end_date}
                      onSelect={(date) => setFormData(prev => ({ ...prev, end_date: date }))}
                      initialFocus
                      className={cn("p-5 pointer-events-auto bg-background")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Custom Theme Toggle */}
            <div className="space-y-6 pt-10 mt-6 border-t border-border/50">
              <div className="flex items-center justify-between p-6 bg-muted/10 rounded-3xl border border-border/30">
                <div>
                  <Label className="text-lg font-bold text-foreground">{t('Custom Theme', 'Custom Theme')}</Label>
                  <p className="text-sm text-muted-foreground mt-1 italic font-medium">Override organization theme for this festival</p>
                </div>
                <Switch checked={useCustomTheme} onCheckedChange={setUseCustomTheme} className="data-[state=checked]:bg-primary" />
              </div>
              {useCustomTheme && (
                <div className="p-8 bg-muted/5 rounded-[2.5rem] border border-border/50 shadow-sm">
                  <ThemeSelector value={theme} onChange={setTheme} label="Festival Theme" />
                </div>
              )}
            </div>

            {/* Custom Pages Toggle */}
            <div className="space-y-6 pt-6 border-t border-border/50">
              <div className="flex items-center justify-between p-6 bg-muted/10 rounded-3xl border border-border/30">
                <div>
                  <Label className="text-lg font-bold text-foreground">{t('Custom Pages', 'Custom Pages')}</Label>
                  <p className="text-sm text-muted-foreground mt-1 italic font-medium">Configure visible pages for this festival</p>
                </div>
                <Switch checked={useCustomPages} onCheckedChange={setUseCustomPages} className="data-[state=checked]:bg-primary" />
              </div>
              {useCustomPages && (
                <div className="p-8 bg-muted/5 rounded-[2.5rem] border border-border/50 shadow-sm">
                  <PageSelector value={enabledPages} onChange={setEnabledPages} label="Festival Pages" />
                </div>
              )}
            </div>

            <div className="flex gap-6 pt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-16 rounded-[2rem] border-border bg-muted/30 hover:bg-muted/50 text-foreground font-bold text-xl transition-all"
                onClick={() => onOpenChange(false)}
              >
                {t('రద్దు', 'Cancel')}
              </Button>
              <Button 
                type="submit" 
                className="flex-[2] h-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
                disabled={addMutation.isPending || isUploading || !formData.name.trim()}
              >
                {addMutation.isPending || isUploading ? t('జోడిస్తున్నాము...', 'Adding...') : t('జోడించు', 'Add Festival')}
              </Button>
            </div>
          </form>
        </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
