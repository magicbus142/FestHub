import { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { LogOut, Lock, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface PageHeaderProps {
  title?: string;
  titleTelugu?: string;
  description?: string;
  descriptionTelugu?: string;
  showBack?: boolean;
  backTo?: string;
  showActions?: boolean;
  onAuthOpen?: () => void;
  children?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  titleTelugu, 
  description, 
  descriptionTelugu,
  showBack = true,
  backTo,
  showActions = true,
  onAuthOpen,
  children 
}: PageHeaderProps) {
  const { currentOrganization, isAuthenticated, logout } = useOrganization();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 150) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const orgPath = currentOrganization ? `/org/${currentOrganization.slug}` : '/';

  const displayTitle = title || titleTelugu || '';
  const displayDescription = description || descriptionTelugu || null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 py-2.5 px-3 sm:px-4 -mx-3 sm:-mx-4 mb-4 sm:mb-6 transition-all duration-200 shadow-xs">
        <div className="flex items-center justify-between gap-2.5 max-w-7xl mx-auto">
          {/* Left: Icon Back Button + Title Block */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {showBack && (
              <BackButton
                to={backTo}
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/80 transition-all shrink-0 shadow-2xs"
              />
            )}

            <div 
              className="min-w-0 flex-1 cursor-pointer group select-none"
              onClick={scrollToTop}
              title={t('పైకి స్క్రోల్ చేయండి', 'Click to scroll to top')}
            >
              {displayTitle && (
                <h1 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {displayTitle}
                </h1>
              )}
              {displayDescription && (
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-none truncate mt-0.5">
                  {displayDescription}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions Toolbar & Auth (Signout / Login) */}
          {showActions && (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {children}

              {/* Scroll to top icon in header when scrolled */}
              {showScrollTop && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={scrollToTop}
                  className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-2xs"
                  title={t('పైకి వెళ్లండి', 'Scroll to Top')}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              )}

              {/* Signout / Login button */}
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout();
                    navigate(orgPath);
                  }}
                  className="h-9 px-2.5 sm:px-3 rounded-full border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/80 font-bold text-xs gap-1.5 transition-all shadow-2xs"
                  title={t('లాగ్‌అవుట్', 'Log Out')}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('లాగ్‌అవుట్', 'Log Out')}</span>
                </Button>
              ) : onAuthOpen ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAuthOpen}
                  className="h-9 px-2.5 sm:px-3 rounded-full border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/80 font-bold text-xs gap-1.5 transition-all shadow-2xs"
                  title={t('అడ్మిన్ లాగిన్', 'Admin Login')}
                >
                  <Lock className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('లాగిన్', 'Login')}</span>
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </header>

      {/* Floating Scroll-To-Top Button on Mobile when scrolled down */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 z-40 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 md:hidden"
          aria-label={t('పైకి వెళ్లండి', 'Scroll to top')}
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </>
  );
}