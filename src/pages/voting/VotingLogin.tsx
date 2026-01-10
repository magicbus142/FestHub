import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function VotingLogin() {
  const { slug, competitionId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    // Check for existing device ID
    let deviceId = localStorage.getItem('device_id');
    
    // If no device ID, generate one
    if (!deviceId) {
      // Generate a 10-digit random ID to mock a phone number and ensure DB compatibility
      const randomId = Math.floor(Math.random() * 9000000000) + 1000000000;
      deviceId = randomId.toString();
      localStorage.setItem('device_id', deviceId);
    }

    // Redirect to gallery immediately
    // Small delay for UX or immediate? Immediate is better for "seamless" feel.
    if (slug && competitionId) {
       navigate(`/org/${slug}/vote/${competitionId}/gallery`, { replace: true });
    }
  }, [navigate, slug, competitionId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-8 flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
           {t('ఓటింగ్ లోడ్ అవుతోంది...', 'Setting up voting...')}
        </p>
      </Card>
    </div>
  );
}
