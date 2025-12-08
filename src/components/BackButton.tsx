import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';

interface BackButtonProps {
  to?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  emphasis?: boolean;
  label?: string;
}

export const BackButton = ({
  to,
  className = '',
  variant = 'outline',
  size = 'default',
  emphasis = false,
  label,
}: BackButtonProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();

  // Default to organization page if no destination specified
  const destination = to || (currentOrganization ? `/org/${currentOrganization.slug}` : '/');

  const themeClasses = emphasis
    ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15'
    : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-secondary-foreground/20 hover:border-secondary-foreground/40';

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => navigate(destination)}
      className={`flex items-center gap-2 font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg ${themeClasses} ${className}`}
      aria-label={t('ఉత్సవాలకు తిరిగి వెళ్లండి', 'Go back to festivals')}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">
        {label || t('ఉత్సవాలు', 'Festivals')}
      </span>
      <span className="sm:hidden">
        {t('తిరిగి', 'Back')}
      </span>
    </Button>
  );
};
