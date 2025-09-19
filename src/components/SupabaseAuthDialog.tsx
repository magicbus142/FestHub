import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { X, Lock } from 'lucide-react';

interface SupabaseAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SupabaseAuthDialog = ({ isOpen, onClose, onSuccess }: SupabaseAuthDialogProps) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    
    if (error) {
      toast({
        title: t("దోషం", "Error"),
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: t("విజయవంతం", "Success"),
        description: t("విజయవంతంగా లాగిన్ అయ్యారు", "Successfully logged in")
      });
      onSuccess();
      handleClose();
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setLoading(false);
    
    if (error) {
      toast({
        title: t("దోషం", "Error"),
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: t("ఇమెయిల్ చెక్ చేయండి", "Check your email"),
        description: t("సైన్ అప్ పూర్తి చేయడానికి ఇమెయిల్ ధృవీకరించండి", "Confirm your email to complete signup")
      });
    }
  };

  const handleClose = () => {
    onClose();
    setEmail('');
    setPassword('');
    setMode('login');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader className="relative">
          <DialogTitle className="text-festival-blue text-xl font-bold text-center flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" />
            {mode === 'login' ? t('లాగిన్', 'Login') : t('ఖాతా సృష్టించండి', 'Create Account')}
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
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">
              {t('ఇమెయిల్', 'Email')}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('ఇమెయిల్ ఎంటర్ చేయండి', 'Enter email')}
              className="bg-background border-border"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium">
              {t('పాస్వర్డ్', 'Password')}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('పాస్వర్డ్ ఎంటర్ చేయండి', 'Enter password')}
              className="bg-background border-border"
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
              onClick={mode === 'login' ? handleLogin : handleSignup}
              className="flex-1 bg-gradient-festive hover:opacity-90 text-white font-medium"
              disabled={loading || !email.trim() || !password.trim()}
            >
              {loading 
                ? t('దయచేసి వేచి ఉండండి...', 'Please wait...') 
                : mode === 'login' 
                  ? t('లాగిన్', 'Login') 
                  : t('సైన్ అప్', 'Sign Up')
              }
            </Button>
          </div>

          <div className="text-sm text-muted-foreground text-center">
            {mode === 'login' ? (
              <>
                {t('ఖాతా లేదా?', "Don't have an account?")} {' '}
                <button className="underline" onClick={() => setMode('signup')}>
                  {t('సైన్ అప్', 'Sign up')}
                </button>
              </>
            ) : (
              <>
                {t('ఇప్పటికే ఖాతా ఉందా?', 'Already have an account?')} {' '}
                <button className="underline" onClick={() => setMode('login')}>
                  {t('లాగిన్', 'Log in')}
                </button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};