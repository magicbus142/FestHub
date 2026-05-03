import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFestival } from '@/contexts/FestivalContext';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addExpense, getExpensesByFestival, getTotalExpensesByFestival, deleteExpense, updateExpense, type Expense } from '@/lib/expenses';
import { Plus, Trash2, Receipt, Edit2, Lock, ArrowUpRight, TrendingUp, Wallet, LogOut } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useOrganization } from '@/contexts/OrganizationContext';
import { AuthDialog } from '@/components/AuthDialog';
import { BackButton } from '@/components/BackButton';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

export default function Expenses() {
  const { t, language, setLanguage } = useLanguage();
  const { selectedFestival } = useFestival();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, currentOrganization, logout } = useOrganization();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: '',
    type_english: '',
    amount: '',
    description: ''
  });
  const [namePreference, setNamePreference] = useState<'telugu' | 'english'>('telugu');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<string>('');

  const { data: expenses = [] } = useQuery({
    queryKey: ['user-expenses-festival', selectedFestival?.name, selectedFestival?.year],
    queryFn: () => selectedFestival ? getExpensesByFestival(selectedFestival.name, selectedFestival.year) : [],
    enabled: !!selectedFestival,
  });

  const { data: totalExpenses = 0 } = useQuery({
    queryKey: ['total-expenses-festival', selectedFestival?.name, selectedFestival?.year],
    queryFn: () => selectedFestival ? getTotalExpensesByFestival(selectedFestival.name, selectedFestival.year) : 0,
    enabled: !!selectedFestival,
  });

  const filteredExpenses = expenses
    .filter((exp: Expense) => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;
      return (
        exp.type.toLowerCase().includes(term) ||
        (exp.type_english || '').toLowerCase().includes(term) ||
        (exp.description || '').toLowerCase().includes(term)
      );
    })
    .sort((a: Expense, b: Expense) => {
      if (sortOption === 'amount-desc') return b.amount - a.amount;
      if (sortOption === 'amount-asc') return a.amount - b.amount;
      // Default: latest first
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

  const addExpenseMutation = useMutation({
    mutationFn: (expense: { type: string; amount: number; description?: string }) => {
      if (!currentOrganization?.id) throw new Error("Organization ID is missing");
      return addExpense({
        ...expense,
        festival_name: selectedFestival?.name || 'Ganesh',
        festival_year: selectedFestival?.year || 2025,
      }, currentOrganization.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-expenses-festival', selectedFestival?.name, selectedFestival?.year] });
      queryClient.invalidateQueries({ queryKey: ['total-expenses-festival', selectedFestival?.name, selectedFestival?.year] });
      setIsDialogOpen(false);
      setFormData({ type: '', type_english: '', amount: '', description: '' });
      toast({
        title: t('విజయవంతమైంది', 'Success'),
        description: t('ఖర్చు జోడించబడింది', 'Expense added successfully'),
      });
    },
    onError: (error) => {
      console.error("Add Expense Error:", error);
      toast({
        title: t('లోపం', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: (payload: { id: string; type: string; type_english?: string; amount: number; description?: string }) =>
      updateExpense(payload.id, { type: payload.type, type_english: payload.type_english, amount: payload.amount, description: payload.description }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-expenses-festival', selectedFestival?.name, selectedFestival?.year] });
      await queryClient.invalidateQueries({ queryKey: ['total-expenses-festival', selectedFestival?.name, selectedFestival?.year] });
      setIsDialogOpen(false);
      setEditingExpenseId(null);
      setFormData({ type: '', type_english: '', amount: '', description: '' });
      toast({
        title: t('విజయవంతమైంది', 'Success'),
        description: t('ఖర్చు నవీకరించబడింది', 'Expense updated successfully'),
      });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({
        title: t('లోపం', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-expenses-festival', selectedFestival?.name, selectedFestival?.year] });
      queryClient.invalidateQueries({ queryKey: ['total-expenses-festival', selectedFestival?.name, selectedFestival?.year] });
      toast({
        title: t('విజయవంతమైంది', 'Success'),
        description: t('ఖర్చు తొలగించబడింది', 'Expense deleted successfully'),
      });
    },
    onError: (error) => {
      console.error("Delete Expense Error:", error);
      toast({
        title: t('లోపం', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { setIsAuthOpen(true); return; }
    if (!formData.type || !formData.amount) {
      toast({
        title: t('లోపం', 'Error'),
        description: t('దయచేసి అన్ని అవసరమైన ఫీల్డ్‌లను పూరించండి', 'Please fill all required fields'),
        variant: 'destructive',
      });
      return;
    }
    const payload = {
      type: formData.type,
      type_english: formData.type_english,
      amount: parseFloat(formData.amount),
      description: formData.description
    };
    if (editingExpenseId) {
      updateExpenseMutation.mutate({ id: editingExpenseId, ...payload });
    } else {
      addExpenseMutation.mutate(payload);
    }
  };

  const startAddExpense = () => {
    if (isAuthenticated) {
      setEditingExpenseId(null);
      setFormData({ type: '', type_english: '', amount: '', description: '' });
      setIsDialogOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  };

  const startEditExpense = (expense: Expense) => {
    if (!isAuthenticated) { setIsAuthOpen(true); return; }
    setEditingExpenseId(expense.id || null);
    setFormData({
      type: expense.type || '',
      type_english: expense.type_english || '',
      amount: String(expense.amount ?? ''),
      description: expense.description || ''
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="container mx-auto px-4 py-6">
        
        {/* Unified Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-2 bg-slate-100/50 w-fit px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-slate-200/50">
             <span>Home</span>
             <span className="opacity-30">/</span>
             <span className="text-primary truncate max-w-[100px]">{selectedFestival?.name || 'Festival'}</span>
             <span className="opacity-30">/</span>
             <span className="text-foreground">Expenses</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
               <h1 className="text-4xl font-black text-foreground tracking-tight mb-1">
                 {t('పండుగ ఖర్చులు', 'Festival Expenses')}
               </h1>
               <p className="text-sm text-muted-foreground font-medium">
                  {t('వ్యయాలు మరియు ఖర్చుల ట్రాకింగ్', 'Track and manage festival expenditures')}
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
                      className="h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-600 font-bold text-xs"
                      title={language === 'telugu' ? 'Switch to English' : 'Switch to Telugu'}
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
                        onClick={() => setIsAuthOpen(true)}
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
                    onClick={startAddExpense}
                    className="hidden md:flex bg-red-600 hover:bg-red-700 text-white font-black h-11 rounded-2xl px-6 text-sm shadow-xl shadow-red-200 transition-all active:scale-[0.95] items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    {t('ఖర్చు జోడించు', 'Add Expense')}
                </Button>
               )}
            </div>
          </div>
        </div>

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl border-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">
                {editingExpenseId ? t('ఖర్చు మార్చు', 'Edit Expense') : t('కొత్త ఖర్చు జోడించండి', 'Add New Expense')}
              </DialogTitle>
              <DialogDescription className="font-medium text-slate-500">
                {t('ఖర్చు వివరాలను నమోదు చేయండి', 'Enter expense details')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="font-bold text-slate-700">{t('రకం', 'Type')} *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="తెలుగు పేరు"
                    required
                    className="rounded-xl border-slate-200 focus:ring-red-500"
                  />
                  <Input
                    id="type_english"
                    value={formData.type_english}
                    onChange={(e) => setFormData({ ...formData, type_english: e.target.value })}
                    placeholder="English Name"
                    className="rounded-xl border-slate-200 focus:ring-red-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="font-bold text-slate-700">{t('మొత్తం', 'Amount')} *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder={t('మొత్తం', 'Amount')}
                  required
                  className="rounded-xl border-slate-200 focus:ring-red-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="font-bold text-slate-700">{t('వివరణ', 'Description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('వివరణ (ఐచ్ఛికం)', 'Description (optional)')}
                  rows={3}
                  className="rounded-xl border-slate-200 focus:ring-red-500 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={addExpenseMutation.isPending || updateExpenseMutation.isPending} className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl font-bold">
                  {editingExpenseId
                    ? (updateExpenseMutation.isPending ? t('నవీకరిస్తోంది...', 'Updating...') : t('నవీకరించు', 'Update'))
                    : (addExpenseMutation.isPending ? t('జోడిస్తోంది...', 'Adding...') : t('జోడించు', 'Add'))}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl border-slate-200">
                  {t('రద్దు', 'Cancel')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Expense Summary Dashboard */}
        <Card className="bg-white shadow-sm border border-slate-100 rounded-3xl overflow-hidden relative group mb-8">
           <CardContent className="p-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                 <div>
                    <p className="text-sm font-bold text-muted-foreground tracking-tight">{t('మొత్తం ఖర్చు', 'TOTAL EXPENDITURE')}</p>
                    <h2 className="text-5xl font-black text-red-600 tracking-tighter">
                       ₹{totalExpenses.toLocaleString()}
                    </h2>
                 </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                       <p className="text-[10px] font-black text-muted-foreground uppercase mb-1 tracking-wider">{t('లావాదేవీలు', 'TRANSACTIONS')}</p>
                       <p className="text-xl font-black text-slate-800">{filteredExpenses.length}</p>
                    </div>
                 </div>
              </div>
           </CardContent>
        </Card>

        {/* Management View: Search + Filter */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
           <div className="p-4 bg-slate-50/30 flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 w-full">
                 <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
                 <input
                   type="text"
                   placeholder={t('ఖర్చు పేరు లేదా వివరణ ద్వారా శోధించండి...', 'Search by expense name or description...')}
                   className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-2xl leading-5 bg-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 sm:text-sm transition-all"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                 <select 
                    className="flex-1 md:w-48 bg-white border border-slate-200 text-foreground py-2.5 px-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                 >
                    <option value="">{t('క్రమబద్ధీకరించు', 'Sort By Date')}</option>
                    <option value="amount-desc">High → Low (Amount)</option>
                    <option value="amount-asc">Low → High (Amount)</option>
                 </select>

                 <Button
                    variant="outline"
                    onClick={() => setNamePreference(prev => prev === 'telugu' ? 'english' : 'telugu')}
                    className="h-10 w-10 p-0 rounded-xl border-slate-200 bg-white hover:bg-slate-50 flex-shrink-0"
                    title="Change Name Preference"
                 >
                    <span className="text-xs font-black">{namePreference === 'telugu' ? 'తె' : 'EN'}</span>
                 </Button>
              </div>
           </div>
        </div>

        {/* Expenses List */}
        <div className="space-y-4 mb-20">
          {filteredExpenses.length === 0 ? (
            <Card className="border-dashed border-2 bg-slate-50/50 rounded-3xl">
              <CardContent className="text-center py-16">
                <Receipt className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-600">
                  {searchTerm ? t('శోధన ఫలితాలు లేవు', 'No search results found') : t('ఇంకా ఖర్చులు లేవు', 'No expenses yet')}
                </h3>
                <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
                  {searchTerm 
                    ? t('వేరొక పదాన్ని ప్రయత్నించండి', 'Try searching with a different term')
                    : t('కొత్త ఖర్చు జోడించడానికి "+" బటన్‌ను క్లిక్ చేయండి', 'Click the "+" button to record your first festival expenditure')}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredExpenses.map((expense: Expense) => (
              <Card key={expense.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all rounded-3xl bg-white">
                 <div className="h-1.5 w-full bg-red-100" />
                 <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                       <div className="flex gap-4">
                          <div className="h-14 w-14 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner shadow-red-100/50">
                             <Receipt className="h-7 w-7 text-red-600" />
                          </div>
                          <div>
                             <h3 className="text-xl font-black text-slate-800 tracking-tight flex flex-wrap items-baseline gap-x-2">
                                {namePreference === 'telugu' ? (
                                  <>
                                    <span>{expense.type}</span>
                                    {expense.type_english && (
                                      <span className="text-sm font-bold text-slate-400">
                                        ({expense.type_english})
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <span>{expense.type_english || expense.type}</span>
                                    {expense.type_english && (
                                      <span className="text-sm font-bold text-slate-400">
                                        ({expense.type})
                                      </span>
                                    )}
                                  </>
                                )}
                             </h3>
                             <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {expense.created_at ? new Date(expense.created_at).toLocaleDateString() : ''}
                             </p>
                             {expense.description && (
                                <p className="text-sm text-slate-500 mt-3 italic leading-relaxed border-l-2 border-slate-100 pl-3">
                                   {expense.description}
                                </p>
                             )}
                          </div>
                       </div>

                       <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-4">
                          <div className="text-3xl font-black text-red-600 tracking-tighter">
                             ₹{expense.amount.toLocaleString()}
                          </div>
                          
                          {isAuthenticated && (
                            <div className="flex items-center bg-slate-50 p-1 rounded-2xl opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all border border-slate-100">
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-white rounded-xl"
                                 onClick={() => startEditExpense(expense)}
                               >
                                 <Edit2 className="h-4 w-4" />
                               </Button>

                               <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                     <Button 
                                       variant="ghost" 
                                       size="icon"
                                       className="h-9 w-9 text-slate-400 hover:text-destructive hover:bg-white rounded-xl"
                                     >
                                       <Trash2 className="h-4 w-4" />
                                     </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-3xl border-none p-8">
                                     <AlertDialogHeader>
                                        <AlertDialogTitle className="text-3xl font-black text-slate-800">{t('ఖర్చు తొలగించు', 'Delete Expense')}</AlertDialogTitle>
                                        <AlertDialogDescription className="text-lg font-medium text-slate-500">
                                           {t('మీరు ఈ ఖర్చును తొలగించాలని ఖచ్చితంగా అనుకుంటున్నారా? ఈ చర్య రద్దు చేయబడదు.', 'Are you sure you want to delete this expense? This action cannot be undone.')}
                                        </AlertDialogDescription>
                                     </AlertDialogHeader>
                                     <AlertDialogFooter className="mt-6 gap-3">
                                        <AlertDialogCancel className="rounded-xl border-none bg-slate-100 font-bold h-12 flex-1">{t('రద్దు', 'Cancel')}</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => {
                                            if (expense.id) deleteExpenseMutation.mutate(expense.id);
                                          }}
                                          className="bg-red-600 text-white hover:bg-red-700 rounded-xl font-bold h-12 flex-1"
                                        >
                                          {t('తొలగించు', 'Delete')}
                                        </AlertDialogAction>
                                     </AlertDialogFooter>
                                  </AlertDialogContent>
                               </AlertDialog>
                            </div>
                          )}
                       </div>
                    </div>
                 </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Floating Action Button (FAB) */}
        {isAuthenticated && (
          <Button
              onClick={startAddExpense}
              className="fixed bottom-24 right-6 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white p-0 flex items-center justify-center border-none transition-all active:scale-95 z-50 md:hidden"
              aria-label={t('ఖర్చు జోడించు', 'Add Expense')}
          >
              <Plus className="h-10 w-10" />
          </Button>
        )}

        <AuthDialog
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={() => setIsAuthOpen(false)}
        />
      </div>
    </div>
  );
}
