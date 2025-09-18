// Images database functions
import { supabase } from '@/integrations/supabase/client';

export interface ImageRecord {
  id?: string;
  user_id?: string;
  title: string;
  description?: string;
  image_url: string;
  image_path: string;
  created_at?: string;
  updated_at?: string;
}

export const uploadImage = async (file: File, title: string, description?: string) => {
  // Upload file to storage
  const fileExt = file.name.split('.').pop();
  const fileName = `public/${Date.now()}.${fileExt}`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('user-images')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('user-images')
    .getPublicUrl(fileName);

  // Save to database with festival info
  const { data, error } = await supabase
    .from('images')
    .insert([{
      title,
      description,
      image_url: publicUrl,
      image_path: fileName,
      festival_name: 'Ganesh',
      festival_year: 2025
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getImages = async (): Promise<ImageRecord[]> => {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ImageRecord[];
};

export const deleteImage = async (id: string, imagePath: string) => {
  // Delete from storage
  await supabase.storage
    .from('user-images')
    .remove([imagePath]);

  // Delete from database
  const { error } = await supabase
    .from('images')
    .delete()
    .eq('id', id);

  if (error) throw error;
};