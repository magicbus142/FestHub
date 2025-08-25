import { Home, Receipt, Image, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export const Navigation = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseAuth();

  const navItems = [
    { 
      path: '/dashboard', 
      icon: Home, 
      label: t('డాష్‌బోర్డ్', 'Dashboard') 
    },
    { 
      path: '/chandas', 
      icon: BarChart3, 
      label: t('చందాలు', 'Chandas') 
    },
    { 
      path: '/expenses', 
      icon: Receipt, 
      label: t('ఖర్చులు', 'Expenses') 
    },
    { 
      path: '/images', 
      icon: Image, 
      label: t('చిత్రాలు', 'Images') 
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:relative md:bottom-auto md:border-0 md:bg-transparent z-50">
      <div className="flex justify-around md:justify-start md:gap-4 p-2 md:p-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Button
              key={item.path}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(item.path)}
              className="flex flex-col md:flex-row items-center gap-1 md:gap-2 h-auto py-2 px-3 min-w-0"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-xs md:text-sm truncate">{item.label}</span>
            </Button>
          );
        })}
        {!user && (
          <Button variant={location.pathname === '/auth' ? 'default' : 'ghost'} size="sm" onClick={() => navigate('/auth')}>
            {t('లాగిన్', 'Login')}
          </Button>
        )}
      </div>
    </nav>
  );
};