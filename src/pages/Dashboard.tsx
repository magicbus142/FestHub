import { useLanguage } from '@/contexts/LanguageContext';
import { useFestival } from '@/contexts/FestivalContext';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { BarChart3, Receipt, Users, ArrowLeft, Image, Wallet, ArrowUpRight } from 'lucide-react';
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
import { VotingPreview } from '@/components/VotingPreview';
import { BackButton } from '@/components/BackButton';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { PageOption } from '@/components/PageSelector';

export default function Dashboard() {
  const { t, language, setLanguage } = useLanguage();
  const {
    selectedFestival
  } = useFestival();
  const navigate = useNavigate();
  const { currentOrganization, allowedPages } = useOrganization();
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
    } catch { }
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
    } catch { }
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
    <div className="container mx-auto px-4 py-6">
      {/* Unified Header */}
      <div className="flex flex-col gap-4 mb-8">
        {/* Breadcrumbs Pill */}
        <div className="flex items-center gap-2 bg-slate-100/50 w-fit px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-slate-200/50">
          <span>Home</span>
          <span className="opacity-30">/</span>
          <span className="text-primary truncate max-w-[100px]">{selectedFestival?.name || 'Festival'}</span>
          <span className="opacity-30">/</span>
          <span className="text-foreground">Dashboard</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight mb-1">
              {selectedFestival?.name} {selectedFestival?.year}
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              {t('పండుగ అవలోకనం మరియు గణాంకాలు', 'Festival overview and statistics')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
              <BackButton
                variant="ghost"
                size="sm"
                className="h-9 rounded-xl bg-slate-50 border-none shadow-none text-slate-600 hover:bg-slate-100 hover:text-primary transition-all"
              />
              <div className="w-px h-4 bg-slate-100 mx-1"></div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLanguage(language === 'telugu' ? 'english' : 'telugu')}
                className="h-9 w-9 rounded-xl hover:bg-blue-50 text-blue-600 font-bold text-xs"
              >
                {language === 'telugu' ? 'EN' : 'తె'}
              </Button>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Festival Pulse Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Financial Health Summary */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-white to-slate-50 shadow-md border-none overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
            <BarChart3 className="h-40 w-40 rotate-12" />
          </div>
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-blue-100 p-2 rounded-xl"><Wallet className="h-5 w-5 text-blue-600" /></div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t('ఆర్థిక సారాంశం', 'FINANCIAL SUMMARY')}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground tracking-tight">{t('Total Balance', 'మిగిలిన మొత్తం')}</p>
                <h2 className="text-5xl font-black text-emerald-600 tracking-tighter">
                  ₹{(totalDonations + chandasPrev - totalExpenses - expensesPrev).toLocaleString()}
                </h2>
                <div className="flex items-center gap-3 mt-4">
                  <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: '75%' }}></div>
                  </div>
                  {/* <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">{t('ఆరోగ్యకరమైనది', 'HEALTHY')}</span> */}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/70 backdrop-blur-md p-5 rounded-3xl border border-white shadow-sm flex flex-col justify-between group/card hover:border-blue-100 transition-all">
                  <p className="text-[10px] font-black text-muted-foreground uppercase mb-1 tracking-wider">{t('Previous Amount', 'మునుపటి మొత్తం')}</p>
                  <div>
                    <p className="text-xl font-black text-blue-600">₹{(totalDonations + chandasPrev).toLocaleString()}</p>
                    {isAuthenticated && (
                      <button
                        onClick={() => { setPrevInput(String(chandasPrev || 0)); setEditingCardType('chandas'); setIsPrevDialogOpen(true); }}
                        className="text-[10px] font-bold text-blue-400 hover:text-blue-600 mt-1 underline decoration-dotted"
                      >
                        {t('మునుపటిది', 'Edit Prev')}
                      </button>
                    )}
                  </div>
                </div>
                <div className="bg-white/70 backdrop-blur-md p-5 rounded-3xl border border-white shadow-sm flex flex-col justify-between group/card hover:border-red-100 transition-all">
                  <p className="text-[10px] font-black text-muted-foreground uppercase mb-1 tracking-wider">{t('ఖర్చులు', 'Expenses')}</p>
                  <p className="text-xl font-black text-red-600">₹{(totalExpenses + expensesPrev).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Module Pulse Cards */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="bg-white shadow-sm border border-slate-100 p-5 flex items-center justify-between group hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer rounded-3xl" onClick={() => navigate('/chandas')}>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner shadow-blue-100/50">
                <BarChart3 className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('చందాలు', 'CHANDAS')}</p>
                <p className="text-xl font-black text-slate-800">₹{totalDonations.toLocaleString()}</p>
              </div>
            </div>
            <ArrowUpRight className="h-6 w-6 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
          </Card>

          <Card className="bg-white shadow-sm border border-slate-100 p-5 flex items-center justify-between group hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer rounded-3xl" onClick={() => navigate('/images')}>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner shadow-purple-100/50">
                <Image className="h-7 w-7 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('చిత్రాలు', 'GALLERY')}</p>
                <p className="text-xl font-black text-slate-800">{totalImages} {t('చిత్రాలు', 'Photos')}</p>
              </div>
            </div>
            <ArrowUpRight className="h-6 w-6 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
          </Card>
        </div>
      </div>

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
        {(!allowedPages || allowedPages.includes('chandas')) && <ChandasPreview />}
        {(!allowedPages || allowedPages.includes('expenses')) && <ExpensesPreview />}
        {(!allowedPages || allowedPages.includes('images')) && <ImagesPreview />}
        {(() => {
          const festivalPages = (selectedFestival?.enabled_pages as unknown as PageOption[]) || [];
          // Check both festival settings AND shared link restrictions
          if (festivalPages.includes('voting') && (!allowedPages || allowedPages.includes('voting'))) {
            return <VotingPreview />;
          }
          return null;
        })()}
      </div>

      {/* Navigation */}

    </div>
  </div>;
}
