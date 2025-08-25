import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllDonations, getTotalAmount, getTotalByCategory, searchDonationsWithTranslation, deleteDonation, type Donation } from '@/lib/database';
import { DonationCard } from '@/components/DonationCard';
import { DonationForm } from '@/components/DonationForm';
import { SearchBar } from '@/components/SearchBar';
import { AuthDialog } from '@/components/AuthDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { BarChart3, DollarSign, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function Chandas() {
  const { t, language, setLanguage } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'chanda' | 'sponsorship'>('chanda');
  // Filters and sorting
  const [filterType, setFilterType] = useState<'none' | 'minAmount'>('none');
  const [minAmount, setMinAmount] = useState<string>('');
  const [sortKey, setSortKey] = useState<'date' | 'amount' | 'name'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [isDonationFormOpen, setIsDonationFormOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | undefined>(undefined);
  const [deletingDonationId, setDeletingDonationId] = useState<string | null>(null);

  const { data: donations = [], refetch } = useQuery({
    queryKey: ['donations', searchTerm],
    queryFn: () => searchTerm ? searchDonationsWithTranslation(searchTerm) : getAllDonations(),
  });

  const { data: totalAmount = 0 } = useQuery({
    queryKey: ['total-amount'],
    queryFn: getTotalAmount,
  });

  const { data: totalChanda = 0 } = useQuery({
    queryKey: ['total-chanda'],
    queryFn: () => getTotalByCategory('chanda'),
  });

  const { data: totalSponsorship = 0 } = useQuery({
    queryKey: ['total-sponsorship'],
    queryFn: () => getTotalByCategory('sponsorship'),
  });

  // Counts for tabs
  const chandaCount = donations.filter(d => d.category === 'chanda').length;
  const sponsorshipCount = donations.filter(d => d.category === 'sponsorship').length;

  // Apply category, filter and sort
  const processedDonations = donations
    .filter(d => d.category === activeCategory)
    .filter(d => {
      if (filterType === 'minAmount') {
        const min = parseFloat(minAmount);
        if (!isNaN(min)) return d.amount >= min;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') {
        const at = new Date(a.created_at || 0).getTime();
        const bt = new Date(b.created_at || 0).getTime();
        cmp = at - bt;
      } else if (sortKey === 'amount') {
        cmp = a.amount - b.amount;
      } else {
        cmp = (a.name || '').localeCompare(b.name || '');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const handleDonationSaved = () => {
    refetch();
  };

  const handleEditDonation = (donation: Donation) => {
    setEditingDonation(donation);
    setIsDonationFormOpen(true);
  };

  const handleDeleteDonation = async (id: string) => {
    try {
      await deleteDonation(id);
      refetch();
      toast({
        title: t('విజయవంతమైంది', 'Success'),
        description: t('దానం తొలగించబడింది', 'Donation deleted successfully'),
      });
    } catch (error) {
      toast({
        title: t('లోపం', 'Error'),
        description: t('దానం తొలగించడంలో లోపం', 'Error deleting donation'),
        variant: 'destructive',
      });
    }
    setDeletingDonationId(null);
  };

  const handleAuthRequired = () => {
    setIsAuthDialogOpen(true);
  };

  const handleAuthSuccess = () => {
    // Refresh data after successful auth
    refetch();
  };

  const handleAddDonation = () => {
    if (isAuthenticated) {
      setEditingDonation(undefined);
      setIsDonationFormOpen(true);
    } else {
      setIsAuthDialogOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('గణేష్ చందా ట్రాకర్', 'Ganesh Chanda Tracker')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('చందాలు మరియు స్పాన్సర్‌షిప్‌లను ట్రాక్ చేయండి', 'Track donations and sponsorships')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setLanguage(language === 'telugu' ? 'english' : 'telugu')}
            >
              {language === 'telugu' ? 'EN' : 'తె'}
            </Button>
            <Button onClick={handleAddDonation} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('చందా జోడించు', 'Add Donation')}
            </Button>
          </div>
        </div>

        {/* Navigation (top on md+, still bottom-fixed on mobile due to component styles) */}
        <Navigation />

        {/* Total amount card only */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('మొత్తం చందా', 'Total Donations')}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: only Chanda and Sponsorship with counts */}
        <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as any)} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chanda">{t('చందా', 'Chanda')} ({chandaCount})</TabsTrigger>
            <TabsTrigger value="sponsorship">{t('స్పాన్సర్‌షిప్', 'Sponsorship')} ({sponsorshipCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters and Search */}
        <div className="mb-6 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm text-muted-foreground mb-1">{t('ఫిల్టర్', 'Filter')}:</label>
              <select
                className="w-full border rounded-md px-3 py-2 bg-background"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
              >
                <option value="none">{t('ఫిల్టర్ లేదు', 'No filter')}</option>
                <option value="minAmount">{t('తక్కువలోపు మొత్తం (>=)', 'Amount minimum (>=)')}</option>
              </select>
            </div>
            {filterType === 'minAmount' && (
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm text-muted-foreground mb-1">{t('కనిష్ట మొత్తం', 'Minimum amount')}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  placeholder={t('కనిష్ట మొత్తం', 'Minimum amount')}
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </div>
            )}
            <div className="col-span-1">
              <label className="block text-sm text-muted-foreground mb-1">{t('క్రమబద్ధీకరణ', 'Sort')}:</label>
              <select
                className="w-full border rounded-md px-3 py-2 bg-background"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as any)}
              >
                <option value="date">{t('తేదీ', 'Date')}</option>
                <option value="amount">{t('మొత్తం', 'Amount')}</option>
                <option value="name">{t('పేరు', 'Name')}</option>
              </select>
            </div>
            <div className="col-span-1">
              <label className="block text-sm text-muted-foreground mb-1">{t('దిశ', 'Direction')}</label>
              <select
                className="w-full border rounded-md px-3 py-2 bg-background"
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as any)}
              >
                <option value="asc">{t('ఆరోహణ', 'Asc')}</option>
                <option value="desc">{t('అవరోహణ', 'Desc')}</option>
              </select>
            </div>
          </div>
          <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        </div>

        {/* Donations List */}
        <div className="space-y-4 mb-6">
          {processedDonations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm
                    ? t('శోధన ఫలితాలు లేవు', 'No search results found')
                    : t('ఇంకా చందాలు లేవు', 'No donations yet')
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            processedDonations.map((donation) => (
              <DonationCard 
                key={donation.id} 
                donation={donation}
                onEdit={handleEditDonation}
                onDelete={(id) => setDeletingDonationId(id)}
                onAuthRequired={handleAuthRequired}
              />
            ))
          )}
        </div>

        {/* Donation Form Dialog */}
        <DonationForm
          isOpen={isDonationFormOpen}
          onClose={() => {
            setIsDonationFormOpen(false);
            setEditingDonation(undefined);
          }}
          donation={editingDonation}
          onSave={handleDonationSaved}
        />

        {/* Auth Dialog */}
        <AuthDialog
          isOpen={isAuthDialogOpen}
          onClose={() => setIsAuthDialogOpen(false)}
          onSuccess={handleAuthSuccess}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingDonationId} onOpenChange={() => setDeletingDonationId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('దానం తొలగించు', 'Delete Donation')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('మీరు ఈ దానాన్ని తొలగించాలని ఖచ్చితంగా అనుకుంటున్నారా? ఈ చర్య రద్దు చేయబడదు.', 'Are you sure you want to delete this donation? This action cannot be undone.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t('రద్దు', 'Cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingDonationId && handleDeleteDonation(deletingDonationId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('తొలగించు', 'Delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
