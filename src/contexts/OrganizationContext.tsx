import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './SupabaseAuthContext';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
}

interface UserRole {
  role: 'admin' | 'manager' | 'viewer';
  organization: Organization;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  userOrganizations: UserRole[];
  setCurrentOrganization: (org: Organization) => void;
  loading: boolean;
  refetchOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used within OrganizationProvider');
  return ctx;
};

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useSupabaseAuth();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserOrganizations = async () => {
    if (!user) {
      setUserOrganizations([]);
      setCurrentOrganization(null);
      setLoading(false);
      return;
    }

    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select(`
          role,
          organization:organizations(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const orgs = (roles || []).map((r: any) => ({
        role: r.role,
        organization: r.organization
      }));

      setUserOrganizations(orgs);

      // Auto-select first org if none selected
      if (orgs.length > 0 && !currentOrganization) {
        setCurrentOrganization(orgs[0].organization);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserOrganizations();
  }, [user]);

  const refetchOrganizations = async () => {
    setLoading(true);
    await fetchUserOrganizations();
  };

  return (
    <OrganizationContext.Provider value={{
      currentOrganization,
      userOrganizations,
      setCurrentOrganization,
      loading,
      refetchOrganizations
    }}>
      {children}
    </OrganizationContext.Provider>
  );
};
