import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useOrganizationAccess } from '@/contexts/OrganizationAccessContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BackButton } from '@/components/BackButton';
import { Loader2, Lock } from 'lucide-react';

export default function OrganizationSettings() {
  const { slug } = useParams<{ slug: string }>();
  const { organization, isAuthenticated, loading } = useOrganizationAccess();
  const { toast } = useToast();
  const [currentPasscode, setCurrentPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [updating, setUpdating] = useState(false);

  if (!slug) {
    return <Navigate to="/" replace />;
  }

  const handleUpdatePasscode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPasscode !== confirmPasscode) {
      toast({
        title: 'Error',
        description: 'New passcodes do not match',
        variant: 'destructive'
      });
      return;
    }

    if (newPasscode.length < 6) {
      toast({
        title: 'Error',
        description: 'Passcode must be at least 6 characters',
        variant: 'destructive'
      });
      return;
    }

    setUpdating(true);

    try {
      // Verify current passcode
      const { data: isValid } = await supabase.rpc('verify_organization_passcode', {
        _organization_id: organization?.id,
        _passcode: currentPasscode
      });

      if (!isValid) {
        toast({
          title: 'Error',
          description: 'Current passcode is incorrect',
          variant: 'destructive'
        });
        setUpdating(false);
        return;
      }

      // Update passcode
      const { error } = await supabase
        .from('organizations')
        .update({ passcode: newPasscode })
        .eq('id', organization?.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Passcode updated successfully'
      });

      setCurrentPasscode('');
      setNewPasscode('');
      setConfirmPasscode('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update passcode',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization) {
    return <Navigate to="/" replace />;
  }

  if (!isAuthenticated) {
    toast({
      title: 'Access Required',
      description: 'You need to authenticate to access settings',
      variant: 'destructive'
    });
    return <Navigate to={`/org/${slug}`} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container max-w-2xl mx-auto py-8">
        <BackButton to={`/org/${slug}`} />
        
        <div className="mt-6">
          <h1 className="text-3xl font-bold mb-2">Organization Settings</h1>
          <p className="text-muted-foreground mb-8">{organization.name}</p>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Passcode
              </CardTitle>
              <CardDescription>
                Update the passcode required for data modifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePasscode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current">Current Passcode</Label>
                  <Input
                    id="current"
                    type="password"
                    placeholder="Enter current passcode"
                    value={currentPasscode}
                    onChange={(e) => setCurrentPasscode(e.target.value)}
                    disabled={updating}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new">New Passcode</Label>
                  <Input
                    id="new"
                    type="password"
                    placeholder="Enter new passcode (min 6 characters)"
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value)}
                    disabled={updating}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm New Passcode</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Confirm new passcode"
                    value={confirmPasscode}
                    onChange={(e) => setConfirmPasscode(e.target.value)}
                    disabled={updating}
                    required
                    minLength={6}
                  />
                </div>

                <Button type="submit" disabled={updating} className="w-full">
                  {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Passcode
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
