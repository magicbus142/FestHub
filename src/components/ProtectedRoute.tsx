import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useSupabaseAuth();
  const location = useLocation();

  if (loading) return null; // Could render a spinner if desired
  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />;
  return <>{children}</>;
};

export default ProtectedRoute;
