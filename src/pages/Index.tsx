import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, IndianRupee, Languages, Shield, LogOut } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Donation, 
  getAllDonations, 
  getDonationsByCategory, 
  deleteDonation, 
  getTotalAmount,
  getTotalByCategory,
  searchDonationsWithTranslation
} from '@/lib/database';
import { DonationForm } from '@/components/DonationForm';
import { DonationCard } from '@/components/DonationCard';
import { SearchBar } from '@/components/SearchBar';
import { AuthDialog } from '@/components/AuthDialog';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [chandas, setChandas] = useState<Donation[]>([]);
  const [sponsorships, setSponsorships] = useState<Donation[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [chandaTotal, setChandaTotal] = useState(0);
  const [sponsorshipTotal, setSponsorshipTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [donationToDelete, setDonationToDelete] = useState<string | null>(null);
  // Pagination (20 per page)
  const [itemsPerPage] = useState(20);
  const [pageSearch, setPageSearch] = useState(1);
  const [pageChandas, setPageChandas] = useState(1);
  const [pageSponsorships, setPageSponsorships] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'amount'; direction: 'asc' | 'desc' } | null>(null);
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, logout } = useAuth();

  // Desired display order for sponsorship types
  const sponsorshipTypeOrder = [
    'విగ్రహం',
    'లాడు',
    'Day1-భోజనం',
    'Day2-భోజనం',
    'Day3-భోజనం',
    'Day1-టిఫిన్',
    'Day2-టిఫిన్',
    'Day3-టిఫిన్',
    'ఇతర'
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      searchDonationsWithTranslation(searchTerm).then(setFilteredDonations);
    } else {
      setFilteredDonations(donations);
    }
    setPageSearch(1);
  }, [searchTerm, donations]);

  useEffect(() => {
    setPageSearch(1);
    setPageChandas(1);
    setPageSponsorships(1);
  }, [sortConfig]);

  const loadData = async () => {
    try {
      const [allDonations, chandaData, sponsorshipData, total, chandaSum, sponsorshipSum] = 
        await Promise.all([
          getAllDonations(),
          getDonationsByCategory('chanda'),
          getDonationsByCategory('sponsorship'),
          getTotalAmount(),
          getTotalByCategory('chanda'),
          getTotalByCategory('sponsorship')
        ]);

      setDonations(allDonations);
      setFilteredDonations(allDonations);
      setChandas(chandaData);
      setSponsorships(sponsorshipData);
      setTotalAmount(total);
      setChandaTotal(chandaSum);
      setSponsorshipTotal(sponsorshipSum);
    } catch (error) {
      toast({
        title: t("దోషం", "Error"),
        description: t("డేటా లోడ్ చేయడంలో దోషం", "Error loading data"),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (donation: Donation) => {
    if (isAuthenticated) {
      setEditingDonation(donation);
      setIsFormOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  };

  const handleAdd = () => {
    if (isAuthenticated) {
      setIsFormOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  };

  const handleAuthRequired = () => {
    setIsAuthOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }
    
    setDonationToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!donationToDelete) return;
    
    try {
      await deleteDonation(donationToDelete);
      await loadData();
      toast({
        title: t("విజయవంతం", "Success"),
        description: t("దానం విజయవంతంగా తీసివేయబడింది", "Donation deleted successfully")
      });
    } catch (error) {
      toast({
        title: t("దోషం", "Error"),
        description: t("దానం తీసివేయడంలో దోషం", "Error deleting donation"),
        variant: "destructive"
      });
    } finally {
      setDeleteConfirmOpen(false);
      setDonationToDelete(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingDonation(undefined);
  };

  const handleFormSave = async () => {
    await loadData();
  };

  // Sorting helper
  const getSorted = (list: Donation[]) => {
    if (!sortConfig) return list;
    const sorted = [...list].sort((a, b) => {
      const { key, direction } = sortConfig;
      const av = a[key];
      const bv = b[key];
      if (typeof av === 'string' && typeof bv === 'string') {
        const r = av.localeCompare(bv);
        return direction === 'asc' ? r : -r;
      }
      if (typeof av === 'number' && typeof bv === 'number') {
        const r = av - bv;
        return direction === 'asc' ? r : -r;
      }
      return 0;
    });
    return sorted;
  };

  // Sorting for sponsorships: first by type order, then by selected sort within same type
  const getSponsorshipSorted = (list: Donation[]) => {
    const withOrder = [...list].sort((a, b) => {
      const ai = sponsorshipTypeOrder.indexOf(a.type);
      const bi = sponsorshipTypeOrder.indexOf(b.type);
      const aIdx = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
      const bIdx = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
      if (aIdx !== bIdx) return aIdx - bIdx;
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      const av = a[key];
      const bv = b[key];
      if (typeof av === 'string' && typeof bv === 'string') {
        const r = av.localeCompare(bv);
        return direction === 'asc' ? r : -r;
      }
      if (typeof av === 'number' && typeof bv === 'number') {
        const r = av - bv;
        return direction === 'asc' ? r : -r;
      }
      return 0;
    });
    return withOrder;
  };

  const requestSort = (key: 'name' | 'amount', direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
  };

  // Pagination helper
  const paginate = (list: Donation[], page: number) => {
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
    const current = Math.min(Math.max(1, page), totalPages);
    const start = (current - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return { data: list.slice(start, end), totalPages, current };
  };

  // Prepare paginated datasets
  const sortedSearch = getSorted(filteredDonations);
  const { data: pageSearchData, totalPages: totalPagesSearch, current: currentPageSearch } = paginate(sortedSearch, pageSearch);
  const sortedChandas = getSorted(chandas);
  const { data: pageChandasData, totalPages: totalPagesChandas, current: currentPageChandas } = paginate(sortedChandas, pageChandas);
  const sortedSponsorships = getSponsorshipSorted(sponsorships);
  const { data: pageSponsorshipsData, totalPages: totalPagesSponsorships, current: currentPageSponsorships } = paginate(sortedSponsorships, pageSponsorships);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-festive">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('లోడ్ చేస్తోంది...', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-festive">
      {/* Header */}
      <div className="bg-gradient-header text-white p-4 md:p-6 shadow-lg rounded-b-2xl">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-center">
            <div className="text-center md:text-left">
              {/* <IndianRupee className="h-8 w-8 mr-2" /> */}
              <h1 className="font-extrabold text-3xl md:text-4xl leading-tight drop-shadow-sm tracking-tight">
                {t('కాల్వపల వినాయక చవితి 2025', 'Kalvapalli Vinayak Chavithi 2025')}
              </h1>
              <p className="mt-1 md:mt-2 text-white/90 text-sm md:text-base">
                {t('చందాల ట్రాకర్', 'Contributions Tracker')}
              </p>
            </div>
            <div className="flex justify-center md:justify-end items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === 'telugu' ? 'english' : 'telugu')}
                className="text-white hover:bg-white/10"
              >
                <Languages className="h-4 w-4 mr-1" />
                {language === 'telugu' ? 'EN' : 'తె'}
              </Button>
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-white hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  {t('లాగౌట్', 'Logout')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Total Amount Card */}
        <Card className="bg-card/95 backdrop-blur border-0 shadow-festive">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-festival-blue">{t('మొత్తం చందా మొత్తం', 'Total Amount')}</CardTitle>
            <p className="text-4xl font-bold text-festival-orange">₹{totalAmount.toLocaleString('en-IN')}</p>
          </CardHeader>
        </Card>

        {/* Search + Sort + Add */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center">
          <div className="flex-1">
            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          </div>
          {/* On mobile, keep filter and button side-by-side */}
          <div className="flex w-full items-center gap-2 justify-between md:w-auto">
            <div className="flex-1 md:flex-none">
              <Select
                value={sortConfig ? `${sortConfig.key}-${sortConfig.direction}` : ''}
                onValueChange={(value) => {
                  const [key, direction] = value.split('-') as ['name' | 'amount', 'asc' | 'desc'];
                  requestSort(key, direction);
                }}
              >
                <SelectTrigger className="w-full md:w-[220px]">
                  <SelectValue placeholder={t('సార్ట్ చేయి', 'Sort by')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="name-asc">{t('పేరు ↑', 'Name ↑')}</SelectItem>
                  <SelectItem value="name-desc">{t('పేరు ↓', 'Name ↓')}</SelectItem>
                  <SelectItem value="amount-asc">{t('మొత్తం ↑', 'Amount ↑')}</SelectItem>
                  <SelectItem value="amount-desc">{t('మొత్తం ↓', 'Amount ↓')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:ml-auto">
              <Button
                onClick={handleAdd}
                className="bg-gradient-festive hover:opacity-90 text-white shadow-festive whitespace-nowrap"
              >
                {isAuthenticated ? (
                  <Plus className="h-4 w-4 mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                {isAuthenticated ? t('కొత్తది జోడించండి', 'Add New') : t('లాగిన్', 'Login')}
              </Button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchTerm && (
          <Card className="bg-card/95 backdrop-blur border-0">
            <CardHeader>
              <CardTitle className="text-festival-blue">
                {t(`వెతకిన ఫలితాలు (${filteredDonations.length})`, `Search Results (${filteredDonations.length})`)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredDonations.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {pageSearchData.map((donation) => (
                    <DonationCard
                      key={donation.id}
                      donation={donation}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onAuthRequired={handleAuthRequired}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6">{t('ఫలితాలు లేవు', 'No results')}</p>
              )}
              {filteredDonations.length > 0 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <Button variant="outline" size="sm" disabled={currentPageSearch <= 1} onClick={() => setPageSearch(currentPageSearch - 1)}>
                    {t('ముందు', 'Prev')}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {t(`పేజీ ${currentPageSearch} / ${totalPagesSearch}`, `Page ${currentPageSearch} / ${totalPagesSearch}`)}
                  </span>
                  <Button variant="outline" size="sm" disabled={currentPageSearch >= totalPagesSearch} onClick={() => setPageSearch(currentPageSearch + 1)}>
                    {t('తర్వాత', 'Next')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {/* Tabs for Categories */}
        {!searchTerm && (
          <Tabs defaultValue="chandas" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-card/95 backdrop-blur">
              <TabsTrigger value="chandas" className="data-[state=active]:bg-festival-orange data-[state=active]:text-white">
                {t('చందాలు', 'Chandas')} ({chandas.length})
              </TabsTrigger>
              <TabsTrigger value="sponsorships" className="data-[state=active]:bg-festival-blue data-[state=active]:text-white">
                {t('స్పాన్సర్‌షిప్స్', 'Sponsorships')} ({sponsorships.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chandas">
              <Card className="bg-card/95 backdrop-blur border-0">
                <CardHeader>
                  <CardTitle className="text-festival-orange">{t('సాధారణ చందాలు', 'General Chandas')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {chandas.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {pageChandasData.map((donation) => (
                        <DonationCard
                          key={donation.id}
                          donation={donation}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onAuthRequired={handleAuthRequired}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-6">{t('డేటా లేదు', 'No data')}</p>
                  )}
                  {chandas.length > 0 && (
                    <div className="flex items-center justify-center gap-3 mt-4">
                      <Button variant="outline" size="sm" disabled={currentPageChandas <= 1} onClick={() => setPageChandas(currentPageChandas - 1)}>
                        {t('ముందు', 'Prev')}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {t(`పేజీ ${currentPageChandas} / ${totalPagesChandas}`, `Page ${currentPageChandas} / ${totalPagesChandas}`)}
                      </span>
                      <Button variant="outline" size="sm" disabled={currentPageChandas >= totalPagesChandas} onClick={() => setPageChandas(currentPageChandas + 1)}>
                        {t('తర్వాత', 'Next')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sponsorships">
              <Card className="bg-card/95 backdrop-blur border-0">
                <CardHeader>
                  <CardTitle className="text-festival-blue">{t('స్పాన్సర్‌షిప్స్ & ఆఫరింగ్స్', 'Sponsorships & Offerings')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {sponsorships.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {pageSponsorshipsData.map((donation) => (
                        <DonationCard
                          key={donation.id}
                          donation={donation}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onAuthRequired={handleAuthRequired}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-6">{t('డేటా లేదు', 'No data')}</p>
                  )}
                  {sponsorships.length > 0 && (
                    <div className="flex items-center justify-center gap-3 mt-4">
                      <Button variant="outline" size="sm" disabled={currentPageSponsorships <= 1} onClick={() => setPageSponsorships(currentPageSponsorships - 1)}>
                        {t('ముందు', 'Prev')}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {t(`పేజీ ${currentPageSponsorships} / ${totalPagesSponsorships}`, `Page ${currentPageSponsorships} / ${totalPagesSponsorships}`)}
                      </span>
                      <Button variant="outline" size="sm" disabled={currentPageSponsorships >= totalPagesSponsorships} onClick={() => setPageSponsorships(currentPageSponsorships + 1)}>
                        {t('తర్వాత', 'Next')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <DonationForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        donation={editingDonation}
        onSave={handleFormSave}
      />
      
      <AuthDialog
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setIsAuthOpen(false)}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('దానం తీసివేయండి', 'Delete Donation')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('మీరు ఖచ్చితంగా ఈ దానాన్ని తీసివేయాలనుకుంటున్నారా? ఈ చర్య రద్దు చేయబడదు.', 'Are you sure you want to delete this donation? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('రద్దు', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              {t('తీసివేయండి', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
