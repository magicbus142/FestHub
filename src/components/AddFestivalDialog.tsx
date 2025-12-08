import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    end_date: undefined as Date | undefined
  });
  
  const [useCustomTheme, setUseCustomTheme] = useState(false);
  const [theme, setTheme] = useState<ThemeOption>('classic');
  const [useCustomPages, setUseCustomPages] = useState(false);
  const [enabledPages, setEnabledPages] = useState<PageOption[]>(['dashboard', 'chandas', 'expenses', 'images', 'organizers']);

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
      end_date: undefined
    });
    setUseCustomTheme(false);
    setTheme('classic');
    setUseCustomPages(false);
    setEnabledPages(['dashboard', 'chandas', 'expenses', 'images', 'organizers']);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addMutation.mutate({
      name: formData.name,
      year: formData.year,
      description: formData.description,
      background_color: formData.background_color,
      start_date: formData.start_date?.toISOString().split('T')[0],
      end_date: formData.end_date?.toISOString().split('T')[0],
      is_active: true,
      theme: useCustomTheme ? theme : undefined,
      enabled_pages: useCustomPages ? enabledPages : undefined
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t('కొత్త ఉత్సవం జోడించండి', 'Add New Festival')}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('ఉత్సవ పేరు', 'Festival Name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('ఉత్సవ పేరు నమోదు చేయండి', 'Enter festival name')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">{t('సంవత్సరం', 'Year')}</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                min="2020"
                max="2030"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('వివరణ', 'Description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('ఉత్సవ వివరణ', 'Festival description')}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('ప్రారంభ తేదీ', 'Start Date')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(formData.start_date, "PPP") : t('తేదీ ఎంచుకోండి', 'Pick a date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) => setFormData(prev => ({ ...prev, start_date: date }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>{t('ముగింపు తేదీ', 'End Date')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? format(formData.end_date, "PPP") : t('తేదీ ఎంచుకోండి', 'Pick a date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={formData.end_date}
                      onSelect={(date) => setFormData(prev => ({ ...prev, end_date: date }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Custom Theme Toggle */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Custom Theme</Label>
                  <p className="text-xs text-muted-foreground">Override organization theme</p>
                </div>
                <Switch checked={useCustomTheme} onCheckedChange={setUseCustomTheme} />
              </div>
              {useCustomTheme && (
                <ThemeSelector value={theme} onChange={setTheme} label="Festival Theme" />
              )}
            </div>

            {/* Custom Pages Toggle */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Custom Pages</Label>
                  <p className="text-xs text-muted-foreground">Override organization pages</p>
                </div>
                <Switch checked={useCustomPages} onCheckedChange={setUseCustomPages} />
              </div>
              {useCustomPages && (
                <PageSelector value={enabledPages} onChange={setEnabledPages} label="Festival Pages" />
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('రద్దు', 'Cancel')}
              </Button>
              <Button
                type="submit"
                disabled={addMutation.isPending || !formData.name.trim()}
              >
                {addMutation.isPending ? t('జోడిస్తున్నాము...', 'Adding...') : t('జోడించు', 'Add')}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
