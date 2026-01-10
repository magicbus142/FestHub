import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CreditCard, ShieldCheck, AlertCircle, ArrowUpCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SubscriptionTab() {
  const { currentOrganization, isAuthenticated, setCurrentOrganization } = useOrganization();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const plan = currentOrganization?.plan || 'free';
  const status = currentOrganization?.subscription_status || 'active';

  const updatePlanMutation = useMutation({
    mutationFn: async (newPlan: string) => {
      if (!currentOrganization) throw new Error('No organization selected');
      
      const { error } = await supabase
        .from('organizations')
        .update({ 
          plan: newPlan,
          subscription_status: 'active'
        })
        .eq('id', currentOrganization.id);

      if (error) throw error;
      return newPlan;
    },
    onSuccess: (newPlan) => {
      if (currentOrganization) {
        setCurrentOrganization({
          ...currentOrganization,
          plan: newPlan,
          subscription_status: 'active'
        });
      }
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast({
        title: t('ప్లాన్ అప్‌డేట్ అయింది', 'Plan updated'),
        description: t(`మీరు విజయవంతంగా ${newPlan} ప్లాన్‌కు మారారు`, `You have successfully switched to the ${newPlan} plan.`),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('దోషం', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrganization) throw new Error('No organization selected');
      
      const { error } = await supabase
        .from('organizations')
        .update({ 
          subscription_status: 'canceled'
        })
        .eq('id', currentOrganization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      if (currentOrganization) {
        setCurrentOrganization({
          ...currentOrganization,
          subscription_status: 'canceled'
        });
      }
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast({
        title: t('సబ్‌స్క్రిప్షన్ రద్దు చేయబడింది', 'Subscription canceled'),
        description: t('మీ సబ్‌స్క్రిప్షన్ విజయవంతంగా రద్దు చేయబడింది', 'Your subscription has been successfully canceled.'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('దోషం', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  if (!currentOrganization) return null;

  const isPro = plan === 'pro_monthly' || plan === 'pro_annual';
  const isCanceled = status === 'canceled';

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm",
            isPro ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground border border-border"
          )}>
            {isPro ? (isCanceled ? 'Expiring Soon' : 'Active Plan') : 'Free Tier'}
          </div>
        </div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {t('మీ ప్లాన్', 'Your Subscription')}
          </CardTitle>
          <CardDescription>
            {t('మీ ప్రస్తుత ప్లాన్ మరియు బిల్లింగ్ వివరాలను నిర్వహించండి', 'Manage your current plan and billing details')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
            <div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Current Plan</div>
              <div className="text-3xl font-bold text-foreground">
                {plan === 'pro_annual' ? 'Pro Annual' : plan === 'pro_monthly' ? 'Pro Monthly' : 'Free Experience'}
              </div>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                {plan === 'free' 
                  ? 'Great for small community projects and individual festivals.'
                  : 'Powering your large-scale events with advanced features and security.'}
              </p>
            </div>
            <div className="flex flex-col gap-2 min-w-[200px] relative overflow-hidden group">
              {plan === 'free' ? (
                <div className="flex flex-col items-center gap-2 p-4 bg-primary/5 rounded-xl border border-primary/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />
                  <div className="text-xl font-black text-primary uppercase italic tracking-tighter">Coming Soon</div>
                  <p className="text-[10px] text-muted-foreground font-medium">Professional features are launching soon!</p>
                  <Button 
                    disabled
                    className="w-full mt-2 shadow-sm opacity-50 cursor-not-allowed"
                  >
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    Upgrade Delayed
                  </Button>
                </div>
              ) : !isCanceled ? (
                <Button 
                  variant="outline" 
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Subscription
                </Button>
              ) : (
                <Button 
                  onClick={() => updatePlanMutation.mutate(plan)}
                  disabled={updatePlanMutation.isPending}
                  className="w-full"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Reactive Plan
                </Button>
              )}
              {isPro && !isCanceled && (
                <p className="text-[10px] text-center text-muted-foreground">Next billing date: Feb 9, 2026</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Features Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              Data Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>End-to-end encryption for all sensitive data.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>Nightly automated backups for Pro users.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>99.9% Uptime SLA for critical events.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Having issues with your subscription or need a custom plan for a mega-event?
            </p>
            <Button variant="link" className="p-0 h-auto text-primary font-bold">
              Contact Support →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
