import { useLanguage } from '@/contexts/LanguageContext';
import { useFestival } from '@/contexts/FestivalContext';
import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Receipt, Image, Users, Plus, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getTotalByFestival } from '@/lib/database';
import { getTotalExpensesByFestival } from '@/lib/expenses';
import { getImages } from '@/lib/images';
import { getAllFestivals } from '@/lib/festivals';
import { YearBadge } from '@/components/YearBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { FestivalCard } from '@/components/FestivalCard';
import { AddFestivalDialog } from '@/components/AddFestivalDialog';

export default function Dashboard() {
  const { t, language, setLanguage } = useLanguage();
  const { selectedFestival } = useFestival();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect to festival selection if no festival selected
  useEffect(() => {
    if (!selectedFestival) {
      navigate('/');
    }
  }, [selectedFestival, navigate]);
  const [isPrevDialogOpen, setIsPrevDialogOpen] = useState(false as boolean);
  const [prevInput, setPrevInput] = useState('' as string);
  // Hardcoded default previous amount (change here if needed)
  const PREVIOUS_AMOUNT_DEFAULT = 0;
  const [previousAmount, setPreviousAmount] = useState<number>(PREVIOUS_AMOUNT_DEFAULT);

  // Load from localStorage once (optional persistence without DB)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('previous_amount');
      if (stored !== null) setPreviousAmount(Number(stored) || 0);
    } catch {}
  }, []);

  const savePreviousAmount = (value: number) => {
    setPreviousAmount(value);
    try {
      localStorage.setItem('previous_amount', String(value));
    } catch {}
  };

  const { data: totalDonations = 0 } = useQuery({
    queryKey: ['total-donations-festival', selectedFestival?.name, selectedFestival?.year],
    queryFn: () => selectedFestival ? getTotalByFestival(selectedFestival.name, selectedFestival.year, 'chanda') : 0,
    enabled: !!selectedFestival,
  });

  const { data: totalExpenses = 0 } = useQuery({
    queryKey: ['total-expenses-festival', selectedFestival?.name, selectedFestival?.year],
    queryFn: () => selectedFestival ? getTotalExpensesByFestival(selectedFestival.name, selectedFestival.year) : 0,
    enabled: !!selectedFestival,
  });

  const { data: totalImages = 0 } = useQuery({
    queryKey: ['total-images', selectedFestival?.name, selectedFestival?.year],
    queryFn: async () => {
      if (!selectedFestival) return 0;
      const images = await getImages(selectedFestival.name, selectedFestival.year);
      return images.length;
    },
    enabled: !!selectedFestival,
  });

  const { data: festivals = [] } = useQuery({
    queryKey: ['festivals'],
    queryFn: getAllFestivals,
  });

  const [isAddFestivalOpen, setIsAddFestivalOpen] = useState(false);


  const dashboardCards = [
    {
      title: t('చందాలు', 'Chandas'),
      description: t('చందా నిర్వహణ (స్పాన్సర్‌షిప్ వేరు)', 'Manage Chanda (sponsorships separate)'),
      icon: BarChart3,
      path: '/chandas',
      value: `₹${totalDonations.toLocaleString()}`,
      color: 'text-blue-600'
    },
    {
      title: t('ఖర్చులు', 'Expenses'),
      description: t('ఖర్చుల రికార్డ్ మరియు ట్రాకింగ్', 'Track and record expenses'),
      icon: Receipt,
      path: '/expenses',
      value: `₹${totalExpenses.toLocaleString()}`,
      color: 'text-red-600'
    },
    {
      title: t('చిత్రాలు', 'Images'),
      description: t('ఫోటోలు మరియు చిత్రాలను అప్‌లోడ్ చేయండి', 'Upload and manage photos'),
      icon: Image,
      path: '/images',
      value: `${totalImages} ${t('చిత్రాలు', 'images')}`,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('వెనుక', 'Back')}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {selectedFestival?.name || t('డాష్‌బోర్డ్', 'Dashboard')}
              </h1>
              <p className="text-muted-foreground mt-2">
                {selectedFestival ? `${selectedFestival.year} - ${t('డేటా', 'Data')}` : t('గణేష్ చందా', 'Ganesh Chanda')}
              </p>
              <YearBadge />
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setLanguage(language === 'telugu' ? 'english' : 'telugu')}
            className="shrink-0"
          >
            {language === 'telugu' ? 'EN' : 'తె'}
          </Button>
        </div>

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
                  {t('మొత్తం చందాలు (చందా మాత్రమే)', 'Total Chandas')}
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
                    ₹{previousAmount.toLocaleString()}
                  </p>
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setPrevInput(String(previousAmount || 0));
                        setIsPrevDialogOpen(true);
                      }}
                    >
                      {t('సవరించు', 'Edit')}
                    </Button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t('మునుపటి మొత్తం', 'Previous Amount')}
                </p>
              </div>
              <div className="text-center sm:col-span-2 md:col-span-1">
                <p className="text-2xl sm:text-3xl font-bold text-green-600 leading-tight">
                  ₹{(totalDonations + previousAmount - totalExpenses).toLocaleString()}
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
              <DialogTitle>{t('మునుపటి మొత్తాన్ని సవరించు', 'Edit Previous Amount')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                type="number"
                value={prevInput}
                onChange={(e) => setPrevInput(e.target.value)}
                placeholder={t('మొత్తం', 'Amount')}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsPrevDialogOpen(false)}>
                  {t('రద్దు', 'Cancel')}
                </Button>
                <Button
                  onClick={() => {
                    const val = Number(prevInput);
                    if (!Number.isFinite(val)) return;
                    savePreviousAmount(val);
                    setIsPrevDialogOpen(false);
                  }}
                >
                  {t('సేవ్', 'Save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit allowed only when logged in; no auth dialog shown */}

        {/* Festivals Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {t('ఉత్సవాలు', 'Festivals')}
            </h2>
            {isAuthenticated && (
              <Button 
                className="flex items-center gap-2"
                onClick={() => setIsAddFestivalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {t('కొత్త ఉత్సవం', 'Add New Festival')}
              </Button>
            )}
          </div>
          
          {festivals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {festivals.map((festival) => (
                <FestivalCard 
                  key={festival.id} 
                  festival={festival}
                  onClick={() => {
                    // Navigate to festival details or management page
                    console.log('Festival clicked:', festival.name);
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <div className="text-muted-foreground">
                <p className="text-lg mb-2">
                  {t('ఇంకా ఉత్సవాలు జోడించబడలేదు', 'No festivals added yet')}
                </p>
                <p className="text-sm">
                  {t('కొత్త ఉత్సవాన్ని జోడించడానికి లాగిన్ చేయండి', 'Login to add new festivals')}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Add Festival Dialog */}
        <AddFestivalDialog 
          open={isAddFestivalOpen} 
          onOpenChange={setIsAddFestivalOpen} 
        />

        {/* Navigation */}
        <Navigation />
      </div>
    </div>
  );
}
