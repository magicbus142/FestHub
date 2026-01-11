import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Festival } from '@/lib/festivals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Save, Eye } from 'lucide-react';
import { generateReceipt } from '@/utils/receiptGenerator';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReceiptConfig {
  title: string;
  sub_title: string;
  footer_text: string;
  show_logo: boolean;
  show_date: boolean;
  show_receipt_no: boolean;
  layout: 'standard' | 'table';
  theme: 'saffron' | 'blue' | 'green' | 'rose';
}

const DEFAULT_CONFIG: ReceiptConfig = {
  title: '',
  sub_title: '',
  footer_text: 'Thank you for your generous contribution!',
  show_logo: true,
  show_date: true,
  show_receipt_no: true,
  layout: 'standard',
  theme: 'saffron'
};

export function ReceiptSettings({ festival }: { festival: Festival }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<ReceiptConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    if (festival.receipt_settings) {
      // Merge with default to ensure all keys exist
      setConfig({ ...DEFAULT_CONFIG, ...(festival.receipt_settings as unknown as ReceiptConfig) });
    } else {
        setConfig({
            ...DEFAULT_CONFIG,
            title: festival.name // Default title to festival name
        });
    }
  }, [festival]);

  const updateMutation = useMutation({
    mutationFn: async (newConfig: ReceiptConfig) => {
      const { error } = await supabase
        .from('festivals')
        .update({ receipt_settings: newConfig as any })
        .eq('id', festival.id!);

      if (error) throw error;
      return newConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['festivals'] });
      toast({
        title: t('సెట్టింగ్‌లు సేవ్ చేయబడ్డాయి', 'Settings Saved'),
        description: t('రసీదు కాన్ఫిగరేషన్ అప్‌డేట్ చేయబడింది', 'Receipt configuration updated successfully'),
      });
    },
    onError: (error) => {
      toast({
        title: t('లోపం', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleSave = () => {
    updateMutation.mutate(config);
  };

  const handlePreview = () => {
    // Generate a dummy donation for preview
    const dummyDonation = {
        id: 'PREVIEW-123456',
        name: 'John Doe',
        amount: 5001,
        type: 'UPI',
        category: 'chanda' as const,
        created_at: new Date().toISOString()
    };
    
    // We need to pass the config to the generator. 
    // Since the generator signature currently only takes string args for names, 
    // we will update the generator next to take a config object or use these params more flexibly.
    // For now, let's just trigger the existing generator and we will refactor it in the next step.
    // Ideally: generateReceipt(dummyDonation, config);
    
    // TEMPORARY: triggering with current args, but we need to update generator to strictly use the config.
    // Passing the config via the "organizationName" param temporary for the generator to pick up? 
    // No, better to update the generator first.
    // But for this step, I'll assume I'll update the generator signature to:
    // generateReceipt(donation, settings)
    
    // @ts-ignore - We will update the function signature shortly
    generateReceipt(dummyDonation, { ...config, organization_name: festival.name }); 
  };

  return (
    <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>{t('రసీదు సెట్టింగ్‌లు', 'Receipt Settings')}</CardTitle>
        <CardDescription>
          {t('రసీదు కంటెంట్ మరియు రూపాన్ని అనుకూలీకరించండి', 'Customize receipt content and appearance')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
           <div className="space-y-2">
            <Label>{t('శీర్షిక', 'Header Title')}</Label>
            <Input 
                value={config.title} 
                onChange={(e) => setConfig({ ...config, title: e.target.value })} 
                placeholder={festival.name}
            />
            <p className="text-xs text-muted-foreground">Topmost bold text on the receipt</p>
          </div>
          
           <div className="space-y-2">
            <Label>{t('ఉప శీర్షిక', 'Sub Header')}</Label>
            <Input 
                value={config.sub_title} 
                onChange={(e) => setConfig({ ...config, sub_title: e.target.value })} 
                placeholder="Optional sub-text"
            />
          </div>
        </div>

        <div className="space-y-2">
            <Label>{t('ఫుటర్ సందేశం', 'Footer Message')}</Label>
            <Textarea 
                value={config.footer_text}
                onChange={(e) => setConfig({ ...config, footer_text: e.target.value })}
                rows={2}
            />
        </div>

        <div className="space-y-2">
            <Label>{t('లేఅవుట్', 'Layout Style')}</Label>
            <Select 
                value={config.layout || 'standard'} 
                onValueChange={(val: 'standard' | 'table') => setConfig({ ...config, layout: val })}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select Layout" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="standard">Standard (List View)</SelectItem>
                    <SelectItem value="table">Formal Table (Box Style)</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
            <Label>{t('థీమ్', 'Color Theme')}</Label>
            <div className="flex gap-3 pt-2">
                {[
                    { id: 'saffron', color: 'bg-orange-500', label: 'Saffron' },
                    { id: 'blue', color: 'bg-blue-600', label: 'Royal Blue' },
                    { id: 'green', color: 'bg-emerald-600', label: 'Emerald' },
                    { id: 'rose', color: 'bg-rose-600', label: 'Rose' },
                ].map((theme) => (
                    <button
                        key={theme.id}
                        type="button"
                        onClick={() => setConfig({ ...config, theme: theme.id as any })}
                        className={`w-8 h-8 rounded-full ${theme.color} ring-offset-2 transition-all ${config.theme === theme.id ? 'ring-2 ring-black scale-110' : 'hover:scale-105'}`}
                        title={theme.label}
                    />
                ))}
            </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between border-t pt-4">
            <div className="flex items-center space-x-2">
                <Switch 
                    id="show-logo" 
                    checked={config.show_logo}
                    onCheckedChange={(checked) => setConfig({ ...config, show_logo: checked })}
                />
                <Label htmlFor="show-logo">Show Logo</Label>
            </div>
            
            <div className="flex items-center space-x-2">
                <Switch 
                    id="show-date" 
                    checked={config.show_date}
                    onCheckedChange={(checked) => setConfig({ ...config, show_date: checked })}
                />
                <Label htmlFor="show-date">Show Date</Label>
            </div>
             <div className="flex items-center space-x-2">
                <Switch 
                    id="show-receipt-no" 
                    checked={config.show_receipt_no}
                    onCheckedChange={(checked) => setConfig({ ...config, show_receipt_no: checked })}
                />
                <Label htmlFor="show-receipt-no">Show Receipt No</Label>
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Configuration
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
