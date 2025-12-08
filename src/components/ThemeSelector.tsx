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
      <div className="grid grid-cols-2 gap-3">
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            className={cn(
              "relative flex flex-col items-center p-3 rounded-lg border-2 transition-all",
              value === theme.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="flex gap-1 mb-2">
              {theme.colors.map((color, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border border-border/50"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{theme.name}</span>
            <span className="text-xs text-muted-foreground">{theme.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
