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
  // Mock data until festivals table is created in database
  return [
    {
      id: '1',
      name: 'Ganesh Chaturthi',
      year: 2024,
      background_color: 'hsl(var(--festival-orange))',
      background_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
      is_active: true,
    },
    {
      id: '2', 
      name: 'Dashara',
      year: 2024,
      background_color: 'hsl(var(--festival-gold))',
      background_image: 'https://images.unsplash.com/photo-1605538883669-825200433431?w=800&h=600&fit=crop',
      is_active: true,
    }
  ];
}

export async function getActiveFestivals(): Promise<Festival[]> {
  const allFestivals = await getAllFestivals();
  return allFestivals.filter(festival => festival.is_active);
}

export async function addFestival(festival: Omit<Festival, 'id' | 'created_at' | 'updated_at'>): Promise<Festival> {
  // This will work once festivals table exists in database
  throw new Error('Festival table not yet available. Please confirm the database migration first.');
}

export async function updateFestival(id: string, festival: Partial<Festival>): Promise<Festival> {
  throw new Error('Festival table not yet available. Please confirm the database migration first.');
}

export async function deleteFestival(id: string): Promise<void> {
  throw new Error('Festival table not yet available. Please confirm the database migration first.');
}