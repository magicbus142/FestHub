import { Donation } from '@/lib/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface DonationCardProps {
  donation: Donation;
  onEdit: (donation: Donation) => void;
  onDelete: (id: number) => void;
  onAuthRequired: () => void;
}

export const DonationCard = ({ donation, onEdit, onDelete, onAuthRequired }: DonationCardProps) => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const handleEdit = () => {
    if (isAuthenticated) {
      onEdit(donation);
    } else {
      onAuthRequired();
    }
  };

  const handleDelete = () => {
    if (isAuthenticated) {
      donation.id && onDelete(donation.id);
    } else {
      onAuthRequired();
    }
  };
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
              onClick={handleEdit}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              {isAuthenticated ? (
                <Edit className="h-4 w-4 text-festival-blue" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 w-8 p-0 hover:bg-destructive/10"
            >
              {isAuthenticated ? (
                <Trash2 className="h-4 w-4 text-destructive" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm bg-accent px-2 py-1 rounded-full">
            {donation.type}
          </span>
          <span className="text-xs text-muted-foreground">
            {donation.category === 'chanda' ? t('చందా', 'Chanda') : t('స్పాన్సర్‌షిప్', 'Sponsorship')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};