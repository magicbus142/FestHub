
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Share2, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import type { Festival } from '@/lib/festivals';


interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationSlug: string;
  festivals: Festival[];
}

const AVAILABLE_PAGES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'chandas', label: 'Chandas' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'images', label: 'Images' },
  { id: 'voting', label: 'Voting' },
];

export function ShareDialog({ open, onOpenChange, organizationSlug, festivals }: ShareDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // State for selected festivals
  const [selectedFestivalIds, setSelectedFestivalIds] = useState<string[]>([]);
  // State for selected pages
  const [selectedPages, setSelectedPages] = useState<string[]>(['dashboard', 'chandas', 'expenses', 'images', 'voting']);
  
  // State for generated link
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Initialize selections when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedFestivalIds(festivals.map(f => f.id));
      setSelectedPages(['dashboard', 'chandas', 'expenses', 'images', 'voting']);
      setGeneratedLink('');
      setIsCopied(false);
    }
  }, [open, festivals]);

  // Generate link whenever selection changes
  useEffect(() => {
    if (!organizationSlug) return;

    // Use deployed URL if available, otherwise fallback to window location
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const baseUrl = `${siteUrl}/org/${organizationSlug}`;
    const params = new URLSearchParams();

    // 1. Handle Festival Selection
    const allFestivalsSelected = selectedFestivalIds.length === festivals.length && festivals.length > 0;
    
    // If NO festivals selected, no link
    if (selectedFestivalIds.length === 0) {
      setGeneratedLink('');
      return;
    }

    if (!allFestivalsSelected) {
      params.set('festivals', selectedFestivalIds.join(','));
    }

    // 2. Handle Page Selection
    const allPagesSelected = selectedPages.length === AVAILABLE_PAGES.length;
    
    // If NO pages selected (which shouldn't happen ideally), maybe default to none?
    if (selectedPages.length === 0) {
       // do nothing, effectively showing nothing? Or do we force at least one?
    } else if (!allPagesSelected) {
       params.set('pages', selectedPages.join(','));
    }
    
    // Construct final URL
    const queryString = params.toString();
    if (queryString) {
      setGeneratedLink(`${baseUrl}?${queryString}`);
    } else {
      setGeneratedLink(baseUrl);
    }

  }, [selectedFestivalIds, selectedPages, organizationSlug, festivals]);

  const handleSelectAllFestivals = (checked: boolean) => {
    if (checked) {
      setSelectedFestivalIds(festivals.map(f => f.id));
    } else {
      setSelectedFestivalIds([]);
    }
  };

  const handleToggleFestival = (festivalId: string, checked: boolean) => {
    if (checked) {
      setSelectedFestivalIds(prev => [...prev, festivalId]);
    } else {
      setSelectedFestivalIds(prev => prev.filter(id => id !== festivalId));
    }
  };

  const handleTogglePage = (pageId: string, checked: boolean) => {
    if (checked) {
      setSelectedPages(prev => [...prev, pageId]);
    } else {
      setSelectedPages(prev => prev.filter(id => id !== pageId));
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    
    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    toast({
      title: t('లింక్ కాపీ చేయబడింది', 'Link Copied'),
      description: t('షేర్ లింక్ క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది', 'Share link copied to clipboard'),
    });

    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
     if (!generatedLink) return;
     const text = encodeURIComponent(`Check out our festivals: ${generatedLink}`);
     window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('ఉత్సవాలను షేర్ చేయండి', 'Share Festivals')}</DialogTitle>
          <DialogDescription>
            {t(
              'ఉత్సవాలు మరియు పేజీలను ఎంచుకోండి.',
              'Select festivals and pages to share.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          
          {/* Section 1: Festivals */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium leading-none mb-3 text-muted-foreground">{t('ఉత్సవాలు', 'Festivals')}</h4>
            <div className="flex items-center space-x-2 pb-2">
                <Checkbox 
                id="select-all-festivals" 
                checked={selectedFestivalIds.length === festivals.length && festivals.length > 0}
                onCheckedChange={handleSelectAllFestivals}
                />
                <Label htmlFor="select-all-festivals" className="font-semibold cursor-pointer text-sm">
                {t('అన్ని ఎంచుకోండి', 'Select All')}
                </Label>
            </div>
            <ScrollArea className="h-[120px] w-full rounded-md border p-2">
                <div className="space-y-2">
                {festivals.map((festival) => (
                    <div key={festival.id} className="flex items-center space-x-2">
                    <Checkbox 
                        id={`festival-${festival.id}`}
                        checked={selectedFestivalIds.includes(festival.id)}
                        onCheckedChange={(checked) => handleToggleFestival(festival.id, checked as boolean)}
                    />
                    <Label htmlFor={`festival-${festival.id}`} className="cursor-pointer text-sm font-normal">
                        {festival.name} <span className="text-muted-foreground text-xs">({festival.year})</span>
                    </Label>
                    </div>
                ))}
                </div>
            </ScrollArea>
          </div>

          {/* Section 2: Page Visibility */}
          <div className="space-y-2">
             <h4 className="text-sm font-medium leading-none mb-3 text-muted-foreground">{t('కనిపించే పేజీలు', 'Visible Pages')}</h4>
             <div className="flex flex-wrap gap-4">
               {AVAILABLE_PAGES.map((page) => (
                  <div key={page.id} className="flex items-center space-x-2">
                    <Checkbox 
                        id={`page-${page.id}`}
                        checked={selectedPages.includes(page.id)}
                        onCheckedChange={(checked) => handleTogglePage(page.id, checked as boolean)}
                    />
                    <Label htmlFor={`page-${page.id}`} className="cursor-pointer text-sm font-normal">
                        {page.label}
                    </Label>
                  </div>
               ))}
             </div>
          </div>

          {/* Generated Link Display */}
          <div className="pt-2 border-t mt-4">
             <Label className="text-xs text-muted-foreground mb-1.5 block">
                {t('షేర్ లింక్', 'Share Link')}
             </Label>
             <div className="flex items-center space-x-2">
                <Input 
                  readOnly 
                  value={generatedLink} 
                  className="bg-muted text-muted-foreground text-sm h-9"
                />
                <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={handleCopyLink} disabled={!generatedLink}>
                   {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
             </div>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
           <Button 
            variant="outline" 
            className="flex-1" 
            onClick={handleWhatsAppShare}
            disabled={!generatedLink}
           >
             <Share2 className="h-4 w-4 mr-2" />
             WhatsApp
           </Button>
           <Button 
             type="button" 
             className="flex-1"
             onClick={() => onOpenChange(false)}
           >
             {t('పూర్తయింది', 'Done')}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
