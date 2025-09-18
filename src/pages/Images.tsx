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
import { Upload, Image as ImageIcon, Calendar, Trash2, X, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { AuthDialog } from '@/components/AuthDialog';
import { YearBadge } from '@/components/YearBadge';

export default function Images() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
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
    queryKey: ['user-images'],
    queryFn: getImages,
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ file, title, description }: { file: File; title: string; description?: string }) =>
      uploadImage(file, title, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-images'] });
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
      queryClient.invalidateQueries({ queryKey: ['user-images'] });
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('చిత్రాలు', 'Images')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('మీ ఫోటోలను అప్‌లోడ్ చేయండి మరియు నిర్వహించండి', 'Upload and manage your photos')}
            </p>
            <YearBadge />
          </div>

          <Button
            className="flex items-center gap-2"
            onClick={() => {
              if (isAuthenticated) {
                setIsDialogOpen(true);
              } else {
                setIsAuthOpen(true);
              }
            }}
          >
            <Upload className="h-4 w-4" />
            {t('అప్‌లోడ్', 'Upload')}
          </Button>
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
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                {t('ఇంకా చిత్రాలు లేవు. అప్‌లోడ్ చేయండి!', 'No images yet. Upload one!')}
              </div>
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
                    {isAuthenticated && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingImageId(image.id || null);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Image Modal */}
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
                {selectedImage && (
                  <div className="space-y-4">
                    <div className="relative">
                      <img 
                        src={selectedImage.image_url} 
                        alt={selectedImage.title}
                        className="w-full max-h-[70vh] object-contain"
                      />
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedImage.title}</h2>
                        {selectedImage.description && (
                          <p className="text-muted-foreground mt-2">{selectedImage.description}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(new Date(selectedImage.created_at || ''), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline"
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
                                variant="secondary"
                                onClick={() => {
                                  toast({
                                    title: t('విజయవంతమైంది', 'Success'),
                                    description: t('పండుగ నేపథ్యంగా సెట్ చేయబడింది', 'Set as festival background'),
                                  });
                                  setSelectedImage(null);
                                }}
                              >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                {t('నేపథ్యంగా సెట్ చేయండి', 'Set as Background')}
                              </Button>
                              <Button
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
    </div>
  );
}
