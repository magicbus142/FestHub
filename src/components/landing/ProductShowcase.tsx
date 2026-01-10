import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/lib/utils'; // Assuming utils exists

gsap.registerPlugin(ScrollTrigger);

export function ProductShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const panels = gsap.utils.toArray<HTMLElement>('.showcase-panel');
    const totalPanels = panels.length;

    gsap.to(panels, {
      xPercent: -100 * (totalPanels - 1),
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        pin: true,
        scrub: 1,
        snap: 1 / (totalPanels - 1),
        end: () => '+=' + sliderRef.current?.offsetWidth,
      }
    });
  }, { scope: containerRef });

  const slides = [
    {
      title: "Dashboard Overview",
      desc: "All your festivals at a glance. Track active events, total funds, and recent activity in one unified view.",
      color: "from-indigo-500/20 to-purple-500/20",
      mockup: (
        <div className="w-full h-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-border/50 p-6 flex flex-col gap-4">
           {/* Mock Dashboard UI */}
           <div className="flex gap-4">
              <div className="w-1/3 h-32 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 animate-pulse"></div>
              <div className="w-1/3 h-32 rounded-lg bg-purple-100 dark:bg-purple-900/30 animate-pulse delay-75"></div>
              <div className="w-1/3 h-32 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 animate-pulse delay-150"></div>
           </div>
           <div className="flex-1 rounded-lg bg-slate-100 dark:bg-slate-800/50 w-full animate-pulse delay-200"></div>
        </div>
      )
    },
    {
      title: "Live Donation Tracking",
      desc: "Record donations in real-time with receipts. No more lost paper slips or Excel confusion.",
      color: "from-emerald-500/20 to-teal-500/20",
      mockup: (
         <div className="w-full h-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-border/50 p-6 flex flex-col">
            <div className="h-8 w-1/3 bg-emerald-100 dark:bg-emerald-900/30 rounded mb-6"></div>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-border/50 last:border-0">
                 <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <div className="w-32 h-4 bg-slate-100 dark:bg-slate-800 rounded"></div>
                 </div>
                 <div className="w-16 h-6 bg-emerald-100 dark:bg-emerald-900/20 rounded text-emerald-600 text-xs flex items-center justify-center font-bold">₹ 5,000</div>
              </div>
            ))}
         </div>
      )
    },
    {
        title: "Transparent Expenses",
        desc: "Track every rupee spent. Categorize expenses and attach bills for complete financial transparency.",
        color: "from-rose-500/20 to-orange-500/20",
        mockup: (
           <div className="w-full h-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-border/50 p-6 flex items-center justify-center">
               <div className="w-64 h-64 rounded-full border-[16px] border-slate-100 dark:border-slate-800 relative">
                  <div className="absolute inset-0 border-[16px] border-rose-500 rounded-full border-l-transparent border-b-transparent rotate-45"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-3xl font-bold text-foreground">₹2.4L</div>
                      <div className="text-sm text-muted-foreground">Total Spent</div>
                  </div>
               </div>
           </div>
        )
      },
      {
        title: "Public Festival Page",
        desc: "Share a beautiful, public-facing page with your community. No login required for them to see updates and photos.",
        color: "from-sky-500/20 to-blue-500/20",
        mockup: (
           <div className="w-full h-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-border/50 overflow-hidden relative">
               <div className="h-32 bg-sky-500/20 w-full absolute top-0"></div>
               <div className="absolute top-24 left-6 w-20 h-20 rounded-xl bg-white shadow-lg z-10"></div>
               <div className="mt-48 px-6 space-y-4">
                  <div className="h-6 w-2/3 bg-slate-100 dark:bg-slate-800 rounded"></div>
                  <div className="h-4 w-full bg-slate-50 dark:bg-slate-800/50 rounded"></div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                     {[1,2,3].map(i => <div key={i} className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg"></div>)}
                  </div>
               </div>
           </div>
        )
      }
  ];

  return (
    <div ref={containerRef} className="py-20 overflow-hidden relative bg-background">
       <div className="container mx-auto px-4 mb-12 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">See it in action</h2>
          <p className="text-muted-foreground text-lg">Powerful features wrapped in a simple design.</p>
       </div>

      <div ref={sliderRef} className="flex w-[400%] h-[600px]">
        {slides.map((slide, i) => (
          <div key={i} className="showcase-panel w-screen h-full flex flex-col md:flex-row items-center justify-center px-4 md:px-20 gap-8 md:gap-16">
            
            {/* Text Side */}
            <div className="w-full md:w-1/3 space-y-6">
               <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br", slide.color)}>
                  <span className="text-xl font-bold opacity-50">{i + 1}</span>
               </div>
               <h3 className="text-3xl md:text-4xl font-bold leading-tight">{slide.title}</h3>
               <p className="text-lg text-muted-foreground leading-relaxed">
                 {slide.desc}
               </p>
            </div>

            {/* Visual Side */}
            <div className="w-full md:w-1/2 h-[300px] md:h-[500px] relative perspective-1000">
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-br rounded-[2.5rem] transform rotate-3 scale-95 opacity-50 blur-xl transition-all duration-500", 
                    slide.color
                )} />
                <div className="relative w-full h-full transform transition-all duration-500 ease-out hover:scale-[1.02] hover:-rotate-1">
                   {slide.mockup}
                </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
