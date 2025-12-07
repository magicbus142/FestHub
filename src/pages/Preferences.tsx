import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BackButton } from '@/components/BackButton';
import { Globe } from 'lucide-react';

export default function Preferences() {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageToggle = () => {
    setLanguage(language === 'english' ? 'telugu' : 'english');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <BackButton />
        
        <div className="mt-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t('ప్రాధాన్యతలు', 'Preferences')}
          </h1>
          <p className="text-muted-foreground mb-6">
            {t('మీ యాప్ సెట్టింగ్‌లను అనుకూలీకరించండి', 'Customize your app settings')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('భాష', 'Language')}
            </CardTitle>
            <CardDescription>
              {t('మీ ఇష్టపడే భాషను ఎంచుకోండి', 'Choose your preferred language')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="language-toggle" className="text-base">
                  {t('తెలుగు భాష', 'Telugu Language')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {language === 'telugu' 
                    ? 'తెలుగులో యాప్‌ను చూడండి' 
                    : 'View the app in Telugu'}
                </p>
              </div>
              <Switch
                id="language-toggle"
                checked={language === 'telugu'}
                onCheckedChange={handleLanguageToggle}
              />
            </div>
            
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {t('ప్రస్తుత భాష:', 'Current language:')} 
                <span className="font-medium text-foreground ml-1">
                  {language === 'telugu' ? 'తెలుగు' : 'English'}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
