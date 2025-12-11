import { createContext, useContext, ReactNode } from 'react';
import { useOrganization } from './OrganizationContext';

interface AuthContextType {
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// This context now delegates to OrganizationContext for authentication
// The hardcoded admin credentials have been removed for security
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { isAuthenticated, logout } = useOrganization();

  return (
    <AuthContext.Provider value={{ isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
