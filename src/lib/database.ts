// Supabase database functions for donations management
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

export type SponsorshipType = 'విగ్రహం' | 'లాడు' | 'Day1-భోజనం' | 'Day2-భోజనం' | 'Day3-భోజనం' | 'Day1-టిఫిన్' | 'Day2-టిఫిన్' | 'Day3-టిఫిన్' | 'ఇతర';
export type ChandaType = 'చందా';

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
    .or(`name.ilike.%${searchTerm}%,name_telugu.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Donation[];
};

export const searchDonationsWithTranslation = async (searchTerm: string): Promise<Donation[]> => {
  try {
    // First try to translate the search term
    const { data: translationData, error: translationError } = await supabase.functions.invoke('translate-search', {
      body: { searchTerm }
    });

    let searchTerms = [searchTerm];
    
    if (!translationError && translationData?.translatedTerm && translationData.translatedTerm !== searchTerm) {
      searchTerms.push(translationData.translatedTerm);
    }

    // Search with both original and translated terms
    const searchQuery = searchTerms.map(term => 
      `name.ilike.%${term}%,name_telugu.ilike.%${term}%`
    ).join(',');

    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .or(searchQuery)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Donation[];
  } catch (error) {
    console.error('Search with translation failed, falling back to basic search:', error);
    return searchDonations(searchTerm);
  }
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