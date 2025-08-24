import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Donation, SponsorshipType, ChandaType, addDonation, updateDonation } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { X } from 'lucide-react';

interface DonationFormProps {
  isOpen: boolean;
  onClose: () => void;
  donation?: Donation;
  onSave: () => void;
}

const sponsorshipTypes: SponsorshipType[] = ['విగ్రహం', 'లాడు', 'Day1-భోజనం', 'Day2-భోజనం', 'Day3-భోజనం', 'Day1-టిఫిన్', 'Day2-టిఫిన్', 'Day3-టిఫిన్'];
const chandaTypes: ChandaType[] = ['చందా', 'విఘ్రహందాత', 'ప్రసాదం', 'వస్త్రం', 'పుష్పం', 'ఇతర'];

export const DonationForm = ({ isOpen, onClose, donation, onSave }: DonationFormProps) => {
  const [name, setName] = useState(donation?.name || '');
  const [amount, setAmount] = useState(donation?.amount?.toString() || '');
  const [type, setType] = useState(donation?.type || '');
  const [category, setCategory] = useState<'chanda' | 'sponsorship'>(donation?.category || 'chanda');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !amount || !type) {
      toast({
        title: t("దోషం", "Error"),
        description: t("దయచేసి అన్ని ఫీల్డులను పూరించండి", "Please fill all fields"),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const donationData = {
        name: name.trim(),
        amount: parseFloat(amount),
        type,
        category
      };

      if (donation?.id) {
        await updateDonation(donation.id, donationData);
        toast({
          title: t("విజయవంతం", "Success"),
          description: t("దానం విజయవంతంగా అప్డేట్ చేయబడింది", "Donation updated successfully")
        });
      } else {
        await addDonation(donationData);
        toast({
          title: t("విజయవంతం", "Success"),
          description: t("కొత్త దానం విజయవంతంగా జోడించబడింది", "New donation added successfully")
        });
      }
      
      onSave();
      onClose();
      setName('');
      setAmount('');
      setType('');
      setCategory('chanda');
    } catch (error) {
      toast({
        title: t("దోషం", "Error"),
        description: t("దానం సేవ్ చేయడంలో దోషం", "Error saving donation"),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setName('');
    setAmount('');
    setType('');
    setCategory('chanda');
  };

  const getTypeOptions = () => {
    return category === 'sponsorship' ? sponsorshipTypes : chandaTypes;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader className="relative">
          <DialogTitle className="text-festival-blue text-xl font-bold text-center">
            {donation ? t('దానం ఎడిట్ చేయండి', 'Edit Donation') : t('కొత్త దానం జోడించండి', 'Add New Donation')}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-6 w-6 p-0"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-foreground font-medium">
              {t('వర్గం', 'Category')}
            </Label>
            <Select value={category} onValueChange={(value: 'chanda' | 'sponsorship') => {
              setCategory(value);
              setType(''); // Reset type when category changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder={t("వర్గం ఎంచుకోండి", "Select category")} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="chanda">{t('చందాలు', 'Chandas')}</SelectItem>
                <SelectItem value="sponsorship">{t('స్పాన్సర్‌షిప్స్', 'Sponsorships')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground font-medium">
              {t('పేరు', 'Name')}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("దాత పేరు", "Donor name")}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground font-medium">
              {t('మొత్తం (₹)', 'Amount (₹)')}
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-foreground font-medium">
              {t('రకం', 'Type')}
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder={t("రకం ఎంచుకోండి", "Select type")} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {getTypeOptions().map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              {t('రద్దు చేయండి', 'Cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-festive hover:opacity-90 text-white font-medium"
              disabled={loading}
            >
              {loading ? t('సేవ్ చేస్తోంది...', 'Saving...') : donation ? t('అప్డేట్ చేయండి', 'Update') : t('జోడించండి', 'Add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};