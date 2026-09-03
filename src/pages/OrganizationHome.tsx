import { useEffect } from 'react';
import { useParams, useNavigate, Routes, Route, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase, getSupabaseClientForOrg, supabasePrimary, supabaseSecondary } from '@/integrations/supabase/client';
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
  const [searchParams] = useSearchParams();
  const { setCurrentOrganization, setAllowedPages } = useOrganization();

  // Handle shared link query params
  useEffect(() => {
    const pagesParam = searchParams.get('pages');
    if (pagesParam) {
      const pages = pagesParam.split(',');
      setAllowedPages(pages);
    }
  }, [searchParams, setAllowedPages]);

  const { data: organization, isPending, isError } = useQuery({
    queryKey: ['organization', slug],
    queryFn: async () => {
      let client = getSupabaseClientForOrg(slug);
      let { data, error } = await client
        .from('organizations')
        .select('id, name, slug, description, email, logo_url, theme, enabled_pages, created_at, updated_at')
        .eq('slug', slug)
        .single();
      
      // Fallback lookup across databases if not found on initial client
      if ((error || !data) && supabaseSecondary && client !== supabaseSecondary) {
        const res = await supabaseSecondary
          .from('organizations')
          .select('id, name, slug, description, email, logo_url, theme, enabled_pages, created_at, updated_at')
          .eq('slug', slug)
          .single();
        if (res.data) {
          data = res.data;
          error = null;
        }
      } else if ((error || !data) && client !== supabasePrimary) {
        const res = await supabasePrimary
          .from('organizations')
          .select('id, name, slug, description, email, logo_url, theme, enabled_pages, created_at, updated_at')
          .eq('slug', slug)
          .single();
        if (res.data) {
          data = res.data;
          error = null;
        }
      }

      if (error) throw error;
      return data as Organization;
    },
    enabled: !!slug
  });

  useEffect(() => {
    if (organization) {
      setCurrentOrganization(organization);
    } else if (isError) {
      navigate('/');
    }
  }, [organization, setCurrentOrganization, navigate, isError]);

  if (isPending || !organization) {
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
