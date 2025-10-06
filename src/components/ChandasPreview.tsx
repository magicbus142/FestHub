import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFestival } from '@/contexts/FestivalContext';
import { useQuery } from '@tanstack/react-query';
import { getDonationsByFestival } from '@/lib/database';
import { useNavigate } from 'react-router-dom';

export function ChandasPreview() {
  const { t } = useLanguage();
  const { selectedFestival } = useFestival();
  const navigate = useNavigate();

  const { data: donations = [] } = useQuery({
    queryKey: ['donations-preview', selectedFestival?.name, selectedFestival?.year, 'chanda'],
    queryFn: () => selectedFestival ? getDonationsByFestival(selectedFestival.name, selectedFestival.year, 'chanda') : [],
    enabled: !!selectedFestival,
  });

  const recentDonations = donations.slice(0, 3);
  const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
  const totalCount = donations.length;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            {t('చందాలు', 'Chandas')}
          </CardTitle>
          <CardDescription>
            {t('చందా నిర్వహణ', 'Manage Chanda donations')}
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/chandas')}
        >
          {t('అన్నీ చూడండి', 'View All')}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-blue-600">
                ₹{totalAmount.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('మొత్తం చందా', 'Total Amount')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-600">
                {totalCount}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('దాతలు', 'Donors')}
              </p>
            </div>
          </div>

          {/* Recent Donations */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {t('ఇటీవలి చందాలు', 'Recent Donations')}
            </h4>
            {recentDonations.length > 0 ? (
              <div className="space-y-2">
                {recentDonations.map((donation) => (
                  <div key={donation.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{donation.name}</p>
                      <p className="text-xs text-muted-foreground">{donation.type}</p>
                    </div>
                    <p className="font-semibold text-blue-600">
                      ₹{donation.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('చందాలు లేవు', 'No donations yet')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
