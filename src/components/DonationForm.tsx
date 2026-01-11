import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Add Tabs
import { Donation, addDonation, updateDonation, type NameSuggestion, searchNameSuggestions } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { X, Plus, Trash2, Package, Coins, HandHelping, Wallet, CreditCard } from 'lucide-react';

interface DonationItem {
  type: string;
  amount: string;
  receivedAmount?: string;
  mode: 'cash' | 'goods' | 'service'; // Add mode to item
  paymentMethod?: 'cash' | 'upi';
}

interface DonationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donation?: Donation;
  onDonationSaved: () => void;
  selectedFestival?: {
    name: string;
    year: number;
  };
}

const sponsorshipTypes = ['విగరహం', 'ల్డడు', 'Day1-భోజనం', 'Day2-భోజనం', 'Day3-భోజనం', 'Day1-టిఫిన్', 'Day2-టిఫిన్', 'Day3-టిఫిన్'];

export const DonationForm = ({ open, onOpenChange, donation, onDonationSaved, selectedFestival }: DonationFormProps) => {
  const [nameTelugu, setNameTelugu] = useState(donation?.name || '');
  const [nameEnglish, setNameEnglish] = useState(donation?.name_english || '');
  
  // Initialize with correct mode
  const initialMode = donation?.donation_mode || 'cash';
  const [mode, setMode] = useState<'cash' | 'goods' | 'service'>(initialMode);

  const [donationItems, setDonationItems] = useState<DonationItem[]>(
    donation 
    ? [{ 
        type: donation.type, 
        amount: donation.amount.toString(), 
        receivedAmount: (donation.received_amount || 0).toString(), 
        mode: donation.donation_mode || 'cash',
        paymentMethod: donation.payment_method || 'cash'
      }] 
    : [{ type: 'చందా', amount: '', receivedAmount: '', mode: 'cash', paymentMethod: 'cash' }] // Default 'cash'
  );
  
  const [category, setCategory] = useState<'chanda' | 'sponsorship'>(donation?.category || 'chanda');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { currentOrganization } = useOrganization();

  // Suggestions state
  const [suggestions, setSuggestions] = useState<NameSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Sync state when editing
  useEffect(() => {
    if (open && donation) {
      setNameTelugu(donation.name || '');
      setNameEnglish(donation.name_english || '');
      setCategory(donation.category || 'chanda');
      setMode(donation.donation_mode || 'cash');
      setDonationItems([{ 
          type: donation.type, 
          amount: donation.amount.toString(),
          receivedAmount: (donation.received_amount || 0).toString(),
          mode: donation.donation_mode || 'cash'
      }]);
      setSuggestions([]);
      setShowSuggestions(false);
    }
    if (open && !donation) {
      // Reset for new entry
      setNameTelugu('');
      setNameEnglish('');
      setCategory('chanda');
      setMode('cash');
      setDonationItems([{ type: 'చందా', amount: '', receivedAmount: '', mode: 'cash' }]);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [open, donation]);

  // Handle Mode Change
  const handleModeChange = (newMode: 'cash' | 'goods' | 'service') => {
      setMode(newMode);
      
      // User Rule: "goods or service is sponsorships"
      if (newMode === 'goods' || newMode === 'service') {
          setCategory('sponsorship');
      }

      // Update all items to match mode
      const updated = donationItems.map(item => ({
          ...item,
          mode: newMode,
          // Fix: Clear type if switching to non-cash, or default to Chanda for cash
          type: newMode === 'cash' ? (item.type || 'చందా') : '', 
      }));
      setDonationItems(updated);
  };


  // Suggestions fetch (unchanged)
  useEffect(() => {
    const term = (nameEnglish || nameTelugu).trim();
    if (!term || term.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const handle = setTimeout(async () => {
        try {
            const res = await searchNameSuggestions(term);
            setSuggestions(res);
            setShowSuggestions(res.length > 0);
        } catch(e) {}
    }, 300);
    return () => clearTimeout(handle);
  }, [nameTelugu, nameEnglish]);

  const addDonationItem = () => {
    setDonationItems([...donationItems, { type: '', amount: '', receivedAmount: '', mode }]);
  };

  const removeDonationItem = (index: number) => {
    const newItems = [...donationItems];
    newItems.splice(index, 1);
    setDonationItems(newItems);
  };

  const updateDonationItem = (index: number, field: keyof DonationItem, value: string) => {
    const newItems = [...donationItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setDonationItems(newItems);
  };

  const applySuggestion = (s: NameSuggestion) => {
    setNameTelugu(s.name || '');
    setNameEnglish(s.name_english || '');
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!nameTelugu.trim() && !nameEnglish.trim()) {
        toast({ title: t("దోషం", "Error"), description: "Please enter a name", variant: "destructive" });
        return;
    }

    // Basic Validation
    for (const item of donationItems) {
        if (!item.type.trim()) {
            toast({ title: "Error", description: "Please enter Type / Item Name", variant: "destructive" });
            return;
        }
        // Amount validation only for CASH
        if (mode === 'cash') {
             if (isNaN(parseFloat(item.amount)) || parseFloat(item.amount) <= 0) {
                 toast({ title: "Error", description: "Invalid Amount", variant: "destructive" });
                 return;
             }
        }
    }

    setLoading(true);
    try {
        const prepareDonation = (item: DonationItem) => ({
            name: (nameTelugu || nameEnglish).trim(),
            name_english: nameEnglish.trim() || undefined,
            amount: parseFloat(item.amount) || 0, // Allow 0 for Goods/Service
            received_amount: parseFloat(item.receivedAmount || '0'), 
            type: item.type.trim(),
            category,
            donation_mode: mode,
            payment_method: item.paymentMethod || 'cash',
            festival_name: selectedFestival?.name || donation?.festival_name,
            festival_year: selectedFestival?.year || donation?.festival_year
        });

        // Debug logging
        const payload = prepareDonation(donationItems[0]);
        console.log("Saving Donation:", payload, "Org:", currentOrganization.id);

        if (donation?.id) {
            await updateDonation(donation.id, payload);
        } else {
             if (!currentOrganization?.id) {
                toast({ title: "Error", description: "Organization not found", variant: "destructive" });
                setLoading(false);
                return;
            }
            for (const item of donationItems) {
                await addDonation(prepareDonation(item), currentOrganization.id);
            }
        }
        
        toast({ title: t("విజయవంతం", "Success"), description: "Saved successfully" });
        onDonationSaved();
        onOpenChange(false);
    } catch(err: any) {
        console.error("Donation Save Error:", err);
        toast({ 
            title: "Error", 
            description: err.message || "Failed to save", 
            variant: "destructive" 
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {donation ? t('దానం ఎడిట్ చేయండి', 'Edit Donation') : t('కొత్త దానం జోడించండి', 'Add New Donation')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
           
           {/* Donation Mode Selector */}
           <div className="bg-slate-100 p-1 rounded-lg">
               <Tabs value={mode} onValueChange={(v) => handleModeChange(v as any)} className="w-full">
                   <TabsList className="grid w-full grid-cols-3">
                       <TabsTrigger value="cash" className="gap-2">
                           <Coins className="w-4 h-4" /> {t('నగదు', 'Cash')}
                       </TabsTrigger>
                       <TabsTrigger value="goods" className="gap-2">
                           <Package className="w-4 h-4" /> {t('వస్తువులు', 'Goods')}
                       </TabsTrigger>
                       <TabsTrigger value="service" className="gap-2">
                           <HandHelping className="w-4 h-4" /> {t('సేవ', 'Service')}
                       </TabsTrigger>
                   </TabsList>
               </Tabs>
           </div>

           {/* Name Inputs (Unchanged) */}
           <div className="space-y-2">
             <Label>{t('పేరు', 'Name')}</Label>
             <div className="grid grid-cols-2 gap-2 relative">
                 <Input 
                     value={nameTelugu} 
                     onChange={e => setNameTelugu(e.target.value)} 
                     placeholder="తెలుగు పేరు"
                     onFocus={() => suggestions.length && setShowSuggestions(true)}
                 />
                 <Input 
                     value={nameEnglish} 
                     onChange={e => setNameEnglish(e.target.value)} 
                     placeholder="English Name" 
                     onFocus={() => suggestions.length && setShowSuggestions(true)}
                 />
                 {showSuggestions && suggestions.length > 0 && (
                     <div className="absolute z-50 top-full w-full bg-white border rounded shadow-lg">
                         {suggestions.map((s, i) => (
                             <div key={i} className="p-2 hover:bg-slate-100 cursor-pointer" onClick={() => applySuggestion(s)}>
                                 {s.name} <span className="text-xs text-slate-500">{s.name_english}</span>
                             </div>
                         ))}
                     </div>
                 )}
             </div>
           </div>

           {/* Items List */}
           <div className="space-y-3">
               <div className="flex justify-between items-center">
                   <Label>{t('వివరాలు', 'Details')}</Label>
                   {!donation && <Button type="button" size="sm" variant="ghost" onClick={addDonationItem}><Plus className="w-4 h-4" /></Button>}
               </div>

               {donationItems.map((item, index) => (
                   <div key={index} className="p-3 border rounded-md bg-slate-50 space-y-3 relative">
                       {donationItems.length > 1 && (
                           <button type="button" onClick={() => removeDonationItem(index)} className="absolute top-2 right-2 text-red-500" title={t("తీసివేయు", "Remove Item")}>
                               <Trash2 className="w-4 h-4"/>
                               <span className="sr-only">{t("తీసివేయు", "Remove Item")}</span>
                           </button>
                       )}

                       {/* Conditional Input based on Mode */}
                       {/* If Cash -> Show Dropdown or Text? User said "Enter value instead of dropdown". So we permit text. */}
                       <div className="space-y-1">
                           <Label className="text-xs">
                               {mode === 'cash' ? t('రకం (చందా / స్పాన్సర్‌షిప్)', 'Type') : 
                                mode === 'goods' ? t('వస్తువు పేరు', 'Item Name (e.g. Rice 25kg)') :
                                t('సేవ రకం', 'Service Type (e.g. Decoration)')}
                           </Label>
                           {/* Combobox logic: Input that lists suggestions but allows custom text */}
                           <div className="relative">
                               <Input 
                                   value={item.type}
                                   onChange={(e) => updateDonationItem(index, 'type', e.target.value)}
                                   placeholder={mode === 'cash' ? "చందా" : mode === 'goods' ? "Rice 25kg" : "Decoration work"}
                                   list={`types-${index}`} // Uses datalist for suggestions
                               />
                               {/* Only show suggestions for Cash mode or if we had predefined goods */}
                               {mode === 'cash' && (
                                   <datalist id={`types-${index}`}>
                                       <option value="చందా" />
                                       {sponsorshipTypes.map(t => <option key={t} value={t} />)}
                                   </datalist>
                               )}
                           </div>
                       </div>

                        {/* Amount Field */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">
                                    {mode === 'cash' ? t('మొత్తం (₹)', 'Amount (₹)') : t('విలువ (ఐచ్ఛికం)', 'Est. Value (Optional)')}
                                </Label>
                                <Input 
                                    type="number" 
                                    value={item.amount} 
                                    onChange={e => updateDonationItem(index, 'amount', e.target.value)} 
                                    placeholder="0"
                                />
                            </div>
                            
                            <div className="space-y-1">
                                <Label className="text-xs">{t('చెల్లింపు విధానం', 'Payment Method')}</Label>
                                <Select 
                                    value={item.paymentMethod || 'cash'} 
                                    onValueChange={(v) => updateDonationItem(index, 'paymentMethod', v)}
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">
                                            <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-600"/> Cash</div>
                                        </SelectItem>
                                        <SelectItem value="upi">
                                            <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-600"/> UPI / Online</div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {mode === 'cash' && (
                            <div className="space-y-1 mt-2">
                                <div className="flex justify-between">
                                    <Label className="text-xs text-emerald-600">{t('వసూలు (₹)', 'Received (₹)')}</Label>
                                </div>
                                <Input 
                                    type="number" 
                                    value={item.receivedAmount} 
                                    onChange={e => updateDonationItem(index, 'receivedAmount', e.target.value)} 
                                    className="border-emerald-200"
                                />
                                {(() => {
                                    const amt = parseFloat(item.amount) || 0;
                                    const rcv = parseFloat(item.receivedAmount || '0') || 0;
                                    const pending = amt - rcv;
                                    if (amt > 0 && pending > 0) {
                                        return <div className="text-xs text-red-500 text-right font-medium">Pending: ₹{pending}</div>
                                    }
                                    return null;
                                })()}
                            </div>
                        )}
                   </div>
               ))}
           </div>

           <div className="flex gap-3">
               <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>{t('రద్దు', 'Cancel')}</Button>
               <Button type="submit" className="flex-1 bg-gradient-festive text-white" disabled={loading}>
                   {loading ? 'Saving...' : 'Save'}
               </Button>
           </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
