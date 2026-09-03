import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';
import { supabase, getSupabaseClientForOrg, supabasePrimary, supabaseSecondary } from '@/integrations/supabase/client';

interface OrganizationLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  prefilledName?: string;
}

export function OrganizationLoginDialog({
  open,
  onOpenChange,
  onSuccess,
  prefilledName
}: OrganizationLoginDialogProps) {
  const [name, setName] = useState(prefilledName || '');
  const [passcode, setPasscode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetFlow, setShowResetFlow] = useState(false);
  const [resetName, setResetName] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const passcodeRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus logic
  useEffect(() => {
    if (open) {
      if (prefilledName && passcodeRef.current) {
        passcodeRef.current.focus();
      }
    }
  }, [open, prefilledName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const trimmedName = name.trim();
      let client = getSupabaseClientForOrg(trimmedName);

      // 1. Find organization by name
      let { data: org, error } = await client
        .from('organizations')
        .select('*')
        .ilike('name', trimmedName)
        .single();

      // Fallback search across both clients if not found on primary client lookup
      if ((error || !org) && supabaseSecondary && client !== supabaseSecondary) {
        const { data: secondaryOrg } = await supabaseSecondary
          .from('organizations')
          .select('*')
          .ilike('name', trimmedName)
          .single();
        if (secondaryOrg) {
          org = secondaryOrg;
          client = supabaseSecondary;
        }
      } else if ((error || !org) && client !== supabasePrimary) {
        const { data: primaryOrg } = await supabasePrimary
          .from('organizations')
          .select('*')
          .ilike('name', trimmedName)
          .single();
        if (primaryOrg) {
          org = primaryOrg;
          client = supabasePrimary;
        }
      }

      if (!org) {
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
      if (org.email) {
        const { data: authData } = await client.auth.signInWithPassword({
          email: org.email,
          password: passcode
        });

        if (authData?.session) {
          handleLoginSuccess(org);
          return;
        }
      }

      // 3. Fallback: Check Legacy Passcode
      const { data: isValidLegacy } = await client.rpc('verify_organization_passcode', {
        _organization_id: org.id,
        _passcode: passcode
      });

      if (isValidLegacy) {
        if (org.email && passcode.length >= 6) {
          await client.auth.signUp({
            email: org.email,
            password: passcode,
            options: {
              data: { organization_name: org.name }
            }
          });
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

  // Update name when prefilledName changes
  React.useEffect(() => {
    if (open && prefilledName) {
      setName(prefilledName);
    }
  }, [open, prefilledName]);

  const handleLoginSuccess = (org: any) => {
    // Store authenticated org in localStorage (for UI purposes only)
    localStorage.setItem('orgAuthenticated', 'true');
    localStorage.setItem('orgAuthId', org.id);

    toast({
      title: 'Access granted',
      description: `Welcome to ${org.name}`
    });

    onOpenChange(false);
    if (!prefilledName) {
      setName('');
    }
    setPasscode('');
    
    if (onSuccess) {
      onSuccess();
    } else {
      navigate(`/org/${org.slug}`);
    }
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
      // Use window.location.origin to ensure the link redirects back to the current domain (whether localhost or prod)
      const siteUrl = window.location.origin;

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
      <DialogContent className="sm:max-w-lg w-[95vw] max-h-[90vh] border border-border p-0 bg-background/95 backdrop-blur-2xl overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-primary/10">
        <div className="p-6 sm:p-10 flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="mb-6 sm:mb-8 flex-shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 mb-2">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-sm shrink-0">
                <LogIn className="h-6 w-6 sm:h-7 sm:w-7 text-primary" strokeWidth={2.5} />
              </div>
              <DialogTitle className="text-2xl sm:text-[28px] font-extrabold text-foreground tracking-tight line-clamp-2">Enter Organization</DialogTitle>
            </div>
            <DialogDescription className="text-base sm:text-lg text-muted-foreground mt-2 leading-relaxed font-medium">
              Enter your organization name and passcode to access your festivals
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4 -mr-4">
            {showResetFlow ? (
              <form onSubmit={handleResetRequest} className="space-y-6 p-1 pb-6">
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
              <form onSubmit={handleSubmit} className="space-y-8 p-1">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Organization Name</Label>
                    <Input
                      id="org-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter organization name"
                      autoFocus={!prefilledName}
                      readOnly={!!prefilledName}
                      className={prefilledName ? "bg-slate-50 font-semibold text-slate-500 border-slate-100 cursor-not-allowed" : ""}
                      required
                    />
                    {prefilledName && (
                      <p className="text-[10px] text-muted-foreground mt-1 px-1">
                        Log in to the current organization. To switch, logout first.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="org-passcode">Passcode</Label>
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-xs font-medium text-primary hover:text-primary/80"
                        onClick={() => setShowResetFlow(true)}
                      >
                        Forgot Passcode?
                      </Button>
                    </div>
                    <Input
                      id="org-passcode"
                      type="password"
                      ref={passcodeRef}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter passcode"
                      required
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
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
                      className="flex-1 bg-primary text-primary-foreground"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Verifying...' : 'Enter'}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
