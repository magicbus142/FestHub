import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadImage, getImages, deleteImage, updateImage, type ImageRecord } from '@/lib/images';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';

import { Upload, Calendar, Trash2, X, Download, Pin, Lock, Edit2, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useFestival } from '@/contexts/FestivalContext';
import { AuthDialog } from '@/components/AuthDialog';
import { ComingSoon } from '@/components/ComingSoon';
import { setFestivalBackgroundImage } from '@/lib/festivals';
import { BackButton } from '@/components/BackButton';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

export default function Images() {
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, logout } = useOrganization();
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ title: '', description: '' });

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

  const updateImageMutation = useMutation({
    mutationFn: ({ id, title, description }: { id: string; title: string; description?: string }) =>
      updateImage(id, title, description),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-images', selectedFestival?.name, selectedFestival?.year] });
      setSelectedImage(data as ImageRecord);
      setIsEditDialogOpen(false);
      toast({
        title: t('విజయవంతమైంది', 'Success'),
        description: t('చిత్రం నవీకరించబడింది', 'Image updated successfully'),
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
      if (!file.type.startsWith('image/')) {
        toast({ title: t('లోపం', 'Error'), description: t('దయచేసి చిత్రం ఫైల్‌ను ఎంచుకోండి', 'Please select an image file'), variant: 'destructive' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: t('లోపం', 'Error'), description: t('ఫైల్ పరిమాణం 5MB కంటే తక్కువగా ఉండాలి', 'File size should be less than 5MB'), variant: 'destructive' });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({ title: t('లోపం', 'Error'), description: t('దయచేసి చిత్రం ఫైల్‌ను ఎంచుకోండి', 'Please select an image file'), variant: 'destructive' });
      return;
    }
    uploadImageMutation.mutate({ file: selectedFile, title: formData.title || '', description: formData.description });
  };

  if (!selectedFestival) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <div className="container mx-auto px-4 py-6">
          <ComingSoon 
            festivalName="Festival"
            year={new Date().getFullYear()}
            message={t('ఉత్సవాన్ని ఎంచుకోండి', 'Please select a festival first')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="container mx-auto px-4 py-6">
        
        {/* Unified Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-2 bg-slate-100/50 w-fit px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-slate-200/50">
             <span>Home</span>
             <span className="opacity-30">/</span>
             <span className="text-primary truncate max-w-[100px]">{selectedFestival?.name || 'Festival'}</span>
             <span className="opacity-30">/</span>
             <span className="text-foreground">Gallery</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
               <h1 className="text-4xl font-black text-foreground tracking-tight mb-1">
                 {t('పండుగ చిత్రాలు', 'Festival Gallery')}
               </h1>
               <p className="text-sm text-muted-foreground font-medium">
                  {t('జ్ఞాపకాలను సేవ్ చేయండి', 'Capture and preserve festival memories')}
               </p>
            </div>

            <div className="flex items-center gap-2">
               <div className="flex items-center bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                  <BackButton 
                    variant="ghost" 
                    size="sm"
                    className="h-9 rounded-xl bg-slate-50 border-none shadow-none text-slate-600 hover:bg-slate-100 hover:text-primary transition-all" 
                  />
                  <div className="w-px h-4 bg-slate-100 mx-1"></div>
                  <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setLanguage(language === 'telugu' ? 'english' : 'telugu')}
                      className="h-9 w-9 rounded-xl hover:bg-blue-50 text-blue-600 font-bold text-xs"
                  >
                     {language === 'telugu' ? 'EN' : 'తె'}
                  </Button>
                  <ThemeSwitcher />
                  
                  {isAuthenticated ? (
                    <>
                      <div className="w-px h-4 bg-slate-100 mx-1"></div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          logout();
                          toast({ title: t('లాగ్ అవుట్', 'Logged out'), description: t('విజయవంతంగా లాగ్ అవుట్ అయ్యారు', 'Successfully logged out') });
                        }}
                        className="h-9 w-9 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
                        title={t('లాగ్ అవుట్', 'Log Out')}
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="w-px h-4 bg-slate-100 mx-1"></div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsAuthOpen(true)}
                        className="h-9 w-9 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors"
                        title={t('లాగిన్', 'Login')}
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                    </>
                  )}
               </div>

               {isAuthenticated && (
                 <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="hidden md:flex bg-purple-600 hover:bg-purple-700 text-white font-black h-11 rounded-2xl px-6 text-sm shadow-xl shadow-purple-200 transition-all active:scale-[0.95] items-center gap-2"
                >
                    <Upload className="h-5 w-5" />
                    {t('చిత్రం అప్‌లోడ్ చేయండి', 'Upload Image')}
                </Button>
               )}
            </div>
          </div>
        </div>

        {/* Upload Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl border-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">{t('కొత్త చిత్రం అప్‌లోడ్ చేయండి', 'Upload New Image')}</DialogTitle>
              <DialogDescription className="font-medium text-slate-500">
                 {t('మీ పండుగ జ్ఞాపకాలను అందరితో పంచుకోండి', 'Share your festival memories with everyone')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file" className="font-bold text-slate-700">{t('చిత్రం', 'Image')} *</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50 transition-all relative">
                   <Input id="file" type="file" accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} required className="absolute inset-0 opacity-0 cursor-pointer" />
                   <div className="space-y-2">
                      <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto">
                         <Upload className="h-6 w-6 text-purple-600" />
                      </div>
                      <p className="text-sm font-bold text-slate-600">{selectedFile ? selectedFile.name : t('చిత్రం ఎంచుకోండి', 'Choose an image')}</p>
                      <p className="text-xs text-slate-400">{t('గరిష్ట పరిమాణం 5MB', 'Max size 5MB')}</p>
                   </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title" className="font-bold text-slate-700">{t('టైటిల్', 'Title')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('చిత్రం టైటిల్ (ఐచ్ఛికం)', 'Image title (optional)')}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="font-bold text-slate-700">{t('వివరణ', 'Description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('చిత్రం వివరణ (ఐచ్ఛికం)', 'Image description (optional)')}
                  rows={3}
                  className="rounded-xl border-slate-200 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={uploadImageMutation.isPending} className="flex-1 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold h-11">
                  {uploadImageMutation.isPending ? t('అప్‌లోడ్ చేస్తోంది...', 'Uploading...') : t('అప్‌లోడ్', 'Upload')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl border-slate-200 h-11">
                  {t('రద్దు', 'Cancel')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Images Grid */}
        <div className="max-w-7xl mx-auto mb-24">
          {images.length === 0 ? (
            <ComingSoon 
              festivalName={selectedFestival.name}
              year={selectedFestival.year}
              message={t('ఈ ఉత్సవానికి ఇంకా చిత్రాలు లేవు. అప్‌లోడ్ చేయండి!', 'No images available for this festival yet. Upload some!')}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 cursor-pointer aspect-[3/4]"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image.image_url}
                    alt={image.title || 'Image'}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Glass Overlay Actions */}
                  {isAuthenticated && (
                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-20">
                      <Button
                          variant="secondary"
                          size="icon"
                          className="h-9 w-9 bg-white/90 backdrop-blur-md rounded-xl text-slate-700 hover:bg-purple-600 hover:text-white border-none shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedFestival?.id && image.id) {
                              setBackgroundMutation.mutate({ festivalId: selectedFestival.id, imageId: image.id });
                            }
                          }}
                      >
                          <Pin className="h-4 w-4" />
                      </Button>
                      <Button
                          variant="secondary"
                          size="icon"
                          className="h-9 w-9 bg-white/90 backdrop-blur-md rounded-xl text-slate-700 hover:bg-blue-600 hover:text-white border-none shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditFormData({ title: image.title || '', description: image.description || '' });
                            setSelectedImage(image);
                            setIsEditDialogOpen(true);
                          }}
                      >
                          <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                          variant="secondary"
                          size="icon"
                          className="h-9 w-9 bg-white/90 backdrop-blur-md rounded-xl text-slate-700 hover:bg-red-600 hover:text-white border-none shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingImageId(image.id || null);
                          }}
                      >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Gradient & Meta */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
                    <p className="text-white text-sm font-black line-clamp-1 drop-shadow-md uppercase tracking-tight">
                        {image.title || t('చిత్రం', 'Photo')}
                    </p>
                    <p className="text-white/60 text-[10px] font-bold mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {image.created_at ? format(new Date(image.created_at), 'MMM dd, yyyy') : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Action Button (FAB) */}
        {isAuthenticated && (
          <Button
              onClick={() => setIsDialogOpen(true)}
              className="fixed bottom-24 right-6 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white p-0 flex items-center justify-center border-none transition-all active:scale-95 z-50 md:hidden"
              aria-label={t('చిత్రం అప్‌లోడ్ చేయండి', 'Upload Image')}
          >
              <Upload className="h-10 w-10" />
          </Button>
        )}

        {/* Image Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="p-0 border-none bg-black/95 max-w-5xl overflow-hidden rounded-3xl h-[85vh] sm:h-auto">
             <Button
               variant="ghost"
               size="icon"
               className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
               onClick={() => setSelectedImage(null)}
             >
               <X className="h-6 w-6" />
             </Button>
             
             {selectedImage && (
                <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                  <div className="md:col-span-2 flex items-center justify-center relative p-4 overflow-hidden">
                     <div 
                       className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-60"
                       style={{ backgroundImage: `url(${selectedImage.image_url})` }}
                     />
                     <div className="absolute inset-0 bg-black/40" />
                     <img 
                       src={selectedImage.image_url} 
                       alt={selectedImage.title}
                       className="relative z-10 max-w-full max-h-[70vh] object-contain shadow-2xl rounded-lg"
                     />
                  </div>
                  <div className="bg-white p-8 flex flex-col justify-center">
                     <div className="space-y-3">
                        <Button 
                          className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black shadow-lg shadow-purple-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                          onClick={async () => {
                            try {
                              const response = await fetch(selectedImage.image_url);
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = selectedImage.title ? `${selectedImage.title}.jpg` : 'photo.jpg';
                              a.click();
                              window.URL.revokeObjectURL(url);
                            } catch (e) {
                              toast({ title: t('లోపం', 'Error'), description: t('డౌన్‌లోడ్ విఫలమైంది', 'Download failed'), variant: 'destructive' });
                            }
                          }}
                        >
                          <Download className="h-5 w-5" />
                          {t('డౌన్‌లోడ్', 'Download Photo')}
                        </Button>
                        
                        {isAuthenticated && (
                           <div className="grid grid-cols-3 gap-2">
                              <Button 
                                variant="outline"
                                className="h-12 rounded-2xl border-slate-200 font-bold hover:bg-purple-50 hover:text-purple-600 px-0"
                                onClick={() => {
                                  if (selectedFestival?.id && selectedImage?.id) {
                                    setBackgroundMutation.mutate({ festivalId: selectedFestival.id, imageId: selectedImage.id });
                                    setSelectedImage(null);
                                  }
                                }}
                              >
                                <Pin className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline"
                                className="h-12 rounded-2xl border-slate-200 font-bold hover:bg-blue-50 hover:text-blue-600 px-0"
                                onClick={() => { 
                                  setEditFormData({ title: selectedImage.title || '', description: selectedImage.description || '' });
                                  setIsEditDialogOpen(true); 
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline"
                                className="h-12 rounded-2xl border-slate-200 font-bold hover:bg-red-50 hover:text-red-600 px-0"
                                onClick={() => { setDeletingImageId(selectedImage.id || null); setSelectedImage(null); }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
             )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingImageId} onOpenChange={() => setDeletingImageId(null)}>
          <AlertDialogContent className="rounded-3xl border-none p-8">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-3xl font-black text-slate-800">{t('చిత్రం తొలగించు', 'Delete Image')}</AlertDialogTitle>
              <AlertDialogDescription className="text-lg font-medium text-slate-500 mt-2">
                {t('మీరు ఈ చిత్రాన్ని తొలగించాలని ఖచ్చితంగా అనుకుంటున్నారా?', 'Are you sure you want to delete this image?')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 gap-3">
              <AlertDialogCancel className="h-12 rounded-xl border-none bg-slate-100 font-bold flex-1">{t('రద్దు', 'Cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const image = images.find(img => img.id === deletingImageId);
                  if (image) deleteImageMutation.mutate({ id: image.id!, imagePath: image.image_path });
                  setDeletingImageId(null);
                }}
                className="h-12 bg-red-600 text-white hover:bg-red-700 rounded-xl font-bold flex-1"
              >
                {t('తొలగించు', 'Delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl border-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">{t('చిత్రం వివరాలను సవరించండి', 'Edit Image Details')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (selectedImage?.id) {
                updateImageMutation.mutate({ 
                  id: selectedImage.id, 
                  title: editFormData.title, 
                  description: editFormData.description 
                });
              }
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="font-bold text-slate-700">{t('టైటిల్', 'Title')}</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder={t('చిత్రం టైటిల్ (ఐచ్ఛికం)', 'Image title (optional)')}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description" className="font-bold text-slate-700">{t('వివరణ', 'Description')}</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder={t('చిత్రం వివరణ (ఐచ్ఛికం)', 'Image description (optional)')}
                  rows={3}
                  className="rounded-xl border-slate-200 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={updateImageMutation.isPending} className="flex-1 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold h-11">
                  {updateImageMutation.isPending ? t('సేవ్ అవుతోంది...', 'Saving...') : t('సేవ్', 'Save')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl border-slate-200 h-11">
                  {t('రద్దు', 'Cancel')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <AuthDialog
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={() => setIsAuthOpen(false)}
        />
      </div>
    </div>
  );
}