import { useLanguage } from '@/contexts/LanguageContext';
import { useFestival } from '@/contexts/FestivalContext';
import { YearBadge } from '@/components/YearBadge';

interface PageHeaderProps {
  pageName: string;
  pageNameTelugu: string;
  description?: string;
  descriptionTelugu?: string;
  children?: React.ReactNode;
}

export function PageHeader({ 
  pageName, 
  pageNameTelugu, 
  description, 
  descriptionTelugu,
  children 
}: PageHeaderProps) {
  const { t } = useLanguage();
  const { selectedFestival } = useFestival();

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
            {selectedFestival?.name} • {t(pageNameTelugu, pageName)}
          </h1>
        </div>
        {(description || descriptionTelugu) && (
          <p className="text-muted-foreground mt-1 md:mt-2">
            {t(descriptionTelugu || '', description || '')}
          </p>
        )}
        <YearBadge />
      </div>
      {children && (
        <div className="w-full md:w-auto flex items-center flex-wrap gap-2">
          {children}
        </div>
      )}
    </div>
  );
}