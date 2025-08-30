import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Receipt, Image, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getTotalByCategory } from '@/lib/database';
import { getTotalExpenses } from '@/lib/expenses';
import { getImages } from '@/lib/images';
import { YearBadge } from '@/components/YearBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
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
    queryKey: ['total-donations-chanda'],
    queryFn: () => getTotalByCategory('chanda'),
  });

  const { data: totalExpenses = 0 } = useQuery({
    queryKey: ['total-expenses'],
    queryFn: getTotalExpenses,
  });

  const { data: images = [] } = useQuery({
    queryKey: ['user-images'],
    queryFn: getImages,
  });


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
      value: `${images.length} ${t('చిత్రాలు', 'images')}`,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('డాష్‌బోర్డ్', 'Dashboard')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('గణేష్ చందా', 'Ganesh Chanda')}
            </p>
            <YearBadge />
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

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {dashboardCards.map((card) => {
            const Icon = card.icon;
            
            // Show image cards for Images section
            if (card.path === '/images') {
              const firstFourImages = images.slice(0, 4);
              return (
                <Card 
                  key={card.path} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                  onClick={() => navigate(card.path)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <CardDescription className="text-sm">
                      {card.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {firstFourImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {firstFourImages.map((img) => (
                          <div key={img.id} className="aspect-square rounded-md overflow-hidden">
                            <img 
                              src={img.image_url} 
                              alt={img.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {firstFourImages.length < 4 && Array.from({ length: 4 - firstFourImages.length }).map((_, idx) => (
                          <div key={`empty-${idx}`} className="aspect-square rounded-md bg-muted flex items-center justify-center">
                            <Icon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {Array.from({ length: 4 }).map((_, idx) => (
                          <div key={`empty-${idx}`} className="aspect-square rounded-md bg-muted flex items-center justify-center">
                            <Icon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    )}
                    <p className={`text-sm font-medium ${card.color} mb-3`}>
                      {card.value}
                    </p>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(card.path);
                      }}
                    >
                      {t('వీక్షించండి', 'View')}
                    </Button>
                  </CardContent>
                </Card>
              );
            }
            
            // Regular cards for other sections
            return (
              <Card 
                key={card.path} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => navigate(card.path)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <CardDescription className="text-sm">
                    {card.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${card.color}`}>
                    {card.value}
                  </p>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="mt-3 w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(card.path);
                    }}
                  >
                    {t('వీక్షించండి', 'View')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Navigation */}
        <Navigation />
      </div>
    </div>
  );
}
