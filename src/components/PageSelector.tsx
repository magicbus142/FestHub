import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Home, Receipt, Wallet, Image, Users, Vote } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PageOption = 'dashboard' | 'chandas' | 'expenses' | 'images' | 'organizers' | 'voting';

interface PageSelectorProps {
  value: PageOption[];
  onChange: (pages: PageOption[]) => void;
  label?: string;
}

const pages: { id: PageOption; name: string; description: string; icon: React.ElementType }[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Overview and summary',
    icon: Home
  },
  {
    id: 'chandas',
    name: 'Chandas (Donations)',
    description: 'Track donations',
    icon: Receipt
  },
  {
    id: 'expenses',
    name: 'Expenses',
    description: 'Track spending',
    icon: Wallet
  },
  {
    id: 'images',
    name: 'Images',
    description: 'Photo gallery',
    icon: Image
  },
  {
    id: 'voting',
    name: 'Voting',
    description: 'Competitions & Polls',
    icon: Vote
  }
];

export function PageSelector({ value, onChange, label = 'Select Pages to Show' }: PageSelectorProps) {
  const handleToggle = (pageId: PageOption) => {
    if (value.includes(pageId)) {
      // Don't allow removing all pages - keep at least one
      if (value.length > 1) {
        onChange(value.filter(p => p !== pageId));
      }
    } else {
      onChange([...value, pageId]);
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="space-y-2">
        {pages.map((page) => {
          const Icon = page.icon;
          const isChecked = value.includes(page.id);
          
          return (
            <div
              key={page.id}
              className={cn(
                "flex items-center space-x-4 p-4 rounded-2xl transition-all border border-transparent",
                isChecked ? "bg-primary/5 border-primary/10" : "hover:bg-muted/50"
              )}
            >
              <Checkbox
                id={page.id}
                checked={isChecked}
                onCheckedChange={() => handleToggle(page.id)}
                className="w-5 h-5 rounded-lg border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                isChecked ? "bg-background text-primary shadow-sm" : "bg-muted text-muted-foreground/40"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label
                  htmlFor={page.id}
                  className={cn(
                    "text-sm font-bold cursor-pointer transition-colors",
                    isChecked ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {page.name}
                </label>
                <p className="text-xs text-muted-foreground/60 leading-tight">{page.description}</p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        At least one page must be selected
      </p>
    </div>
  );
}
