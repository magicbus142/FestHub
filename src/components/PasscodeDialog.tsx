import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

interface PasscodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticate: (passcode: string) => boolean | Promise<boolean>;
  organizationName: string;
}

export function PasscodeDialog({ 
  open, 
  onOpenChange, 
  onAuthenticate,
  organizationName 
}: PasscodeDialogProps) {
  const [passcode, setPasscode] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await onAuthenticate(passcode);
    
    if (success) {
      toast({
        title: 'Access granted',
        description: 'You can now edit data in this organization'
      });
      onOpenChange(false);
      setPasscode('');
    } else {
      toast({
        title: 'Invalid passcode',
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Authentication Required</DialogTitle>
              <DialogDescription className="text-xs mt-1">
                {organizationName}
              </DialogDescription>
            </div>
          </div>
          <DialogDescription>
            Enter the organization passcode to edit data
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passcode">Passcode</Label>
            <Input
              id="passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode"
              autoFocus
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
                setPasscode('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Authenticate
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
