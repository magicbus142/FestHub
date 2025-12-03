import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { X, Lock } from 'lucide-react';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthDialog = ({ isOpen, onClose, onSuccess }: AuthDialogProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { authenticate } = useOrganization();
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (authenticate(code)) {
      toast({
        title: t("విజయవంతం", "Success"),
        description: t("విజయవంతంగా లాగిన్ అయ్యారు", "Successfully logged in")
      });
      onSuccess();
      onClose();
      setCode('');
    } else {
      toast({
        title: t("దోషం", "Error"),
        description: t("తప్పు కోడ్. దయచేసి మళ్లీ ప్రయత్నించండి", "Wrong code. Please try again"),
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleClose = () => {
    onClose();
    setCode('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader className="relative">
          <DialogTitle className="text-festival-blue text-xl font-bold text-center flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" />
            {t('యాక్సెస్ కోడ్', 'Access Code')}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-6 w-6 p-0"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-foreground font-medium">
              {t('యాక్సెస్ కోడ్ ఎంటర్ చేయండి', 'Enter Access Code')}
            </Label>
            <Input
              id="code"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('కోడ్ ఎంటర్ చేయండి', 'Enter code')}
              className="bg-background border-border"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              {t('రద్దు చేయండి', 'Cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-festive hover:opacity-90 text-white font-medium"
              disabled={loading || !code.trim()}
            >
              {loading ? t('వెరిఫై చేస్తోంది...', 'Verifying...') : t('వెరిఫై చేయండి', 'Verify')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};