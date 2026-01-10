import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export type ThemeOption = 'classic' | 'modern' | 'festive' | 'elegant';

interface ThemeSelectorProps {
  value: ThemeOption;
  onChange: (theme: ThemeOption) => void;
  label?: string;
}

const themes: { id: ThemeOption; name: string; colors: string[]; description: string }[] = [
  {
    id: 'classic',
    name: 'Classic',
    colors: ['hsl(25, 95%, 53%)', 'hsl(43, 96%, 56%)', 'hsl(0, 0%, 98%)'],
    description: 'Traditional warm colors'
  },
  {
    id: 'modern',
    name: 'Modern',
    colors: ['hsl(221, 83%, 53%)', 'hsl(262, 83%, 58%)', 'hsl(0, 0%, 98%)'],
    description: 'Clean blue & purple'
  },
  {
    id: 'festive',
    name: 'Festive',
    colors: ['hsl(340, 82%, 52%)', 'hsl(25, 95%, 53%)', 'hsl(43, 96%, 56%)'],
    description: 'Vibrant celebration'
  },
  {
    id: 'elegant',
    name: 'Elegant',
    colors: ['hsl(270, 50%, 40%)', 'hsl(45, 80%, 50%)', 'hsl(0, 0%, 15%)'],
    description: 'Sophisticated gold & purple'
  }
];

export function ThemeSelector({ value, onChange, label = 'Select Theme' }: ThemeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-4">
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            className={cn(
              "relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all group",
              value === theme.id
                ? "border-primary bg-primary/5"
                : "border-border bg-background hover:border-primary/50"
            )}
          >
            <div className="flex -space-x-2 mb-3">
              {theme.colors.map((color, i) => {
                const colorClass = color === 'hsl(25, 95%, 53%)' ? 'bg-[#f58021]' :
                                 color === 'hsl(43, 96%, 56%)' ? 'bg-[#f5b821]' :
                                 color === 'hsl(0, 0%, 98%)' ? 'bg-[#fafafa]' :
                                 color === 'hsl(221, 83%, 53%)' ? 'bg-[#1d63ed]' :
                                 color === 'hsl(262, 83%, 58%)' ? 'bg-[#823cf3]' :
                                 color === 'hsl(340, 82%, 52%)' ? 'bg-[#ec1b5c]' :
                                 color === 'hsl(270, 50%, 40%)' ? 'bg-[#663399]' :
                                 color === 'hsl(45, 80%, 50%)' ? 'bg-[#cca31a]' :
                                 color === 'hsl(0, 0%, 15%)' ? 'bg-[#262626]' : '';
                return (
                  <div
                    key={i}
                    className={cn("w-8 h-8 rounded-full border-2 border-background shadow-sm", colorClass)}
                  />
                );
              })}
            </div>
            <span className={cn(
              "text-sm font-bold transition-colors",
              value === theme.id ? "text-foreground" : "text-muted-foreground"
            )}>
              {theme.name}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 font-medium">{theme.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
