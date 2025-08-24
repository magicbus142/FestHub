import { Donation } from '@/lib/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface DonationCardProps {
  donation: Donation;
  onEdit: (donation: Donation) => void;
  onDelete: (id: number) => void;
}

export const DonationCard = ({ donation, onEdit, onDelete }: DonationCardProps) => {
  return (
    <Card className="bg-card border-border hover:shadow-festive transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-lg">{donation.name}</h3>
            <p className="text-festival-orange text-xl font-bold">₹{donation.amount.toLocaleString('en-IN')}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(donation)}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              <Edit className="h-4 w-4 text-festival-blue" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => donation.id && onDelete(donation.id)}
              className="h-8 w-8 p-0 hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm bg-accent px-2 py-1 rounded-full">
            {donation.type}
          </span>
          <span className="text-xs text-muted-foreground">
            {donation.category === 'chanda' ? 'చందా / Chanda' : 'స్పాన్సర్‌షిప్ / Sponsorship'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};