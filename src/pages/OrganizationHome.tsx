import { useParams, Navigate, Routes, Route } from 'react-router-dom';
import { OrganizationAccessProvider } from '@/contexts/OrganizationAccessContext';
import Dashboard from './Dashboard';
import OrganizationSettings from './OrganizationSettings';
import Expenses from './Expenses';
import Chandas from './Chandas';
import Images from './Images';
import FestivalSelection from './FestivalSelection';

export default function OrganizationHome() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return <Navigate to="/" replace />;
  }

  return (
    <OrganizationAccessProvider slug={slug}>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="settings" element={<OrganizationSettings />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="chandas" element={<Chandas />} />
        <Route path="images" element={<Images />} />
        <Route path="festival-selection" element={<FestivalSelection />} />
      </Routes>
    </OrganizationAccessProvider>
  );
}
