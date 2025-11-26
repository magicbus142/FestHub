import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const location = useLocation();

  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />;
  
  // Allow /organizations route without org selection
  if (location.pathname === '/organizations') return <>{children}</>;
  
  // Require organization for all other routes
  if (!currentOrganization) return <Navigate to="/organizations" replace />;
  
  return <>{children}</>;
};

export default ProtectedRoute;
