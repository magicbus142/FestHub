import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, LogIn, User, LogOut, Loader2, ArrowRight, CheckCircle2, Heart, IndianRupee, Image as ImageIcon, Trophy } from 'lucide-react';
import { CreateOrganizationDialog } from '@/components/CreateOrganizationDialog';
import { OrganizationLoginDialog } from '@/components/OrganizationLoginDialog';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Import landing components
import { TrustSection } from '@/components/landing/TrustSection';
import { FeatureSections } from '@/components/landing/FeatureSections';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Pricing } from '@/components/landing/Pricing';
import { Footer } from '@/components/landing/Footer';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { AppLogo } from '@/components/AppLogo';

gsap.registerPlugin(ScrollTrigger);

export default function OrganizationsList() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { user, isLoading, signOut } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const heroRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Animate hero content
    const tl = gsap.timeline();
    
    tl.from('.hero-badge', {
      y: -20,
      opacity: 0,
      duration: 0.6,
      ease: 'power3.out'
    })
    .from('.hero-title span', {
      y: 60,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    }, '-=0.3')
    .from('.hero-subtitle', {
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: 'power3.out'
    }, '-=0.4')
    .from('.hero-buttons', {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: 'power3.out'
    }, '-=0.3')
    .from('.hero-mockup', {
      x: 50,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.5')
    .from('.floating-element', {
      scale: 0,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: 'back.out(1.7)'
    }, '-=0.4')
    .from('.service-card', {
      x: (i) => i % 2 === 0 ? -40 : 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out'
    }, '-=0.6');

    // Continuous floating animation for service cards
    gsap.to('.service-card', {
      y: 'random(-15, 15)',
      x: 'random(-10, 10)',
      rotation: 'random(-2, 2)',
      duration: 'random(2, 4)',
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      stagger: {
        amount: 2,
        from: 'random'
      }
    });
    
  }, { scope: heroRef });

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <AppLogo />
          
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.email}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign out
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setIsLoginOpen(true)}>
                <User className="h-4 w-4 mr-1" />
                Sign in
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="pt-28 pb-20 md:pt-40 md:pb-32 relative overflow-hidden">
        {/* Background Decorations - Softer, more elegant */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[150px] pointer-events-none opacity-60" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Decorative grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8 max-w-xl">
              <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium backdrop-blur-sm shadow-sm transition-all hover:bg-primary/20">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>Modernizing Festival Management</span>
              </div>
              
              <h1 className="hero-title text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-foreground leading-[1.15] tracking-tight">
                <span className="block">Manage Festivals.</span>
                <span className="block text-primary">Track Donations.</span>
                <span className="block text-primary">Share Memories.</span>
              </h1>
              
              <p className="hero-subtitle text-lg text-muted-foreground max-w-md leading-relaxed">
                FestHub is the bridge between tradition and modern management. <span className="text-primary font-style:italic ">Showcase your events/festivals to attract sponsorships, gather your community together </span>, and manage donations and expenses with total transparency.
              </p>

              <div className="hero-buttons flex flex-col sm:flex-row gap-4 pt-2">
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/30 text-base px-8 h-14 rounded-full group transition-all hover:shadow-2xl hover:shadow-primary/40"
                >
                  <Plus className="h-5 w-5 mr-2 transition-transform group-hover:rotate-90" />
                  Create Organization
                </Button>
                <Button
                  onClick={() => setIsLoginOpen(true)}
                  size="lg"
                  variant="outline"
                  className="border-2 border-border hover:border-primary/50 hover:bg-primary/5 text-foreground text-base px-8 h-14 rounded-full group"
                >
                  Login
                  <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>

            {/* Right: Enhanced Product Mockup */}
            <div className="hero-mockup relative hidden lg:block">
              {/* Main Dashboard Card */}
              <div className="relative z-20">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/30 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-500">
                  {/* Browser Header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 rounded-md text-xs text-muted-foreground border border-slate-100 dark:border-slate-700">
                        🔒 festhub.app/dashboard
                      </div>
                    </div>
                  </div>
                  
                  {/* Dashboard Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Festival Status</div>
                        <div className="text-lg font-bold text-foreground mt-1">Ganesh Utsav 2024</div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                        ● Active
                      </span>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/10">
                        <div className="text-2xl font-bold text-primary">₹2.5L</div>
                        <div className="text-[11px] text-muted-foreground mt-1">Total Donations</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl border border-orange-500/10">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">₹1.8L</div>
                        <div className="text-[11px] text-muted-foreground mt-1">Expenses</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/10">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">70000</div>
                        <div className="text-[11px] text-muted-foreground mt-1">Balance</div>
                      </div>
                    </div>
                    
                    {/* Two Column Layout - Donations & Voting */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Recent Donations */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Donations</div>
                        <div className="space-y-1.5">
                          {[
                            { name: 'Ramesh K.', amount: '₹5,000' },
                            { name: 'Sita S.', amount: '₹2,500' },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-1.5 px-2 bg-white dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700/30">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                                  {item.name.charAt(0)}
                                </div>
                                <span className="text-xs font-medium text-foreground">{item.name}</span>
                              </div>
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{item.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Voting Contest */}
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-3 border border-amber-200/50 dark:border-amber-700/30">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">🏆 Rangoli Contest</div>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { img: '/images/showcase/rangoli1.jpg', votes: 245 },
                            { img: '/images/showcase/rangoli2.jpg', votes: 189 },
                          ].map((entry, i) => (
                            <div key={i} className="relative rounded-lg overflow-hidden border border-white/50 shadow-sm group">
                              <img src={entry.img} alt="" className="w-full h-12 object-cover group-hover:scale-110 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                              <div className="absolute bottom-1 left-1 bg-white/90 dark:bg-slate-900/90 px-1.5 py-0.5 rounded text-[8px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-0.5">
                                🏆 {entry.votes}
                              </div>
                            </div>
                          ))}
                        </div>
                        <button className="w-full mt-2 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg transition-colors">
                          Vote Now →
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
              
              {/* Floating Accent Card - Top Right */}
              <div className="floating-element absolute -top-4 -right-8 z-30 bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-slate-900/10 p-4 border border-slate-100 dark:border-slate-700 transform rotate-6 hover:rotate-3 transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-xl shadow-md">
                    🎉
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">New Donation!</div>
                    <div className="text-[10px] text-muted-foreground">₹10,000 received</div>
                  </div>
                </div>
              </div>
              
              {/* Floating Icon - Bottom Left */}
              <div className="floating-element absolute -bottom-6 -left-6 z-30 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl shadow-purple-500/30 flex items-center justify-center text-2xl transform -rotate-6 hover:rotate-0 transition-transform">
                🪔
              </div>
              
              {/* Floating Stats Badge - Right Side */}
              <div className="floating-element absolute top-1/2 -right-4 z-30 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 border border-slate-100 dark:border-slate-700 transform translate-y-[-50%] rotate-3 hover:rotate-0 transition-transform">
                <div className="text-lg font-bold text-emerald-600">+12%</div>
                <div className="text-[9px] text-muted-foreground">This Week</div>
              </div>

              {/* Enhanced Service Cards */}
              {/* Chandas Card */}
              <div className="service-card absolute -left-20 top-1/4 z-30 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-xl p-4 border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-3 min-w-[180px]">
                <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Chandas</div>
                  <div className="text-[10px] text-muted-foreground">Track Donations</div>
                </div>
              </div>

              {/* Expenses Card */}
              <div className="service-card absolute -right-24 bottom-1/4 z-30 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-xl p-4 border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-3 min-w-[180px]">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <IndianRupee className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Expenses</div>
                  <div className="text-[10px] text-muted-foreground">Manage Funds</div>
                </div>
              </div>

              {/* Gallery Card */}
              <div className="service-card absolute -left-12 -bottom-4 z-30 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-xl p-4 border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-3 min-w-[180px]">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Gallery</div>
                  <div className="text-[10px] text-muted-foreground">Share Images</div>
                </div>
              </div>

              {/* Voting Card */}
              <div className="service-card absolute -right-16 -top-12 z-30 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-xl p-4 border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-3 min-w-[180px]">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Voting</div>
                  <div className="text-[10px] text-muted-foreground">Community Contests</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Trust Section */}
      <TrustSection />

      {/* Features Section */}
      <FeatureSections />

      {/* How It Works */}
      <HowItWorks />

      {/* Pricing */}
      <Pricing />

      {/* Footer with CTA */}
      <Footer onStart={() => setIsCreateOpen(true)} />

      {/* Dialogs */}
      <OrganizationLoginDialog 
        open={isLoginOpen} 
        onOpenChange={setIsLoginOpen}
      />
      <CreateOrganizationDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}
