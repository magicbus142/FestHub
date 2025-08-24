import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Donation, SponsorshipType, ChandaType, addDonation, updateDonation } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface DonationFormProps {
  isOpen: boolean;
  onClose: () => void;
  donation?: Donation;
  onSave: () => void;
}

const sponsorshipTypes: SponsorshipType[] = ['విగ్రహం', 'లాడు', 'భోజనం', 'టిఫిన్'];
const chandaTypes: ChandaType[] = ['చందా', 'విఘ్రహందాత', 'ప్రసాదం', 'వస్త్రం', 'పుష్పం', 'ఇతర'];

export const DonationForm = ({ isOpen, onClose, donation, onSave }: DonationFormProps) => {
  const [name, setName] = useState(donation?.name || '');
  const [amount, setAmount] = useState(donation?.amount?.toString() || '');
  const [type, setType] = useState(donation?.type || '');
  const [category, setCategory] = useState<'chanda' | 'sponsorship'>(donation?.category || 'chanda');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !amount || !type) {
      toast({
        title: "దోషం",
        description: "దయచేసి అన్ని ఫీల్డులను పూరించండి",
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
          title: "విజయవంతం",
          description: "దానం విజయవంతంగా అప్డేట్ చేయబడింది"
        });
      } else {
        await addDonation(donationData);
        toast({
          title: "విజయవంతం",
          description: "కొత్త దానం విజయవంతంగా జోడించబడింది"
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
        title: "దోషం",
        description: "దానం సేవ్ చేయడంలో దోషం",
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
            {donation ? 'దానం ఎడిట్ చేయండి' : 'కొత్త దానం జోడించండి'}
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
              వర్గం
            </Label>
            <Select value={category} onValueChange={(value: 'chanda' | 'sponsorship') => {
              setCategory(value);
              setType(''); // Reset type when category changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder="వర్గం ఎంచుకోండి" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="chanda">చందాలు / Chandas</SelectItem>
                <SelectItem value="sponsorship">స్పాన్సర్‌షిప్స్ / Sponsorships</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground font-medium">
              పేరు
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="దాత పేరు"
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground font-medium">
              మొత్తం (₹)
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
              రకం
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="రకం ఎంచుకోండి" />
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
              రద్దు చేయండి
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-festive hover:opacity-90 text-white font-medium"
              disabled={loading}
            >
              {loading ? 'సేవ్ చేస్తోంది...' : donation ? 'అప్డేట్ చేయండి' : 'జోడించండి'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};