import { useLanguage } from '@/contexts/LanguageContext';
import { useFestival } from '@/contexts/FestivalContext';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { BarChart3, Receipt, Users, ArrowLeft, Image, Wallet, ArrowUpRight, LogOut, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getTotalByFestival } from '@/lib/database';
import { getTotalExpensesByFestival } from '@/lib/expenses';
import { getImages } from '@/lib/images';
import { YearBadge } from '@/components/YearBadge';
import { PageHeader } from '@/components/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ChandasPreview } from '@/components/ChandasPreview';
import { ExpensesPreview } from '@/components/ExpensesPreview';
import { ImagesPreview } from '@/components/ImagesPreview';
import { VotingPreview } from '@/components/VotingPreview';
import { BackButton } from '@/components/BackButton';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { PageOption } from '@/components/PageSelector';
import { AuthDialog } from '@/components/AuthDialog';

export default function Dashboard() {
  const { t, language, setLanguage } = useLanguage();
  const {
    selectedFestival,
    setSelectedFestival
  } = useFestival();
  const navigate = useNavigate();
  const { currentOrganization, allowedPages, isAuthenticated, logout } = useOrganization();

  const orgPath = currentOrganization ? `/org/${currentOrganization.slug}` : '/';

  // Redirect to festival selection if no festival selected
  useEffect(() => {
    if (!selectedFestival) {
      navigate(orgPath);
    }
  }, [selectedFestival, navigate, orgPath]);
   const [isPrevDialogOpen, setIsPrevDialogOpen] = useState(false as boolean);
  const [isAuthOpen, setIsAuthOpen] = useState(false as boolean);
  const [prevInput, setPrevInput] = useState('' as string);
  const [editingCardType, setEditingCardType] = useState<'chandas' | 'expenses' | 'images' | null>(null);

  // Read previous amounts directly from the selected festival
  const chandasPrev = selectedFestival?.previous_chandas || 0;
  const expensesPrev = selectedFestival?.previous_expenses || 0;

  const savePreviousAmount = async (cardType: 'chandas' | 'expenses' | 'images', value: number) => {
    if (!selectedFestival || !selectedFestival.id) return;
    try {
      const updates: Partial<typeof selectedFestival> = {};
      if (cardType === 'chandas') updates.previous_chandas = value;
      if (cardType === 'expenses') updates.previous_expenses = value;

      // Import updateFestival at the top if not present, but we will use the one imported earlier or add it now
      const { updateFestival } = await import('@/lib/festivals');
      const updatedFest = await updateFestival(selectedFestival.id, updates);
      
      // Update local context
      setSelectedFestival(updatedFest);
    } catch (e) {
      console.error(e);
    }
  };

  const {
    data: totalDonations = 0
  } = useQuery({
    queryKey: ['total-donations-festival', selectedFestival?.name, selectedFestival?.year],
    queryFn: () => selectedFestival ? getTotalByFestival(selectedFestival.name, selectedFestival.year, 'chanda') : 0,
    enabled: !!selectedFestival
  });

  const {
    data: totalCollection = 0
  } = useQuery({
    queryKey: ['total-collection-festival', selectedFestival?.name, selectedFestival?.year],
    queryFn: () => selectedFestival ? getTotalByFestival(selectedFestival.name, selectedFestival.year) : 0,
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
    description: t('చందా మరియు స్పాన్సర్‌షిప్ నిర్వహణ', 'Manage Chanda and Sponsorships'),
    icon: BarChart3,
    path: `${orgPath}/chandas`,
    value: `₹${totalCollection.toLocaleString()}`,
    color: 'text-blue-600'
  }, {
    title: t('ఖర్చులు', 'Expenses'),
    description: t('ఖర్చుల రికార్డ్ మరియు ట్రాకింగ్', 'Track and record expenses'),
    icon: Receipt,
    path: `${orgPath}/expenses`,
    value: `₹${totalExpenses.toLocaleString()}`,
    color: 'text-red-600'
  }, {
    title: t('చిత్రాలు', 'Images'),
    description: t('ఫోటోలు మరియు చిత్రాలను అప్‌లోడ్ చేయండి', 'Upload and manage photos'),
    icon: Image,
    path: `${orgPath}/images`,
    value: `${totalImages} ${t('చిత్రాలు', 'images')}`,
    color: 'text-green-600'
  }];
  return <div className="min-h-screen bg-background">
    <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
      <PageHeader
        title={`${selectedFestival?.name || ''} ${selectedFestival?.year || ''}`}
        description={t('పండుగ అవలోకనం మరియు గణాంకాలు', 'Festival overview and statistics')}
        onAuthOpen={() => setIsAuthOpen(true)}
      />

      {/* Festival Pulse Dashboard */}
      {/* Financial Health Summary - Full Width */}
      <Card className="w-full bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 shadow-md border-none overflow-hidden relative group mb-6">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
          <BarChart3 className="h-40 w-40 rotate-12" />
        </div>
        <CardContent className="p-5 sm:p-7">
          <div className="flex items-center gap-2 mb-5">
            <div className="bg-blue-100 dark:bg-blue-950 p-2 rounded-xl"><Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t('ఆర్థిక సారాంశం', 'FINANCIAL SUMMARY')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
            {/* Total Balance */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col justify-between md:col-span-1">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{t('మిగిలిన మొత్తం', 'Total Balance')}</p>
                <h2 className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight truncate">
                  ₹{(totalCollection + chandasPrev - totalExpenses - expensesPrev).toLocaleString()}
                </h2>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>

            {/* Side-by-side container for Previous Amount & Expenses on Mobile */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:col-span-2">
              {/* Previous Amount */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col justify-between group/card hover:border-blue-200 transition-all">
                <p className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 truncate">{t('మునుపటి మొత్తం', 'Previous Amount')}</p>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight truncate">
                    ₹{(chandasPrev || 0).toLocaleString()}
                  </p>
                  {isAuthenticated && (
                    <button
                      onClick={() => { setPrevInput(String(chandasPrev || 0)); setEditingCardType('chandas'); setIsPrevDialogOpen(true); }}
                      className="text-[11px] font-bold text-blue-500 hover:text-blue-700 mt-1 underline decoration-dotted cursor-pointer"
                    >
                      {t('మునుపటిది', 'Edit Prev')}
                    </button>
                  )}
                </div>
              </div>

              {/* Expenses */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col justify-between group/card hover:border-red-200 transition-all">
                <p className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 truncate">{t('ఖర్చులు', 'Expenses')}</p>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400 tracking-tight truncate">
                    ₹{(totalExpenses + expensesPrev).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Pulse Cards - Full Width Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 p-5 flex items-center justify-between group hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer rounded-3xl" onClick={() => navigate(`${orgPath}/chandas`)}>
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-14 w-14 bg-blue-50 dark:bg-blue-950 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner shrink-0">
              <BarChart3 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('చందాలు', 'CHANDAS')}</p>
              <p className="text-xl font-black text-slate-800 dark:text-slate-100 font-sans truncate">₹{totalCollection.toLocaleString()}</p>
            </div>
          </div>
          <ArrowUpRight className="h-6 w-6 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all shrink-0" />
        </Card>

        <Card className="bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 p-5 flex items-center justify-between group hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer rounded-3xl" onClick={() => navigate(`${orgPath}/images`)}>
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-14 w-14 bg-purple-50 dark:bg-purple-950 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner shrink-0">
              <Image className="h-7 w-7 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('చిత్రాలు', 'GALLERY')}</p>
              <p className="text-xl font-black text-slate-800 dark:text-slate-100 truncate">{totalImages} {t('చిత్రాలు', 'Photos')}</p>
            </div>
          </div>
          <ArrowUpRight className="h-6 w-6 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all shrink-0" />
        </Card>
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

      {/* Module Previews - 1 Card per row for Full Width on iPad / Laptops */}
      <div className="grid grid-cols-1 gap-6 mb-8">
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

      <AuthDialog
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setIsAuthOpen(false)}
      />

      {/* Navigation */}
    </div>
  </div>;
}
