import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Vote } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CustomLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: string;
  onConfirm: (value: number) => void;
}

export function CustomLimitDialog({ open, onOpenChange, initialValue, onConfirm }: CustomLimitDialogProps) {
  const { t } = useLanguage();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
    }
  }, [open, initialValue]);

  const handleConfirm = () => {
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      onConfirm(num);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
            <Vote className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            {t('కస్టమ్ ఓటు పరిమితి', 'Custom Vote Limit')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t('ఈ పోటీ కోసం గరిష్ట ఓట్ల సంఖ్యను నమోదు చేయండి', 'Enter the maximum number of votes allowed for this competition.')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="limit" className="text-sm font-semibold text-slate-700">
                {t('ఓట్ల సంఖ్య', 'Number of Votes')}
              </Label>
              <Input
                id="limit"
                type="number"
                min="1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-12 text-lg font-bold text-center bg-slate-50 border-slate-200 focus:ring-primary"
                placeholder="e.g. 15"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm();
                }}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="ghost"
            className="w-full sm:flex-1 rounded-xl h-12 text-slate-500 hover:bg-slate-100"
            onClick={() => onOpenChange(false)}
          >
            {t('రద్దు చేయి', 'Cancel')}
          </Button>
          <Button
            className="w-full sm:flex-1 rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
            onClick={handleConfirm}
          >
            {t('నిర్ధారించు', 'Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
