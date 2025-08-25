import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadImage, getUserImages, deleteImage, type ImageRecord } from '@/lib/images';
import { Plus, Trash2, Image as ImageIcon, Upload } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Images() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  const { data: images = [] } = useQuery({
    queryKey: ['user-images'],
    queryFn: getUserImages,
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
    
    if (!selectedFile || !formData.title) {
      toast({
        title: t('లోపం', 'Error'),
        description: t('దయచేసి చిత్రం మరియు టైటిల్‌ను ఎంచుకోండి', 'Please select an image and enter title'),
        variant: 'destructive',
      });
      return;
    }

    uploadImageMutation.mutate({
      file: selectedFile,
      title: formData.title,
      description: formData.description
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('చిత్రాలు', 'Images')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('మీ ఫోటోలను అప్‌లోడ్ చేయండి మరియు నిర్వహించండి', 'Upload and manage your photos')}
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {t('అప్‌లోడ్', 'Upload')}
              </Button>
            </DialogTrigger>
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
                  <Label htmlFor="title">{t('టైటిల్', 'Title')} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('చిత్రం టైటిల్', 'Image title')}
                    required
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
        </div>

        {/* Images Grid */}
        {images.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t('ఇంకా చిత్రాలు లేవు', 'No images yet')}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('మీ మొదటి చిత్రాన్ని అప్‌లోడ్ చేయడానికి పైన ఉన్న "అప్‌లోడ్" బటన్‌ను క్లిక్ చేయండి', 'Click the "Upload" button above to upload your first image')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image: ImageRecord) => (
              <Card key={image.id} className="overflow-hidden">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{image.title}</CardTitle>
                      {image.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {image.description}
                        </CardDescription>
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="ml-2 shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t('చిత్రం తొలగించు', 'Delete Image')}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('మీరు ఈ చిత్రాన్ని తొలగించాలని ఖచ్చితంగా అనుకుంటున్నారా? ఈ చర్య రద్దు చేయబడదు.', 'Are you sure you want to delete this image? This action cannot be undone.')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {t('రద్దు', 'Cancel')}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteImageMutation.mutate({ 
                              id: image.id!, 
                              imagePath: image.image_path 
                            })}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t('తొలగించు', 'Delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                {image.created_at && (
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">
                      {t('అప్‌లోడ్ చేసిన తేదీ:', 'Uploaded on:')} {new Date(image.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Navigation */}
        <Navigation />
      </div>
    </div>
  );
}