// Expenses database functions
import { supabase } from '@/integrations/supabase/client';

export interface Expense {
  id?: string;
  user_id?: string;
  type: string;
  amount: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export const addExpense = async (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([{
      type: expense.type,
      amount: expense.amount,
      description: expense.description
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

export const deleteExpense = async (id: string) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
};