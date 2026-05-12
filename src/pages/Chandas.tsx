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
import { useOrganization } from '@/contexts/OrganizationContext';
import { BarChart3, DollarSign, Plus, ArrowLeft, Lock, TrendingUp, Wallet, CreditCard, Download, Package, HandHelping, ArrowUpRight, Users, Target, LogOut } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { YearBadge } from '@/components/YearBadge';
import { PageHeader } from '@/components/PageHeader';
import { ComingSoon } from '@/components/ComingSoon';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '@/components/BackButton';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { generateReceipt } from '@/utils/receiptGenerator';
import { FileDown } from 'lucide-react';

export default function Chandas() {
  const { t, language, setLanguage } = useLanguage();
  const { selectedFestival } = useFestival();
  const { isAuthenticated, currentOrganization, logout } = useOrganization();
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'received' | 'pending'>('all');

  const { data: donations = [], refetch } = useQuery({
    queryKey: ['donations-festival', selectedFestival?.name, selectedFestival?.year],
    queryFn: () => selectedFestival ? getDonationsByFestival(selectedFestival.name, selectedFestival.year) : [],
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

  // Calculate totals and pending amounts based on actual collection
  // Logic: If received_amount is NULL/Undefined, assume it equals amount (Legacy Data is likely paid).
  // If received_amount is explicitly 0, it means Pending.
  const getReceived = (d: Donation) => d.received_amount ?? d.amount;

  const totalChandaAmount = (donations || [])
    .filter(d => d.category === 'chanda' || !d.category)
    .reduce((sum, d) => sum + d.amount, 0);
    
  const totalChandaReceived = (donations || [])
    .filter(d => d.category === 'chanda' || !d.category)
    .reduce((sum, d) => sum + getReceived(d), 0);
    
  const totalSponsorshipAmount = (donations || [])
    .filter(d => d.category === 'sponsorship')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalSponsorshipReceived = (donations || [])
    .filter(d => d.category === 'sponsorship')
    .reduce((sum, d) => sum + getReceived(d), 0);

  const totalAmount = totalChandaAmount + totalSponsorshipAmount;
  const totalReceived = totalChandaReceived + totalSponsorshipReceived;

  // Pending Calculation
  const pendingChanda = Math.max(0, totalChandaAmount - totalChandaReceived);
  const pendingSponsorship = Math.max(0, totalSponsorshipAmount - totalSponsorshipReceived);
  const pendingTotal = Math.max(0, totalAmount - totalReceived);
  
  // Progress percentages for stats cards
  const chandaProgress = totalChandaAmount > 0 ? (totalChandaReceived / totalChandaAmount) * 100 : 0;
  const sponsorshipProgress = totalSponsorshipAmount > 0 ? (totalSponsorshipReceived / totalSponsorshipAmount) * 100 : 0;
  const totalProgress = totalAmount > 0 ? (totalReceived / totalAmount) * 100 : 0;

  const handleExport = () => {
    try {
      if (filteredDonations.length === 0) {
        alert(t('ఎగుమతి చేయడానికి డేటా లేదు', 'No data to export'));
        return;
      }

      // Define CSV headers
      const headers = ['Name', 'Category', 'Type', 'Total Amount', 'Received Amount', 'Pending Amount', 'Date'];
      
      // Map data to CSV rows
      const rows = filteredDonations.map(d => [
        // Name: Handle commas by wrapping in quotes
        `"${language === 'telugu' ? d.name : (d.name_english || d.name)}"`,
        d.category,
        d.type,
        d.amount,
        d.received_amount || 0,
        d.amount - (d.received_amount || 0),
        new Date(d.created_at || '').toLocaleDateString()
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `donations_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  // Client-side, case-insensitive search over Telugu `name` and English `name_english`
  const term = (searchTerm || '').trim().toLowerCase();
  const searchFiltered = term
    ? donations.filter(d => {
        const en = (d.name_english || '').toLowerCase();
        const te = (d.name || '').toLowerCase();
        const amt = String(d.amount || '');
        const isNumeric = !isNaN(Number(term)) && term.trim() !== '';
        const amtMatches = isNumeric ? (amt === term) : amt.includes(term);
        return en.includes(term) || te.includes(term) || amtMatches;
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
  let filteredDonations = duplicatesFiltered.filter(d => d.category === activeCategory);

  // Apply status filter
  if (statusFilter !== 'all') {
    filteredDonations = filteredDonations.filter(d => {
      const received = d.received_amount || 0;
      if (statusFilter === 'received') {
        return received >= d.amount;
      } else {
        // pending (includes partial)
        return received < d.amount; 
      }
    });
  }
  
  const sortedDonations = filteredDonations.slice().sort((a, b) => {
    // Sponsorship tab: custom order by type, then latest within the same type (only when no sorting filter is active)
    if (activeCategory === 'sponsorship' && !sortOption) {
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

  const filteredTotalAmount = sortedDonations.reduce((sum, d) => sum + d.amount, 0);
  const filteredTotalReceived = sortedDonations.reduce((sum, d) => sum + (d.received_amount ?? d.amount), 0);
  const filteredTotalPending = Math.max(0, filteredTotalAmount - filteredTotalReceived);
  
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

  /* Removed local generateReceipt function in favor of utility */


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        {/* Custom Header Layout matching Standard Design */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Breadcrumbs Pill */}
          <div className="flex items-center gap-2 bg-slate-100/50 w-fit px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-slate-200/50">
             <span>Home</span>
             <span className="opacity-30">/</span>
             <span className="text-primary truncate max-w-[100px]">{selectedFestival?.name || 'Festival'}</span>
             <span className="opacity-30">/</span>
             <span className="text-foreground">Finances</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
               <h1 className="text-4xl font-black text-foreground tracking-tight mb-1">
                 {t('పండుగ ఆర్థికం', 'Festival Finances')}
               </h1>
               <p className="text-sm text-muted-foreground font-medium">
                  {t('నిధులు మరియు స్పాన్సర్‌షిప్‌ల నిర్వహణ', 'Manage collections and sponsorships')}
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
                  {isAuthenticated ? (
                    <>
                      <div className="w-px h-4 bg-slate-100 mx-1"></div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          logout();
                          toast({ title: t('లాగ్ అవుట్', 'Logged out'), description: t('విజయవంతంగా లాగ్ అవుట్ అయ్యారు', 'Successfully logged out') });
                        }}
                        className="h-9 w-9 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
                        title={t('లాగ్ అవుట్', 'Log Out')}
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="w-px h-4 bg-slate-100 mx-1"></div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsAuthDialogOpen(true)}
                        className="h-9 w-9 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors"
                        title={t('లాగిన్', 'Login')}
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                    </>
                  )}
               </div>

               {isAuthenticated && (
                 <Button
                    onClick={handleAddDonation}
                    className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground font-black h-11 rounded-2xl px-6 text-sm shadow-xl shadow-primary/20 transition-all active:scale-[0.95] items-center gap-2"
                 >
                    <Plus className="h-5 w-5" />
                    {t('చందా జోడించు', 'Add Chanda')}
                 </Button>
               )}
            </div>
          </div>
        </div>

        {/* Navigation moved to bottom for consistency */}

        {/* Stats Grid - 3 Cards */}
        {/* Dashboard Summary Card */}
        <div className="mb-6">
          <Card className="bg-gradient-to-br from-white to-slate-50 shadow-md border-none overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <TrendingUp className="h-32 w-32 -mr-8 -mt-8 text-primary" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Primary Stat */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest">{t('మొత్తం సేకరణ', 'TOTAL COLLECTION')}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-4xl font-black text-foreground tracking-tight">₹{totalReceived.toLocaleString()}</h2>
                    <span className="text-sm font-medium text-muted-foreground">of ₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold border border-emerald-100">
                      <ArrowUpRight className="h-3 w-3" />
                      {totalProgress.toFixed(1)}%
                    </div>
                    <div className="flex items-center gap-1.5 bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold border border-red-100">
                      <span className="opacity-70 font-medium">{t('బాకీ', 'Due')}:</span>
                      ₹{pendingTotal.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                      <Users className="h-3.5 w-3.5" />
                      {searchFiltered.length} {t('దాతలు', 'Donors')}
                    </div>
                  </div>
                </div>

                {/* Vertical Divider (Desktop) */}
                <div className="hidden md:block w-px h-16 bg-slate-200"></div>

                {/* Secondary Stats Grid */}
                <div className="grid grid-cols-2 gap-8 md:gap-12">
                  {/* Chanda Stat */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Wallet className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">{t('చందా', 'CHANDA')}</span>
                    </div>
                    <p className="text-xl font-bold">₹{totalChandaReceived.toLocaleString()}</p>
                    <div className="w-16 h-1 bg-blue-100 rounded-full overflow-hidden">
                       <div className="bg-blue-500 h-full" style={{ width: `${chandaProgress}%` }}></div>
                    </div>
                  </div>

                  {/* Sponsorship Stat */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-purple-600">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">{t('స్పాన్సర్‌షిప్‌లు', 'SPONSORSHIPS')}</span>
                    </div>
                    <p className="text-xl font-bold">₹{totalSponsorshipReceived.toLocaleString()}</p>
                    <div className="w-16 h-1 bg-purple-100 rounded-full overflow-hidden">
                       <div className="bg-purple-500 h-full" style={{ width: `${sponsorshipProgress}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Master Progress Bar (Bottom) */}
              <div className="mt-6 w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                 <div className="bg-blue-500 h-full transition-all duration-700" style={{ width: `${(totalChandaReceived / totalAmount) * 100}%` }}></div>
                 <div className="bg-purple-500 h-full transition-all duration-700" style={{ width: `${(totalSponsorshipReceived / totalAmount) * 100}%` }}></div>
                 <div className="bg-slate-200 h-full flex-1"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management View: Tabs + Search + Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
           {/* Tab Header */}
           <div className="flex items-center justify-between border-b border-slate-50 px-4 pt-4">
              <div className="flex items-center gap-6">
                 <button 
                   onClick={() => handleCategoryChange('chanda')}
                   className={`flex items-center gap-2 pb-3 text-sm font-bold tracking-tight transition-all relative ${activeCategory === 'chanda' ? 'text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}
                 >
                   {t('చందా', 'Chanda')}
                   <span className="text-[10px] bg-blue-50 px-1.5 py-0.5 rounded-full text-blue-600 border border-blue-100 font-bold">{chandaCount}</span>
                   {activeCategory === 'chanda' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />}
                 </button>
                 <button 
                   onClick={() => handleCategoryChange('sponsorship')}
                   className={`flex items-center gap-2 pb-3 text-sm font-bold tracking-tight transition-all relative ${activeCategory === 'sponsorship' ? 'text-purple-600' : 'text-muted-foreground hover:text-foreground'}`}
                 >
                   {t('స్పాన్సర్‌షిప్‌లు', 'Sponsorships')}
                   <span className="text-[10px] bg-purple-50 px-1.5 py-0.5 rounded-full text-purple-600 border border-purple-100 font-bold">{sponsorshipCount}</span>
                   {activeCategory === 'sponsorship' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-full" />}
                 </button>
              </div>
           </div>

           {/* Filter Toolbar */}
           <div className="p-4 bg-slate-50/30 flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 w-full">
                 <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
                 <input
                   type="text"
                   placeholder={t('పేరు లేదా మొత్తం ద్వారా శోధించండి...', 'Search by name or amount...')}
                   className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>

              {/* Status & Sort Selectors */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                 <select 
                    className="flex-1 md:w-40 bg-white border border-slate-200 text-foreground py-2 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                 >
                    <option value="all">{t('అన్ని', 'All Status')}</option>
                    <option value="received">{t('స్వీకరించబడింది', 'Received')}</option>
                    <option value="pending">{t('పెండింగ్', 'Pending')}</option>
                 </select>
                 
                 <select 
                    className="flex-1 md:w-40 bg-white border border-slate-200 text-foreground py-2 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                 >
                    <option value="">{t('ఫిల్టర్', 'Filter')}</option>
                    <option value="amount-desc">High → Low</option>
                    <option value="amount-asc">Low → High</option>
                    <option value="name-asc">Name: A - Z</option>
                 </select>

                 <Button
                    variant="outline"
                    onClick={() => setNamePreference(prev => prev === 'telugu' ? 'english' : 'telugu')}
                    className="h-10 w-10 p-0 rounded-xl border-slate-200 bg-white hover:bg-slate-50 flex-shrink-0"
                    title="Change Language"
                 >
                    <span className="text-xs font-black">{namePreference === 'telugu' ? 'తె' : 'EN'}</span>
                 </Button>
              </div>
           </div>
        </div>

        {/* Filter Summary */}
        {(searchTerm || statusFilter !== 'all' || showDuplicates) && (
          <div className="mb-4 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 flex flex-wrap justify-between items-center gap-3">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t('ఫిల్టర్ సారాంశం', 'Filter Summary')}
             </div>
             <div className="flex flex-wrap gap-x-6 gap-y-2 items-center text-sm">
                <span className="font-medium text-slate-600">
                   {t('మొత్తం చందా', 'Total Amount')}: <strong className="text-slate-800 font-sans">₹{filteredTotalAmount.toLocaleString()}</strong>
                </span>
                <div className="hidden sm:block w-px h-4 bg-slate-200"></div>
                <span className="font-medium text-slate-600">
                   {t('స్వీకరించబడింది', 'Received')}: <strong className="text-emerald-600 font-sans">₹{filteredTotalReceived.toLocaleString()}</strong>
                </span>
                <div className="hidden sm:block w-px h-4 bg-slate-200"></div>
                <span className="font-medium text-slate-600">
                   {t('పెండింగ్', 'Pending')}: <strong className="text-red-500 font-sans">₹{filteredTotalPending.toLocaleString()}</strong>
                </span>
             </div>
          </div>
        )}

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
             <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
               {/* Desktop Table View */}
               <div className="hidden md:block">
                 <Table>
                   <TableHeader className="bg-slate-50">
                     <TableRow>
                       <TableHead className="font-semibold">{t('దాత', 'Contributor')}</TableHead>
                       <TableHead className="font-semibold">{t('తేదీ', 'Date')}</TableHead>
                       <TableHead className="font-semibold">{t('విధానం', 'Mode')}</TableHead>
                       <TableHead className="text-right font-semibold">{t('మొత్తం', 'Amount')}</TableHead>
                       <TableHead className="font-semibold text-center">{t('స్థితి', 'Status')}</TableHead>
                       <TableHead className="w-[100px]"></TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {processedDonations.map((donation) => (
                       <TableRow key={donation.id} className="group hover:bg-slate-50 transition-colors">
                         <TableCell>
                           <div className="flex items-center gap-3">
                             <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                               donation.category === 'sponsorship' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                             }`}>
                               {(donation.name_english?.[0] || donation.name?.[0] || '?').toUpperCase()}
                             </div>
                             <div>
                               <p className="font-medium text-foreground">
                                  {namePreference === 'english' 
                                    ? (donation.name_english || donation.name || '').toUpperCase() 
                                    : (donation.name || (donation.name_english || '').toUpperCase())}
                               </p>
                               {donation.category === 'sponsorship' && (
                                 <p className="text-xs text-muted-foreground">{donation.type}</p>
                               )}
                             </div>
                           </div>
                         </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {donation.created_at ? new Date(donation.created_at).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-foreground/80">
                                {donation.donation_mode === 'goods' ? <Package className="h-3.5 w-3.5 text-orange-500" /> :
                                 donation.donation_mode === 'service' ? <HandHelping className="h-3.5 w-3.5 text-purple-500" /> :
                                 donation.payment_method === 'upi' ? <CreditCard className="h-3.5 w-3.5 text-blue-500" /> : // UPI
                                 <Wallet className="h-3.5 w-3.5 text-emerald-500" /> // Cash
                                }
                              <span className="capitalize">
                                  {donation.donation_mode === 'cash' ? (donation.payment_method === 'upi' ? 'UPI' : 'Cash') : (donation.donation_mode || 'Cash')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            <div>₹{donation.amount.toLocaleString()}</div>
                            {(donation.amount - (donation.received_amount ?? donation.amount)) > 0 && (
                              <div className="text-xs text-red-500 font-semibold mt-0.5">
                                {t('బాకీ', 'Pending')}: ₹{(donation.amount - (donation.received_amount ?? 0)).toLocaleString()}
                              </div>
                            )}
                          </TableCell>
                           <TableCell className="text-center">
                            {(donation.received_amount ?? donation.amount) >= donation.amount ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {t('స్వీకరించబడింది', 'Received')}
                              </span>
                            ) : (donation.received_amount || 0) > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                {t('పాక్షికం', 'Partial')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {t('బాకీ', 'Pending')}
                             </span>
                           )}
                          </TableCell>
                         <TableCell>
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditDonation(donation)}>
                                   <span className="sr-only">Edit</span>
                                   <svg
                                     width="15"
                                     height="15"
                                     viewBox="0 0 15 15"
                                     fill="none"
                                     xmlns="http://www.w3.org/2000/svg"
                                     className="h-4 w-4"
                                   >
                                     <path
                                       d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1464 1.14645L3.71455 8.57829C3.64594 8.6469 3.59374 8.73177 3.56236 8.825L2.83151 11.0176C2.79374 11.1309 2.82522 11.2566 2.91264 11.3364C3.00006 11.4162 3.1287 11.4348 3.22097 11.3813L5.32043 10.1691C5.40552 10.12 5.47467 10.0503 5.52352 9.96503L12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645L11.8536 1.14645ZM11.5 2.20711L12.1464 2.85355L5.05609 9.94391L4.05372 10.5226L4.54224 9.05705L11.5 2.20711ZM5.5 13H1.5C1.22386 13 1 13.2239 1 13.5C1 13.7761 1.22386 14 1.5 14H5.5C5.77614 14 6 13.7761 6 13.5C6 13.2239 5.77614 13 5.5 13Z"
                                       fill="currentColor"
                                       fillRule="evenodd"
                                       clipRule="evenodd"
                                     ></path>
                                   </svg>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeletingDonationId(donation.id)}>
                                   <span className="sr-only">Delete</span>
                                   <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                </Button>
                                <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   className="h-8 w-8 text-muted-foreground hover:text-blue-600" 
                                   onClick={() => {
                                      const settings = selectedFestival?.receipt_settings as any; // Cast from Json
                                      generateReceipt(donation, { 
                                          ...settings,
                                          organization_name: currentOrganization?.name,
                                          // sub_title default to festival name if not configured
                                          sub_title: settings?.sub_title || selectedFestival?.name 
                                      });
                                   }}
                                   title="Download Receipt"
                                >
                                   <FileDown className="h-4 w-4" />
                                </Button>
                            </div>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>

               {/* Mobile List View */}
                <div className="md:hidden space-y-4 px-1">
                  {processedDonations.map((donation) => (
                    <DonationCard 
                      key={donation.id} 
                      donation={donation}
                      onEdit={handleEditDonation}
                      onDelete={(id) => setDeletingDonationId(id)}
                      onReceipt={(d) => {
                          const settings = selectedFestival?.receipt_settings as any;
                          generateReceipt(d, { 
                              ...settings,
                              organization_name: currentOrganization?.name,
                              sub_title: settings?.sub_title || selectedFestival?.name 
                          });
                      }}
                      onAuthRequired={handleAuthRequired}
                      namePreference={namePreference}
                      className="rounded-2xl border border-slate-100 shadow-sm"
                    />
                  ))}
               </div>
             </div>
           )}
         </div>

         {/* Pagination */}
         {totalPages > 1 && (
           <div className="flex justify-between items-center px-2 py-4 border-t mt-4">
              <div className="text-sm text-muted-foreground hidden md:block">
                 Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedDonations.length)} of {sortedDonations.length} results
              </div>
              <div className="flex gap-2 mx-auto md:mx-0">
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                   disabled={currentPage === 1}
                   className="h-8 w-8 p-0"
                 >
                   <span className="sr-only">Previous</span>
                   <ArrowLeft className="h-4 w-4" />
                 </Button>
                    {(() => {
                    const maxButtons = 5;
                    let pages = [];
                    if (totalPages <= maxButtons) {
                      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                    } else if (currentPage <= 3) {
                      pages = [1, 2, 3, 4, 5];
                    } else if (currentPage >= totalPages - 2) {
                      pages = Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
                    } else {
                      pages = [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
                    }
                    return pages.map((p) => (
                      <Button
                        key={p}
                        variant={currentPage === p ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </Button>
                    ));
                  })()}
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                   disabled={currentPage === totalPages}
                   className="h-8 w-8 p-0"
                 >
                   <span className="sr-only">Next</span>
                   <ArrowLeft className="h-4 w-4 rotate-180" />
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
          selectedFestival={selectedFestival ? { name: selectedFestival.name, year: selectedFestival.year } : undefined}
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

         {/* Floating Action Button (FAB) */}
        {isAuthenticated && (
          <Button
              onClick={handleAddDonation}
              className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-0 flex items-center justify-center border-none transition-all active:scale-95 z-50 md:hidden"
              aria-label={t('చందా జోడించు', 'Add Donation')}
          >
              <Plus className="h-8 w-8" />
          </Button>
        )}
      </div>
    </div>
  );
}
