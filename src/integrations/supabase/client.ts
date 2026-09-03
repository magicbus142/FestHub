import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const formatSupabaseUrl = (rawUrl: string): string => {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}.supabase.co`;
};

const SUPABASE_URL = formatSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || "https://geddraorjmehuimildnx.supabase.co");
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlZGRyYW9yam1laHVpbWlsZG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMjk1ODMsImV4cCI6MjA3MTYwNTU4M30.IuzOqVuAVtagB5b_p0q55_g5grN75bL1_kgL3IvVfwU";

// Secondary Supabase Account (Dedicated to NRSA)
const SUPABASE_URL_SECONDARY = formatSupabaseUrl(import.meta.env.VITE_SUPABASE_URL_SECONDARY || "");
const SUPABASE_PUBLISHABLE_KEY_SECONDARY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY_SECONDARY || "";
const SECONDARY_ORG_NAME = (import.meta.env.VITE_SECONDARY_ORG_NAME || "NRSA").toLowerCase();

export const supabasePrimary = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

const initSecondaryClient = (): SupabaseClient<Database> | null => {
  if (!SUPABASE_URL_SECONDARY || !SUPABASE_PUBLISHABLE_KEY_SECONDARY) return null;
  try {
    return createClient<Database>(SUPABASE_URL_SECONDARY, SUPABASE_PUBLISHABLE_KEY_SECONDARY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  } catch (err) {
    console.error('Failed to initialize secondary Supabase client:', err);
    return null;
  }
};

export const supabaseSecondary = initSecondaryClient();

export const getSupabaseClientForOrg = (orgName?: string | null): SupabaseClient<Database> => {
  let targetName = orgName;

  if (!targetName) {
    try {
      if (typeof window !== 'undefined') {
        const match = window.location.pathname.match(/\/org\/([^/]+)/);
        if (match && match[1]) {
          targetName = decodeURIComponent(match[1]);
        }
      }
    } catch {
      // ignore
    }
  }

  if (!targetName) {
    try {
      const savedOrg = localStorage.getItem('currentOrganization');
      if (savedOrg) {
        const org = JSON.parse(savedOrg);
        targetName = org?.name || org?.slug;
      }
    } catch {
      // fallback
    }
  }

  if (targetName) {
    const normalized = targetName.trim().toLowerCase();
    if ((normalized === SECONDARY_ORG_NAME || normalized === 'nrsa') && supabaseSecondary) {
      return supabaseSecondary;
    }
  }
  return supabasePrimary;
};

// Transparent Proxy: dynamic router directing database, auth, storage calls based on active organization
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop: keyof SupabaseClient<Database>) {
    const activeClient = getSupabaseClientForOrg();
    const value = activeClient[prop];
    if (typeof value === 'function') {
      return (value as Function).bind(activeClient);
    }
    return value;
  }
});