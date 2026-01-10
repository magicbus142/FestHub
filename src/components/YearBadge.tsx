import { useYear } from '@/contexts/YearContext';

interface YearBadgeProps {
  year?: number;
}

export const YearBadge = ({ year: propYear }: YearBadgeProps) => {
  const { year: contextYear } = useYear();
  const displayYear = propYear || contextYear;

  return (
    <span className="inline-flex items-center rounded-md bg-muted text-muted-foreground px-2 py-0.5 text-xs font-medium mt-1">
      {displayYear}
    </span>
  );
};
