import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Donation, SponsorshipType, ChandaType, addDonation, updateDonation, type NameSuggestion, searchNameSuggestions } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, Plus, Trash2 } from 'lucide-react';

interface DonationItem {
  type: string;
  amount: string;
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

const sponsorshipTypes: SponsorshipType[] = ['విగరహం', 'ల్డడు', 'Day1-భోజనం', 'Day2-భోజనం', 'Day3-భోజనం', 'Day1-టిఫిన్', 'Day2-టిఫిన్', 'Day3-టిఫిన్', 'ఇతర'];
const chandaTypes: ChandaType[] = ['చందా'];

export const DonationForm = ({ open, onOpenChange, donation, onDonationSaved, selectedFestival }: DonationFormProps) => {
  const [nameTelugu, setNameTelugu] = useState(donation?.name || '');
  const [nameEnglish, setNameEnglish] = useState(donation?.name_english || '');
  // Normalize legacy type labels
  const normalizeType = (t: string) => (t === 'ల్డడు పరసాదం' ? 'ల్డడు' : t);
  const [donationItems, setDonationItems] = useState<DonationItem[]>(
    donation ? [{ type: normalizeType(donation.type), amount: donation.amount.toString() }] : [{ type: '', amount: '' }]
  );
  const [category, setCategory] = useState<'chanda' | 'sponsorship'>(donation?.category || 'chanda');
  const [sponsorshipAmount, setSponsorshipAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Suggestions state
  const [suggestions, setSuggestions] = useState<NameSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState('');

  // When the dialog opens, ensure the form reflects the donation being edited
  useEffect(() => {
    if (open && donation) {
      setNameTelugu(donation.name || '');
      setNameEnglish(donation.name_english || '');
      setCategory(donation.category || 'chanda');
      setDonationItems([{ type: normalizeType(donation.type), amount: donation.amount.toString() }]);
      if ((donation.category || 'chanda') === 'sponsorship') {
        setSponsorshipAmount(donation.amount.toString());
      } else {
        setSponsorshipAmount('');
      }
      setSuggestions([]);
      setShowSuggestions(false);
    }
    if (open && !donation) {
      setNameTelugu('');
      setNameEnglish('');
      setCategory('chanda');
      setDonationItems([{ type: 'చందా', amount: '' }]);
      setSponsorshipAmount('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [open, donation]);

  // Debounced suggestions fetch based on either Telugu or English input
  useEffect(() => {
    const term = (nameEnglish || nameTelugu).trim();
    setSuggestionQuery(term);
    if (!term || term.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    const handle = setTimeout(async () => {
      try {
        const res = await searchNameSuggestions(term);
        setSuggestions(res);
        setShowSuggestions(res.length > 0);
      } catch (e) {
        // silent fail
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [nameTelugu, nameEnglish]);

  const addDonationItem = () => {
    const defaultType = category === 'chanda' ? 'చందా' : 'ఇతర';
    setDonationItems([...donationItems, { type: defaultType, amount: '' }]);
  };

  const removeDonationItem = (index: number) => {
    const newItems = [...donationItems];
    newItems.splice(index, 1);
    setDonationItems(newItems);
  };

  const updateDonationItem = (index: number, field: 'type' | 'amount', value: string) => {
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
    
    // Validate form
    if (!nameTelugu.trim() && !nameEnglish.trim()) {
      toast({
        title: t("దోషం", "Error"),
        description: t("దయచేసి కనీసం ఒక పేరును నమోదు చేయండి (తెలుగు లేదా ఇంగ్లీష్)", "Please enter at least one name (Telugu or English)"),
        variant: "destructive"
      });
      return;
    }

    // Validate donation items
    if (category === 'sponsorship') {
      // Validate types only
      for (let i = 0; i < donationItems.length; i++) {
        const item = donationItems[i];
        if (!item.type) {
          toast({
            title: t("దోషం", "Error"),
            description: t("దయచేసి స్పాన్సర్‌షిప్ రకాలు ఎంచుకోండి", "Please select sponsorship types"),
            variant: "destructive"
          });
          return;
        }
      }
    } else {
      for (let i = 0; i < donationItems.length; i++) {
        const item = donationItems[i];
        if (!item.type || !item.amount) {
          toast({
            title: t("దోషం", "Error"),
            description: t("దయచేసి అన్ని ఫీల్డులను పూరించండి", "Please fill all fields"),
            variant: "destructive"
          });
          return;
        }
        if (isNaN(parseFloat(item.amount)) || parseFloat(item.amount) <= 0) {
          toast({
            title: t("దోషం", "Error"),
            description: t("దయచేసి సరైన మొత్తం నమోదు చేయండి", "Please enter a valid amount"),
            variant: "destructive"
          });
          return;
        }
      }
    }

    setLoading(true);
    
    try {
      if (donation?.id) {
        // Editing a single existing record: use the first item only
        const first = donationItems[0];
        const donationData = {
          name: (nameTelugu || nameEnglish).trim(),
          name_english: nameEnglish.trim() || undefined,
          amount: category === 'sponsorship' ? 0 : parseFloat(first.amount),
          type: normalizeType(first.type),
          category,
          festival_name: selectedFestival?.name,
          festival_year: selectedFestival?.year
        };
        await updateDonation(donation.id, donationData);
      } else {
        // Creating: save each donation item as a separate record
        if (category === 'sponsorship') {
          for (const item of donationItems) {
            const donationData = {
              name: (nameTelugu || nameEnglish).trim(),
              name_english: nameEnglish.trim() || undefined,
              amount: 0,
              type: normalizeType(item.type),
              category,
              festival_name: selectedFestival?.name,
              festival_year: selectedFestival?.year
            };
            await addDonation(donationData);
          }
        } else {
          for (const item of donationItems) {
            const donationData = {
              name: (nameTelugu || nameEnglish).trim(),
              name_english: nameEnglish.trim() || undefined,
              amount: parseFloat(item.amount),
              type: normalizeType(item.type),
              category,
              festival_name: selectedFestival?.name,
              festival_year: selectedFestival?.year
            };
            await addDonation(donationData);
          }
        }
      }
      
      toast({
        title: t("విజయవంతం", "Success"),
        description: t("దానం(లు) విజయవంతంగా సేవ్ చేయబడ్డాయి", "Donation(s) saved successfully")
      });
      
      onDonationSaved();
      onOpenChange(false);
      setNameTelugu('');
      setNameEnglish('');
      setDonationItems([{ type: 'చందా', amount: '' }]);
      setCategory('chanda');
    } catch (error) {
      console.error('Error saving donation:', error);
      const message = (error as any)?.message || t("దానం సేవ్ చేయడంలో దోషం", "Error saving donation");
      toast({
        title: t("దోషం", "Error"),
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form on close
    setTimeout(() => {
      setNameTelugu('');
      setNameEnglish('');
      setDonationItems([{ type: 'చందా', amount: '' }]);
      setCategory('chanda');
      setSuggestions([]);
      setShowSuggestions(false);
    }, 300);
  };

  const getTypeOptions = () => {
    return category === 'sponsorship' ? sponsorshipTypes : chandaTypes;
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(open) => {
        // only reset when closing
        if (!open) handleClose();
      }}
    >
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader className="relative">
          <DialogTitle className="text-festival-blue text-xl font-bold text-center">
            {donation ? t('దానం ఎడిట్ చేయండి', 'Edit Donation') : t('కొత్త దానం జోడించండి', 'Add New Donation')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('దానం జోడించడానికి లేదా మార్చడానికి ఈ ఫారంని ఉపయోగించండి', 'Use this form to add or edit a donation')}
          </DialogDescription>
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
              // Reset donation items with sensible default type per category
              setDonationItems([{ type: value === 'chanda' ? 'చందా' : 'ఇతర', amount: '' }]);
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
            <Label className="text-foreground font-medium">
              {t('పేరు (తెలుగు / ఇంగ్లీష్‌లో కనీసం ఒకటి)', 'Name (at least one of Telugu/English)')}
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
              <div>
                <Label htmlFor="name_telugu" className="text-xs">{t('పేరు (తెలుగు)', 'Name (Telugu)')}</Label>
                <Input
                  id="name_telugu"
                  value={nameTelugu}
                  onChange={(e) => { setNameTelugu(e.target.value); }}
                  placeholder={t('ఉదా: రామయ్య', 'e.g., రామయ్య')}
                  className="bg-background border-border"
                  onFocus={() => suggestions.length && setShowSuggestions(true)}
                />
              </div>
              <div>
                <Label htmlFor="name_english" className="text-xs">{t('Name (English)', 'Name (English)')}</Label>
                <Input
                  id="name_english"
                  value={nameEnglish}
                  onChange={(e) => { setNameEnglish(e.target.value); }}
                  placeholder={t('e.g., Ramaiah', 'e.g., Ramaiah')}
                  className="bg-background border-border"
                  onFocus={() => suggestions.length && setShowSuggestions(true)}
                />
              </div>

              {/* Suggestions dropdown (spans both columns) */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 mt-1 w-full md:col-span-2 bg-popover border border-border rounded-md shadow-sm max-h-56 overflow-auto">
                  <ul className="divide-y divide-border">
                    {suggestions.map((s, idx) => (
                      <li key={idx}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted/60"
                          onClick={() => applySuggestion(s)}
                        >
                          <div className="text-sm font-medium">{s.name}</div>
                          {s.name_english && (
                            <div className="text-xs text-muted-foreground">{s.name_english}</div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-foreground font-medium">
                {t('దానాల వివరాలు', 'Donation Details')}
              </Label>
              {!donation && category === 'sponsorship' && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addDonationItem}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  {t('మరో దానం జోడించండి', 'Add Another')}
                </Button>
              )}
            </div>

            {category === 'sponsorship' ? (
              <>
                <Label className="text-xs">{t('రకాలు', 'Types')}</Label>
                <div className="flex flex-wrap gap-2">
                  {donationItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select
                        value={item.type}
                        onValueChange={(value) => updateDonationItem(index, 'type', value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder={t('ఎంచుకోండి', 'Select')} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {getTypeOptions().map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!donation && donationItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeDonationItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{t('తీసివేయి', 'Remove')}</span>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              donationItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5">
                    <Label htmlFor={`type-${index}`} className="text-xs">
                      {t('రకం', 'Type')}
                    </Label>
                    <Input
                      id={`type-${index}`}
                      value={t('చందా', 'Chanda')}
                      readOnly
                      className="bg-muted border-border text-muted-foreground"
                    />
                  </div>
                  <div className="col-span-5">
                    <Label htmlFor={`amount-${index}`} className="text-xs">
                      {t('మొత్తం (₹)', 'Amount (₹)')}
                    </Label>
                    <Input
                      id={`amount-${index}`}
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateDonationItem(index, 'amount', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="col-span-2">
                    {!donation && donationItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive"
                        onClick={() => removeDonationItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{t('తీసివేయి', 'Remove')}</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
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
