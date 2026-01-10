import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Upload, Loader2, Eye, EyeOff } from 'lucide-react';
import { PasscodeDialog } from '@/components/PasscodeDialog';

export function OrganizationSettingsTab() {
  const { currentOrganization, isAuthenticated, setCurrentOrganization, authenticate } = useOrganization();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(currentOrganization?.name || '');
  const [description, setDescription] = useState(currentOrganization?.description || '');
  const [email, setEmail] = useState(currentOrganization?.email || '');
  const [newPasscode, setNewPasscode] = useState(''); // Only for changing passcode
  const [showPasscode, setShowPasscode] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(currentOrganization?.logo_url || null);
  const [isPasscodeDialogOpen, setIsPasscodeDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Sync state when organization changes
  useEffect(() => {
    if (currentOrganization) {
      setName(currentOrganization.name || '');
      setDescription(currentOrganization.description || '');
      setEmail(currentOrganization.email || '');
      setLogoPreview(currentOrganization.logo_url || null);
    }
  }, [currentOrganization]);

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; email: string; newPasscode?: string; logo_url?: string }) => {
      if (!currentOrganization) throw new Error('No organization selected');

      const updateData: Record<string, any> = {
        name: data.name,
        description: data.description,
        email: data.email,
        logo_url: data.logo_url || currentOrganization.logo_url
      };

      // Only update passcode if a new one was provided
      if (data.newPasscode && data.newPasscode.trim()) {
        updateData.passcode = data.newPasscode;
      }

      const { error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', currentOrganization.id);

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Update the current organization in context (without passcode)
      if (currentOrganization) {
        setCurrentOrganization({
          ...currentOrganization,
          name: data.name,
          description: data.description,
          email: data.email,
          logo_url: data.logo_url || currentOrganization.logo_url
        });
      }
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      setNewPasscode(''); // Clear passcode field
      toast({
        title: t('సెట్టింగ్‌లు అప్‌డేట్ అయ్యాయి', 'Settings updated'),
        description: t('మీ సంస్థ సెట్టింగ్‌లు విజయవంతంగా సేవ్ చేయబడ్డాయి', 'Your organization settings have been saved successfully'),
      });
    },
    onError: (error) => {
      toast({
        title: t('దోషం', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !currentOrganization) return null;

    setIsUploading(true);
    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `org-logos/${currentOrganization.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user-images')
        .upload(fileName, logoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: t('లోగో అప్‌లోడ్ విఫలమైంది', 'Logo upload failed'),
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setIsPasscodeDialogOpen(true);
      return;
    }

    let logoUrl: string | undefined;
    if (logoFile) {
      const uploadedUrl = await uploadLogo();
      if (uploadedUrl) {
        logoUrl = uploadedUrl;
      }
    }

    updateMutation.mutate({
      name,
      description,
      email,
      newPasscode: newPasscode.trim() || undefined,
      logo_url: logoUrl
    });
  };

  const handleAuthenticate = (enteredPasscode: string) => {
    return authenticate(enteredPasscode);
  };

  if (!currentOrganization) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">No organization selected</p>
      </div>
    );
  }

  return (
    <>
      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t('సంస్థ సెట్టింగ్‌లు', 'Organization Settings')}
          </CardTitle>
          <CardDescription>
            {t('మీ సంస్థ వివరాలు మరియు సెట్టింగ్‌లను నిర్వహించండి', 'Manage your organization details and settings')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>{t('లోగో', 'Logo')}</Label>
              <div className="flex items-center gap-4">
                <div 
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('అప్‌లోడ్ అవుతోంది...', 'Uploading...')}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {t('లోగో ఎంచుకోండి', 'Choose Logo')}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('PNG, JPG లేదా GIF, 2MB వరకు', 'PNG, JPG or GIF, up to 2MB')}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  title="Upload Logo"
                />
              </div>
            </div>

            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('సంస్థ పేరు', 'Organization Name')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('మీ సంస్థ పేరు', 'Your organization name')}
                required
              />
            </div>

            {/* Organization Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('సంస్థ ఈమెయిల్', 'Organization Email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('సంస్థ ఈమెయిల్ (పాస్‌కోడ్ రికవరీ కోసం)', 'Organization email (for passcode recovery)')}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t('వివరణ', 'Description')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('మీ సంస్థ గురించి చెప్పండి', 'Tell us about your organization')}
                rows={3}
              />
            </div>

            {/* Passcode */}
            <div className="space-y-2">
              <Label htmlFor="passcode">{t('కొత్త పాస్‌కోడ్', 'New Passcode')}</Label>
              <div className="relative">
                <Input
                  id="passcode"
                  type={showPasscode ? 'text' : 'password'}
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  placeholder={t('కొత్త పాస్‌కోడ్ సెట్ చేయండి', 'Set new passcode (leave empty to keep current)')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPasscode(!showPasscode)}
                >
                  {showPasscode ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('ఖాళీగా ఉంచండి ప్రస్తుత పాస్‌కోడ్ ఉంచడానికి', 'Leave empty to keep current passcode')}
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={updateMutation.isPending || isUploading}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('సేవ్ అవుతోంది...', 'Saving...')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('సేవ్ చేయండి', 'Save Changes')}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <PasscodeDialog
        open={isPasscodeDialogOpen}
        onOpenChange={setIsPasscodeDialogOpen}
        onAuthenticate={handleAuthenticate}
        organizationName={currentOrganization.name}
      />
    </>
  );
}
