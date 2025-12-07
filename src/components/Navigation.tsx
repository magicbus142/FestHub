import { Home, Receipt, Image, BarChart3, Settings, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export const Navigation = () => {
  const { t } = useLanguage();
  const { currentOrganization, isAuthenticated } = useOrganization();
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide/show navigation on scroll for mobile
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
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
  }, []);

  const orgPrefix = currentOrganization ? `/org/${currentOrganization.slug}` : '';

  const navItems = [
    {
      path: `${orgPrefix}/dashboard`,
      icon: Home,
      label: t('డాష్‌బోర్డ్', 'Dashboard'),
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
      label: t('చిత్రాలు', 'Images'),
      requiresAuth: false
    },
    {
      path: `${orgPrefix}/preferences`,
      icon: SlidersHorizontal,
      label: t('ప్రాధాన్యతలు', 'Preferences'),
      requiresAuth: false
    },
    {
      path: `${orgPrefix}/settings`,
      icon: Settings,
      label: t('సెట్టింగ్‌లు', 'Settings'),
      requiresAuth: true
    }
  ];

  // Filter items based on authentication
  const visibleNavItems = navItems.filter(item => !item.requiresAuth || isAuthenticated);

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border transition-transform duration-300 ease-in-out lg:fixed lg:top-4 lg:left-1/2 lg:transform lg:-translate-x-1/2 lg:bottom-auto lg:border lg:rounded-xl lg:w-auto lg:shadow-lg md:relative md:bottom-auto md:border-0 md:bg-transparent z-50 ${
      isVisible ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'
    }`}>
      <div className="flex items-center justify-around md:justify-start md:gap-2 p-2 md:p-0 lg:bg-card lg:px-4 lg:py-3">
        {/* Organization Logo */}
        {currentOrganization?.logo_url && (
          <div 
            className="hidden lg:flex items-center gap-2 pr-3 mr-3 border-r border-border cursor-pointer"
            onClick={() => navigate(`/org/${currentOrganization.slug}`)}
          >
            <img 
              src={currentOrganization.logo_url} 
              alt={currentOrganization.name}
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="text-sm font-semibold text-foreground max-w-[120px] truncate">
              {currentOrganization.name}
            </span>
          </div>
        )}
        
        {/* Navigation Items */}
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isRootDashboard = item.path === '/dashboard' && location.pathname === '/';
          const isSamePath = location.pathname === item.path;
          const isChildPath = location.pathname.startsWith(item.path + '/');
          const isActive = isRootDashboard || isSamePath || isChildPath;

          return (
            <Button
              key={item.path}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col md:flex-row items-center gap-1 md:gap-2 h-auto py-2.5 px-3 md:px-4 min-w-0 transition-all duration-200 hover:scale-105 active:scale-95 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
              <span className="text-xs md:text-sm font-medium truncate">{item.label}</span>
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary-foreground rounded-full lg:hidden" />
              )}
            </Button>
          );
        })}
      </div>
    </nav>
  );
};