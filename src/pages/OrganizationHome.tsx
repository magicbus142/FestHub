import { useParams, Navigate } from 'react-router-dom';
import { OrganizationAccessProvider } from '@/contexts/OrganizationAccessContext';
import Dashboard from './Dashboard';

export default function OrganizationHome() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return <Navigate to="/" replace />;
  }

  return (
    <OrganizationAccessProvider slug={slug}>
      <Dashboard />
    </OrganizationAccessProvider>
  );
}
