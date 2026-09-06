import { Expense } from '@/lib/expenses';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  namePreference?: 'telugu' | 'english';
  className?: string;
}

export const ExpenseCard = ({ expense, onEdit, onDelete, namePreference = 'telugu', className }: ExpenseCardProps) => {
  const { isAuthenticated } = useOrganization();
  const { t } = useLanguage();

  const isEnglishPref = namePreference === 'english';
  const teluguType = expense.type?.trim() || '';
  const englishType = expense.type_english?.trim() || '';

  let primaryName = '';
  let secondaryName: string | null = null;

  if (isEnglishPref) {
    primaryName = englishType || teluguType;
    if (englishType && teluguType && englishType.toLowerCase() !== teluguType.toLowerCase()) {
      secondaryName = teluguType;
    }
  } else {
    primaryName = teluguType || englishType;
    if (teluguType && englishType && teluguType.toLowerCase() !== englishType.toLowerCase()) {
      secondaryName = englishType.toUpperCase();
    }
  }

  return (
    <Card className={cn(
      "bg-white/80 backdrop-blur-sm border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden",
      "hover:border-red-100",
      className
    )}>
      {/* Left Red Accent Line */}
      <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />

      <CardContent className="p-4 sm:p-5">
        <div className="flex justify-between items-start gap-3 mb-2">
          {/* Left: Primary Name, Secondary Name & Type Badge */}
          <div className="flex flex-col min-w-0 flex-1">
             <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl break-words leading-tight">
               {primaryName}
             </h3>
             {secondaryName && (
               <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wide truncate mt-0.5">
                 {secondaryName}
               </p>
             )}
             <div className="flex items-center gap-2 mt-2 flex-wrap">
               <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-100">
                 {t('ఖర్చు', 'Expense')}
               </span>
             </div>
          </div>

          {/* Right: Amount & Date */}
          <div className="flex flex-col items-end shrink-0">
             <p className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight">
               ₹{expense.amount.toLocaleString('en-IN')}
             </p>
             <span className="text-[10px] font-bold text-muted-foreground mt-1">
                {expense.created_at ? new Date(expense.created_at).toLocaleDateString() : ''}
             </span>
          </div>
        </div>

        {/* Description if available */}
        {expense.description && (
          <p className="text-xs sm:text-sm text-slate-600 mt-2 italic bg-slate-50 p-2.5 rounded-xl border-l-2 border-red-300">
            {expense.description}
          </p>
        )}

        {/* Action Buttons (Authenticated only) */}
        {isAuthenticated && (
          <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-100">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(expense)}
                className="h-8 w-8 rounded-full hover:bg-slate-100"
                title={t('సవరించు', 'Edit')}
              >
                <Edit2 className="h-3.5 w-3.5 text-slate-600" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600"
                    title={t('తొలగించు', 'Delete')}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-slate-600 hover:text-red-600" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl border-none p-6">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-extrabold text-slate-800">
                      {t('ఖర్చు తొలగించు', 'Delete Expense')}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm font-medium text-slate-500">
                      {t('మీరు ఈ ఖర్చును తొలగించాలని ఖచ్చితంగా అనుకుంటున్నారా? ఈ చర్య రద్దు చేయబడదు.', 'Are you sure you want to delete this expense? This action cannot be undone.')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-4 gap-2">
                    <AlertDialogCancel className="rounded-xl border-none bg-slate-100 font-bold">
                      {t('రద్దు', 'Cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => expense.id && onDelete(expense.id)}
                      className="bg-red-600 text-white hover:bg-red-700 rounded-xl font-bold"
                    >
                      {t('తొలగించు', 'Delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
