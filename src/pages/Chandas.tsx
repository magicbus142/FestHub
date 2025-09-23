import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDonationsByFestival, getTotalByFestival, searchDonations, deleteDonation, type Donation } from '@/lib/database';
import { DonationCard } from '@/components/DonationCard';
import { DonationForm } from '@/components/DonationForm';
import { SearchBar } from '@/components/SearchBar';
import { AuthDialog } from '@/components/AuthDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFestival } from '@/contexts/FestivalContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { BarChart3, DollarSign, Plus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { YearBadge } from '@/components/YearBadge';
import { PageHeader } from '@/components/PageHeader';
import { ComingSoon } from '@/components/ComingSoon';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '@/components/BackButton';

export default function Chandas() {
  const { t, language, setLanguage } = useLanguage();
  const { selectedFestival } = useFestival();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
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
  const [showDuplicates, setShowDuplicates] = useState(false);

  const { data: donations = [], refetch } = useQuery({
    queryKey: ['donations-festival', selectedFestival?.name, selectedFestival?.year, activeCategory],
    queryFn: () => selectedFestival ? getDonationsByFestival(selectedFestival.name, selectedFestival.year, activeCategory) : [],
    enabled: !!selectedFestival,
  });

  const { data: totalChanda = 0 } = useQuery({
    queryKey: ['total-chanda-festival', selectedFestival?.name, selectedFestival?.year],
    queryFn: () => selectedFestival ? getTotalByFestival(selectedFestival.name, selectedFestival.year, 'chanda') : 0,
    enabled: !!selectedFestival,
  });

  const { data: totalSponsorship = 0 } = useQuery({
    queryKey: ['total-sponsorship-festival', selectedFestival?.name, selectedFestival?.year],
    queryFn: () => selectedFestival ? getTotalByFestival(selectedFestival.name, selectedFestival.year, 'sponsorship') : 0,
    enabled: !!selectedFestival,
  });

  // Client-side, case-insensitive search over Telugu `name` and English `name_english`
  const term = (searchTerm || '').trim().toLowerCase();
  const searchFiltered = term
    ? donations.filter(d => {
        const en = (d.name_english || '').toLowerCase();
        const te = (d.name || '').toLowerCase();
        return en.includes(term) || te.includes(term);
      })
    : donations;

  // Optional duplicates-only filter, based on normalized English name (fallback to Telugu)
  const nameKey = (d: Donation) => ((d.name_english && d.name_english.trim().toLowerCase()) || (d.name?.trim().toLowerCase()) || '');
  const duplicatesFiltered = showDuplicates
    ? (() => {
        const counts = new Map<string, number>();
        for (const d of searchFiltered) {
          const key = nameKey(d);
          if (!key) continue;
          counts.set(key, (counts.get(key) || 0) + 1);
        }
        return searchFiltered.filter(d => {
          const key = nameKey(d);
          return key && (counts.get(key) || 0) > 1;
        });
      })()
    : searchFiltered;

  // Counts for tabs (after applying search filter)
  const chandaCount = duplicatesFiltered.filter(d => d.category === 'chanda').length;
  const sponsorshipCount = duplicatesFiltered.filter(d => d.category === 'sponsorship').length;

  // Sponsorship display order (fixed)
  const SPONSOR_ORDER = [
    'విగరహం',
    'ల్డడు',
    'Day1-భోజనం',
    'Day2-భోజనం',
    'Day3-భోజనం',
    'Day1-టిఫిన్',
    'Day2-టిఫిన్',
    'Day3-టిఫిన్',
    'ఇతర'
  ];

  // Apply category and sort (after search filter)
  const filteredDonations = duplicatesFiltered.filter(d => d.category === activeCategory);
  
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
      // Always sort by English name for consistency, fall back to Telugu if missing
      const an = (a.name_english || a.name || '');
      const bn = (b.name_english || b.name || '');
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
        <PageHeader
          pageName="Chandas"
          pageNameTelugu="చందాలు"
          description="Track Chandas and sponsorships"
          descriptionTelugu="చందాలు మరియు స్పాన్సర్‌షిప్‌లను ట్రాక్ చేయండి"
        >
          <div className="flex flex-col gap-3 w-full">
            {/* Back + Language Row */}
            <div className="flex items-center justify-between">
              <BackButton
                className="rounded-md"
                emphasis size="sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'telugu' ? 'english' : 'telugu')}
                className="px-3"
              >
                {language === 'telugu' ? 'EN' : 'తె'}
              </Button>
            </div>

            {/* Language and Name Preference Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNamePreference(prev => prev === 'telugu' ? 'english' : 'telugu')}
                className="flex-1"
              >
                {namePreference === 'telugu' ? t('పేర్లు: తెలుగు', 'Names: Telugu') : t('పేర్లు: English', 'Names: English')}
              </Button>
            </div>

            {/* Prominent Add Button */}
            <Button
              onClick={handleAddDonation}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              {t('చందా జోడించు', 'Add Chanda')}
            </Button>
          </div>
        </PageHeader>

        {/* Navigation moved to bottom for consistency */}

        {/* Total amount card only */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('మొత్తం చందా', 'Total Chandas')}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalChanda.toLocaleString()}</div>
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
                <option value="amount-desc">{t('మొత్తం (ఎక్కువ → తక్కువ)', 'Amount (High → Low)')}</option>
                <option value="amount-asc">{t('మొత్తం (తక్కువ → ఎక్కువ)', 'Amount (Low → High)')}</option>
                <option value="name-asc">{t('పేరు (A → Z)', 'Name (A → Z)')}</option>
                <option value="name-desc">{t('పేరు (Z → A)', 'Name (Z → A)')}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="duplicates-only"
                checked={showDuplicates}
                onCheckedChange={(v) => setShowDuplicates(!!v)}
              />
              <label htmlFor="duplicates-only" className="text-sm text-foreground select-none cursor-pointer">
                {t('నకిలీలు మాత్రమే', 'Duplicates only')}
              </label>
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
          <div className="sticky bottom-16 z-40 -mx-4 px-4 py-2 bg-background/80 supports-[backdrop-filter]:bg-background/60 backdrop-blur border-t md:static md:border-0 md:-mx-0 md:px-0">
            <div className="flex justify-center items-center gap-2">
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
          </div>
        )}

        {/* Donation Form Dialog */}
        <DonationForm
          open={isDonationFormOpen}
          onOpenChange={(open) => {
            setIsDonationFormOpen(open);
            if (!open) setEditingDonation(undefined);
          }}
          donation={editingDonation}
          onDonationSaved={handleDonationSaved}
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

        {/* Bottom Navigation */}
        <Navigation />
      </div>
    </div>
  );
}
