import { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image, Camera, ChevronLeft, ChevronRight, ArrowRight, Maximize2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFestival } from '@/contexts/FestivalContext';
import { useQuery } from '@tanstack/react-query';
import { getImages } from '@/lib/images';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';

export function ImagesPreview() {
  const { t } = useLanguage();
  const { selectedFestival } = useFestival();
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { data: images = [] } = useQuery({
    queryKey: ['images-preview', selectedFestival?.name, selectedFestival?.year],
    queryFn: () => selectedFestival ? getImages(selectedFestival.name, selectedFestival.year) : [],
    enabled: !!selectedFestival
  });

  const recentImages = images.slice(0, 8);
  const totalCount = images.length;

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [recentImages]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleNavigateToGallery = () => {
    if (currentOrganization) {
      navigate(`/org/${currentOrganization.slug}/images`);
    }
  };

  return (
    <Card className="h-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-5 sm:p-6 border-b border-slate-50 dark:border-slate-800/50">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-black">
            <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Camera className="h-5 w-5" />
            </div>
            <span>{t('చిత్రాల గ్యాలరీ', 'Photo Gallery')}</span>
            <span className="ml-1 px-2.5 py-0.5 text-xs font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-full">
              {totalCount}
            </span>
          </CardTitle>
          <CardDescription className="text-xs font-medium text-slate-400 mt-1">
            {t('ఇటీవలి పండుగ ఫోటోలు', 'Recent festival photos and memories')}
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll Navigation Buttons for Desktop / Laptop / iPad */}
          {recentImages.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 mr-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className="h-7 w-7 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700"
                title={t('వెనుకకు', 'Scroll left')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className="h-7 w-7 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700"
                title={t('ము ముందుకు', 'Scroll right')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleNavigateToGallery}
            className="rounded-xl border-slate-200 text-xs font-bold hover:bg-purple-50 hover:text-purple-600 transition-colors"
          >
            {t('అన్నీ చూడండి', 'View All')}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {recentImages.length > 0 ? (
          <div className="relative">
            {/* Scrollable Horizontal Reel Container */}
            <div 
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto pb-3 pt-1 px-1 scroll-smooth snap-x snap-mandatory no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none]"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {recentImages.map((image) => (
                <div 
                  key={image.id} 
                  className="group relative shrink-0 snap-start w-[240px] sm:w-[280px] md:w-[320px] lg:w-[340px] h-[160px] sm:h-[190px] md:h-[210px] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 cursor-pointer shadow-2xs hover:shadow-xl transition-all duration-300" 
                  onClick={handleNavigateToGallery}
                >
                  <img 
                    src={image.image_url} 
                    alt={image.title || 'Festival image'} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  
                  {/* Subtle Gradient Overlay with Title & Expand indicator */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300 flex flex-col justify-between p-3">
                    <div className="self-end opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-md p-1.5 rounded-full text-white">
                      <Maximize2 className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white line-clamp-1 drop-shadow-md">
                        {image.title || t('చిత్రం', 'Photo')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* View All End Card */}
              <div 
                onClick={handleNavigateToGallery}
                className="shrink-0 snap-start w-[160px] sm:w-[200px] h-[160px] sm:h-[190px] md:h-[210px] rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/70 dark:hover:bg-purple-950/40 cursor-pointer flex flex-col items-center justify-center p-4 text-purple-600 dark:text-purple-400 group transition-all"
              >
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/60 mb-2 group-hover:scale-110 transition-transform">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <span className="text-xs font-black text-center">
                  {t('అన్ని ఫోటోలను చూడండి', 'View All Photos')}
                </span>
                <span className="text-[10px] font-bold text-purple-400 dark:text-purple-500 mt-1">
                  +{Math.max(0, totalCount - recentImages.length)} {t('మరిన్ని', 'more')}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50">
            <Image className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-500">
              {t('చిత్రాలు లేవు', 'No images available yet')}
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-3 text-purple-600 font-bold hover:bg-purple-50 rounded-xl text-xs" 
              onClick={handleNavigateToGallery}
            >
              {t('మొదట అప్‌లోడ్ చేయండి', 'Upload first photo')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

