import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  searchDonations,
  initDatabase
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
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      searchDonations(searchTerm).then(setFilteredDonations);
    } else {
      setFilteredDonations(donations);
    }
  }, [searchTerm, donations]);

  const loadData = async () => {
    try {
      await initDatabase();
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

  const handleDelete = async (id: number) => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }
    
    try {
      await deleteDonation(id);
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
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingDonation(undefined);
  };

  const handleFormSave = async () => {
    await loadData();
  };

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
      <div className="bg-gradient-header text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <IndianRupee className="h-8 w-8 mr-2" />
              <h1 className="text-3xl font-bold">{t('KPL వినాయక చవితి', 'KPL Vinayak Chavithi')}</h1>
            </div>
            <div className="flex items-center gap-2">
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
          <p className="text-center text-white/90">{t('దానాలు మరియు చందాల ట్రాకర్', 'Donations and Contributions Tracker')}</p>
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

        {/* Search and Add Button */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          </div>
          <Button
            onClick={handleAdd}
            className="bg-gradient-festive hover:opacity-90 text-white shadow-festive"
          >
            {isAuthenticated ? (
              <Plus className="h-4 w-4 mr-2" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            {isAuthenticated ? t('కొత్తది జోడించండి', 'Add New') : t('లాగిన్', 'Login')}
          </Button>
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
                  {filteredDonations.map((donation) => (
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
                <p className="text-center text-muted-foreground py-8">
                  {t('వెతకిన పేరుకు సంబంధించిన దానం దొరకలేదు', 'No donations found for the searched name')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs for Categories */}
        {!searchTerm && (
          <Tabs defaultValue="chandas" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-card/95 backdrop-blur">
              <TabsTrigger value="chandas" className="data-[state=active]:bg-festival-orange data-[state=active]:text-white">
                {t('చందాలు', 'Chandas')} (₹{chandaTotal.toLocaleString('en-IN')})
              </TabsTrigger>
              <TabsTrigger value="sponsorships" className="data-[state=active]:bg-festival-blue data-[state=active]:text-white">
                {t('స్పాన్సర్‌షిప్స్', 'Sponsorships')} (₹{sponsorshipTotal.toLocaleString('en-IN')})
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
                      {chandas.map((donation) => (
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
                    <p className="text-center text-muted-foreground py-8">
                      {t('చందాలు ఇంకా జోడించబడలేదు', 'No chandas added yet')}
                    </p>
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
                      {sponsorships.map((donation) => (
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
                    <p className="text-center text-muted-foreground py-8">
                      {t('స్పాన్సర్‌షిప్స్ ఇంకా జోడించబడలేదు', 'No sponsorships added yet')}
                    </p>
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
    </div>
  );
};

export default Index;
