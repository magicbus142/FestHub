import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, TrendingDown, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFestival } from '@/contexts/FestivalContext';
import { useQuery } from '@tanstack/react-query';
import { getExpensesByFestival } from '@/lib/expenses';
import { useNavigate } from 'react-router-dom';

export function ExpensesPreview() {
  const { t } = useLanguage();
  const { selectedFestival } = useFestival();
  const navigate = useNavigate();

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses-preview', selectedFestival?.name, selectedFestival?.year],
    queryFn: () => selectedFestival ? getExpensesByFestival(selectedFestival.name, selectedFestival.year) : [],
    enabled: !!selectedFestival,
  });

  const recentExpenses = expenses.slice(0, 3);
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalCount = expenses.length;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-red-600" />
            {t('ఖర్చులు', 'Expenses')}
          </CardTitle>
          <CardDescription>
            {t('ఖర్చుల రికార్డ్', 'Track expenses')}
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('expenses')}
        >
          {t('అన్నీ చూడండి', 'View All')}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-red-600">
                ₹{totalAmount.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('మొత్తం ఖర్చు', 'Total Expenses')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-orange-600">
                {totalCount}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('ఖర్చుల రికార్డ్‌లు', 'Records')}
              </p>
            </div>
          </div>

          {/* Recent Expenses */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {t('ఇటీవలి ఖర్చులు', 'Recent Expenses')}
            </h4>
            {recentExpenses.length > 0 ? (
              <div className="space-y-2">
                {recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{expense.type}</p>
                      {expense.description && (
                        <p className="text-xs text-muted-foreground">{expense.description}</p>
                      )}
                    </div>
                    <p className="font-semibold text-red-600">
                      ₹{expense.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('ఖర్చులు లేవు', 'No expenses yet')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}