import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image, Upload, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFestival } from '@/contexts/FestivalContext';
import { useQuery } from '@tanstack/react-query';
import { getImages } from '@/lib/images';
import { useNavigate } from 'react-router-dom';

export function ImagesPreview() {
  const { t } = useLanguage();
  const { selectedFestival } = useFestival();
  const navigate = useNavigate();

  const { data: images = [] } = useQuery({
    queryKey: ['images-preview', selectedFestival?.name, selectedFestival?.year],
    queryFn: () => selectedFestival ? getImages(selectedFestival.name, selectedFestival.year) : [],
    enabled: !!selectedFestival,
  });

  const recentImages = images.slice(0, 4);
  const totalCount = images.length;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-green-600" />
            {t('చిత్రాలు', 'Images')}
          </CardTitle>
          <CardDescription>
            {t('ఫోటోల గ్యాలరీ', 'Photo gallery')}
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/images')}
        >
          {t('అన్నీ చూడండి', 'View All')}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-600">
                {totalCount}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('మొత్తం చిత్రాలు', 'Total Images')}
              </p>
            </div>
            <Button 
              size="sm"
              onClick={() => navigate('/images')}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {t('అప్‌లోడ్', 'Upload')}
            </Button>
          </div>

          {/* Recent Images Grid */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {t('ఇటీవలి చిత్రాలు', 'Recent Images')}
            </h4>
            {recentImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {recentImages.map((image) => (
                  <div 
                    key={image.id} 
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate('/images')}
                  >
                    <img
                      src={image.image_url}
                      alt={image.title || 'Festival image'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t('చిత్రాలు లేవు', 'No images yet')}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => navigate('/images')}
                >
                  {t('మొదట అప్‌లోడ్ చేయండి', 'Upload first')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}