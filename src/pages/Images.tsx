import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadImage, getImages, deleteImage, type ImageRecord } from '@/lib/images';
 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navigation } from '@/components/Navigation';
import { Upload, Image as ImageIcon, Calendar, Trash2, X, Download, Pin, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useFestival } from '@/contexts/FestivalContext';
import { AuthDialog } from '@/components/AuthDialog';
import { YearBadge } from '@/components/YearBadge';
import { PageHeader } from '@/components/PageHeader';
import { ComingSoon } from '@/components/ComingSoon';
import { setFestivalBackgroundImage } from '@/lib/festivals';
import { BackButton } from '@/components/BackButton';

export default function Images() {
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useOrganization();
  const { selectedFestival } = useFestival();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);

  const { data: images = [] } = useQuery({
    queryKey: ['user-images', selectedFestival?.name, selectedFestival?.year],
    queryFn: () => getImages(selectedFestival?.name, selectedFestival?.year),
    enabled: !!selectedFestival,
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ file, title, description }: { file: File; title: string; description?: string }) =>
      uploadImage(file, title, description, selectedFestival?.name, selectedFestival?.year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-images', selectedFestival?.name, selectedFestival?.year] });
      setIsDialogOpen(false);
      setFormData({ title: '', description: '' });
      setSelectedFile(null);
      toast({
        title: t('విజయవంతమైంది', 'Success'),
        description: t('చిత్రం అప్‌లోడ్ చేయబడింది', 'Image uploaded successfully'),
      });
    },
    onError: (error) => {
      toast({
        title: t('లోపం', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: ({ id, imagePath }: { id: string; imagePath: string }) =>
      deleteImage(id, imagePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-images', selectedFestival?.name, selectedFestival?.year] });
      toast({
        title: t('విజయవంతమైంది', 'Success'),
        description: t('చిత్రం తొలగించబడింది', 'Image deleted successfully'),
      });
    },
    onError: (error) => {
      toast({
        title: t('లోపం', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const setBackgroundMutation = useMutation({
    mutationFn: ({ festivalId, imageId }: { festivalId: string; imageId: string }) =>
      setFestivalBackgroundImage(festivalId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['festivals'] });
      toast({
        title: t('విజయవంతమైంది', 'Success'),
        description: t('పండుగ నేపథ్యంగా సెట్ చేయబడింది', 'Set as festival background'),
      });
    },
    onError: (error) => {
      toast({
        title: t('లోపం', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('లోపం', 'Error'),
          description: t('దయచేసి చిత్రం ఫైల్‌ను ఎంచుకోండి', 'Please select an image file'),
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('లోపం', 'Error'),
          description: t('ఫైల్ పరిమాణం 5MB కంటే తక్కువగా ఉండాలి', 'File size should be less than 5MB'),
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: t('లోపం', 'Error'),
        description: t('దయచేసి చిత్రం ఫైల్‌ను ఎంచుకోండి', 'Please select an image file'),
        variant: 'destructive',
      });
      return;
    }

    uploadImageMutation.mutate({
      file: selectedFile,
      title: formData.title || '',
      description: formData.description
    });
  };

  // Show coming soon if no festival selected
  if (!selectedFestival) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <ComingSoon 
            festivalName="Festival"
            year={new Date().getFullYear()}
            message={t('ఉత్సవాన్ని ఎంచుకోండి', 'Please select a festival first')}
          />
          <Navigation />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* Header */}
        <PageHeader
          pageName="Images"
          pageNameTelugu="చిత్రాలు"
          description="Upload and manage your photos"
          descriptionTelugu="మీ ఫోటోలను అప్‌లోడ్ చేయండి మరియు నిర్వహించండి"
        >
          <div className="flex flex-col gap-3 w-full">
            {/* Back + Language Row */}
            <div className="flex items-center justify-between">
              <BackButton emphasis size="sm" className="rounded-md" />
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setLanguage(language === 'telugu' ? 'english' : 'telugu')}
                 className="px-3"
               >
                 {language === 'telugu' ? 'EN' : 'తె'}
               </Button>
            </div>

            {/* Prominent Upload Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="lg"
                    onClick={() => {
                      if (isAuthenticated) {
                        setIsDialogOpen(true);
                      } else {
                        setIsAuthOpen(true);
                      }
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    {isAuthenticated ? (
                      <Upload className="h-5 w-5 mr-2" />
                    ) : (
                      <Lock className="h-5 w-5 mr-2" />
                    )}
                    {t('చిత్రం అప్‌లోడ్ చేయండి', 'Upload Image')}
                  </Button>
                </TooltipTrigger>
                {!isAuthenticated && (
                  <TooltipContent>
                    <p>{t('అప్‌లోడ్ చేయడానికి లాగిన్ అవసరం', 'Login required to upload')}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </PageHeader>

        {/* Upload Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('కొత్త చిత్రం అప్‌లోడ్ చేయండి', 'Upload New Image')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="file">{t('చిత్రం', 'Image')} *</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('ఎంచుకున్నది:', 'Selected:')} {selectedFile.name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="title">{t('టైటిల్ (ఐచ్ఛికం)', 'Title (optional)')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('చిత్రం టైటిల్ (ఐచ్ఛికం)', 'Image title (optional)')}
                />
              </div>
              <div>
                <Label htmlFor="description">{t('వివరణ', 'Description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('చిత్రం వివరణ (ఐచ్ఛికం)', 'Image description (optional)')}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={uploadImageMutation.isPending} className="flex-1">
                  {uploadImageMutation.isPending ? (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {t('అప్‌లోడ్ చేస్తోంది...', 'Uploading...')}
                    </>
                  ) : (
                    t('అప్‌లోడ్', 'Upload')
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('రద్దు', 'Cancel')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Images Grid (image-only) */}
        <div className="max-w-6xl mx-auto">
          {images.length === 0 ? (
            <ComingSoon 
              festivalName={selectedFestival.name}
              year={selectedFestival.year}
              message={t(
                'ఈ ఉత్సవానికి ఇంకా చిత్రాలు లేవు. అప్‌లోడ్ చేయండి!',
                'No images available for this festival yet. Upload some!'
              )}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer rounded-lg overflow-hidden bg-muted border shadow-sm hover:shadow-md transition-shadow"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image.image_url}
                    alt={image.title || 'Image'}
                    loading="lazy"
                    className="aspect-square w-full h-auto object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  {image.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2 sm:p-3">
                      <p className="text-white text-xs sm:text-sm font-medium line-clamp-2 drop-shadow-md">
                        {image.title}
                      </p>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isAuthenticated) {
                                setIsAuthOpen(true);
                                return;
                              }
                              if (selectedFestival?.id && image.id) {
                                setBackgroundMutation.mutate({
                                  festivalId: selectedFestival.id,
                                  imageId: image.id
                                });
                              }
                            }}
                          >
                            {isAuthenticated ? (
                              <Pin className="h-3.5 w-3.5" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        {!isAuthenticated && (
                          <TooltipContent>
                            <p>{t('పిన్ చేయడానికి లాగిన్ అవసరం', 'Login required to pin')}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isAuthenticated) {
                                setIsAuthOpen(true);
                                return;
                              }
                              setDeletingImageId(image.id || null);
                            }}
                          >
                            {isAuthenticated ? (
                              <Trash2 className="h-3.5 w-3.5" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        {!isAuthenticated && (
                          <TooltipContent>
                            <p>{t('తొలగించడానికి లాగిన్ అవసరం', 'Login required to delete')}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Image Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="p-0 w-screen h-[100dvh] max-w-none rounded-none sm:w-auto sm:h-auto sm:max-w-4xl sm:rounded-lg">
            <div className="relative flex h-full flex-col overflow-hidden">
               <Button
                 variant="outline"
                 size="icon"
                 className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 bg-background/80 backdrop-blur-sm rounded-full sm:rounded-md sm:bg-background sm:hover:bg-accent sm:border sm:border-border sm:h-8 sm:w-8"
                 onClick={() => setSelectedImage(null)}
                 aria-label={t('మూసివేయి', 'Close')}
               >
                 <X className="h-5 w-5 sm:h-4 sm:w-4" />
               </Button>
               {selectedImage && (
                 <div className="flex h-full flex-col">
                   {/* Image area (scrollable on mobile) */}
                   <div className="flex-1 overflow-auto">
                     <div className="relative w-full h-full flex items-center justify-center">
                       <img 
                         src={selectedImage.image_url} 
                         alt={selectedImage.title}
                         className="w-full h-auto object-contain sm:max-h-[70vh]"
                       />
                     </div>
                   </div>
                   {/* Details + actions */}
                   <div className="px-4 sm:p-6 pt-3 sm:pt-6 space-y-3 sm:space-y-4 bg-background">
                     <div>
                       <h2 className="text-xl sm:text-2xl font-bold">{selectedImage.title}</h2>
                       {selectedImage.description && (
                         <p className="text-muted-foreground mt-2">{selectedImage.description}</p>
                       )}
                     </div>
                      <div className="flex items-center justify-between flex-col sm:flex-row gap-3 sm:gap-0">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(new Date(selectedImage.created_at || ''), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex w-full sm:w-auto items-center gap-2 justify-end">
                          <Button 
                            className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const response = await fetch(selectedImage.image_url);
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                const filename = selectedImage.title ? 
                                  `${selectedImage.title}.${blob.type.split('/')[1] || 'jpg'}` : 
                                  `image-${selectedImage.id}.${blob.type.split('/')[1] || 'jpg'}`;
                                a.href = url;
                                a.download = filename;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                              } catch (error) {
                                console.error('Download failed:', error);
                                toast({
                                  title: t('లోపం', 'Error'),
                                  description: t('డౌన్‌లోడ్ విఫలమైంది', 'Download failed'),
                                  variant: 'destructive',
                                });
                              }
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {t('డౌన్‌లోడ్', 'Download')}
                          </Button>
                         {isAuthenticated && (
                           <>
                             <Button 
                               className="flex-1 sm:flex-none"
                               variant="secondary"
                               onClick={() => {
                                 if (selectedFestival?.id && selectedImage?.id) {
                                   setBackgroundMutation.mutate({
                                     festivalId: selectedFestival.id,
                                     imageId: selectedImage.id
                                   });
                                   setSelectedImage(null);
                                 }
                               }}
                             >
                               <Pin className="h-4 w-4 mr-2" />
                               {t('నేపథ్యంగా సెట్ చేయండి', 'Set as Background')}
                             </Button>
                             <Button
                               className="flex-1 sm:flex-none"
                               variant="destructive"
                               onClick={() => {
                                 setDeletingImageId(selectedImage.id || null);
                                 setSelectedImage(null);
                               }}
                             >
                               <Trash2 className="h-4 w-4 mr-2" />
                               {t('తొలగించు', 'Delete')}
                             </Button>
                           </>
                         )}
                       </div>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           </DialogContent>
         </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingImageId} onOpenChange={() => setDeletingImageId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('చిత్రం తొలగించు', 'Delete Image')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('మీరు ఈ చిత్రాన్ని తొలగించాలని ఖచ్చితంగా అనుకుంటున్నారా?', 'Are you sure you want to delete this image?')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('రద్దు', 'Cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const image = images.find(img => img.id === deletingImageId);
                  if (image) {
                    deleteImageMutation.mutate({ id: image.id!, imagePath: image.image_path });
                  }
                  setDeletingImageId(null);
                }}
                className="bg-destructive text-destructive-foreground"
              >
                {t('తొలగించు', 'Delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Navigation */}
        <Navigation />
        
        <AuthDialog
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={() => setIsAuthOpen(false)}
        />
      </div>
    </div>
  );
}