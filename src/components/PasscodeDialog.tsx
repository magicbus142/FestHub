import { useState } from 'react';
import { useOrganizationAccess } from '@/contexts/OrganizationAccessContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';

interface PasscodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PasscodeDialog = ({ isOpen, onClose, onSuccess }: PasscodeDialogProps) => {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const { authenticate } = useOrganizationAccess();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await authenticate(passcode);
    
    setLoading(false);
    
    if (success) {
      toast({
        title: 'Access granted',
        description: 'You can now modify data'
      });
      setPasscode('');
      onSuccess();
      onClose();
    } else {
      toast({
        title: 'Access denied',
        description: 'Invalid passcode',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Enter Passcode
          </DialogTitle>
          <DialogDescription>
            Enter the organization passcode to add, edit, or delete data
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="passcode">Passcode</Label>
              <Input
                id="passcode"
                type="password"
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !passcode}>
              {loading ? 'Verifying...' : 'Submit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
