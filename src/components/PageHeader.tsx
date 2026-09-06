import { useOrganization } from '@/contexts/OrganizationContext';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { LogOut, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const orgPath = currentOrganization ? `/org/${currentOrganization.slug}` : '/';

  const displayTitle = title || titleTelugu || '';
  const displayDescription = description || descriptionTelugu || null;

  return (
    <header className="flex items-center justify-between gap-3 py-2 border-b border-slate-200/50 dark:border-slate-800/50 mb-4 sm:mb-6">
      {/* Left: Icon Back Button + Title Block */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {showBack && (
          <BackButton
            to={backTo}
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all shrink-0 shadow-2xs"
          />
        )}

        <div className="min-w-0 flex-1">
          {displayTitle && (
            <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug truncate">
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

      {/* Right: Actions Toolbar */}
      {showActions && (
        <div className="flex items-center gap-1.5 shrink-0">
          {children}

          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                logout();
                navigate(orgPath);
              }}
              className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-red-50 text-red-500 transition-colors shadow-2xs lg:hidden"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : onAuthOpen ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onAuthOpen}
              className="h-9 w-9 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors shadow-2xs lg:hidden"
              title="Login"
            >
              <Lock className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      )}
    </header>
  );
}