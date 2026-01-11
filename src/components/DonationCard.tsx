import { Donation } from '@/lib/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Lock } from 'lucide-react';
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
    <Card className={`bg-card border-border hover:shadow-festive transition-all duration-200 ${className}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-lg">{displayName}</h3>
            {donation.category === 'chanda' && (
              <p className="text-festival-orange text-xl font-bold">₹{donation.amount.toLocaleString('en-IN')}</p>
            )}
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                {!isAuthenticated && (
                  <TooltipContent>
                    <p>{t('సవరించడానికి లాగిన్ అవసరం', 'Login required to edit')}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                {!isAuthenticated && (
                  <TooltipContent>
                    <p>{t('తొలగించడానికి లాగిన్ అవసరం', 'Login required to delete')}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            {/* Receipt Button */}
            <Button
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 hover:bg-blue-50 text-muted-foreground hover:text-blue-600"
                onClick={() => onReceipt && onReceipt(donation)}
             >
                <div style={{ // Using explicit import or icon here? 
                            // Lucide import check: we need FileDown.
                }}>
                  {/* FileDown from Lucide needs to be imported, assume FileDown is not imported yet in this file */}
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-down"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
                </div>
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
             <span className="text-muted-foreground text-sm bg-accent px-2 py-1 rounded-full">
               {donation.type}
              </span>
              {/* Status Badge */}
             {(donation.received_amount || 0) >= donation.amount ? (
               <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                 {t('స్వీకరించబడింది', 'Received')}
               </span>
             ) : (donation.received_amount || 0) > 0 ? (
               <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                  {t('పాక్షికం', 'Partial')}
               </span>
             ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                  {t('బాకీ', 'Pending')}
               </span>
             )}
          </div>
          <div className="text-right">
             <span className="text-xs text-muted-foreground block">
                {donation.category === 'chanda' ? t('చందా', 'Chanda') : t('స్పాన్సర్‌షిప్', 'Sponsorship')}
             </span>
             {/* Show pending amount if any */}
             {(donation.amount - (donation.received_amount || 0)) > 0 && (
                 <span className="text-xs text-red-500 font-semibold">
                    {t('బాకీ: ', 'Pending: ')} ₹{(donation.amount - (donation.received_amount || 0)).toLocaleString()}
                 </span>
             )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};