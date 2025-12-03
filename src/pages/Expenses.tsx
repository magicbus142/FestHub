import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFestival } from '@/contexts/FestivalContext';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addExpense, getExpensesByFestival, getTotalExpensesByFestival, deleteExpense, updateExpense, type Expense } from '@/lib/expenses';
import { Plus, Trash2, Receipt, Edit2, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { AuthDialog } from '@/components/AuthDialog';
import { PageHeader } from '@/components/PageHeader';
import { BackButton } from '@/components/BackButton';

export default function Expenses() {
  const { t, language, setLanguage } = useLanguage();
  const { selectedFestival } = useFestival();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: '',
    amount: '',
    description: ''
  });

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

  const addExpenseMutation = useMutation({
    mutationFn: (expense: { type: string; amount: number; description?: string }) =>
      addExpense({
        ...expense,
        festival_name: selectedFestival?.name || 'Ganesh',
        festival_year: selectedFestival?.year || 2025,
      }, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-expenses-festival', selectedFestival?.name, selectedFestival?.year] });
      queryClient.invalidateQueries({ queryKey: ['total-expenses-festival', selectedFestival?.name, selectedFestival?.year] });
      setIsDialogOpen(false);
      setFormData({ type: '', amount: '', description: '' });
      toast({
        title: t('విజయవంతమైంది', 'Success'),
        description: t('ఖర్చు జోడించబడింది', 'Expense added successfully'),
      });
    },
    onError: (error) => {
      toast({
        title: t('లోపం', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: (payload: { id: string; type: string; amount: number; description?: string }) =>
      updateExpense(payload.id, { type: payload.type, amount: payload.amount, description: payload.description }),
    onSuccess: async () => {
      console.log('Update successful, invalidating queries...');
      
      await queryClient.invalidateQueries({ queryKey: ['user-expenses-festival', selectedFestival?.name, selectedFestival?.year] });
      await queryClient.invalidateQueries({ queryKey: ['total-expenses-festival', selectedFestival?.name, selectedFestival?.year] });
      
      // Force refetch to ensure we get fresh data
      await queryClient.refetchQueries({ queryKey: ['user-expenses-festival', selectedFestival?.name, selectedFestival?.year] });
      await queryClient.refetchQueries({ queryKey: ['total-expenses-festival', selectedFestival?.name, selectedFestival?.year] });
      
      console.log('Queries refetched');
      
      setIsDialogOpen(false);
      setEditingExpenseId(null);
      setFormData({ type: '', amount: '', description: '' });
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
      toast({
        title: t('లోపం', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }

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
      setFormData({ type: '', amount: '', description: '' });
      setIsDialogOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  };

  const startEditExpense = (expense: Expense) => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }
    setEditingExpenseId(expense.id || null);
    setFormData({
      type: expense.type || '',
      amount: String(expense.amount ?? ''),
      description: expense.description || ''
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* Header */}
        <PageHeader
          pageName="Expenses"
          pageNameTelugu="ఖర్చులు"
          description="Track your expenses"
          descriptionTelugu="మీ ఖర్చులను ట్రాక్ చేయండి"
        >
          <div className="flex flex-col gap-3 w-full">
            {/* Back + Language Row */}
            <div className="flex items-center justify-between">
              <BackButton emphasis size="sm" className="rounded-md " />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'telugu' ? 'english' : 'telugu')}
                className="px-3"
              >
                {language === 'telugu' ? 'EN' : 'తె'}
              </Button>
            </div>

            {/* Prominent Add Expense Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="lg"
                    onClick={startAddExpense}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    {isAuthenticated ? (
                      <Plus className="h-5 w-5 mr-2" />
                    ) : (
                      <Lock className="h-5 w-5 mr-2" />
                    )}
                    {t('ఖర్చు జోడించు', 'Add Expense')}
                  </Button>
                </TooltipTrigger>
                {!isAuthenticated && (
                  <TooltipContent>
                    <p>{t('జోడించడానికి లాగిన్ అవసరం', 'Login required to add')}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </PageHeader>

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingExpenseId ? t('ఖర్చు మార్చు', 'Edit Expense') : t('కొత్త ఖర్చు జోడించండి', 'Add New Expense')}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t('ఖర్చు వివరాలను నమోదు చేయండి', 'Enter expense details')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">{t('రకం', 'Type')} *</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder={t('ఖర్చు రకం', 'Expense type')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">{t('మొత్తం', 'Amount')} *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder={t('మొత్తం', 'Amount')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">{t('వివరణ', 'Description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('వివరణ (ఐచ్ఛికం)', 'Description (optional)')}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={addExpenseMutation.isPending || updateExpenseMutation.isPending} className="flex-1">
                  {editingExpenseId
                    ? (updateExpenseMutation.isPending ? t('నవీకరిస్తోంది...', 'Updating...') : t('నవీకరించు', 'Update'))
                    : (addExpenseMutation.isPending ? t('జోడిస్తోంది...', 'Adding...') : t('జోడించు', 'Add'))}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('రద్దు', 'Cancel')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Total Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-red-600" />
              {t('మొత్తం ఖర్చులు', 'Total Expenses')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              ₹{totalExpenses.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <div className="space-y-4">
          {expenses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {t('ఇంకా ఖర్చులు లేవు', 'No expenses yet')}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('కొత్త ఖర్చు జోడించడానికి పైన ఉన్న "జోడించు" బటన్‌ను క్లిక్ చేయండి', 'Click the "Add" button above to add your first expense')}
                </p>
              </CardContent>
            </Card>
          ) : (
            expenses.map((expense: Expense) => (
              <Card key={expense.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{expense.type}</CardTitle>
                      {expense.description && (
                        <CardDescription className="mt-1">
                          {expense.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-red-600">
                        ₹{expense.amount.toLocaleString()}
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => startEditExpense(expense)}>
                              {isAuthenticated ? (
                                <Edit2 className="h-4 w-4" />
                              ) : (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          {!isAuthenticated && (
                            <TooltipContent>
                              <p>{t('సవరించడానికి లాగిన్ అవసరం', 'Login required to edit')}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm">
                                  {isAuthenticated ? (
                                    <Trash2 className="h-4 w-4" />
                                  ) : (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              {!isAuthenticated && (
                                <TooltipContent>
                                  <p>{t('తొలగించడానికి లాగిన్ అవసరం', 'Login required to delete')}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t('ఖర్చు తొలగించు', 'Delete Expense')}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('మీరు ఈ ఖర్చును తొలగించాలని ఖచ్చితంగా అనుకుంటున్నారా? ఈ చర్య రద్దు చేయబడదు.', 'Are you sure you want to delete this expense? This action cannot be undone.')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t('రద్దు', 'Cancel')}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                if (!isAuthenticated) { setIsAuthOpen(true); return; }
                                deleteExpenseMutation.mutate(expense.id!);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t('తొలగించు', 'Delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                {/* {expense.created_at && (
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">
                      {t('జోడించిన తేదీ:', 'Added on:')} {new Date(expense.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                )} */}
              </Card>
            ))
          )}
        </div>

        {/* Navigation */}
        <Navigation />
        <AuthDialog
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={() => setIsAuthOpen(false)}
        />
      </div>
    </div>
  );
}
