import { ArrowRight, UserPlus, CalendarPlus, Share2 } from 'lucide-react';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const steps = [
    {
      num: "01",
      title: "Create Organization",
      desc: "Start by creating your organization or entering an existing one with your secure passcode.",
      icon: UserPlus
    },
    {
      num: "02",
      title: "Add Festivals",
      desc: "Set up your festivals for the year. Customize details and prepare your dashboard.",
      icon: CalendarPlus
    },
    {
      num: "03",
      title: "Manage & Share",
      desc: "Track donations, expenses, and share your public page with the community.",
      icon: Share2
    }
  ];

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 70%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse'
      }
    });

    // Animate Line
    tl.from('.connecting-line', {
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 1,
      ease: 'power2.inOut'
    });

    // Animate Steps
    tl.from('.step-item', {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.3,
      ease: 'back.out(1.7)'
    }, '-=0.5');

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="py-20 relative">
      <div className="text-center mb-16 px-4">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground drop-shadow-sm">How It Works</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Get started in minutes. No complex setup required.
        </p>
      </div>

      <div className="relative max-w-5xl mx-auto px-4">
        {/* Connecting Line (Desktop) */}
        <div className="connecting-line hidden md:block absolute top-[60px] left-[10%] right-[10%] h-1 bg-gradient-to-r from-primary/10 via-primary/50 to-primary/10 rounded-full" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
          {steps.map((step, i) => {
            const Icon = step.icon;
            // Use subtle accent colors
            return (
              <div key={i} className="step-item flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 relative transition-transform duration-500 group-hover:scale-110 shadow-lg border border-border/20 bg-white">
                  <Icon className="h-9 w-9 transition-colors duration-300 text-primary" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary border-4 border-white dark:border-slate-900 flex items-center justify-center text-sm font-bold shadow-md text-primary-foreground">
                    {step.num}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-[250px] mx-auto text-sm">
                  {step.desc}
                </p>
                
                {i < steps.length - 1 && (
                  <div className="md:hidden mt-8 text-muted-foreground/30">
                    <ArrowRight className="h-6 w-6 rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
