import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  email?: string;
  theme?: string;
  plan?: string;
  subscription_status?: string;
  enabled_pages?: string[];
  created_at?: string;
  updated_at?: string;
  // Note: passcode is intentionally NOT included - never expose it client-side
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization) => void;
  isAuthenticated: boolean;
  authenticate: (passcode: string) => Promise<boolean>;
  logout: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used within OrganizationProvider');
  return ctx;
};

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [currentOrganization, setCurrentOrgState] = useState<Organization | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load organization and auth from localStorage
  useEffect(() => {
    const savedOrg = localStorage.getItem('currentOrganization');
    const savedAuth = localStorage.getItem('orgAuthenticated');
    const savedOrgId = localStorage.getItem('orgAuthId');
    
    if (savedOrg) {
      try {
        const org = JSON.parse(savedOrg);
        // Remove passcode from saved org if it exists (cleanup from old versions)
        const { passcode, ...cleanOrg } = org;
        setCurrentOrgState(cleanOrg);
        
        // Check if authenticated for this org
        if (savedAuth === 'true' && savedOrgId === cleanOrg.id) {
          setIsAuthenticated(true);
        }
      } catch {
        localStorage.removeItem('currentOrganization');
      }
    }
  }, []);

  const setCurrentOrganization = useCallback((org: Organization) => {
    // Ensure passcode is never stored
    const { passcode, ...cleanOrg } = org as Organization & { passcode?: string };
    
    // Only update if ID has changed to prevent unnecessary re-renders
    setCurrentOrgState(prev => {
        if (prev?.id === cleanOrg.id) return prev;
        return cleanOrg;
    });

    localStorage.setItem('currentOrganization', JSON.stringify(cleanOrg));
    
    // Check if we're already authenticated for this org
    const savedAuth = localStorage.getItem('orgAuthenticated');
    const savedOrgId = localStorage.getItem('orgAuthId');
    
    if (savedAuth === 'true' && savedOrgId === cleanOrg.id) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Server-side passcode verification
  const authenticate = useCallback(async (passcode: string): Promise<boolean> => {
    if (!currentOrganization) return false;
    
    try {
      const { data: isValid, error } = await supabase
        .rpc('verify_organization_passcode', {
          _organization_id: currentOrganization.id,
          _passcode: passcode
        });

      if (error) {
        console.error('Authentication error:', error);
        return false;
      }

      if (isValid) {
        setIsAuthenticated(true);
        localStorage.setItem('orgAuthenticated', 'true');
        localStorage.setItem('orgAuthId', currentOrganization.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }, [currentOrganization]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.removeItem('orgAuthenticated');
    localStorage.removeItem('orgAuthId');
  }, []);

  const value = useMemo(() => ({
      currentOrganization,
      setCurrentOrganization,
      isAuthenticated,
      authenticate,
      logout
  }), [currentOrganization, setCurrentOrganization, isAuthenticated, authenticate, logout]);

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
