import { Donation } from '@/lib/database';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, FileDown, Package, HandHelping } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface DonationCardProps {
  donation: Donation;
  onEdit: (donation: Donation) => void;
  onDelete: (id: string) => void;
  onReceipt?: (donation: Donation) => void;
  onAuthRequired: () => void;
  namePreference?: 'telugu' | 'english';
  className?: string;
}

export const DonationCard = ({ donation, onEdit, onDelete, onReceipt, onAuthRequired, namePreference = 'telugu', className }: DonationCardProps) => {
  const { isAuthenticated } = useOrganization();
  const { t, language } = useLanguage();

  const isEnglishPref = namePreference === 'english';
  const teluguName = donation.name?.trim() || '';
  const englishName = donation.name_english?.trim() || '';

  let primaryName = '';
  let secondaryName: string | null = null;

  if (isEnglishPref) {
    primaryName = englishName || teluguName;
    if (englishName && teluguName && englishName.toLowerCase() !== teluguName.toLowerCase()) {
      secondaryName = teluguName;
    }
  } else {
    primaryName = teluguName || englishName;
    if (teluguName && englishName && teluguName.toLowerCase() !== englishName.toLowerCase()) {
      secondaryName = englishName.toUpperCase();
    }
  }

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

  const displayType = donation.type === 'చందా' ? t('చందా', 'Chanda') : (donation.type || (donation.category === 'chanda' ? t('చందా', 'Chanda') : t('స్పాన్సర్‌షిప్', 'Sponsorship')));

  return (
    <Card className={cn(
      "bg-white/80 backdrop-blur-sm border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden",
      donation.category === 'sponsorship' ? "hover:border-purple-100" : "hover:border-blue-100",
      className
    )}>
      {/* Category Accent Line */}
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full",
        donation.category === 'sponsorship' ? "bg-purple-500" : "bg-blue-500"
      )} />

      <CardContent className="p-4 sm:p-5">
        <div className="flex justify-between items-start gap-3 mb-3">
          {/* Left: Both Language Names & Type */}
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
               <span className={cn(
                 "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                 donation.category === 'sponsorship' ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
               )}>
                 {displayType}
               </span>
               {donation.flat_no && (
                 <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
                   Flat: {donation.flat_no}
                 </span>
               )}
               {donation.amount === 0 && donation.donation_mode && (
                 <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                   {donation.donation_mode === 'goods' ? t('వస్తువులు', 'Goods') : t('సేవ', 'Service')}
                 </span>
               )}
             </div>
          </div>

          {/* Right: Amount, Mode & Date */}
          <div className="flex flex-col items-end shrink-0">
             {donation.amount > 0 ? (
               <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-500 tracking-tight">
                 ₹{donation.amount.toLocaleString('en-IN')}
               </p>
             ) : (
               <p className="text-lg font-bold text-purple-600 tracking-tight flex items-center gap-1.5 mt-1">
                 {donation.donation_mode === 'goods' ? <Package className="h-4 w-4" /> : <HandHelping className="h-4 w-4" />}
                 {donation.type}
               </p>
             )}
             <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
                {donation.donation_mode === 'cash' ? (donation.payment_method === 'upi' ? 'UPI' : 'CASH') : (donation.donation_mode?.toUpperCase() || 'CASH')}
             </span>
             <span className="text-[10px] font-bold text-muted-foreground mt-1">
                {donation.created_at ? new Date(donation.created_at).toLocaleDateString() : ''}
             </span>
          </div>
        </div>

        {isAuthenticated && (
          <div className="flex justify-between items-center pt-3 border-t border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1">
                  {onReceipt && donation.amount > 0 && (
                      <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onReceipt(donation)}
                          className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600"
                          title={t('రసీదు', 'Receipt')}
                      >
                          <FileDown className="h-3.5 w-3.5" />
                      </Button>
                  )}
                  <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleEdit}
                      className="h-8 w-8 rounded-full hover:bg-slate-100"
                  >
                      <Edit className="h-3.5 w-3.5 text-slate-600" />
                  </Button>
                  <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDelete}
                      className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600"
                  >
                      <Trash2 className="h-3.5 w-3.5" />
                  </Button>
              </div>
            </div>

            <div className="flex flex-col items-end ml-auto">
               {/* Status Badge */}
               {donation.amount === 0 ? (
                 <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-purple-50 text-purple-600 border border-purple-100">
                   {t('స్పాన్సర్ చేయబడింది', 'Sponsored')}
                 </span>
               ) : (donation.received_amount || 0) >= donation.amount ? (
                 <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                   {t('స్వీకరించబడింది', 'Received')}
                 </span>
               ) : (donation.received_amount || 0) > 0 ? (
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-amber-50 text-amber-600 border border-amber-100 mb-1">
                      {t('పాక్షికం', 'Partial')}
                    </span>
                    <span className="text-[10px] text-red-500 font-bold">
                      {t('బాకీ: ', 'Due: ')} ₹{(donation.amount - (donation.received_amount || 0)).toLocaleString()}
                    </span>
                 </div>
               ) : (
                  <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-100 mb-1">
                          {t('బాకీ', 'Pending')}
                      </span>
                      <span className="text-[10px] text-red-500 font-bold">
                          ₹{donation.amount.toLocaleString()} Due
                      </span>
                  </div>
               )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};