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
    .select(`
      *,
      background_image_rel:images!festivals_background_image_id_fkey(image_url)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get images for each festival to use as background when no specific background is set
  const festivalsWithImages = await Promise.all(
    (festivals || []).map(async (festival: any) => {
      // First check if festival has a specific background image
      let backgroundImage = festival.background_image_rel?.[0]?.image_url || festival.background_image;
      
      // If no specific background, get the latest image from this festival
      if (!backgroundImage) {
        const { data: festivalImages } = await supabase
          .from('images')
          .select('image_url')
          .eq('festival_name', festival.name)
          .eq('festival_year', festival.year)
          .order('created_at', { ascending: false })
          .limit(1);
        
        backgroundImage = festivalImages?.[0]?.image_url || null;
      }
      
      return {
        ...festival,
        background_image: backgroundImage
      };
    })
  );

  return festivalsWithImages;
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

export async function setFestivalBackgroundImage(festivalId: string, imageId: string): Promise<Festival> {
  const { data, error } = await supabase
    .from('festivals')
    .update({ background_image_id: imageId })
    .eq('id', festivalId)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Festival not found or you do not have permission to update it');
  return data;
}