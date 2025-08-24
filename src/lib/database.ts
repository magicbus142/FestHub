import { supabase } from '@/integrations/supabase/client';

export interface Donation {
  id?: string;
  name: string;
  amount: number;
  type: string;
  category: 'chanda' | 'sponsorship';
  created_at?: string;
  updated_at?: string;
}

export type SponsorshipType = 'విగ్రహం' | 'లాడు' | 'భోజనం' | 'టిఫిన్';
export type ChandaType = 'చందా' | 'విఘ్రహందాత' | 'ప్రసాదం' | 'వస్త్రం' | 'పుష్పం' | 'ఇతర';

export const addDonation = async (donation: Omit<Donation, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('donations')
    .insert([{
      name: donation.name,
      amount: donation.amount,
      type: donation.type,
      category: donation.category
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateDonation = async (id: string, donation: Omit<Donation, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('donations')
    .update({
      name: donation.name,
      amount: donation.amount,
      type: donation.type,
      category: donation.category
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteDonation = async (id: string) => {
  const { error } = await supabase
    .from('donations')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getAllDonations = async (): Promise<Donation[]> => {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Donation[];
};

export const getDonationsByCategory = async (category: 'chanda' | 'sponsorship'): Promise<Donation[]> => {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Donation[];
};

export const searchDonations = async (searchTerm: string): Promise<Donation[]> => {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .ilike('name', `%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Donation[];
};

export const getTotalAmount = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('donations')
    .select('amount.sum()');

  if (error) throw error;
  return Number(data?.[0]?.sum) || 0;
};

export const getTotalByCategory = async (category: 'chanda' | 'sponsorship'): Promise<number> => {
  const { data, error } = await supabase
    .from('donations')
    .select('amount.sum()')
    .eq('category', category);

  if (error) throw error;
  return Number(data?.[0]?.sum) || 0;
};