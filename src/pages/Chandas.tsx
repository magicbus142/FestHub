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
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // Sorting (no default option selected; chanda defaults to latest internally)
  const [sortOption, setSortOption] = useState<string>('');
  const [namePreference, setNamePreference] = useState<'telugu' | 'english'>('telugu');
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

  // Sponsorship display order (fixed)
  const SPONSOR_ORDER = [
    'విగరహం',
    'ల్డడు పరసాదం',
    'Day1-భోజనం',
    'Day2-భోజనం',
    'Day3-భోజనం',
    'Day1-టిఫిన్',
    'Day2-టిఫిన్',
    'Day3-టిఫిన్',
    'ఇతర'
  ];

  // Apply category and sort
  const filteredDonations = donations.filter(d => d.category === activeCategory);
  
  const sortedDonations = filteredDonations.slice().sort((a, b) => {
    // Sponsorship tab: custom order by type, then latest within the same type
    if (activeCategory === 'sponsorship') {
      const ai = SPONSOR_ORDER.indexOf(a.type);
      const bi = SPONSOR_ORDER.indexOf(b.type);
      const typeCmp = (ai === -1 ? Number.MAX_SAFE_INTEGER : ai) - (bi === -1 ? Number.MAX_SAFE_INTEGER : bi);
      if (typeCmp !== 0) return typeCmp;
      // latest first within type
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }

    // For non-sponsorship (i.e., chanda): if no filter selected -> latest first
    if (!sortOption) {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }

    const [sortKey, sortDir] = sortOption.split('-');
    let cmp = 0;

    if (sortKey === 'amount') {
      cmp = a.amount - b.amount;
    } else if (sortKey === 'name') {
      const an = namePreference === 'english'
        ? (a.name_english || a.name || '')
        : (a.name || a.name_english || '');
      const bn = namePreference === 'english'
        ? (b.name_english || b.name || '')
        : (b.name || b.name_english || '');
      cmp = an.localeCompare(bn);
    } else {
      // Default safeguard: latest first
      cmp = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    }

    return sortDir === 'asc' ? cmp : -cmp;
  });
  
  // Apply pagination
  const totalPages = Math.ceil(sortedDonations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const processedDonations = sortedDonations.slice(startIndex, startIndex + itemsPerPage);
  
  // Reset to first page when category changes
  const handleCategoryChange = (category: 'chanda' | 'sponsorship') => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

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
              onClick={() => setNamePreference(prev => prev === 'telugu' ? 'english' : 'telugu')}
            >
              {namePreference === 'telugu' ? t('పేర్లు: తెలుగు', 'Names: Telugu') : t('పేర్లు: English', 'Names: English')}
            </Button>
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

        {/* Tabs: only Chanda and Sponsorship with counts (sticky on mobile) */}
        <div className="sticky top-0 z-40 -mx-4 px-4 pt-1 pb-3 bg-background/80 supports-[backdrop-filter]:bg-background/60 backdrop-blur border-b md:static md:border-0 md:-mx-0 md:px-0 md:pt-0 md:pb-0">
          <Tabs value={activeCategory} onValueChange={(value) => handleCategoryChange(value as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="chanda"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t('చందా', 'Chanda')} ({chandaCount})
              </TabsTrigger>
              <TabsTrigger
                value="sponsorship"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t('స్పాన్సర్‌షిప్', 'Sponsorship')} ({sponsorshipCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Sort and Search */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm text-muted-foreground mb-1">{t('క్రమబద్ధీకరణ', 'Sort by')}:</label>
              <select
                className="w-full border rounded-md px-3 py-2 bg-background"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="">{t('ఫిల్టర్', 'Filter')}</option>
                <option value="amount-desc">{t('మొత్తం ↓', 'Amount ↓')}</option>
                <option value="amount-asc">{t('మొత్తం ↑', 'Amount ↑')}</option>
                <option value="name-asc">{t('పేరు ↑', 'Name ↑')}</option>
                <option value="name-desc">{t('పేరు ↓', 'Name ↓')}</option>
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
                namePreference={namePreference}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              {t('మునుపటి', 'Previous')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t(`పేజీ ${currentPage} / ${totalPages}`, `Page ${currentPage} of ${totalPages}`)}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              {t('తదుపరి', 'Next')}
            </Button>
          </div>
        )}

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
