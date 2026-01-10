import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useState } from 'react';

gsap.registerPlugin(ScrollTrigger);

export function Pricing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const { toast } = useToast();
  const { t } = useLanguage();

  useGSAP(() => {
    const cards = gsap.utils.toArray<HTMLElement>('.pricing-card');
    gsap.from(cards, {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power3.out'
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">Start for free, upgrade when you need more power. No hidden fees.</p>

          {/* Pricing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={cn("text-sm font-medium transition-colors", billingCycle === 'monthly' ? "text-foreground" : "text-muted-foreground")}>Monthly</span>
            <button 
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="relative w-14 h-7 rounded-full bg-slate-200 dark:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Toggle billing cycle"
            >
              <div className={cn(
                "absolute top-1 left-1 w-5 h-5 rounded-full bg-primary shadow-sm transition-transform duration-300 ease-in-out",
                billingCycle === 'annual' ? "translate-x-7" : "translate-x-0"
              )} />
            </button>
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-medium transition-colors", billingCycle === 'annual' ? "text-foreground" : "text-muted-foreground")}>Yearly</span>
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Save 25%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          
          {/* Free Plan */}
          <div className="pricing-card bg-card border border-border/50 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
             <div className="mb-6">
               <h3 className="text-xl font-bold text-muted-foreground">Free</h3>
               <div className="text-4xl font-bold mt-2">₹0 <span className="text-base font-normal text-muted-foreground">/ forever</span></div>
               <p className="text-sm text-muted-foreground mt-2 font-medium">Data removed after 10 days of inactivity.</p>
             </div>
             <Button variant="outline" className="w-full mb-8" size="lg">Get Started Free</Button>
             
             <div className="space-y-4">
               {[
                 { text: "1 Festival / Project", check: true },
                 { text: "Basic image uploads", check: true },
                 { text: "Donation tracking", check: true },
                 { text: "Expense tracking", check: true },
                 { text: "Event tracking", check: true },
                 { text: "Voting and voting results", check: true },
                 { text: "Data removed after 10 days inactive", check: true, highlight: true },
                 { text: "Games and voting to connect community", check: true },
                
               ].map((feat, i) => (
                 <div key={i} className="flex items-center gap-3 text-sm">
                    {feat.check ? (
                      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", feat.highlight ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary")}>
                        <Check className="h-3 w-3" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 opacity-50">
                        <X className="h-3 w-3" />
                      </div>
                    )}
                    <span className={cn(
                      feat.check ? 'text-foreground' : 'text-muted-foreground line-through opacity-70',
                      feat.highlight && "font-bold text-amber-700"
                    )}>{feat.text}</span>
                 </div>
               ))}
             </div>
          </div>

          {/* Pro Plan */}
          <div className="pricing-card bg-card border-2 border-primary rounded-2xl p-8 shadow-xl relative z-10 flex flex-col min-h-[500px] overflow-hidden group">
             <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold shadow-lg uppercase tracking-widest z-20">
               Most Popular
             </div>
             
             {/* Coming Soon Animation/Visual */}
             <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-gradient-to-b from-primary/5 to-primary/10">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 animate-pulse shadow-inner">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-3xl font-black text-primary mb-3 tracking-tighter uppercase italic">
                  Coming Soon
                </h3>
                <p className="text-sm text-muted-foreground max-w-[200px] font-medium leading-relaxed">
                  We're putting the final polish on our professional tools. stay tuned!
                </p>
                <div className="mt-8 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-1.5 h-1.5 rounded-full bg-primary/30 animate-pulse",
                        i === 1 ? "[animation-delay:200ms]" : i === 2 ? "[animation-delay:400ms]" : ""
                      )}
                    />
                  ))}
                </div>
             </div>

             {/* 
             // ORIGINAL PLAN DETAILS COMMENTED OUT 
             <div className="mb-6 opacity-20 pointer-events-none blur-[2px]">
               <h3 className="text-xl font-bold text-primary">Pro</h3>
               <div className="flex items-baseline gap-1 mt-2">
                 <span className="text-4xl font-bold">₹{billingCycle === 'annual' ? '299' : '399'}</span>
                 <span className="text-base font-normal text-muted-foreground">/ month</span>
               </div>
               <p className="text-sm text-muted-foreground mt-2 font-medium">
                 {billingCycle === 'annual' ? 'Billed ₹3,588 / year' : 'Billed monthly'}
               </p>
               <p className="text-xs text-primary font-bold mt-1">
                 {billingCycle === 'annual' ? 'Save ₹1,200 per year' : 'Flexibility to cancel anytime'}
               </p>
             </div>
             <Button 
                disabled
                className="w-full mb-8 shadow-lg shadow-primary/25 h-12 text-md font-bold opacity-20" 
                size="lg"
              >
                Coming Soon
              </Button>
             
             <div className="space-y-4 flex-1 opacity-20 pointer-events-none blur-[1px]">
               {[
                 { text: "Unlimited Festivals", check: true },
                 { text: "Advanced Data Security", check: true, highlight: true },
                 { text: "Nightly Automated Backups", check: true, highlight: true },
                 { text: "Premium Image Hosting", check: true },
                 { text: "Detailed Financial Reports", check: true },
                 { text: "Data Persistence (No Removal)", check: true },
                 { text: "Priority Support", check: true },
                 { text: "Custom Subdomains", check: true },
               ].map((feat, i) => (
                 <div key={i} className="flex items-center gap-3 text-sm">
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", feat.highlight ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
                      <Check className="h-3 w-3" />
                    </div>
                    <span className={cn(
                      "text-foreground", 
                      feat.highlight && "font-bold"
                    )}>{feat.text}</span>
                 </div>
               ))}
             </div>
             */}
          </div>

          {/* Enterprise / Scale Plan - COMMENTED OUT AS REQUESTED
          <div className="pricing-card bg-card/50 border border-border/50 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col opacity-90 lg:scale-95">
             <div className="mb-6">
               <h3 className="text-xl font-bold text-muted-foreground uppercase tracking-tight">Enterprise</h3>
               <div className="text-4xl font-bold mt-2">Custom</div>
               <p className="text-sm text-muted-foreground mt-2 font-medium">For larger organizations and events.</p>
             </div>
             <Button variant="outline" className="w-full mb-8" size="lg">Contact Sales</Button>
             
             <div className="space-y-4 flex-1 text-muted-foreground">
               {[
                 { text: "Dedicated Success Manager", check: true },
                 { text: "On-site Event Support", check: true },
                 { text: "Custom API Integrations", check: true },
                 { text: "White-label Mobile App", check: true },
                 { text: "SSO & SAML Authentication", check: true },
                 { text: "Custom Contract & SLA", check: true },
               ].map((feat, i) => (
                 <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span>{feat.text}</span>
                 </div>
               ))}
             </div>
          </div>
          */}

        </div>
      </div>
    </div>
  );
}
