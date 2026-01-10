import { useEffect, useState } from 'react';
import { useParams, useNavigate, Routes, Route } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization, Organization } from '@/contexts/OrganizationContext';

import { YearProvider } from '@/contexts/YearContext';
import { FestivalProvider } from '@/contexts/FestivalContext';
import FestivalSelection from '@/pages/FestivalSelection';
import Dashboard from '@/pages/Dashboard';
import Expenses from '@/pages/Expenses';
import Chandas from '@/pages/Chandas';
import Images from '@/pages/Images';
import VotingList from '@/pages/voting/VotingList';
import ManageCompetitionPage from '@/pages/voting/ManageCompetitionPage';
import Settings from '@/pages/Settings';

import { Loader2 } from 'lucide-react';

import { MainLayout } from '@/components/layout/MainLayout';

export default function OrganizationHome() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { setCurrentOrganization } = useOrganization();
  const [isLoading, setIsLoading] = useState(true);

  const { data: organization } = useQuery({
    queryKey: ['organization', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, description, email, logo_url, theme, enabled_pages, created_at, updated_at')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data as Organization;
    },
    enabled: !!slug
  });

  useEffect(() => {
    if (organization) {
      setCurrentOrganization(organization);
      setIsLoading(false);
    } else if (!organization && !isLoading) {
      // If query is done but no data, redirect
      navigate('/');
    }
  }, [organization, setCurrentOrganization, navigate, isLoading]);

  if (isLoading || !organization) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading organization...</p>
        </div>
      </div>
    );
  }

  return (
      <YearProvider>
        <FestivalProvider>
          <MainLayout>
            <Routes>
              <Route path="/" element={<FestivalSelection />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/chandas" element={<Chandas />} />
              <Route path="/images" element={<Images />} />
              <Route path="/voting" element={<VotingList />} />
              <Route path="/voting/:competitionId/manage" element={<ManageCompetitionPage />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </MainLayout>
        </FestivalProvider>
      </YearProvider>
  );
}
