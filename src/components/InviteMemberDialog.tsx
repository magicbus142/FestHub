import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, Copy, Check } from 'lucide-react';

interface InviteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteMemberDialog = ({ isOpen, onClose }: InviteMemberDialogProps) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { user } = useSupabaseAuth();

  const generateInviteLink = async () => {
    if (!email || !currentOrganization || !user) return;

    setLoading(true);
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { error } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: currentOrganization.id,
          email,
          role,
          token,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
          invited_by: user.id
        });

      if (error) throw error;

      const link = `${window.location.origin}/invite/accept?token=${token}`;
      setInviteLink(link);

      toast({
        title: 'Invitation created!',
        description: 'Share this link with the user'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create invitation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Invitation link copied to clipboard'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setEmail('');
    setRole('viewer');
    setInviteLink('');
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || !!inviteLink}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v: any) => setRole(v)} disabled={loading || !!inviteLink}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer - Can view data</SelectItem>
                <SelectItem value="manager">Manager - Can edit data</SelectItem>
                <SelectItem value="admin">Admin - Full control</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {inviteLink ? (
            <div className="space-y-2">
              <Label>Invitation Link</Label>
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link expires in 7 days. Share it with {email} to join your organization.
              </p>
            </div>
          ) : (
            <Button
              onClick={generateInviteLink}
              disabled={!email || loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Invitation Link
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full"
          >
            {inviteLink ? 'Done' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
