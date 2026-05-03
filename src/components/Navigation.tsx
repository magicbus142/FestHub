import { Home, Receipt, Image, BarChart3, Settings, Vote, MoreHorizontal, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFestival } from '@/contexts/FestivalContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

export const Navigation = () => {
  const { t } = useLanguage();
  const { currentOrganization, isAuthenticated, allowedPages } = useOrganization();
  const { selectedFestival } = useFestival();
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
            setIsMoreMenuOpen(false); // Auto-close menu on scroll
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

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreMenuOpen]);

  const orgPrefix = currentOrganization ? `/org/${currentOrganization.slug}` : '';

  const navItems = [
    {
      path: `${orgPrefix}/dashboard`,
      icon: Home,
      label: t('డాష్‌బోర్డ్', 'Home'),
      requiresAuth: false,
      isPrimary: true
    },
    {
      path: `${orgPrefix}/chandas`,
      icon: BarChart3,
      label: t('చందాలు', 'Chandas'),
      requiresAuth: false,
      isPrimary: true
    },
    {
      path: `${orgPrefix}/expenses`,
      icon: Receipt,
      label: t('ఖర్చులు', 'Expenses'),
      requiresAuth: false,
      isPrimary: true
    },
    {
      path: `${orgPrefix}/images`,
      icon: Image,
      label: t('చిత్రాలు', 'Images'),
      requiresAuth: false,
      isPrimary: true
    },
    {
      path: `${orgPrefix}/voting`,
      icon: Vote,
      label: t('ఓటింగ్', 'Voting'),
      requiresAuth: false,
      isPrimary: false
    },
    {
      path: `${orgPrefix}/settings`,
      icon: Settings,
      label: t('సెట్టింగ్‌లు', 'Settings'),
      requiresAuth: true,
      isPrimary: false
    }
  ];

  // Logic to determine visible items and categorize them
  const filterItem = (item: any) => {
    if (item.requiresAuth && !isAuthenticated) return false;
    // @ts-ignore
    if (item.requiresFestival && !selectedFestival) return false;

    // Fixed internal page keys for database checks
    const keyMap: Record<string, string> = {
      'dashboard': 'dashboard',
      'chandas': 'chandas',
      'expenses': 'expenses',
      'images': 'images',
      'voting': 'voting'
    };

    const routeName = item.path.split('/').pop();

    // Shared Link Page Restrictions
    if (allowedPages && Array.isArray(allowedPages)) {
       if (routeName && keyMap[routeName] && !allowedPages.includes(keyMap[routeName])) {
          return false;
       }
    }

    // Database Settings (Festival enabled_pages)
    if (selectedFestival?.enabled_pages && Array.isArray(selectedFestival.enabled_pages)) {
       if (routeName && keyMap[routeName] && !selectedFestival.enabled_pages.includes(keyMap[routeName])) {
          return false;
       }
    }
    return true;
  };

  const visibleNavItems = navItems.filter(filterItem);
  const primaryVisible = visibleNavItems.filter(item => item.isPrimary);
  const secondaryVisible = visibleNavItems.filter(item => !item.isPrimary);

  const isSecondaryActive = secondaryVisible.some(item => 
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  );

  return (
    <div className="lg:hidden">
      {/* More Menu Overlay */}
      <AnimatePresence>
        {isMoreMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-colors"
              onClick={() => setIsMoreMenuOpen(false)}
            />
            <motion.div
              ref={menuRef}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-24 left-4 right-4 z-50 bg-background/95 backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl p-4 max-w-sm mx-auto"
            >
              <div className="flex items-center justify-between mb-4 border-b border-primary/10 pb-3">
                <h3 className="font-bold text-primary flex items-center gap-2">
                  <MoreHorizontal className="h-4 w-4" />
                  {t('మరిన్ని', 'More Options')}
                </h3>
                <button 
                  onClick={() => setIsMoreMenuOpen(false)} 
                  className="p-1 hover:bg-primary/10 rounded-full transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {secondaryVisible.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsMoreMenuOpen(false);
                      }}
                      aria-label={item.label}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl gap-2 transition-all duration-300 pointer-events-auto",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                          : "bg-primary/5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      )}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs font-bold truncate w-full text-center">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
          initial={{ y: 100 }}
          animate={{ y: isVisible ? 0 : 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
      >
        <div className={cn(
            "pointer-events-auto flex items-center justify-between p-2 rounded-full w-full max-w-[420px]",
            "bg-white border-2 border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
            "dark:bg-slate-900 dark:border-slate-800"
        )}>
          {primaryVisible.map((item) => {
            const Icon = item.icon;
            const isSamePath = location.pathname === item.path;
            const isChildPath = location.pathname.startsWith(item.path + '/');
            const isActive = isSamePath || isChildPath;

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsMoreMenuOpen(false);
                }}
                aria-label={item.label}
                className={cn(
                  "relative flex flex-col items-center justify-center h-14 flex-1 rounded-full transition-all duration-300 group outline-none",
                  isActive ? "text-primary font-black" : "text-slate-500 hover:text-foreground dark:text-slate-400"
                )}
              >
                  {isActive && (
                      <motion.div
                          layoutId="nav-pill"
                          className="absolute inset-0 bg-primary/10 rounded-full"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                  )}
                  
                  <span className="relative z-10 flex flex-col items-center">
                      <Icon className={cn("h-6 w-6", isActive && "scale-110")} />
                      <span className="text-[10px] font-black uppercase tracking-tight mt-1 opacity-100 truncate max-w-[65px]">
                          {item.label}
                      </span>
                  </span>
              </button>
            );
          })}

          {/* More Toggle */}
          {secondaryVisible.length > 0 && (
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              aria-label="More menu"
              className={cn(
                "relative flex flex-col items-center justify-center h-14 flex-1 rounded-full transition-all duration-300 group outline-none",
                isMoreMenuOpen || isSecondaryActive ? "text-primary font-black" : "text-slate-500 hover:text-foreground dark:text-slate-400"
              )}
            >
                {(isMoreMenuOpen || isSecondaryActive) && (
                    <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-primary/10 rounded-full"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
                <span className="relative z-10 flex flex-col items-center">
                    <MoreHorizontal className={cn("h-6 w-6 transition-transform", isMoreMenuOpen && "rotate-90")} />
                    <span className="text-[10px] font-black uppercase tracking-tight mt-1 opacity-100">
                        {t('మరిన్ని', 'More')}
                    </span>
                </span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
