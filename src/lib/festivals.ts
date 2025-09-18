import { supabase } from '@/integrations/supabase/client';

export interface Festival {
  id?: string;
  name: string;
  year: number;
  background_color?: string;
  background_image?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function getAllFestivals(): Promise<Festival[]> {
  const { data: festivals, error } = await supabase
    .from('festivals')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get images to use as backgrounds
  const { data: images } = await supabase
    .from('images')
    .select('*')
    .order('created_at', { ascending: false });

  // Map festivals with background images from database
  return (festivals || []).map((festival, index) => ({
    ...festival,
    background_image: festival.background_image || images?.[index]?.image_url || 
      (festival.name === 'Ganesh' ? 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop' :
       'https://images.unsplash.com/photo-1605538883669-825200433431?w=800&h=600&fit=crop')
  }));
}

export async function getActiveFestivals(): Promise<Festival[]> {
  const allFestivals = await getAllFestivals();
  return allFestivals.filter(festival => festival.is_active);
}

export async function addFestival(festival: Omit<Festival, 'id' | 'created_at' | 'updated_at'>): Promise<Festival> {
  const { data, error } = await supabase
    .from('festivals')
    .insert([festival])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFestival(id: string, festival: Partial<Festival>): Promise<Festival> {
  const { data, error } = await supabase
    .from('festivals')
    .update(festival)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFestival(id: string): Promise<void> {
  const { error } = await supabase
    .from('festivals')
    .delete()
    .eq('id', id);

  if (error) throw error;
}