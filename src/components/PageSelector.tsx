import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Home, Receipt, Wallet, Image, Users } from 'lucide-react';

export type PageOption = 'dashboard' | 'chandas' | 'expenses' | 'images' | 'organizers';

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
    id: 'organizers',
    name: 'Organizers',
    description: 'Team members',
    icon: Users
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
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={page.id}
                checked={isChecked}
                onCheckedChange={() => handleToggle(page.id)}
              />
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <label
                  htmlFor={page.id}
                  className="text-sm font-medium cursor-pointer"
                >
                  {page.name}
                </label>
                <p className="text-xs text-muted-foreground">{page.description}</p>
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
