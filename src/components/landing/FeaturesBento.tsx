import { Calendar, DollarSign, Users, Image, ArrowUpRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface BentoCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  className?: string;
  graphic?: React.ReactNode;
  backgroundImage?: string;
}

function BentoCard({ title, description, icon: Icon, className, graphic, backgroundImage }: BentoCardProps) {
  return (
    <div className={cn(
      "bento-card relative overflow-hidden rounded-[2rem] p-8 group transition-all duration-300 hover:-translate-y-2 border border-border/40 shadow-xl hover:shadow-2xl bg-card opacity-0 translate-y-10",
      className
    )}>
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <img 
            src={backgroundImage} 
            alt={title} 
            className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-500 scale-105 group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-gradient-to-br from-card/80 to-card/95" />
        </div>
      )}
      <div className="relative z-10 h-full flex flex-col">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="text-2xl font-bold mb-3 text-foreground">{title}</h3>
        <p className="text-muted-foreground text-base leading-relaxed mb-6 flex-grow font-medium">
          {description}
        </p>
        <div className="flex items-center text-primary font-bold text-sm tracking-wide uppercase opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
          Learn more <ArrowUpRight className="ml-1 h-4 w-4" />
        </div>
      </div>
      
      {/* Decorative Graphic Area */}
      {graphic && (
        <div className="absolute right-0 bottom-0 opacity-80 group-hover:scale-105 transition-transform duration-500 pointer-events-none">
          {graphic}
        </div>
      )}
    </div>
  );
}

export function FeaturesBento() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const cards = gsap.utils.toArray<HTMLElement>('.bento-card');
    
    gsap.to(cards, {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse'
      },
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.2, // Increased stagger for distinct entrance
      ease: 'power3.out'
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="py-24 bg-secondary/20">
      <div className="text-center mb-16 px-4">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
          Everything you need
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg md:text-xl">
          Powerful tools to manage every aspect of your festival, built for modern organizations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto auto-rows-[340px] px-4">
        {/* Large Main Card - Festival Management */}
        <BentoCard
          title="Festival Command Center"
          description="Manage all your festivals from one dashboard. Create festivals by year, track progress, view totals, and switch between events instantly."
          icon={Calendar}
          className="md:col-span-2 md:row-span-2 bg-white dark:bg-card"
          graphic={
            <div className="absolute top-[10%] left-8 right-8 bottom-0 flex gap-4 min-h-[300px] pointer-events-none select-none">
              <div className="w-full bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 flex flex-col gap-4">
                 {/* Quick Stats Grid */}
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-card p-3 rounded-lg shadow-sm border border-border/50">
                       <div className="text-[10px] uppercase font-bold text-blue-600 mb-1">TOTAL CHANDAS</div>
                       <div className="text-xl font-bold">₹ 8.5L</div>
                       <div className="text-[10px] text-muted-foreground">Total received</div>
                    </div>
                    <div className="bg-white dark:bg-card p-3 rounded-lg shadow-sm border border-border/50">
                       <div className="text-[10px] uppercase font-bold text-red-600 mb-1">TOTAL EXPENSES</div>
                       <div className="text-xl font-bold">₹ 1.2L</div>
                       <div className="text-[10px] text-muted-foreground">Tracked spending</div>
                    </div>
                 </div>
                 
                 {/* Module Previews Grid */}
                 <div className="grid grid-cols-2 gap-3 flex-1">
                    <div className="bg-white dark:bg-card p-3 rounded-lg shadow-sm border border-border/50 flex flex-col justify-between">
                       <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-md"><Users className="w-3 h-3 text-blue-600 dark:text-blue-300"/></div>
                          <span className="text-xs font-bold">Chandas</span>
                       </div>
                       <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full"><div className="w-[70%] bg-blue-500 h-full rounded-full"></div></div>
                    </div>
                     <div className="bg-white dark:bg-card p-3 rounded-lg shadow-sm border border-border/50 flex flex-col justify-between">
                       <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-amber-100 dark:bg-amber-900 rounded-md"><Trophy className="w-3 h-3 text-amber-600 dark:text-amber-300"/></div>
                          <span className="text-xs font-bold">Voting</span>
                       </div>
                       <div className="flex -space-x-1">
                          {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full bg-slate-200 border border-white"></div>)}
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          }
        />

        {/* Right Column Top - Donations */}
        <BentoCard
          title="Smart Donations"
          description="Record donations in real time with donor names, amounts, and categories. View live lists and totals without Excel or paperwork."
          icon={DollarSign}
          className="md:col-span-1 bg-white dark:bg-card"
          graphic={
            <div className="absolute top-[25%] left-0 right-0 px-4 pointer-events-none">
              <div className="bg-white dark:bg-card shadow-lg rounded-xl border border-border/50 overflow-hidden text-xs">
                 <div className="grid grid-cols-4 bg-slate-50 dark:bg-slate-900 p-2 font-bold text-muted-foreground border-b border-border/50">
                    <div className="col-span-2">Contributor</div>
                    <div className="text-right">Amount</div>
                    <div className="text-center">Status</div>
                 </div>
                 <div className="divide-y divide-border/50">
                    {[
                      { name: "Ravi Kumar", amt: "₹ 5,116", status: "Received", color: "bg-green-100 text-green-800" },
                      { name: "Priya Sharma", amt: "₹ 1,001", status: "Received", color: "bg-green-100 text-green-800" },
                      { name: "Suresh Reddy", amt: "₹ 10,000", status: "Pending", color: "bg-red-100 text-red-800" }
                    ].map((row, i) => (
                      <div key={i} className="grid grid-cols-4 p-2 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <div className="col-span-2 font-medium">{row.name}</div>
                         <div className="text-right font-bold">{row.amt}</div>
                         <div className="flex justify-center"><span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${row.color}`}>{row.status}</span></div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          }
        />

        {/* Right Column Middle - Expenses */}
        <BentoCard
          title="Expense Tracking"
          description="Track every expense with category, amount, and notes. Know exactly where the money goes — transparently."
          icon={Users}
          className="md:col-span-1 bg-white dark:bg-card"
          graphic={
            <div className="absolute inset-0 flex items-center justify-center pt-20 pointer-events-none">
               <div className="relative w-40 h-40 group-hover:scale-110 transition-transform duration-500">
                  {/* CSS Conic Gradient for Pie Chart */}
                  <div className="absolute inset-0 rounded-full shadow-inner bg-[conic-gradient(from_0deg,var(--tw-colors-rose-500)_0%_65%,var(--tw-colors-rose-200)_65%_100%)]"></div>
                  <div className="absolute inset-5 bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-sm">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">SPENT</span>
                    <span className="text-2xl font-bold text-rose-500">65%</span>
                  </div>
               </div>
            </div>
          }
        />

        {/* Full Width Bottom - Gallery & Voting Split */}
        <BentoCard
          title="Community Gallery"
          description="Build professional showcases that attract sponsorships and keep the community engaged. Share photos and daily updates that gather everyone together."
          icon={Image}
          className="md:col-span-1 md:row-span-1 bg-card"
          backgroundImage="/assets/images/rangoli-1.jpg"
          graphic={
            <div className="absolute inset-0 top-20 px-6 flex items-start justify-center overflow-hidden pointer-events-none">
               {/* Masonry-style grid simulating the gallery */}
               <div className="grid grid-cols-2 gap-2 w-full max-w-sm transform group-hover:-translate-y-4 transition-transform duration-700 ease-out">
                  <div className="space-y-2">
                     <div className="rounded-lg overflow-hidden h-24 bg-cover bg-center bg-[url('/assets/images/rangoli-1.jpg')]"></div>
                     <div className="rounded-lg overflow-hidden h-32 bg-cover bg-center bg-[url('/assets/images/rangoli-3.jpg')]"></div>
                  </div>
                  <div className="space-y-2 pt-4">
                     <div className="rounded-lg overflow-hidden h-32 bg-cover bg-center bg-[url('/assets/images/rangoli-2.jpg')]"></div>
                     <div className="rounded-lg overflow-hidden h-20 bg-cover bg-center bg-slate-100 flex items-center justify-center text-xs font-bold text-muted-foreground">+12 More</div>
                  </div>
               </div>
            </div>
          }
        />

        <BentoCard
          title="Voting & Competitions"
          description="Ignite community spirit and gather people for your festival. Host Rangoli, Decoration, or Talent contests with live interactive voting."
          icon={Trophy}
          className="md:col-span-2 md:row-span-1 bg-card"
          backgroundImage={undefined}
          graphic={
             <div className="absolute right-0 top-0 bottom-0 w-1/2 p-6 hidden md:flex items-center justify-center pointer-events-none">
                 <div className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-md rounded-xl shadow-2xl border border-border/20 w-full overflow-hidden flex flex-col transform group-hover:scale-105 transition-transform duration-500">
                    <div className="h-32 bg-cover bg-center relative bg-[url('/assets/images/rangoli-2.jpg')]">
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                       <div className="absolute bottom-2 left-2 text-white font-bold text-sm">Entry #12</div>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                       <div className="text-xs font-medium text-muted-foreground">Rangoli Contest</div>
                    </div>
                 </div>
             </div>
          }
        />
      </div>
    </div>
  );
}
