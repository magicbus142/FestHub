import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';

interface BackButtonProps {
  to?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  emphasis?: boolean;
  label?: string;
  iconOnly?: boolean;
}

export const BackButton = ({
  to,
  className = '',
  variant = 'outline',
  size = 'default',
  emphasis = false,
  label,
  iconOnly = false,
}: BackButtonProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();

  // Default to organization page if no destination specified
  const destination = to || (currentOrganization ? `/org/${currentOrganization.slug}` : '/');

  const isIconOnly = iconOnly || size === 'icon';

  const themeClasses = emphasis
    ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15'
    : '';

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => navigate(destination)}
      className={`flex items-center justify-center font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${themeClasses} ${className}`}
      aria-label={t('ఉత్సవాలకు తిరిగి వెళ్లండి', 'Go back')}
      title={t('వెనుకకు', 'Go Back')}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      {!isIconOnly && (
        <>
          <span className="hidden sm:inline">
            {label || t('ఉత్సవాలు', 'Festivals')}
          </span>
          <span className="sm:hidden">
            {t('తిరిగి', 'Back')}
          </span>
        </>
      )}
    </Button>
  );
};
