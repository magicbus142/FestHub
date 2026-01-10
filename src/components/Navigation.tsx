import { Home, Receipt, Image, BarChart3, Settings, Vote } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFestival } from '@/contexts/FestivalContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export const Navigation = () => {
  const { t } = useLanguage();
  const { currentOrganization, isAuthenticated } = useOrganization();
  const { selectedFestival } = useFestival();
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Smart hide on scroll for mobile
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          // Hide only on substantial downward scroll, show immediately on up
          if (currentScrollY > lastScrollY && currentScrollY > 50) {
            setIsVisible(false);
          } else {
            setIsVisible(true);
          }
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const orgPrefix = currentOrganization ? `/org/${currentOrganization.slug}` : '';

  const navItems = [
    {
      path: `${orgPrefix}/dashboard`,
      icon: Home,
      label: t('డాష్‌బోర్డ్', 'Home'),
      requiresAuth: false
    },
    {
      path: `${orgPrefix}/chandas`,
      icon: BarChart3,
      label: t('చందాలు', 'Chandas'),
      requiresAuth: false
    },
    {
      path: `${orgPrefix}/expenses`,
      icon: Receipt,
      label: t('ఖర్చులు', 'Expenses'),
      requiresAuth: false
    },
    {
      path: `${orgPrefix}/images`,
      icon: Image,
      label: t('చిత్రాలు', 'Gallery'), // Shortened label
      requiresAuth: false
    },
    {
      path: `${orgPrefix}/voting`,
      icon: Vote,
      label: t('ఓటింగ్', 'Voting'),
      requiresAuth: false
    },
    {
      path: `${orgPrefix}/settings`,
      icon: Settings,
      label: t('సెట్టింగ్‌లు', 'Settings'),
      requiresAuth: true
    }
  ];

  // Logic to determine visible items
  const visibleNavItems = navItems.filter(item => {
    if (item.requiresAuth && !isAuthenticated) return false;
    // @ts-ignore
    if (item.requiresFestival && !selectedFestival) return false;

    if (selectedFestival?.enabled_pages && Array.isArray(selectedFestival.enabled_pages)) {
       const pageMap: Record<string, string> = {
         'dashboard': 'dashboard',
         'chandas': 'chandas', 
         'expenses': 'expenses',
         'images': 'images',
         'voting': 'voting'
       };
       const routeName = item.path.split('/').pop();
       if (routeName && pageMap[routeName]) {
          // @ts-ignore
          if (!selectedFestival.enabled_pages.includes(pageMap[routeName])) {
              return false;
          }
       }
    }
    return true;
  });

  return (
    <motion.nav
        initial={{ y: 100 }}
        animate={{ y: isVisible ? 0 : 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 w-full md:bottom-6 md:left-1/2 md:right-auto md:w-auto md:max-w-[95vw] md:-translate-x-1/2 lg:hidden"
    >
      <div className={cn(
          "flex items-center justify-around md:justify-center md:gap-1 p-3 md:p-2",
          "bg-background/85 backdrop-blur-xl border-t border-white/20 dark:border-white/10 shadow-2xl",
          "md:rounded-full md:border",
          "supports-[backdrop-filter]:bg-background/60"
      )}>
        {currentOrganization?.logo_url && (
            <motion.div 
                className="hidden md:flex items-center pl-2 pr-4 mr-2 border-r border-white/20 cursor-pointer"
                onClick={() => navigate(`/org/${currentOrganization.slug}`)}
                whileHover={{ scale: 1.05 }}
            >
            <div className="relative w-7 h-7">
                <div className="absolute inset-0 bg-primary/20 blur-sm rounded-md" />
                <img 
                    src={currentOrganization.logo_url} 
                    alt={currentOrganization.name}
                    className="w-full h-full rounded-md object-cover relative z-10"
                />
            </div>
            </motion.div>
        )}

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isRootDashboard = item.path === '/dashboard' && location.pathname === '/';
          const isSamePath = location.pathname === item.path;
          const isChildPath = location.pathname.startsWith(item.path + '/');
          const isActive = isRootDashboard || isSamePath || isChildPath;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center px-4 py-2 min-w-[64px] rounded-full transition-all duration-300 group outline-none",
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
                {isActive && (
                    <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-primary rounded-full shadow-lg"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
                
                <span className="relative z-10 flex flex-col items-center gap-0.5">
                    <Icon className={cn("h-5 w-5", isActive && "scale-110 transition-transform")} />
                    <span className="text-[10px] font-medium leading-none opacity-90">
                        {item.label}
                    </span>
                </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
};
