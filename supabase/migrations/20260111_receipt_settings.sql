-- Add receipt_settings column to festivals table
alter table public.festivals 
add column if not exists receipt_settings jsonb default '{"layout": "standard", "show_logo": true, "show_date": true}'::jsonb;
