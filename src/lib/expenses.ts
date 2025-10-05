// Expenses database functions
import { supabase } from '@/integrations/supabase/client';

export interface Expense {
  id?: string;
  user_id?: string;
  type: string;
  amount: number;
  description?: string;
  festival_name?: string;
  festival_year?: number;
  created_at?: string;
  updated_at?: string;
}

export const addExpense = async (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([{
      type: expense.type,
      amount: expense.amount,
      description: expense.description,
      festival_name: expense.festival_name,
      festival_year: expense.festival_year
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getExpenses = async (): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Expense[];
};

export const getTotalExpenses = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('amount');

  if (error) throw error;
  return (data || []).reduce((sum, expense) => sum + expense.amount, 0);
};

export const getExpensesByFestival = async (festivalName: string, festivalYear: number): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('festival_name', festivalName)
    .eq('festival_year', festivalYear)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Expense[];
};

export const getTotalExpensesByFestival = async (festivalName: string, festivalYear: number): Promise<number> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('amount')
    .eq('festival_name', festivalName)
    .eq('festival_year', festivalYear);

  if (error) throw error;
  return (data || []).reduce((sum, expense) => sum + expense.amount, 0);
};

export const updateExpense = async (id: string, expense: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
  const { data, error } = await supabase
    .from('expenses')
    .update(expense)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteExpense = async (id: string) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
};