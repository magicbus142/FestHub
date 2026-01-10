import { ReactNode } from 'react';
import { Navigation } from '@/components/Navigation';
import { SideNavigation } from '@/components/SideNavigation';
import { useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const { slug } = useParams();

  // Determine if we should show navigation
  // FestivalSelection is at /org/:slug/ without the trailing slash too
  const isFestivalSelection = location.pathname === `/org/${slug}` || location.pathname === `/org/${slug}/`;
  const showNavigation = !isFestivalSelection;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden transition-colors duration-500">
      {/* Decorative Blur Elements for Premium Feel */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <main className={`flex-1 relative z-10 transition-all duration-300 ${showNavigation ? 'pb-24 lg:pb-8 lg:pl-64' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {showNavigation && (
        <>
            <div className="z-50 lg:hidden">
            <Navigation />
            </div>
            <SideNavigation />
        </>
      )}
    </div>
  );
};
