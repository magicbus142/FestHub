import { supabase } from '@/integrations/supabase/client';

const PREVIOUS_AMOUNT_KEY = 'previous_amount';

export const getPreviousAmount = async (): Promise<number> => {
  const sb: any = supabase as any;
  const { data, error } = await sb
    .from('settings')
    .select('value')
    .eq('key', PREVIOUS_AMOUNT_KEY)
    .maybeSingle();

  if (error) throw error;
  return Number(data?.value ?? 0) || 0;
};

export const setPreviousAmount = async (value: number): Promise<void> => {
  const sb: any = supabase as any;
  const { error } = await sb
    .from('settings')
    .upsert({ key: PREVIOUS_AMOUNT_KEY, value })
    .eq('key', PREVIOUS_AMOUNT_KEY);
  if (error) throw error;
};
