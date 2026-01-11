import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OrganizationLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrganizationLoginDialog({ 
  open, 
  onOpenChange 
}: OrganizationLoginDialogProps) {
  const [name, setName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetFlow, setShowResetFlow] = useState(false);
  const [resetName, setResetName] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // 1. Find organization by name
      const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .ilike('name', name.trim())
        .single();

      if (error || !org) {
        toast({
          title: 'Organization not found',
          description: 'Please check the organization name and try again',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      if (org.subscription_status === 'suspended') {
        toast({
          title: 'Access Suspended',
          description: 'Your organization access has been suspended. Please contact support.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // 2. Try Supabase Auth Login (Primary Method)
      // We use the organization's email + the entered passcode
      if (org.email) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: org.email,
            password: passcode
        });

        if (authData.session) {
            // SUCCESS: Native Auth worked
            handleLoginSuccess(org);
            return;
        }
      }

      // 3. Fallback: Check Legacy Passcode & Migrate (JIT)
      // If native auth failed, it might be an old account that hasn't been migrated.
      // We verify the legacy passcode column.
      
      const { data: isValidLegacy } = await supabase.rpc('verify_organization_passcode', {
          _organization_id: org.id,
          _passcode: passcode
      });

      if (isValidLegacy) {
          // LEGACY VALID! -> MIGRATE NOW
          // This user has the correct passcode but no Auth User. 
          // We will create the Auth User for them now ("Just In Time").
          
          if (org.email && passcode.length >= 6) {
              const { error: signUpError } = await supabase.auth.signUp({
                  email: org.email,
                  password: passcode,
                  options: {
                      data: { organization_name: org.name }
                  }
              });
              
              if (!signUpError) {
                  // Migration success! Next time they can use standard auth.
                  // Note: signUp automatically signs them in if email confirmation is off,
                  // or sends an email if it's on.
                  // For this seamless flow, we'll assume we can proceed to dashboard 
                  // but warn them if they need to check email.
                  toast({
                      title: "Account Upgraded",
                      description: "We've updated your security system for better protection.",
                  });
              }
          }
          
          handleLoginSuccess(org);
          return;
      }

      // If we got here, both Auth and Legacy failed
      toast({
        title: 'Invalid passcode',
        description: 'Please check the passcode and try again',
        variant: 'destructive'
      });

    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (org: any) => {
      // Store authenticated org in localStorage (for UI purposes only)
      localStorage.setItem('orgAuthenticated', 'true');
      localStorage.setItem('orgAuthId', org.id);
      
      toast({
        title: 'Access granted',
        description: `Welcome to ${org.name}`
      });
      
      onOpenChange(false);
      setName('');
      setPasscode('');
      navigate(`/org/${org.slug}`);
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        // 1. Get Org Email first (since user inputs Name)
        const { data: org } = await supabase
            .from('organizations')
            .select('email')
            .ilike('name', resetName.trim())
            .single();

        if (!org || !org.email) {
             toast({
              title: 'Organization not found',
              description: 'Could not find an organization with that name or no email configured.',
              variant: 'destructive'
            });
            return;
        }

       // 2. Trigger Native Supabase Reset Email
       // Use VITE_SITE_URL from env if available, otherwise use the deployed URL (so local testing generates valid prod links)
       const siteUrl = import.meta.env.VITE_SITE_URL || 'https://fest-hub-livid.vercel.app';
       
       const { error } = await supabase.auth.resetPasswordForEmail(org.email, {
         redirectTo: `${siteUrl}/reset-passcode`,
       });

      if (error) {
           // Fallback for dev mode if rate limited or not configured
           console.error("Reset Error:", error);
           if (error.message.includes("configured")) {
               // If SMTP not configured, we simulate
               setResetSuccess(true);
               toast({
                   title: 'Email Service Not Configured',
                   description: 'In Production, this sends an email. Check console for error details.',
                   variant: 'destructive'
               });
               return;
           }
           throw error;
      }

      setResetSuccess(true);
      toast({
        title: 'Email Sent',
        description: `Check ${org.email} for the reset link.`
      });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-none p-0 bg-background overflow-hidden rounded-[2.5rem] shadow-2xl">
        <div className="p-10">
          <DialogHeader className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                <LogIn className="h-7 w-7 text-primary" strokeWidth={2.5} />
              </div>
              <DialogTitle className="text-[28px] font-extrabold text-foreground tracking-tight">Enter Organization</DialogTitle>
            </div>
            <DialogDescription className="text-lg text-muted-foreground mt-2 leading-relaxed font-medium">
              Enter your organization name and passcode to access your festivals
            </DialogDescription>
          </DialogHeader>
      
      {showResetFlow ? (
        <form onSubmit={handleResetRequest} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="reset-org-name" className="text-base font-bold text-foreground">Organization Name</Label>
            <Input
              id="reset-org-name"
              type="text"
              value={resetName}
              onChange={(e) => setResetName(e.target.value)}
              placeholder="Enter organization name"
              autoFocus
              required
              disabled={resetSuccess}
              className="h-14 px-6 rounded-2xl bg-muted/30 border-border focus:border-primary focus:ring-primary/20 transition-all text-base placeholder:text-muted-foreground/60"
            />
          </div>

          {resetSuccess ? (
            <div className="p-4 bg-green-50/50 border border-green-100 rounded-2xl text-sm text-green-700">
              <p className="font-bold mb-1">Reset Link Generated!</p>
              <p>An email would normally be sent to the organization's registered address. For now, you can find the reset link in the browser console.</p>
            </div>
          ) : null}

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-16 rounded-2xl border-border bg-muted/50 hover:bg-muted text-muted-foreground font-bold text-lg transition-all"
              onClick={() => {
                setShowResetFlow(false);
                setResetSuccess(false);
                setResetName('');
              }}
              disabled={isLoading}
            >
              Back
            </Button>
            {!resetSuccess && (
              <Button 
                type="submit" 
                className="flex-1 h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
                disabled={isLoading}
              >
                {isLoading ? 'Requesting...' : 'Reset'}
              </Button>
            )}
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <Label htmlFor="org-name" className="text-lg font-bold text-foreground ml-1">Organization Name</Label>
            <Input
              id="org-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter organization name"
              autoFocus
              required
              className="h-16 px-8 rounded-3xl bg-muted/20 border-border focus:border-primary focus:ring-0 transition-all text-lg placeholder:text-muted-foreground/50 font-medium"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <Label htmlFor="org-passcode" className="text-lg font-bold text-foreground">Passcode</Label>
              <Button 
                type="button" 
                variant="link" 
                className="p-0 h-auto text-base font-bold text-primary hover:text-primary/80"
                onClick={() => setShowResetFlow(true)}
              >
                Forgot Passcode?
              </Button>
            </div>
            <Input
              id="org-passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode"
              required
              className="h-16 px-8 rounded-3xl bg-muted/20 border-border focus:border-primary focus:ring-0 transition-all text-lg placeholder:text-muted-foreground/50 font-medium"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-16 rounded-[2rem] border-border bg-muted/30 hover:bg-muted/50 text-foreground font-bold text-xl transition-all"
              onClick={() => {
                onOpenChange(false);
                setName('');
                setPasscode('');
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Enter'}
            </Button>
          </div>
        </form>
      )}
    </div>
  </DialogContent>
</Dialog>
  );
}
