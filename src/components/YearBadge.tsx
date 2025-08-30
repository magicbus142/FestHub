import { useYear } from '@/contexts/YearContext';

export const YearBadge = () => {
  const { year } = useYear();
  return (
    <span className="inline-flex items-center rounded-md bg-muted text-muted-foreground px-2 py-0.5 text-xs font-medium mt-1">
      {year}
    </span>
  );
};
