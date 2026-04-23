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
      <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] border border-border p-0 bg-background/95 backdrop-blur-2xl overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-primary/10">
        <div className="p-6 sm:p-10 flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="mb-6 sm:mb-8 flex-shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 mb-2">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-sm shrink-0">
                <PlusIcon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" strokeWidth={2.5} />
              </div>
              <DialogTitle className="text-2xl sm:text-[28px] font-extrabold text-foreground tracking-tight line-clamp-2">Create Organization</DialogTitle>
            </div>
            <DialogDescription className="text-base sm:text-lg text-muted-foreground mt-2 leading-relaxed font-medium">
              Start your journey by creating a dedicated hub for your festivals
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4 -mr-4">
            <form onSubmit={handleSubmit} className="space-y-6 p-1 pb-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Organization Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Ganesh Temple 2026"
                    required
                    className="h-12 px-4 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Admin Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="For passcode recovery"
                    required
                    className="h-12 px-4 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your organization"
                  rows={3}
                  className="resize-none p-4 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passcode" className="text-sm font-semibold text-slate-700">Access Passcode <span className="text-red-500">*</span></Label>
                <Input
                  id="passcode"
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Create a secure passcode"
                  required
                  className="h-12 px-4 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                  This passcode will be required to manage your organization
                </p>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 text-base font-semibold border-slate-200 hover:bg-slate-50"
                  onClick={() => onOpenChange(false)}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
