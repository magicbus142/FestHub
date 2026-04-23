import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');

const Auth = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useSupabaseAuth();
  const { signInWithMagicLink } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    const result = emailSchema.safeParse(email.trim());
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    const { error: authError } = await signInWithMagicLink(email.trim());

    setIsLoading(false);

    if (authError) {
      toast({
        title: 'Error',
        description: authError.message,
        variant: 'destructive',
      });
      return;
    }

    setEmailSent(true);
    toast({
      title: 'Check your email',
      description: 'We sent you a magic link to sign in.',
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F101A] p-4">
      <Card className="w-full max-w-md premium-card overflow-hidden">
        <CardHeader className="space-y-4 text-left pb-2">
          <CardTitle className="text-2xl font-bold text-white">
            {emailSent ? 'Check your email' : 'Admin Login'}
          </CardTitle>
          <CardDescription className="text-muted-foreground/70">
            {emailSent
              ? 'We sent you a magic link. Click the link in your email to sign in.'
              : 'Enter your credentials to access the tournament management system.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {emailSent ? (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-500/10 p-4">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Sent to <span className="font-medium text-foreground">{email}</span>
              </p>
              <div className="space-y-3">
                <Button
                  variant="premium-outline"
                  className="w-full"
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                >
                  Use a different email
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-white/70 hover:text-white"
                  onClick={() => navigate('/')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to home
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="premium-input-container">
                <Label htmlFor="email" className="premium-label">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    className="premium"
                    autoFocus
                    disabled={isLoading}
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive mt-1">{error}</p>
                )}
              </div>

              <div className="flex gap-4 pt-2">
                <Button
                  type="submit"
                  variant="premium"
                  size="lg"
                  className="flex-1"
                  disabled={isLoading || !email.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="premium-outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => navigate('/')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
