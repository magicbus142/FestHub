import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, IndianRupee } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [chandas, setChandas] = useState<Donation[]>([]);
  const [sponsorships, setSponsorships] = useState<Donation[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [chandaTotal, setChandaTotal] = useState(0);
  const [sponsorshipTotal, setSponsorshipTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
        title: "దోషం",
        description: "డేటా లోడ్ చేయడంలో దోషం",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (donation: Donation) => {
    setEditingDonation(donation);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDonation(id);
      await loadData();
      toast({
        title: "విజయవంతం",
        description: "దానం విజయవంతంగా తీసివేయబడింది"
      });
    } catch (error) {
      toast({
        title: "దోషం",
        description: "దానం తీసివేయడంలో దోషం",
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
          <p className="text-white text-lg">లోడ్ చేస్తోంది...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-festive">
      {/* Header */}
      <div className="bg-gradient-header text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-4">
            <IndianRupee className="h-8 w-8 mr-2" />
            <h1 className="text-3xl font-bold">KPL వినాయక చవితి</h1>
          </div>
          <p className="text-center text-white/90">దానాలు మరియు చందాల ట్రాకర్</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Total Amount Card */}
        <Card className="bg-card/95 backdrop-blur border-0 shadow-festive">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-festival-blue">మొత్తం చందా మొత్తం</CardTitle>
            <p className="text-4xl font-bold text-festival-orange">₹{totalAmount.toLocaleString('en-IN')}</p>
          </CardHeader>
        </Card>

        {/* Search and Add Button */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-gradient-festive hover:opacity-90 text-white shadow-festive"
          >
            <Plus className="h-4 w-4 mr-2" />
            కొత్తది జోడించండి
          </Button>
        </div>

        {/* Search Results */}
        {searchTerm && (
          <Card className="bg-card/95 backdrop-blur border-0">
            <CardHeader>
              <CardTitle className="text-festival-blue">
                వెతకిన ఫలితాలు ({filteredDonations.length})
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
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  వెతకిన పేరుకు సంబంధించిన దానం దొరకలేదు
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
                చందాలు / Chandas (₹{chandaTotal.toLocaleString('en-IN')})
              </TabsTrigger>
              <TabsTrigger value="sponsorships" className="data-[state=active]:bg-festival-blue data-[state=active]:text-white">
                స్పాన్సర్‌షిప్స్ / Sponsorships (₹{sponsorshipTotal.toLocaleString('en-IN')})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chandas">
              <Card className="bg-card/95 backdrop-blur border-0">
                <CardHeader>
                  <CardTitle className="text-festival-orange">సాధారణ చందాలు / General Chandas</CardTitle>
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
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      చందాలు ఇంకా జోడించబడలేదు
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sponsorships">
              <Card className="bg-card/95 backdrop-blur border-0">
                <CardHeader>
                  <CardTitle className="text-festival-blue">స్పాన్సర్‌షిప్స్ & ఆఫరింగ్స్ / Sponsorships & Offerings</CardTitle>
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
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      స్పాన్సర్‌షిప్స్ ఇంకా జోడించబడలేదు
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
    </div>
  );
};

export default Index;
