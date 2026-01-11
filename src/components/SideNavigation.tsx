import { Home, Receipt, Image, BarChart3, Settings, Vote, Menu } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFestival } from '@/contexts/FestivalContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export const SideNavigation = () => {
  const { t } = useLanguage();
  const { currentOrganization, isAuthenticated, allowedPages } = useOrganization();
  const { selectedFestival } = useFestival();
  const navigate = useNavigate();
  const location = useLocation();

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
      label: t('చిత్రాలు', 'Gallery'),
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
    // 1. Check Auth Requirement
    if (item.requiresAuth && !isAuthenticated) return false;
    
    // 2. Check Festival Requirement
    // @ts-ignore
    if (item.requiresFestival && !selectedFestival) return false;

    // 3. Check Shared Link Page Restrictions (allowedPages from context) - ONLY IF NOT AUTHENTICATED
    if (!isAuthenticated && allowedPages && Array.isArray(allowedPages)) {
       const pageMap: Record<string, string> = {
         'dashboard': 'dashboard',
         'chandas': 'chandas', 
         'expenses': 'expenses',
         'images': 'images',
         'voting': 'voting'
       };
       const routeName = item.path.split('/').pop();
       if (routeName && pageMap[routeName]) {
          if (!allowedPages.includes(pageMap[routeName])) {
              return false;
          }
       }
    }

    // 4. Check Database Settings (Festival enabled_pages)
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
    <div className="hidden lg:flex flex-col w-64 border-r border-border/40 min-h-screen bg-card/30 backdrop-blur-xl fixed left-0 top-0 bottom-0 z-40">
      <div className="p-6 pb-2">
        <motion.div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate(`/org/${currentOrganization?.slug}`)}
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            {currentOrganization?.logo_url && (
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl group-hover:bg-primary/30 transition-colors" />
                    <img 
                        src={currentOrganization.logo_url} 
                        alt={currentOrganization.name}
                        className="w-10 h-10 rounded-xl object-cover relative z-10 shadow-sm transition-transform group-hover:scale-105"
                    />
                </div>
            )}
            <div className="flex flex-col">
                <h2 className="font-black text-lg tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70 group-hover:from-primary group-hover:to-primary/80 transition-all">
                    {currentOrganization?.name || 'Festival Manager'}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                        Admin Console
                    </span>
                </div>
            </div>
        </motion.div>
      </div>

      <ScrollArea className="flex-1 py-6 px-4">
        <div className="space-y-1.5">
            {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isRootDashboard = item.path === '/dashboard' && location.pathname === '/';
            const isSamePath = location.pathname === item.path;
            const isChildPath = location.pathname.startsWith(item.path + '/');
            const isActive = isRootDashboard || isSamePath || isChildPath;

            return (
                <Button
                    key={item.path}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                        "w-full justify-start gap-3 h-11 relative overflow-hidden transition-all duration-300",
                        isActive 
                            ? "bg-primary/10 text-primary hover:bg-primary/15 font-semibold shadow-sm" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                    onClick={() => navigate(item.path)}
                >
                    {isActive && (
                        <motion.div
                            layoutId="sidebar-active-indicator"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                        />
                    )}
                    <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground/70")} />
                    <span className="truncate">{item.label}</span>
                </Button>
            );
            })}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/40 bg-muted/10">
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/5">
                <p className="text-xs font-medium text-muted-foreground mb-1">{t('ప్రస్తుత పండుగ', 'Current Festival')}</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-semibold text-sm truncate max-w-[140px]">
                        {selectedFestival?.name || 'Select Festival'}
                    </span>
                </div>
          </div>
      </div>
    </div>
  );
};
