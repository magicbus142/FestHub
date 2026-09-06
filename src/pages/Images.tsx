import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadImage, getImages, deleteImage, updateImage, type ImageRecord } from '@/lib/images';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';

import { Upload, Calendar, Trash2, X, Download, Pin, Lock, Edit2, LogOut, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useFestival } from '@/contexts/FestivalContext';
import { AuthDialog } from '@/components/AuthDialog';
import { ComingSoon } from '@/components/ComingSoon';
import { setFestivalBackgroundImage } from '@/lib/festivals';
import { BackButton } from '@/components/BackButton';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { PageHeader } from '@/components/PageHeader';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<string>('newest');
  const itemsPerPage = 12;

  const { data: images = [] } = useQuery({
    queryKey: ['user-images', selectedFestival?.name, selectedFestival?.year],
    queryFn: () => getImages(selectedFestival?.name, selectedFestival?.year),
    enabled: !!selectedFestival,
  });

  const filteredImages = images.filter((img) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      img.title?.toLowerCase().includes(term) ||
      img.description?.toLowerCase().includes(term)
    );
  }).sort((a, b) => {
    if (sortOption === 'oldest') {
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    }
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
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
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
        
        <PageHeader
          title={t('పండుగ చిత్రాలు', 'Festival Gallery')}
          description={t('జ్ఞాపకాలను సేవ్ చేయండి', 'Capture and preserve festival memories')}
          onAuthOpen={() => setIsAuthOpen(true)}
        >
          {isAuthenticated && (
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground font-black h-9 rounded-xl px-4 text-xs shadow-md transition-all active:scale-[0.95] items-center gap-1.5"
            >
              <Upload className="h-4 w-4" />
              {t('చిత్రం అప్‌లోడ్ చేయండి', 'Upload Image')}
            </Button>
          )}
        </PageHeader>

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
                <div className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/30 hover:bg-purple-50/60 rounded-2xl p-8 text-center transition-all relative cursor-pointer group">
                   <Input 
                     id="file" 
                     type="file" 
                     accept="image/jpeg, image/png, image/webp" 
                     onChange={handleFileChange} 
                     required 
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                   />
                   <div className="space-y-2 pointer-events-none relative z-10">
                      <div className="h-12 w-12 bg-purple-100 group-hover:bg-purple-200 rounded-2xl flex items-center justify-center mx-auto transition-colors">
                         <Upload className="h-6 w-6 text-purple-600" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">{selectedFile ? selectedFile.name : t('చిత్రం ఎంచుకోండి', 'Choose an image')}</p>
                      <p className="text-xs font-semibold text-slate-400">{t('గరిష్ట పరిమాణం 5MB', 'Max size 5MB')}</p>
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
                <Button type="submit" disabled={uploadImageMutation.isPending} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold h-11">
                  {uploadImageMutation.isPending ? t('అప్‌లోడ్ చేస్తోంది...', 'Uploading...') : t('అప్‌లోడ్', 'Upload')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl border-slate-200 h-11">
                  {t('రద్దు', 'Cancel')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        {/* Gallery Overview Dashboard Card (Matching Chandas / Expenses style) */}
        <Card className="bg-white shadow-sm border border-slate-100 rounded-3xl overflow-hidden relative group mb-6">
           <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                       {t('మొత్తం ఫోటోలు', 'TOTAL FESTIVAL PHOTOS')}
                    </p>
                    <div className="flex items-baseline gap-3">
                       <h2 className="text-4xl sm:text-5xl font-black text-blue-600 tracking-tight">
                          {images.length}
                       </h2>
                       <span className="text-sm font-bold text-slate-500">
                          {t('జ్ఞాపకాలు భద్రపరచబడ్డాయి', 'Memories Captured')}
                       </span>
                    </div>
                 </div>

                 {images.length > 0 && (
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3.5 py-2 rounded-2xl text-xs font-bold border border-blue-100/80">
                       <Calendar className="h-4 w-4 text-blue-600" />
                       <span>{t('తాజాది', 'Latest')}: {format(new Date(images[0].created_at || Date.now()), 'MMM dd, yyyy')}</span>
                    </div>
                 )}
              </div>
           </CardContent>
        </Card>

        {/* Management View: Search + Filter + Photo Count */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6 p-4 sm:p-5">
           {/* Section Tab Badge */}
           <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                 <span className="text-sm font-extrabold text-blue-600 border-b-2 border-blue-600 pb-1.5 -mb-3 tracking-tight">
                   {t('చిత్రాలు', 'Photos')}
                 </span>
                 <span className="inline-flex items-center justify-center h-5.5 min-w-[22px] px-2 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    {filteredImages.length}
                 </span>
              </div>

              {isAuthenticated && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground font-black h-8 rounded-xl px-3 text-xs shadow-sm transition-all active:scale-[0.95] items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {t('అప్‌లోడ్', 'Upload')}
                </Button>
              )}
           </div>

           <div className="flex flex-col md:flex-row gap-3 items-center pt-1">
              {/* Search */}
              <div className="relative flex-1 w-full">
                 <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                 </div>
                 <input
                   type="text"
                   placeholder={t('చిత్రం టైటిల్ లేదా వివరణ ద్వారా శోధించండి...', 'Search photos by title or description...')}
                   className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-2xl leading-5 bg-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all"
                   value={searchTerm}
                   onChange={(e) => {
                     setSearchTerm(e.target.value);
                     setCurrentPage(1);
                   }}
                 />
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                 <select 
                    className="flex-1 md:w-48 bg-white border border-slate-200 text-foreground py-2.5 px-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                 >
                    <option value="newest">{t('కొత్తవి మొదట', 'Newest First')}</option>
                    <option value="oldest">{t('పాతవి మొదట', 'Oldest First')}</option>
                 </select>
              </div>
           </div>
        </div>

        {/* Images Grid */}
        <div className="max-w-7xl mx-auto mb-24">
          {images.length === 0 ? (
            <ComingSoon 
              festivalName={selectedFestival.name}
              year={selectedFestival.year}
              message={t('ఈ ఉత్సవానికి ఇంకా చిత్రాలు లేవు. అప్‌లోడ్ చేయండి!', 'No images available for this festival yet. Upload some!')}
            />
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-lg font-bold text-slate-600">{t('చిత్రాలు కనుగొనబడలేదు', 'No photos found matching your search')}</p>
              <Button 
                variant="link" 
                onClick={() => setSearchTerm('')}
                className="text-blue-600 font-bold mt-2"
              >
                {t('అన్ని చిత్రాలను చూపించు', 'Show all photos')}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6 md:gap-7">
                {filteredImages
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((image) => (
                  <div
                    key={image.id}
                    className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 cursor-pointer aspect-[3/4] sm:aspect-[3/4.2] md:aspect-[3/4.6] xl:aspect-[3/4]"
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

              {filteredImages.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-4 border-t border-slate-200/60">
                  <p className="text-xs font-bold text-slate-500">
                    {t(
                      `చూపిస్తోంది ${(currentPage - 1) * itemsPerPage + 1} నుండి ${Math.min(currentPage * itemsPerPage, filteredImages.length)} లో ${filteredImages.length} ఫలితాలు`,
                      `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, filteredImages.length)} of ${filteredImages.length} results`
                    )}
                  </p>

                  {filteredImages.length > itemsPerPage && (
                    <Pagination className="mx-0 w-auto">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.ceil(filteredImages.length / itemsPerPage) }).map((_, i) => (
                           <PaginationItem key={i}>
                             <PaginationLink 
                                href="#" 
                                isActive={currentPage === i + 1}
                                onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}
                             >
                                {i + 1}
                             </PaginationLink>
                           </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext 
                            href="#"
                            onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(Math.ceil(filteredImages.length / itemsPerPage), p + 1)); }}
                            className={currentPage === Math.ceil(filteredImages.length / itemsPerPage) ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating Action Button (FAB) */}
        {isAuthenticated && (
          <Button
              onClick={() => setIsDialogOpen(true)}
              className="fixed bottom-24 right-6 h-16 w-16 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground p-0 flex items-center justify-center border-none transition-all active:scale-95 z-50 md:hidden"
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
                          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
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
                <Button type="submit" disabled={updateImageMutation.isPending} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold h-11">
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