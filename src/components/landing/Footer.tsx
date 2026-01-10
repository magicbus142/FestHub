import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';
interface FooterProps {
  onStart: () => void;
}

export function Footer({ onStart }: FooterProps) {
  return (
    <footer className="bg-slate-950 text-white pt-24 pb-8 overflow-hidden relative">
       {/* Background Glows */}
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
      
       <div className="container mx-auto px-4 relative z-10">
         
         {/* Final CTA Section */}
         <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Ready to organize your next festival the <span className="text-primary">smart way</span>?
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              Create your organization in minutes. No complex setup. No technical skills required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={onStart}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg h-14 px-8 rounded-full shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.4)] transition-all"
              >
                Create Organization <LogIn className="ml-2 h-4 w-4" />
              </Button>
            </div>
         </div>

         <div className="border-t border-white/10 pt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 text-sm">
            <div className="text-center md:text-left">
                <AppLogo className="opacity-80 hover:opacity-100 transition-opacity" />
               <p>Festival management made simple.</p>
            </div>
            
            <div className="flex gap-8 font-medium">
               <a href="#" className="hover:text-white transition-colors">Features</a>
               <a href="#" className="hover:text-white transition-colors">Pricing</a>
               <a href="#" className="hover:text-white transition-colors">Demo</a>
               <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>

            <div className="text-slate-600">
               © 2026 FestHub. Built for communities ❤️
            </div>
         </div>
       </div>
    </footer>
  );
}
