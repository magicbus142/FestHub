import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Festival } from '@/lib/festivals';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Save, MessageSquare, Sparkles, Check, Smile, FileText, Globe } from 'lucide-react';
import { generateWhatsAppMessage, WhatsAppMessageConfig } from '@/utils/whatsappShare';

interface WhatsAppMessageSettingsProps {
  festival: Festival;
  organizationName?: string;
}

const DEFAULT_WA_CONFIG: WhatsAppMessageConfig = {
  style: 'decorative', // Rich & Decorative as DEFAULT
  language: 'english',
  include_emojis: true,
  thankyou_note: 'Thank you for supporting our festival celebrations! Warm regards from our committee.', // Preset 3 as DEFAULT
  show_flat: true
};

export function WhatsAppMessageSettings({ festival, organizationName = 'Festival Manager' }: WhatsAppMessageSettingsProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const [waConfig, setWaConfig] = useState<WhatsAppMessageConfig>(DEFAULT_WA_CONFIG);

  useEffect(() => {
    const keysToTry = [
      `wa_settings_${festival.id}`,
      `wa_settings_${festival.name}`,
      `wa_settings_default`
    ];

    for (const key of keysToTry) {
      if (!key) continue;
      const savedLocal = localStorage.getItem(key);
      if (savedLocal) {
        try {
          setWaConfig({ ...DEFAULT_WA_CONFIG, ...JSON.parse(savedLocal) });
          return;
        } catch (e) {
          // ignore
        }
      }
    }

    if (festival.receipt_settings) {
      const existing = festival.receipt_settings as any;
      setWaConfig({
        style: existing.whatsapp_style || 'decorative',
        language: existing.whatsapp_language || 'english',
        include_emojis: existing.whatsapp_include_emojis ?? true,
        thankyou_note: existing.whatsapp_thankyou_note || DEFAULT_WA_CONFIG.thankyou_note,
        show_flat: existing.whatsapp_show_flat ?? true,
      });
    }
  }, [festival]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Save locally across all key aliases to ensure instant persistence everywhere
      const jsonVal = JSON.stringify(waConfig);
      localStorage.setItem('wa_settings_default', jsonVal);
      if (festival.id) localStorage.setItem(`wa_settings_${festival.id}`, jsonVal);
      if (festival.name) localStorage.setItem(`wa_settings_${festival.name}`, jsonVal);

      // 2. Update local festival reference
      if (festival) {
        (festival as any).receipt_settings = {
          ...((festival.receipt_settings as any) || {}),
          whatsapp_style: waConfig.style,
          whatsapp_language: waConfig.language,
          whatsapp_include_emojis: waConfig.include_emojis,
          whatsapp_thankyou_note: waConfig.thankyou_note,
          whatsapp_show_flat: waConfig.show_flat,
        };
      }

      // 3. Try to save to Supabase if column exists (ignore error if column missing in DB)
      try {
        const currentReceiptSettings = (festival.receipt_settings as any) || {};
        const updatedReceiptSettings = {
          ...currentReceiptSettings,
          whatsapp_style: waConfig.style,
          whatsapp_language: waConfig.language,
          whatsapp_include_emojis: waConfig.include_emojis,
          whatsapp_thankyou_note: waConfig.thankyou_note,
          whatsapp_show_flat: waConfig.show_flat,
        };

        const res = await supabase
          .from('festivals')
          .update({ receipt_settings: updatedReceiptSettings as any })
          .eq('id', festival.id!);
          
        if (res.error) {
          console.warn('Supabase update note:', res.error.message);
        }
      } catch (e) {
        console.warn('DB update skipped, settings saved locally', e);
      }

      queryClient.invalidateQueries({ queryKey: ['festivals'] });

      toast({
        title: t('వాట్సాప్ సెట్టింగ్‌లు సేవ్ అయ్యాయి', 'WhatsApp Settings Saved'),
        description: t('వాట్సాప్ మెసేజ్ కాన్ఫిగరేషన్ అప్‌డేట్ అయింది', 'WhatsApp message format updated successfully'),
      });
    } catch (err: any) {
      toast({
        title: t('లోపం', 'Error'),
        description: err?.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate live preview text using dummy donation data
  const sampleDonation = {
    id: 'DEMO-101',
    name: 'బోగాని చిన్న రామయ్య',
    name_english: 'BOGANI CHINNA RAMAIAH',
    amount: 1000,
    type: 'చందా',
    category: 'chanda' as const,
    flat_no: '102',
    donation_mode: 'cash' as const,
    payment_method: 'cash' as const,
    created_at: new Date().toISOString()
  };

  const previewText = generateWhatsAppMessage({
    donation: sampleDonation,
    organizationName,
    festivalName: festival.name,
    festivalYear: festival.year,
    config: waConfig
  });

  const presets = [
    "Thank you very much for your generous contribution! May God bless you and your family.",
    "మీ సాయానికి మరియు విరాళానికి మనస్ఫూర్తిగా ధన్యవాదాలు! భగవంతుని ఆశీస్సులు మీకు ఎల్లప్పుడూ ఉండాలని ఆశిస్తున్నాము.",
    "Thank you for supporting our festival celebrations! Warm regards from our committee."
  ];

  return (
    <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-emerald-600 dark:text-emerald-400 font-black">
          <MessageSquare className="h-5 w-5" />
          {t('వాట్సాప్ మెసేజ్ సెట్టింగ్‌లు', 'WhatsApp Message Settings')}
        </CardTitle>
        <CardDescription>
          {t('వాట్సాప్‌లో దాతలకు పంపే మెసేజ్ స్టైల్, ఎమోజీలు మరియు ధన్యవాదాల సందేశాన్ని అనుకూలీకరించండి', 'Customize message format, emojis, language, and thank you message sent to donors via WhatsApp')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Style Selection Cards */}
        <div className="space-y-3">
          <Label className="text-sm font-bold flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-emerald-600" />
            {t('మెసేజ్ స్టైల్ / టెంప్లేట్', 'Message Style & Template')}
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { 
                id: 'clean', 
                title: t('క్లీన్ & మినిమల్', 'Clean & Minimal'), 
                desc: t('ఇంగ్లీష్ స్పష్టమైన రసీదు (నో క్లటర్)', 'Clean layout with line dividers') 
              },
              { 
                id: 'decorative', 
                title: t('రిచ్ & డెకరేటివ్', 'Rich & Decorative'), 
                desc: t('ఎమోజీ ఐకాన్లు మరియు హెడర్స్‌తో', 'Decorative headers & category icons') 
              },
              { 
                id: 'compact', 
                title: t('కంప్యాక్ట్ సారాంశం', 'Compact Summary'), 
                desc: t('వేగవంతమైన 3-లైన్ రసీదు', 'Short 3-line quick summary') 
              }
            ].map((styleOption) => (
              <div
                key={styleOption.id}
                onClick={() => setWaConfig({ ...waConfig, style: styleOption.id as any })}
                className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  waConfig.style === styleOption.id
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{styleOption.title}</span>
                    {waConfig.style === styleOption.id && (
                      <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{styleOption.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3">
            <Label className="text-sm font-bold flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-blue-600" />
              {t('మెసేజ్ భాష', 'Message Language')}
            </Label>
            <div className="flex gap-2">
              {[
                { id: 'english', label: 'English Only' },
                { id: 'bilingual', label: 'Bilingual (తెలుగు + EN)' },
                { id: 'telugu', label: 'Telugu Only' }
              ].map((lang) => (
                <Button
                  key={lang.id}
                  type="button"
                  variant={waConfig.language === lang.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWaConfig({ ...waConfig, language: lang.id as any })}
                  className={`flex-1 rounded-xl font-bold text-xs ${
                    waConfig.language === lang.id ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                  }`}
                >
                  {lang.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Emojis Toggle */}
          <div className="space-y-3">
            <Label className="text-sm font-bold flex items-center gap-1.5">
              <Smile className="h-4 w-4 text-amber-500" />
              {t('ఎమోజీలు చేర్చాలా?', 'Include Emojis')}
            </Label>
            <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {waConfig.include_emojis ? t('ఎమోజీలు ఆన్ చేయబడ్డాయి', 'Emojis Enabled (🚩🎉💐🙏)') : t('ఎమోజీలు తీసివేయబడ్డాయి', 'Emojis Disabled (Clean Text)')}
              </span>
              <Switch
                checked={waConfig.include_emojis}
                onCheckedChange={(checked) => setWaConfig({ ...waConfig, include_emojis: checked })}
              />
            </div>
          </div>
        </div>

        {/* Custom Thank You Note */}
        <div className="space-y-2 pt-2">
          <Label className="text-sm font-bold flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-purple-600" />
            {t('ధన్యవాదాల సందేశం / ఆశీస్సులు', 'Custom Thank You & Blessing Note')}
          </Label>
          <Textarea
            value={waConfig.thankyou_note}
            onChange={(e) => setWaConfig({ ...waConfig, thankyou_note: e.target.value })}
            rows={2}
            className="rounded-2xl border-slate-200 dark:border-slate-800 font-medium"
            placeholder="Thank you very much for your generous contribution! May God bless you and your family."
          />
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-bold text-slate-400">{t('ముందస్తు ప్రిసెట్‌లు:', 'Quick Presets:')}</span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setWaConfig({ ...waConfig, thankyou_note: p })}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 transition-colors text-slate-600 truncate max-w-[220px]"
                title={p}
              >
                Preset {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Toggles */}
        <div className="flex flex-wrap gap-4 items-center justify-between border-t pt-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="wa-show-flat"
              checked={waConfig.show_flat}
              onCheckedChange={(checked) => setWaConfig({ ...waConfig, show_flat: checked })}
            />
            <Label htmlFor="wa-show-flat" className="text-xs font-bold">{t('ఫ్లాట్ నెం చూపించు', 'Show Flat No')}</Label>
          </div>
        </div>

        {/* Live WhatsApp Interactive Preview Card */}
        <div className="space-y-2 pt-2">
          <Label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <EyeIcon className="h-3.5 w-3.5" />
            {t('ప్రత్యక్ష వాట్సాప్ ప్రివ్యూ', 'LIVE WHATSAPP PREVIEW')}
          </Label>
          <div className="p-4 rounded-3xl bg-[#efeae2] dark:bg-slate-950 border border-emerald-200/60 dark:border-emerald-900/40 shadow-inner">
            <div className="max-w-md mx-auto bg-white dark:bg-slate-900 p-4 rounded-2xl rounded-tl-none shadow-md border border-slate-100 dark:border-slate-800 text-xs sm:text-sm font-sans font-medium text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed relative">
              {previewText}
              <div className="text-[10px] text-slate-400 text-right mt-2 font-bold flex items-center justify-end gap-1">
                <span>12:00 PM</span>
                <span className="text-emerald-500">✓✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl px-6"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {t('వాట్సాప్ సెట్టింగ్‌లు సేవ్ చేయి', 'Save WhatsApp Settings')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EyeIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}
