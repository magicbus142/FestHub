// Supabase database functions for donations management
import { supabase } from '@/integrations/supabase/client';

export interface Donation {
  id?: string;
  name: string; // Telugu name in DB
  name_english?: string;
  amount: number;
  type: string;
  category: 'chanda' | 'sponsorship';
  created_at?: string;
  updated_at?: string;
}

export type SponsorshipType = 'విగరహం' | 'ల్డడు' | 'Day1-భోజనం' | 'Day2-భోజనం' | 'Day3-భోజనం' | 'Day1-టిఫిన్' | 'Day2-టిఫిన్' | 'Day3-టిఫిన్' | 'ఇతర';
export type ChandaType = 'చందా';

export const addDonation = async (donation: Omit<Donation, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('donations')
    .insert([{
      // Telugu goes into 'name', English into 'name_english'
      name: donation.name,
      name_english: donation.name_english,
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
      name_english: donation.name_english,
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

export const getDonationsByFestival = async (festivalName: string, festivalYear: number, category?: 'chanda' | 'sponsorship'): Promise<Donation[]> => {
  let query = supabase
    .from('donations')
    .select('*')
    .eq('festival_name', festivalName)
    .eq('festival_year', festivalYear);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Donation[];
};

export const searchDonations = async (searchTerm: string): Promise<Donation[]> => {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,name_english.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Donation[];
};


export const getTotalAmount = async (): Promise<number> => {
  const { data, error } = await supabase
    .rpc('get_total_amount');

  if (error) throw error;
  return Number(data) || 0;
};

export const getTotalByCategory = async (category: 'chanda' | 'sponsorship'): Promise<number> => {
  const { data, error } = await supabase
    .rpc('get_total_by_category', { category_param: category });

  if (error) throw error;
  return Number(data) || 0;
};

export const getTotalByFestival = async (festivalName: string, festivalYear: number, category?: 'chanda' | 'sponsorship'): Promise<number> => {
  let query = supabase
    .from('donations')
    .select('amount');

  query = query
    .eq('festival_name', festivalName)
    .eq('festival_year', festivalYear);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).reduce((sum, donation) => sum + donation.amount, 0);
};