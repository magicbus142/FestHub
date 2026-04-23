import { Donation } from '@/lib/database';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Lock, FileDown, Package, HandHelping } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const { t } = useLanguage();

  const displayName = namePreference === 'english'
    ? (donation.name_english || donation.name)
    : (donation.name || donation.name_english);

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
        <div className="flex flex-col mb-4">
           <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                donation.category === 'sponsorship' ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
              )}>
                {donation.category === 'chanda' ? t('చందా', 'Chanda') : t('స్పాన్సర్‌షిప్', 'Sponsorship')}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">
                 {donation.created_at ? new Date(donation.created_at).toLocaleDateString() : ''}
              </span>
           </div>
          <h3 className="font-bold text-foreground text-lg break-words leading-tight mb-1">{displayName}</h3>
          {donation.amount > 0 ? (
            <p className="text-2xl font-black text-slate-900 tracking-tight">₹{donation.amount.toLocaleString('en-IN')}</p>
          ) : (
            <p className="text-lg font-bold text-slate-600 tracking-tight flex items-center gap-2 mt-1">
              {donation.donation_mode === 'goods' ? <Package className="h-4 w-4 text-purple-500" /> : <HandHelping className="h-4 w-4 text-purple-500" />}
              {donation.type}
            </p>
          )}
        </div>

        <div className="flex justify-between items-end pt-3 border-t border-slate-50 flex-wrap gap-4">
          <div className="flex items-center gap-3">
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
                  {donation.amount === 0 ? t('రకం', 'Mode') : 'Type'}
                </span>
                <span className="text-sm font-semibold text-slate-700">
                   {donation.amount === 0 ? (donation.donation_mode === 'goods' ? t('వస్తువులు', 'Goods') : t('సేవ', 'Service')) : donation.type}
                </span>
             </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
             {isAuthenticated && (
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
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
             )}

             <div className="flex flex-col items-end">
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
        </div>
      </CardContent>
    </Card>
  );
};