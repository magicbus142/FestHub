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
import { BarChart3, DollarSign, Plus, ArrowLeft, Lock, TrendingUp, Wallet, CreditCard, Download, Package, HandHelping } from 'lucide-react';
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
  const { isAuthenticated, currentOrganization } = useOrganization();
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

  /* Removed local generateReceipt function in favor of utility */


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        {/* Custom Header Layout matching Standard Design */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="space-y-1">
             {/* Breadcrumbs */}
             <div className="flex items-center text-xs text-muted-foreground mb-4">
                <span>Home</span>
                <span className="mx-2">›</span>
                <span>{selectedFestival?.name || 'Festival'}</span>
                <span className="mx-2">›</span>
                <span className="font-medium text-foreground">Finances</span>
             </div>

             <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
               {t('పండుగ ఆర్థికం', 'Festival Finances')}
             </h1>
          </div>

           {/* Controls Row */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-center gap-2">
                <BackButton className="rounded-xl shadow-sm bg-accent/50 text-primary hover:bg-accent border-0" />
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setLanguage(language === 'telugu' ? 'english' : 'telugu')}
                    className="h-10 w-10 rounded-full border-slate-200"
                >
                   {language === 'telugu' ? 'EN' : 'తె'}
                </Button>
                <ThemeSwitcher />
             </div>
             
             {/* Prominent Add Button (Top Right) */}
             <Button
                onClick={handleAddDonation}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 rounded-full px-6 text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98] md:ml-auto w-full md:w-auto"
            >
                <Plus className="h-5 w-5 mr-2" />
                {t('చందా జోడించు', 'Add Chanda')}
            </Button>
           </div>
        </div>

        {/* Navigation moved to bottom for consistency */}

        {/* Stats Grid - 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Collection */}
          <Card className="bg-white shadow-sm border-slate-100">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {t('మొత్తం సేకరణ', 'TOTAL COLLECTION')}
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    ₹{totalReceived.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/ ₹{totalAmount.toLocaleString()}</span>
                  </h3>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Wallet className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                    {searchFiltered.length} {t('దాతలు', 'Donors')}
                  </span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full mb-2">
                <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${totalProgress}%` } as React.CSSProperties}></div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('పెండింగ్', 'Pending')}: <span className="font-medium text-foreground">₹{pendingTotal.toLocaleString()}</span>
              </p>
            </CardContent>
          </Card>

          {/* Chanda (Individual) */}
          <Card className="bg-white shadow-sm border-slate-100">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {t('చందా (వ్యక్తిగతం)', 'CHANDA (INDIVIDUAL)')}
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    ₹{totalChandaReceived.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/ ₹{totalChandaAmount.toLocaleString()}</span>
                  </h3>
                </div>
                 <div className="flex flex-col items-end gap-1">
                   {/* Placeholder for alignment or specific icon */}
                   <span className="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                     {chandaCount} {t('దాతలు', 'Donors')}
                   </span>
                 </div>
              </div>
               {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full mb-2">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${chandaProgress}%` } as React.CSSProperties}></div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('పెండింగ్', 'Pending')}: <span className="font-medium text-foreground">₹{pendingChanda.toLocaleString()}</span>
              </p>
            </CardContent>
          </Card>

           {/* Sponsorships */}
           <Card className="bg-white shadow-sm border-slate-100">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {t('స్పాన్సర్‌షిప్‌లు', 'SPONSORSHIPS')}
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    ₹{totalSponsorshipReceived.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/ ₹{totalSponsorshipAmount.toLocaleString()}</span>
                  </h3>
                </div>
                 <div className="flex flex-col items-end gap-1">
                   <span className="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                     {sponsorshipCount} {t('దాతలు', 'Donors')}
                   </span>
                 </div>
              </div>
               {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full mb-2">
                <div className="bg-purple-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${sponsorshipProgress}%` } as React.CSSProperties}></div>
              </div>
              <p className="text-xs text-muted-foreground">
                 {t('పెండింగ్', 'Pending')}: <span className="font-medium text-foreground">₹{pendingSponsorship.toLocaleString()}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Wrapper for Tabs and Search to look integrated */}
        <div className="bg-white p-1 rounded-t-xl border-b-0">
           {/* Tabs: Styled as simple text tabs with blue underline active state */}
           <div className="flex items-center gap-6 px-4 md:px-6 mb-4 mt-2 overflow-x-auto pb-2 md:pb-0">
              <button 
                onClick={() => handleCategoryChange('chanda')}
                className={`flex items-center gap-2 pb-2 text-sm font-medium transition-all whitespace-nowrap ${activeCategory === 'chanda' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <div className="bg-blue-100 p-1 rounded-md"><Wallet className="h-3 w-3 text-blue-600"/></div>
                {t('చందా', 'Chanda')} <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-600">{chandaCount}</span>
              </button>
              <button 
                onClick={() => handleCategoryChange('sponsorship')}
                className={`flex items-center gap-2 pb-2 text-sm font-medium transition-all whitespace-nowrap ${activeCategory === 'sponsorship' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <div className="bg-purple-100 p-1 rounded-md"><CreditCard className="h-3 w-3 text-purple-600"/></div>
                {t('స్పాన్సర్‌షిప్‌లు', 'Sponsorships')} <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-600">{sponsorshipCount}</span>
              </button>
           </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border-y border-slate-100 px-4 md:px-6 py-3 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm mb-4">
           {/* Search */}
           <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={t('పేరు లేదా ఫోన్ నంబర్ ద్వారా శోధించండి...', 'Search by name, phone...')}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition duration-150 ease-in-out"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>

           {/* Filters & Export */}
           <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative">
                  <select 
                     aria-label={t('స్థితిని ఎంచుకోండి', 'Select Status')}
                     className="appearance-none bg-white border border-slate-200 text-foreground py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-40"
                     value={statusFilter}
                     onChange={(e) => {
                       setStatusFilter(e.target.value as any);
                       setCurrentPage(1); // Reset page on filter change
                     }}
                  >
                     <option value="all">{t('అన్ని', 'All Status')}</option>
                     <option value="received">{t('స్వీకరించబడింది', 'Received')}</option>
                     <option value="pending">{t('పెండింగ్', 'Pending')}</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-foreground">
                     <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
               </div>

              <div className="relative">
                 <select 
                    aria-label={t('క్రమబద్ధీకరించు', 'Sort Order')}
                    className="appearance-none bg-white border border-slate-200 text-foreground py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-40"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                 >
                    <option value="">{t('ఫిల్టర్', 'Filter')}</option>
                    <option value="amount-desc">Amount: High ↓ Low</option>
                    <option value="amount-asc">Amount: Low ↑ High</option>
                    <option value="name-asc">Name: A - Z</option>
                    <option value="name-desc">Name: Z - A</option>
                 </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-foreground">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                 </div>
              </div>
              
              {/* Name Language Toggle moved here */}
              <Button
                  variant="outline"
                  onClick={() => setNamePreference(prev => prev === 'telugu' ? 'english' : 'telugu')}
                  className="h-9 px-3 gap-2 border-slate-200"
                  title={t('పేరు భాష మార్చండి', 'Change Name Language')}
              >
                  <span className="text-xs font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      {namePreference === 'telugu' ? 'తె' : 'En'}
                  </span>
                  <span className="text-sm hidden sm:inline">{namePreference === 'telugu' ? 'To English' : 'To Telugu'}</span>
              </Button>
              
              {/* <Button variant="outline" className="h-9 gap-2" onClick={handleExport}>
                 <Download className="h-4 w-4 text-muted-foreground" />
                 <span className="hidden sm:inline">{t('ఎగుమతి', 'Export')}</span>
              </Button> */}
           </div>
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
                                 {namePreference === 'english' ? (donation.name_english || donation.name) : (donation.name || donation.name_english)}
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
                            {/* Pending Logic: Treat null received_amount as 0 ONLY if explicitly not matching amount? 
                                Actually, for legacy compatibility: if received_amount is null, assume IT IS PAID (amount). 
                                BUT for this specific requirement, the user wants to see pending. 
                                Let's assume database handles defaults or we stick to: received_amount || 0.
                            */}
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
               <div className="md:hidden divide-y divide-slate-100">
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
                      className="border-0 shadow-none rounded-none first:rounded-t-lg last:rounded-b-lg"
                    />
                  ))}
               </div>
             </div>
           )}
         </div>

         {/* Pagination */}
         {/* ... kept same ... */}
         {totalPages > 1 && (
           /* ... existing pagination code ... */
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
                 {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                    // Simple logic for page numbers, improving this is a bonus
                    const p = i + 1; 
                    return (
                       <Button
                          key={p}
                          variant={currentPage === p ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setCurrentPage(p)}
                       >
                          {p}
                       </Button>
                    )
                 })}
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

      </div>
    </div>
  );
}
