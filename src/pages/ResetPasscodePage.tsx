import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, KeyRound, Eye, EyeOff } from 'lucide-react';

const ResetPasscodePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [orgEmail, setOrgEmail] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const maskEmail = (email: string) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    const maskedLocal = local.length > 3 
      ? `${local.substring(0, 3)}${'*'.repeat(local.length - 5)}${local.substring(local.length - 2)}` 
      : `${local.substring(0, 1)}**`;
    return `${maskedLocal}@${domain}`;
  };

  useEffect(() => {
    // Check if we have a hash fragment (Supabase Auth default for implicit flow)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', '?'));
    const type = params.get('type');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
        setIsVerifying(false);
        setIsValid(false);
        toast({
            title: "Link Error",
            description: errorDescription?.replace(/\+/g, ' ') || "Invalid or expired reset link.",
            variant: "destructive"
        });
    } else if (type === 'recovery') {
        // Supabase automatically handles the session exchange in the background via the AuthProvider
        // We just need to wait for the session to be active.
        setIsVerifying(true);
        // We set a small timeout to allow AuthProvider to process
        setTimeout(() => setIsVerifying(false), 1500);
    } else if (token) {
        // ... (Legacy handling kept but de-emphasized)
        setIsVerifying(false); 
    } else {
        setIsVerifying(false);
    }
  }, [token]);
  
  // Use session from context? Or just direct supabase check?
  // Since we are in an isolated page, let's checking supabase.auth.getSession()
  
  useEffect(() => {
      const checkSession = async () => {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
              setIsValid(true);
              setOrgEmail(data.session.user.email || null);
          } else {
              // If we are not logged in, and no token... invalid
              // But maybe the listener hasn't fired yet? 
              // We'll rely on the user interacting with the form.
          }
      };
      
      // Listen for auth state change (Recovery link triggers SIGNED_IN)
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
              setIsValid(true);
              if (session?.user?.email) setOrgEmail(session.user.email);
              setIsVerifying(false);
          }
      });
      
      checkSession();
      
      return () => {
          authListener.subscription.unsubscribe();
      };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPasscode !== confirmPasscode) {
      toast({
        title: 'Passcodes do not match',
        description: 'Please make sure both passcodes are identical.',
        variant: 'destructive',
      });
      return;
    }

    if (newPasscode.length < 6) {
        toast({
            title: 'Passcode too short',
            description: 'Passcode must be at least 6 characters long.',
            variant: 'destructive',
        });
        return;
    }

    setIsLoading(true);

    try {
      // Supabase Auth Update Password
      const { data, error } = await supabase.auth.updateUser({
          password: newPasscode
      });

      if (error) throw error;
      
      // Also update the organizations table 'passcode' column for consistency (Legacy support)
      // We can iterate over organizations linked to this user email?
      // Since this is technically a "Passcode" reset for the org...
      // But we might be logged in as the user. 
      // Ideally, the 'passcode' column becomes obsolete, but our legacy login depends on it 
      // for the JIT check. So we should sync it.
      // However, we don't have RLS to update 'organizations' freely usually.
      // But let's try.
      if (data.user?.email) {
          await supabase.from('organizations')
            .update({ passcode: newPasscode })
            .eq('email', data.user.email);
      }

      toast({
        title: 'Success!',
        description: 'Your organization passcode has been updated. Logging you in...',
      });
      
      // Redirect to Organization Dashboard
      // We need to fetch the slug.
      const { data: org } = await supabase.from('organizations').select('slug').eq('email', data.user?.email || '').single();
      if (org) {
          navigate(`/org/${org.slug}`);
      } else {
          navigate('/');
      }

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValid && !token && !window.location.hash) {
      // Show invalid only if we really have no auth context
       return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-destructive font-bold text-2xl">Link Expired or Invalid</CardTitle>
            <CardDescription>
              Please request a new reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Reset Passcode</CardTitle>
          <CardDescription>
            Enter a new passcode for your organization to regain access.
            {orgEmail && (
              <div className="mt-2 text-sm font-medium text-slate-600 bg-slate-100 py-1 px-3 rounded-full inline-block">
                 Reseting for: <span className="text-slate-900">{maskEmail(orgEmail)}</span>
              </div>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passcode">New Passcode</Label>
                <div className="relative">
                  <Input
                    id="passcode"
                    type={showPasscode ? 'text' : 'password'}
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value)}
                    placeholder="Enter new passcode"
                    autoFocus
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPasscode(!showPasscode)}
                  >
                    {showPasscode ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-passcode">Confirm Passcode</Label>
                <Input
                  id="confirm-passcode"
                  type={showPasscode ? 'text' : 'password'}
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  placeholder="Confirm new passcode"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !newPasscode || !confirmPasscode}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Reset Passcode
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasscodePage;
