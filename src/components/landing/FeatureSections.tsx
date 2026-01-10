import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/lib/utils';
import { Trophy, LayoutDashboard, IndianRupee, Image as ImageIcon, Search, Bell, Menu, Plus, Filter, MoreVertical, Calendar, Users, CheckCircle2, Settings, BarChart3, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Assuming button exists

gsap.registerPlugin(ScrollTrigger);

export function FeatureSections() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const sections = gsap.utils.toArray<HTMLElement>('.feature-section');
    
    sections.forEach((section, i) => {
       const text = section.querySelector('.feature-text');
       const visual = section.querySelector('.feature-visual');
       
       gsap.from(text, {
         scrollTrigger: {
           trigger: section,
           start: 'top 70%',
         },
         y: 50,
         opacity: 0,
         duration: 0.8,
         ease: 'power3.out'
       });

       gsap.from(visual, {
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
        },
        x: i % 2 === 0 ? 50 : -50,
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
        ease: 'power3.out'
      });
    });
  }, { scope: containerRef });

  const features = [
    {
      title: "Festival Command Center",
      desc: "Get a bird's-eye view of your entire event universe. Switch between festivals, track years, and manage permissions from a single, intuitive dashboard.",
      icon: LayoutDashboard,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      mockup: (
         <div className="w-full aspect-video bg-slate-50 rounded-xl shadow-2xl border border-indigo-100/50 overflow-hidden flex relative group">
            {/* Background Tech Grid - More subtle for light mode */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e5_1px,transparent_1px),linear-gradient(to_bottom,#4f46e5_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.03]"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-slate-50/50 to-slate-50"></div>
            
            {/* Central Hub Animation */}
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="relative">
                  {/* Ripple Pings */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-indigo-400/20 rounded-full animate-ping"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-indigo-400/10 rounded-full animate-ping delay-75"></div>
                  
                  {/* Connection Lines (SVG) */}
                  <svg className="absolute inset-0 w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20" viewBox="0 0 400 400">
                     <line x1="200" y1="200" x2="200" y2="100" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-indigo-500" />
                     <line x1="200" y1="200" x2="300" y2="250" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-indigo-500" />
                     <line x1="200" y1="200" x2="100" y2="250" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-indigo-500" />
                     <line x1="200" y1="200" x2="280" y2="140" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-indigo-500" />
                     <line x1="200" y1="200" x2="120" y2="140" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-indigo-500" />
                  </svg>

                  {/* Orbits */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-indigo-200/50 rounded-full animate-[spin_10s_linear_infinite]"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-indigo-200/70 rounded-full animate-[spin_7s_linear_infinite_reverse]"></div>
                  
                  {/* Core */}
                  <div className="w-20 h-20 bg-white/80 backdrop-blur-md rounded-full border border-indigo-100 flex items-center justify-center relative z-10 shadow-[0_8px_30px_rgba(79,70,229,0.15)]">
                     <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-indigo-500/40">
                        <LayoutDashboard className="w-6 h-6 text-white" />
                     </div>
                  </div>

                  {/* Satellites - Main Modules */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-24 w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-md animate-bounce group-hover:scale-110 transition-transform">
                     <IndianRupee className="w-5 h-5 text-emerald-500" />
                     <div className="absolute -top-8 bg-slate-900 text-white text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Donations</div>
                  </div>
                  <div className="absolute bottom-0 right-1/2 translate-x-24 translate-y-12 w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-md animate-bounce delay-100 group-hover:scale-110 transition-transform">
                     <Trophy className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-24 translate-y-12 w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-md animate-bounce delay-200 group-hover:scale-110 transition-transform">
                     <ImageIcon className="w-5 h-5 text-sky-500" />
                  </div>

                  {/* Secondary Modules - Filling the space */}
                  <div className="absolute top-1/4 -right-20 w-10 h-10 bg-white/60 backdrop-blur border border-indigo-50 rounded-lg flex items-center justify-center shadow-sm animate-[float_3s_ease-in-out_infinite]">
                     <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="absolute top-1/2 -left-24 w-10 h-10 bg-white/60 backdrop-blur border border-indigo-50 rounded-lg flex items-center justify-center shadow-sm animate-[float_4s_ease-in-out_infinite] delay-150">
                     <BarChart3 className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="absolute -top-12 -right-12 w-9 h-9 bg-white/40 backdrop-blur border border-indigo-50 rounded-lg flex items-center justify-center shadow-sm animate-pulse">
                     <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="absolute -bottom-8 right-2 w-9 h-9 bg-white/40 backdrop-blur border border-indigo-50 rounded-lg flex items-center justify-center shadow-sm animate-pulse delay-200">
                     <Settings className="w-4 h-4 text-slate-400" />
                  </div>
               </div>
            </div>

            {/* Live Stats HUD */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20">
               <div className="space-y-1">
                  <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Active</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">Ganesh Utsav </div>
               </div>
               <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-lg p-3 text-right shadow-sm">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Total amount</div>
                  <div className="text-xl font-bold text-indigo-600 font-mono">70000</div>
               </div>
            </div>

            {/* Floating Notifications */}
            <div className="absolute bottom-6 left-6 right-6 space-y-2 z-20">
               {[
                  { text: "New donation received: ₹501", time: "Just now", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
                  { text: "Rangoli entry #45 uploaded", time: "2m ago", color: "bg-amber-50 border-amber-200 text-amber-700" }
               ].map((notif, i) => (
                  <div key={i} className={`backdrop-blur border-l-4 ${notif.color} p-3 rounded-r-lg flex justify-between items-center transform transition-all hover:translate-x-1 cursor-default shadow-sm`}>
                     <span className="text-xs font-bold">{notif.text}</span>
                     <span className="text-[10px] text-slate-400">{notif.time}</span>
                  </div>
               ))}
            </div>
         </div>
      )
    },
    {
      title: "Interactive Competitions & Voting",
      desc: "Engage your community with live competitions. Host Rangoli, Decoration, or Talent contests where users can vote for their favorites in real-time.",
      icon: Trophy,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      mockup: (
        <div className="w-full aspect-video bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-2xl border border-amber-100/50 overflow-hidden flex flex-col relative text-xs sm:text-sm">
           <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl z-0"></div>

           {/* Mock Nav */}
           <div className="h-14 border-b border-amber-100/50 flex items-center justify-between px-6 bg-white/80 backdrop-blur-xl relative z-10">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/30 shadow-lg flex items-center justify-center"><Trophy className="w-4 h-4 text-white"/></div>
                 <div>
                    <div className="font-bold text-slate-800">Rangoli Contest</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Live Voting • 24 Entries</div>
                 </div>
              </div>
              <div className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-xs font-semibold shadow-lg shadow-slate-900/20 transform hover:scale-105 transition-transform cursor-pointer">Add Entry</div>
           </div>

           {/* Tabs Mock */}
           <div className="flex border-b border-amber-100/50 bg-white/50 px-6 gap-8 pt-4 relative z-10">
              <div className="pb-3 border-b-2 border-amber-500 text-amber-900 font-bold">Gallery</div>
              <div className="pb-3 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">Leaderboard</div>
           </div>

           {/* Grid Content */}
           <div className="p-6 grid grid-cols-3 gap-6 relative z-10 overflow-hidden">
               {[
                  { name: "Entry #12", votes: 245, img: "/images/showcase/rangoli1.jpg" },
                  { name: "Entry #08", votes: 189, img: "/images/showcase/rangoli2.jpg" },
                  { name: "Entry #15", votes: 156, img: "/images/showcase/rangoli3.jpg" }
               ].map((entry, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-500">
                     <div className="aspect-[4/3] relative overflow-hidden">
                        <img src={entry.img} alt="" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1">
                           <Trophy className="w-3 h-3 text-amber-500"/> {entry.votes}
                        </div>
                     </div>
                     <div className="p-3">
                        <div className="font-bold text-slate-800 text-sm truncate">{entry.name}</div>
                        <button className="w-full mt-3 bg-slate-50 hover:bg-amber-500 hover:text-white text-slate-600 py-1.5 rounded-lg text-xs font-bold transition-all duration-300">Vote Now</button>
                     </div>
                  </div>
               ))}
           </div>
        </div>
      )
    },
    {
      title: "Smart Finances",
      desc: "Track donations and expenses with total transparency. Categorize spending, capture receipts, and keep your committee informed.",
      icon: IndianRupee,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      mockup: (
         <div className="w-full aspect-video bg-emerald-50/10 rounded-xl shadow-2xl border border-emerald-100/50 overflow-hidden relative group">
            {/* Background Grid & Decor */}
            <div className="absolute inset-0 bg-[radial-gradient(#10b98108_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            {/* Central Stats Hub */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="relative flex flex-col items-center">
                  {/* Glowing background for central focus */}
                  <div className="absolute inset-x-[-60px] inset-y-[-60px] bg-emerald-100/20 blur-3xl rounded-full animate-pulse z-0"></div>
                  
                  {/* Center Balance Circle */}
                  <div className="w-48 h-48 rounded-full bg-white shadow-2xl border border-emerald-100 flex flex-col items-center justify-center relative z-10 transform transition-transform hover:scale-110 duration-500 hover:shadow-emerald-200/50">
                     <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Balance</div>
                     <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight animate-[slideUp_0.5s_ease-out]">₹ 2,15,400</div>
                     <div className="mt-2 px-3 py-1 bg-emerald-50 rounded-full text-[10px] font-bold text-emerald-600 flex items-center gap-1 animate-pulse">
                        <CheckCircle2 className="w-3 h-3" /> Safe to Spend
                     </div>
                  </div>

                  {/* Satellite Stats Row (Donations & Expenses) */}
                  <div className="flex gap-12 -mt-6 relative z-20">
                     <div className="bg-white p-4 rounded-2xl shadow-xl border border-emerald-50 min-w-[140px] transform -rotate-2 hover:rotate-0 transition-all duration-500 hover:shadow-emerald-200/20 group/stat">
                        <div className="text-[10px] text-emerald-600 font-bold uppercase mb-1 flex justify-between items-center">
                           Amount
                           <Plus className="w-3 h-3 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-xl font-bold text-slate-800">₹ 3,00,000</div>
                        <div className="mt-1 h-1 w-full bg-emerald-50 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-400 w-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                     </div>
                     <div className="bg-white p-4 rounded-2xl shadow-xl border border-orange-50 min-w-[140px] transform rotate-2 hover:rotate-0 transition-all duration-500 hover:shadow-orange-200/20 group/stat">
                        <div className="text-[10px] text-orange-600 font-bold uppercase mb-1 flex justify-between items-center">
                           Expenses
                           <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                        </div>
                        <div className="text-xl font-bold text-slate-800">₹ 84,600</div>
                        <div className="mt-1 h-1 w-full bg-orange-50 rounded-full overflow-hidden">
                           <div className="h-full bg-orange-400 w-[28%]"></div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Bottom Accent: Recent Activity Snippets */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-30 opacity-30 group-hover:opacity-60 transition-opacity duration-700">
                <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/50 shadow-sm flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                   <div className="text-[9px] font-bold text-slate-600">Donation received</div>
                </div>
                <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/50 shadow-sm flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                   <div className="text-[9px] font-bold text-slate-600">New expense logged</div>
                </div>
            </div>

            {/* Top Detail: Budget Bar */}
            <div className="absolute top-6 left-6 right-6">
               <div className="flex justify-between items-center mb-1.5 px-1">
                  <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest">2025 Budget Status</div>
                  <div className="text-[10px] font-bold text-emerald-600">Healthy</div>
               </div>
               <div className="w-full h-1 bg-slate-200/50 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500/80 w-[75%]"></div>
               </div>
            </div>
         </div>
      )
    },
    {
      title: "Public Gallery",
      desc: "Create a stunning public page for your festival. Share photos, daily updates, and event schedules without requiring anyone to log in.",
      icon: ImageIcon,
      color: "text-sky-500",
      bgColor: "bg-sky-500/10",
      mockup: (
        <div className="w-full aspect-video bg-slate-900 rounded-xl shadow-2xl border border-slate-800 overflow-hidden relative group">
           {/* Full Bg Image */}
           <div className="absolute inset-0 bg-[url('/images/showcase/ganesh.jpg')] bg-cover bg-center transition-transform duration-1000 group-hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
           </div>

           {/* Foreground Content */}
           <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
              <div className="flex items-end justify-between">
                  <div className="transform transition-transform duration-500 group-hover:translate-y-[-10px]">
                     <div className="flex gap-2 mb-3">
                        <span className="bg-red-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shadow-lg shadow-red-500/40 animate-pulse">Live Now</span>
                        <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold border border-white/10">452 Photos</span>
                     </div>
                     <h3 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">Ganesh Nimajjanam </h3>
                     <p className="text-white/80 text-sm max-w-md line-clamp-2 leading-relaxed">
                        Highlights from the grand immersion procession. Thank you all for making this a huge success!
                     </p>
                  </div>
                  <div className="flex items-center gap-3">
                     <button aria-label="View Events" className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110"><Calendar className="w-5 h-5"/></button>
                     <button aria-label="View Gallery" className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/40 hover:scale-110 hover:rotate-12"><ImageIcon className="w-5 h-5"/></button>
                  </div>
              </div>
           </div>
           
           {/* Floating Thumbnails */}
           <div className="absolute top-6 right-6 flex flex-col gap-3 perspective-500">
              {[
                 { img: '/images/showcase/rangoli1.jpg' },
                 { img: '/images/showcase/rangoli2.jpg' },
                 { img: '/images/showcase/rangoli3.jpg' }
              ].map((thumb, i) => (
                 <div key={i} className={cn("w-16 h-12 rounded-lg border-2 border-white/20 overflow-hidden shadow-2xl transform transition-all duration-500 group-hover:translate-x-0 translate-x-32 rotate-y-12 hover:rotate-y-0 hover:scale-110 cursor-pointer", i === 0 && "delay-100", i === 1 && "delay-200", i === 2 && "delay-300")}>
                    <img src={thumb.img} alt="" className="w-full h-full object-cover" />
                 </div>
              ))}
           </div>
        </div>
      )
    }
  ];

  return (
    <div ref={containerRef} className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
         <div className="text-center mb-24">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
               Powerful tools to manage every aspect of your festival, built for modern organizations.
            </p>
         </div>

         <div className="space-y-32">
            {features.map((feature, i) => {
               const isEven = i % 2 === 0;
               return (
                  <div key={i} className="feature-section flex flex-col md:flex-row items-center gap-12 md:gap-24">
                     {/* Text Side */}
                     <div className={cn("flex-1 space-y-6 feature-text", !isEven && "md:order-2")}>
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", feature.bgColor, feature.color)}>
                           <feature.icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-3xl md:text-4xl font-bold leading-tight">{feature.title}</h3>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                           {feature.desc}
                        </p>
                     </div>
                     
                     {/* Visual Side */}
                     <div className={cn("flex-1 w-full feature-visual perspective-1000", !isEven && "md:order-1")}>
                        <div className="relative transform transition-transform hover:scale-[1.02] duration-700 ease-out preserve-3d">
                           <div className={cn("absolute inset-0 bg-gradient-to-br blur-3xl opacity-20 -z-10 rounded-full", feature.color.replace('text-', 'bg-'))}></div>
                           {feature.mockup}
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
    </div>
  );
}

