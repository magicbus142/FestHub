import { useRef } from 'react';
import { Building2, Users, HeartHandshake, Tent } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function TrustSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const items = gsap.utils.toArray<HTMLElement>('.trust-item');
    const header = containerRef.current?.querySelector('.trust-header');
    
    if (header) {
      gsap.from(header, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        },
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out'
      });
    }

    gsap.from(items, {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 75%',
        toggleActions: 'play none none reverse'
      },
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
      delay: 0.2
    });
  }, { scope: containerRef });

  const items = [
    { icon: Building2, label: 'Temples & Religious Trusts' },
    { icon: Tent, label: 'Village & Community Festivals' },
    { icon: Users, label: 'Cultural & Event Committees' },
    { icon: HeartHandshake, label: 'NGOs & Donation Drives' },
  ];

  return (
    <div ref={containerRef} className="py-16 bg-muted/30 border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 trust-header">
          <h2 className="text-xl font-semibold text-muted-foreground uppercase tracking-widest mb-4">Trusted by Organizers Everywhere</h2>
          <p className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Attract sponsorships, gather your community together
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="trust-item flex flex-col items-center text-center gap-3 opacity-1">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="font-medium text-foreground max-w-[150px]">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
