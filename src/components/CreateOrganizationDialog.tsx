import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, Plus } from 'lucide-react';
import { PageSelector, PageOption } from '@/components/PageSelector';
function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
import { ScrollArea } from '@/components/ui/scroll-area';

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationDialog({ open, onOpenChange }: CreateOrganizationDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [enabledPages, setEnabledPages] = useState<PageOption[]>(['dashboard', 'chandas', 'expenses', 'images', 'organizers']);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      // 1. Password Strength Validation (Supabase Auth Requirements)
      if (passcode.length < 6) {
        throw new Error("Passcode must be at least 6 characters long.");
      }

      // Create slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // 2. Create Supabase Auth User (This sends confirmation email depending on project settings)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: passcode,
        options: {
          data: {
            organization_name: name,
          }
        }
      });

      if (authError) throw authError;

      // 3. Create Organization Record
      // Note: We're keeping the 'passcode' column in DB for now as a fallback/legacy support
      // but the primary auth is now managed by Supabase Auth.
      const { data, error } = await supabase
        .from('organizations')
        .insert([{
          name,
          slug,
          description: description || null,
          email,
          passcode, // Storing for legacy consistency
          theme: 'classic',
          enabled_pages: enabledPages
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Organization created',
        description: 'Your organization account has been set up successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      onOpenChange(false);
      navigate(`/org/${data.slug}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create organization',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !passcode.trim() || !email.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in organization name, email, and passcode',
        variant: 'destructive'
      });
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl border-none p-0 bg-background overflow-hidden rounded-[2.5rem] shadow-2xl">
        <div className="p-10">
          <DialogHeader className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                <PlusIcon className="h-7 w-7 text-primary" strokeWidth={2.5} />
              </div>
              <DialogTitle className="text-[28px] font-extrabold text-foreground tracking-tight">Create Organization</DialogTitle>
            </div>
            <DialogDescription className="text-lg text-muted-foreground mt-2 leading-relaxed font-medium">
              Start your journey by creating a dedicated hub for your festivals
            </DialogDescription>
          </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4 -mr-4">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label htmlFor="name" className="text-lg font-bold text-foreground ml-1">Organization Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Ganesh Temple 2025"
                  required
                  className="h-16 px-8 rounded-3xl bg-muted/20 border-border focus:border-primary focus:ring-0 transition-all text-lg placeholder:text-muted-foreground/50 font-medium"
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="email" className="text-lg font-bold text-foreground ml-1">Admin Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="For passcode recovery"
                  required
                  className="h-16 px-8 rounded-3xl bg-muted/20 border-border focus:border-primary focus:ring-0 transition-all text-lg placeholder:text-muted-foreground/50 font-medium"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="description" className="text-lg font-bold text-foreground ml-1">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your organization"
                rows={2}
                className="px-8 py-5 rounded-3xl bg-muted/20 border-border focus:border-primary focus:ring-0 transition-all text-lg placeholder:text-muted-foreground/50 font-medium resize-none min-h-[140px]"
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="passcode" className="text-lg font-bold text-foreground ml-1">Access Passcode *</Label>
              <Input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Create a secure passcode"
                required
                className="h-16 px-8 rounded-3xl bg-muted/20 border-border focus:border-primary focus:ring-0 transition-all text-lg placeholder:text-muted-foreground/50 font-medium"
              />
              <p className="text-sm text-muted-foreground mt-1 ml-2 italic font-medium">
                This passcode will be required to manage your organization
              </p>
            </div>

            <div className="p-8 bg-muted/10 rounded-[2.5rem] border border-border shadow-sm">
              <PageSelector value={enabledPages} onChange={setEnabledPages} />
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-16 rounded-[2rem] border-border bg-muted/30 hover:bg-muted/50 text-foreground font-bold text-xl transition-all"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-[2] h-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Organization'
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
