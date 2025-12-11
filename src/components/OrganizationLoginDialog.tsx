import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OrganizationLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrganizationLoginDialog({ 
  open, 
  onOpenChange 
}: OrganizationLoginDialogProps) {
  const [name, setName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Find organization by name - NEVER select passcode
      const { data: org, error } = await supabase
        .from('organizations')
        .select('id, name, slug, description, logo_url, theme, enabled_pages, created_at, updated_at')
        .ilike('name', name.trim())
        .single();

      if (error || !org) {
        toast({
          title: 'Organization not found',
          description: 'Please check the organization name and try again',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      // Verify passcode using server-side function
      const { data: isValid, error: verifyError } = await supabase
        .rpc('verify_organization_passcode', {
          _organization_id: org.id,
          _passcode: passcode
        });

      if (verifyError || !isValid) {
        toast({
          title: 'Invalid passcode',
          description: 'Please check the passcode and try again',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      // Success - store authenticated org in localStorage (for UI purposes only)
      localStorage.setItem('orgAuthenticated', 'true');
      localStorage.setItem('orgAuthId', org.id);
      
      toast({
        title: 'Access granted',
        description: `Welcome to ${org.name}`
      });
      
      onOpenChange(false);
      setName('');
      setPasscode('');
      navigate(`/org/${org.slug}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Enter Organization</DialogTitle>
            </div>
          </div>
          <DialogDescription>
            Enter your organization name and passcode to access your festivals
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter organization name"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-passcode">Passcode</Label>
            <Input
              id="org-passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode"
              required
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                setName('');
                setPasscode('');
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Enter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
