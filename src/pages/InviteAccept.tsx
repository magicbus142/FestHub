import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function InviteAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [inviteDetails, setInviteDetails] = useState<any>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/auth', { state: { from: `/invite/accept?token=${token}` } });
      return;
    }

    if (!token) {
      setStatus('error');
      return;
    }

    acceptInvite();
  }, [user, authLoading, token]);

  const acceptInvite = async () => {
    try {
      // Fetch invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('organization_invitations')
        .select('*, organization:organizations(*)')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invitation) {
        setStatus('error');
        return;
      }

      // Check if expired
      if (new Date(invitation.expires_at) < new Date()) {
        setStatus('expired');
        return;
      }

      setInviteDetails(invitation);

      // Check if user's email matches
      if (invitation.email !== user?.email) {
        toast({
          title: 'Email mismatch',
          description: 'This invitation was sent to a different email address',
          variant: 'destructive'
        });
        setStatus('error');
        return;
      }

      // Check if user already has a role in this organization
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', invitation.organization_id)
        .single();

      if (existingRole) {
        toast({
          title: 'Already a member',
          description: 'You are already a member of this organization'
        });
        setStatus('success');
        return;
      }

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          organization_id: invitation.organization_id,
          role: invitation.role
        });

      if (roleError) throw roleError;

      // Update invitation status
      await supabase
        .from('organization_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      setStatus('success');
      toast({
        title: 'Success!',
        description: `You've joined ${invitation.organization.name}`
      });

      setTimeout(() => {
        navigate('/organizations');
      }, 2000);
    } catch (error: any) {
      console.error('Error accepting invite:', error);
      setStatus('error');
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept invitation',
        variant: 'destructive'
      });
    }
  };

  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Processing invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle>Welcome!</CardTitle>
              <CardDescription>
                You've successfully joined {inviteDetails?.organization?.name}
              </CardDescription>
            </>
          )}
          {(status === 'error' || status === 'expired') && (
            <>
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle>
                {status === 'expired' ? 'Invitation Expired' : 'Invalid Invitation'}
              </CardTitle>
              <CardDescription>
                {status === 'expired'
                  ? 'This invitation has expired. Please request a new one.'
                  : 'This invitation link is invalid or has already been used.'}
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => navigate(status === 'success' ? '/organizations' : '/')}
          >
            {status === 'success' ? 'Go to Organizations' : 'Go to Home'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
