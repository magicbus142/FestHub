import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationDialog({ open, onOpenChange }: CreateOrganizationDialogProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const handleCreate = async () => {
    if (!name || !slug || !passcode) {
      toast({
        title: 'Missing fields',
        description: 'Please provide all required fields',
        variant: 'destructive'
      });
      return;
    }

    if (passcode.length < 6) {
      toast({
        title: 'Invalid passcode',
        description: 'Passcode must be at least 6 characters',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Create organization with passcode
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert([{ name, slug, description, passcode }])
        .select()
        .single();

      if (orgError) throw orgError;

      toast({
        title: 'Organization created!',
        description: `Access your organization at /org/${slug}`
      });

      onOpenChange(false);
      
      // Reset form
      setName('');
      setSlug('');
      setDescription('');
      setPasscode('');
      
      // Redirect to the new organization
      window.location.href = `/org/${slug}`;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create organization',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to manage your festivals and events
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              placeholder="My Organization"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              placeholder="my-organization"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Used in URLs and must be unique
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of your organization"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passcode">Passcode</Label>
            <Input
              id="passcode"
              type="password"
              placeholder="Set organization passcode (min 6 characters)"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              disabled={loading}
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">
              Required to add, edit, or delete data
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Organization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
