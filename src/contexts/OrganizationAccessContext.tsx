import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
}

interface OrganizationAccessContextType {
  organization: Organization | null;
  isAuthenticated: boolean;
  loading: boolean;
  authenticate: (passcode: string) => Promise<boolean>;
  logout: () => void;
}

const OrganizationAccessContext = createContext<OrganizationAccessContextType | undefined>(undefined);

export const useOrganizationAccess = () => {
  const context = useContext(OrganizationAccessContext);
  if (!context) {
    throw new Error('useOrganizationAccess must be used within OrganizationAccessProvider');
  }
  return context;
};

interface OrganizationAccessProviderProps {
  children: ReactNode;
  slug: string;
}

export const OrganizationAccessProvider = ({ children, slug }: OrganizationAccessProviderProps) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganization();
    checkStoredAuth();
  }, [slug]);

  const fetchOrganization = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, description, logo_url')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      setOrganization(data);
    } catch (error) {
      console.error('Error fetching organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkStoredAuth = () => {
    const storedAuth = localStorage.getItem(`org_auth_${slug}`);
    if (storedAuth) {
      setIsAuthenticated(true);
    }
  };

  const authenticate = async (passcode: string): Promise<boolean> => {
    if (!organization) return false;

    try {
      const { data, error } = await supabase.rpc('verify_organization_passcode', {
        _organization_id: organization.id,
        _passcode: passcode
      });

      if (error) throw error;

      if (data) {
        setIsAuthenticated(true);
        localStorage.setItem(`org_auth_${slug}`, 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error verifying passcode:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(`org_auth_${slug}`);
  };

  return (
    <OrganizationAccessContext.Provider
      value={{ organization, isAuthenticated, loading, authenticate, logout }}
    >
      {children}
    </OrganizationAccessContext.Provider>
  );
};
