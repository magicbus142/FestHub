import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  passcode?: string;
  created_at?: string;
  updated_at?: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization) => void;
  isAuthenticated: boolean;
  authenticate: (passcode: string) => boolean;
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
        setCurrentOrgState(org);
        
        // Check if authenticated for this org
        if (savedAuth === 'true' && savedOrgId === org.id) {
          setIsAuthenticated(true);
        }
      } catch {
        localStorage.removeItem('currentOrganization');
      }
    }
  }, []);

  const setCurrentOrganization = (org: Organization) => {
    setCurrentOrgState(org);
    localStorage.setItem('currentOrganization', JSON.stringify(org));
    
    // Check if we're already authenticated for this org
    const savedAuth = localStorage.getItem('orgAuthenticated');
    const savedOrgId = localStorage.getItem('orgAuthId');
    
    if (savedAuth === 'true' && savedOrgId === org.id) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  };

  const authenticate = (passcode: string) => {
    if (!currentOrganization) return false;
    
    if (passcode === currentOrganization.passcode) {
      setIsAuthenticated(true);
      localStorage.setItem('orgAuthenticated', 'true');
      localStorage.setItem('orgAuthId', currentOrganization.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('orgAuthenticated');
    localStorage.removeItem('orgAuthId');
  };

  return (
    <OrganizationContext.Provider value={{
      currentOrganization,
      setCurrentOrganization,
      isAuthenticated,
      authenticate,
      logout
    }}>
      {children}
    </OrganizationContext.Provider>
  );
};
