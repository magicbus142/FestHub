import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Clock } from 'lucide-react';

interface ComingSoonProps {
  festivalName: string;
  year: number;
  message?: string;
}

export function ComingSoon({ festivalName, year, message }: ComingSoonProps) {
  const { t } = useLanguage();

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {festivalName} {year}
        </h3>
        
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Clock className="w-4 h-4" />
          <span className="text-lg font-medium">
            {t('త్వరలో వస్తుంది', 'Coming Soon')}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground max-w-md">
          {message || t(
            'ఈ ఉత్సవం కోసం డేటా ఇంకా అందుబాటులో లేదు. త్వరలో అందుబాటులోకి వస్తుంది.',
            'Data for this festival is not yet available. It will be available soon.'
          )}
        </p>
      </CardContent>
    </Card>
  );
}