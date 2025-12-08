import { useLanguage } from '@/contexts/LanguageContext';
import { useFestival } from '@/contexts/FestivalContext';
import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { BarChart3, Receipt, Users, ArrowLeft, Image } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getTotalByFestival } from '@/lib/database';
import { getTotalExpensesByFestival } from '@/lib/expenses';
import { getImages } from '@/lib/images';
import { YearBadge } from '@/components/YearBadge';
import { PageHeader } from '@/components/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { ChandasPreview } from '@/components/ChandasPreview';
import { ExpensesPreview } from '@/components/ExpensesPreview';
import { ImagesPreview } from '@/components/ImagesPreview';
import { BackButton } from '@/components/BackButton';

export default function Dashboard() {
  const { t, language, setLanguage } = useLanguage();
  const {
    selectedFestival
  } = useFestival();
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const {
    isAuthenticated
  } = useAuth();
  
  const orgPath = currentOrganization ? `/org/${currentOrganization.slug}` : '/';

  // Redirect to festival selection if no festival selected
  useEffect(() => {
    if (!selectedFestival) {
      navigate(orgPath);
    }
  }, [selectedFestival, navigate, orgPath]);
  const [isPrevDialogOpen, setIsPrevDialogOpen] = useState(false as boolean);
  const [prevInput, setPrevInput] = useState('' as string);
  const [editingCardType, setEditingCardType] = useState<'chandas' | 'expenses' | 'images' | null>(null);

  // Previous amounts per festival and card type
  const [previousAmounts, setPreviousAmounts] = useState<Record<string, Record<string, number>>>({});

  // Load previous amounts from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('previous_amounts');
      if (stored) {
        setPreviousAmounts(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Get previous amount for specific festival and card type
  const getPreviousAmount = (cardType: 'chandas' | 'expenses' | 'images') => {
    if (!selectedFestival) return 0;
    const festivalKey = `${selectedFestival.name}-${selectedFestival.year}`;
    return previousAmounts[festivalKey]?.[cardType] || 0;
  };

  // Save previous amount for specific festival and card type
  const savePreviousAmount = (cardType: 'chandas' | 'expenses' | 'images', value: number) => {
    if (!selectedFestival) return;

    const festivalKey = `${selectedFestival.name}-${selectedFestival.year}`;
    const updatedAmounts = {
      ...previousAmounts,
      [festivalKey]: {
        ...previousAmounts[festivalKey],
        [cardType]: value
      }
    };

    setPreviousAmounts(updatedAmounts);
    try {
      localStorage.setItem('previous_amounts', JSON.stringify(updatedAmounts));
    } catch {}
  };

  // Calculate balance using per-card previous amounts
  const chandasPrev = getPreviousAmount('chandas');
  const expensesPrev = getPreviousAmount('expenses');
  const imagesPrev = getPreviousAmount('images');

  const {
    data: totalDonations = 0
  } = useQuery({
    queryKey: ['total-donations-festival', selectedFestival?.name, selectedFestival?.year],
    queryFn: () => selectedFestival ? getTotalByFestival(selectedFestival.name, selectedFestival.year, 'chanda') : 0,
    enabled: !!selectedFestival
  });
  const {
    data: totalExpenses = 0
  } = useQuery({
    queryKey: ['total-expenses-festival', selectedFestival?.name, selectedFestival?.year],
    queryFn: () => selectedFestival ? getTotalExpensesByFestival(selectedFestival.name, selectedFestival.year) : 0,
    enabled: !!selectedFestival
  });
  const {
    data: totalImages = 0
  } = useQuery({
    queryKey: ['total-images', selectedFestival?.name, selectedFestival?.year],
    queryFn: async () => {
      if (!selectedFestival) return 0;
      const images = await getImages(selectedFestival.name, selectedFestival.year);
      return images.length;
    },
    enabled: !!selectedFestival
  });
  const dashboardCards = [{
    title: t('చందాలు', 'Chandas'),
    description: t('చందా నిర్వహణ (స్పాన్సర్‌షిప్ వేరు)', 'Manage Chanda (sponsorships separate)'),
    icon: BarChart3,
    path: '/chandas',
    value: `₹${totalDonations.toLocaleString()}`,
    color: 'text-blue-600'
  }, {
    title: t('ఖర్చులు', 'Expenses'),
    description: t('ఖర్చుల రికార్డ్ మరియు ట్రాకింగ్', 'Track and record expenses'),
    icon: Receipt,
    path: '/expenses',
    value: `₹${totalExpenses.toLocaleString()}`,
    color: 'text-red-600'
  }, {
    title: t('చిత్రాలు', 'Images'),
    description: t('ఫోటోలు మరియు చిత్రాలను అప్‌లోడ్ చేయండి', 'Upload and manage photos'),
    icon: Image,
    path: '/images',
    value: `${totalImages} ${t('చిత్రాలు', 'images')}`,
    color: 'text-green-600'
  }];
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* Header */}
        <PageHeader
          pageName="Dashboard"
          pageNameTelugu="డాష్‌బోర్డ్"
        >
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(orgPath)}
              className="flex items-center gap-2 hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('ఉత్సవాలు', 'Festivals')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === 'telugu' ? 'english' : 'telugu')}
              className="px-3"
            >
              {language === 'telugu' ? 'EN' : 'తె'}
            </Button>
          </div>
        </PageHeader>

        {/* Quick Stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('సంక్షిప్త గణాంకాలు', 'Quick Status')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-blue-600 leading-tight">
                  ₹{totalDonations.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t('మొత్తం చందాలు (చందా మాత్రమే)', 'Total Amount (Chandas)')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-red-600 leading-tight">
                  ₹{totalExpenses.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t('మొత్తం ఖర్చులు', 'Total Expenses')}
                </p>
              </div>
              <div className="text-center">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <p className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                    ₹{chandasPrev.toLocaleString()}
                  </p>
                  {isAuthenticated && <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => {
                  setPrevInput(String(chandasPrev || 0));
                  setEditingCardType('chandas');
                  setIsPrevDialogOpen(true);
                }}>
                      {t('సవరించు', 'Edit')}
                    </Button>}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t('మునుపటి చందాలు', 'Previous amountChandas')}
                </p>
              </div>
              <div className="text-center sm:col-span-2 md:col-span-1">
                <p className="text-2xl sm:text-3xl font-bold text-green-600 leading-tight">
                  ₹{(totalDonations + chandasPrev - totalExpenses - expensesPrev).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t('మిగిలిన మొత్తం', 'Balance')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Previous Amount Dialog */}
        <Dialog open={isPrevDialogOpen} onOpenChange={setIsPrevDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCardType === 'chandas' && t('మునుపటి చందాల మొత్తాన్ని సవరించు', 'Edit Previous Chandas Amount')}
                {editingCardType === 'expenses' && t('మునుపటి ఖర్చుల మొత్తాన్ని సవరించు', 'Edit Previous Expenses Amount')}
                {editingCardType === 'images' && t('మునుపటి చిత్రాల మొత్తాన్ని సవరించు', 'Edit Previous Images Amount')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input type="number" value={prevInput} onChange={e => setPrevInput(e.target.value)} placeholder={t('మొత్తం', 'Amount')} />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsPrevDialogOpen(false)}>
                  {t('రద్దు', 'Cancel')}
                </Button>
                <Button onClick={() => {
                const val = Number(prevInput);
                if (!Number.isFinite(val)) return;
                savePreviousAmount(editingCardType!, val);
                setIsPrevDialogOpen(false);
              }}>
                  {t('సేవ్', 'Save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit allowed only when logged in; no auth dialog shown */}

        {/* Module Previews */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          <ChandasPreview />
          <ExpensesPreview />
          <ImagesPreview />
        </div>

        {/* Navigation */}
        <Navigation />
      </div>
    </div>;
}
