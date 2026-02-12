import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePiNetwork } from '@/hooks/usePiNetwork';
import { Header } from '@/components/Header';
import { useUpdateApp, useDeleteApp, useAddScreenshot, useDeleteScreenshot } from '@/hooks/useApps';
import { App, Category, Screenshot } from '@/types/app';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Clock, CheckCircle, XCircle, ArrowLeft, Upload, Image, Video } from 'lucide-react';
import { AppIcon } from '@/components/AppIcon';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function MyApps() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { piUser, authenticateWithPi, createPiPayment } = usePiNetwork();
  
  const updateApp = useUpdateApp();
  const deleteApp = useDeleteApp();
  const addScreenshot = useAddScreenshot();
  const deleteScreenshot = useDeleteScreenshot();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<(App & { category?: Category; screenshots?: Screenshot[] }) | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [adFile, setAdFile] = useState<File | null>(null);
  const [adTitle, setAdTitle] = useState('');
  const [existingAd, setExistingAd] = useState<{ id: string; video_url: string; title: string | null } | null>(null);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    website_url: '',
    category_id: '',
    tags: '',
    version: '1.0',
    developer_name: '',
    age_rating: '4+',
    whats_new: '',
    privacy_policy_url: '',
    developer_website_url: '',
    compatibility: '',
    languages: '',
    has_in_app_purchases: false,
    pricing_model: 'free' as 'free' | 'paid',
    price_amount: '',
    payment_type: 'free' as 'free' | 'onetime' | 'monthly',
    network_type: 'mainnet' as 'mainnet' | 'testnet' | 'beta',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's apps
  const { data: myApps, isLoading: appsLoading } = useQuery({
    queryKey: ['my-apps', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('apps')
        .select('*, category:categories(*), screenshots:app_screenshots(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (App & { category?: Category; screenshots?: Screenshot[] })[];
    },
    enabled: !!user,
  });

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data as Category[];
    },
  });

  useEffect(() => {
    if (categoriesError) {
      toast.error('Failed to load categories. Please refresh and try again.');
    }
  }, [categoriesError]);

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Sign in Required</h1>
          <p className="text-muted-foreground mb-6">You need to be signed in to view your apps.</p>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </main>
      </div>
    );
  }

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error } = await supabase.storage.from('app-assets').upload(fileName, file);
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage.from('app-assets').getPublicUrl(fileName);
    return publicUrl;
  };

  const openEditDialog = (app: App & { category?: Category; screenshots?: Screenshot[] }) => {
    setEditingApp(app);
    setFormData({
      name: app.name,
      tagline: app.tagline || '',
      description: app.description || '',
      website_url: app.website_url,
      category_id: app.category_id ? String(app.category_id) : '',
      tags: app.tags?.join(', ') || '',
      version: app.version,
      developer_name: app.developer_name || '',
      age_rating: app.age_rating || '4+',
      whats_new: app.whats_new || '',
      privacy_policy_url: app.privacy_policy_url || '',
      developer_website_url: app.developer_website_url || '',
      compatibility: app.compatibility || '',
      languages: app.languages?.join(', ') || '',
      has_in_app_purchases: !!app.has_in_app_purchases,
      pricing_model: app.pricing_model || 'free',
      price_amount: app.price_amount ? String(app.price_amount) : '',
      payment_type: app.payment_type || 'free',
      network_type: app.network_type || 'mainnet',
      notes: app.notes || '',
    });
    setLogoFile(null);
    setScreenshotFiles([]);
    setAdFile(null);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    if (!isDialogOpen || !editingApp || !user) return;
    let isMounted = true;
    setIsAdLoading(true);
    supabase
      .from('app_ads')
      .select('id, video_url, title')
      .eq('app_id', editingApp.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          setExistingAd(null);
          setAdTitle('');
        } else {
          setExistingAd(data ? { id: data.id, video_url: data.video_url, title: data.title } : null);
          setAdTitle(data?.title || '');
        }
      })
      .then(() => {
        if (isMounted) setIsAdLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [editingApp?.id, isDialogOpen, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    setIsSubmitting(true);
    try {
      if (formData.pricing_model === 'paid' && !formData.price_amount) {
        toast.error('Price is required for paid apps');
        return;
      }

      // Require 5 Pi payment for every edit
      let activePiUser = piUser;
      if (!activePiUser) {
        activePiUser = await authenticateWithPi();
      }
      if (!activePiUser) {
        toast.error('Pi authentication required to edit apps');
        return;
      }
      await createPiPayment(5, 'App edit fee', {
        type: 'app_edit',
        app_id: editingApp.id,
        user_id: activePiUser.uid,
      });

      let logo_url = editingApp.logo_url;
      
      if (logoFile) {
        logo_url = await uploadFile(logoFile, 'logos');
      }

      await updateApp.mutateAsync({
        id: editingApp.id,
        name: formData.name,
        tagline: formData.tagline || null,
        description: formData.description || null,
        website_url: formData.website_url,
        category_id: formData.category_id || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        version: formData.version,
        logo_url,
        developer_name: formData.developer_name || null,
        age_rating: formData.age_rating,
        whats_new: formData.whats_new || null,
        privacy_policy_url: formData.privacy_policy_url || null,
        developer_website_url: formData.developer_website_url || null,
        compatibility: formData.compatibility || null,
        languages: formData.languages ? formData.languages.split(',').map(l => l.trim()).filter(Boolean) : [],
        has_in_app_purchases: !!formData.has_in_app_purchases,
        pricing_model: formData.pricing_model,
        price_amount: formData.price_amount ? parseFloat(formData.price_amount) : 0,
        payment_type: formData.pricing_model === 'free' ? 'free' : formData.payment_type,
        network_type: formData.network_type,
        notes: formData.notes || null,
      });

      // Upload new screenshots
      for (let i = 0; i < screenshotFiles.length; i++) {
        const imageUrl = await uploadFile(screenshotFiles[i], 'screenshots');
        await addScreenshot.mutateAsync({
          app_id: editingApp.id,
          image_url: imageUrl,
          display_order: (editingApp.screenshots?.length || 0) + i,
        });
      }

      // Update or create marketing video ad
      if (user) {
        if (adFile) {
          const videoUrl = await uploadFile(adFile, 'ads');
          if (existingAd?.id) {
            const { error: updateAdError } = await supabase
              .from('app_ads')
              .update({ video_url: videoUrl, title: adTitle || null })
              .eq('id', existingAd.id);
            if (updateAdError) throw updateAdError;
          } else {
            const { error: insertAdError } = await supabase
              .from('app_ads')
              .insert({
                app_id: editingApp.id,
                user_id: user.id,
                video_url: videoUrl,
                title: adTitle || null,
                is_active: true,
                skip_after_seconds: 5,
              });
            if (insertAdError) throw insertAdError;
          }
        } else if (existingAd?.id && adTitle !== (existingAd.title || '')) {
          const { error: updateAdTitleError } = await supabase
            .from('app_ads')
            .update({ title: adTitle || null })
            .eq('id', existingAd.id);
          if (updateAdTitleError) throw updateAdTitleError;
        }
      }

      toast.success('App updated successfully');
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['my-apps'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update app');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this app?')) return;
    
    try {
      await deleteApp.mutateAsync(id);
      toast.success('App deleted');
      queryClient.invalidateQueries({ queryKey: ['my-apps'] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteScreenshot = async (id: string) => {
    try {
      await deleteScreenshot.mutateAsync(id);
      toast.success('Screenshot deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Apps</h1>
            <p className="text-muted-foreground">Manage your submitted apps</p>
          </div>
          <Link to="/submit">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Submit App
            </Button>
          </Link>
        </div>

        {appsLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : myApps && myApps.length > 0 ? (
          <div className="space-y-4">
            {myApps.map((app) => (
              <div key={app.id} className="flex items-center gap-4 p-4 rounded-2xl bg-card">
                <AppIcon src={app.logo_url} name={app.name} size="md" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">{app.name}</h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{app.tagline}</p>
                  <p className="text-xs text-muted-foreground">
                    {app.category?.name || 'Uncategorized'} • v{app.version}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(app)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(app.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">No apps yet</h2>
            <p className="text-muted-foreground mb-4">Submit your first app to get started</p>
            <Link to="/submit">
              <Button>Submit App</Button>
            </Link>
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit App</DialogTitle>
            <DialogDescription className="sr-only">
              Update app details, screenshots, and metadata.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo */}
            <div className="space-y-2">
              <Label>App Icon</Label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 app-icon overflow-hidden bg-secondary">
                  <img
                    src={logoFile ? URL.createObjectURL(logoFile) : editingApp?.logo_url || ''}
                    alt="Logo"
                    className="h-full w-full object-cover"
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-2 transition-colors hover:border-primary">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Change icon</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">App Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger disabled={categoriesLoading || !!categoriesError}>
                    <SelectValue placeholder={categoriesLoading ? 'Loading categories...' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : !categories || categories.length === 0 ? (
                      <SelectItem value="empty" disabled>No categories found</SelectItem>
                    ) : (
                      categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="age_rating">Age Rating</Label>
                <Select
                  value={formData.age_rating}
                  onValueChange={(value) => setFormData({ ...formData, age_rating: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select age rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {['4+', '9+', '12+', '17+'].map((rating) => (
                      <SelectItem key={rating} value={rating}>
                        {rating}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="developer_name">Developer Name</Label>
              <Input
                id="developer_name"
                value={formData.developer_name}
                onChange={(e) => setFormData({ ...formData, developer_name: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="developer_website_url">Developer Website</Label>
                <Input
                  id="developer_website_url"
                  type="url"
                  value={formData.developer_website_url}
                  onChange={(e) => setFormData({ ...formData, developer_website_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="privacy_policy_url">Privacy Policy</Label>
                <Input
                  id="privacy_policy_url"
                  type="url"
                  value={formData.privacy_policy_url}
                  onChange={(e) => setFormData({ ...formData, privacy_policy_url: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="compatibility">Compatibility</Label>
                <Input
                  id="compatibility"
                  value={formData.compatibility}
                  onChange={(e) => setFormData({ ...formData, compatibility: e.target.value })}
                  placeholder="Web, iOS, Android..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="languages">Languages (comma-separated)</Label>
                <Input
                  id="languages"
                  value={formData.languages}
                  onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whats_new">What's New</Label>
              <Textarea
                id="whats_new"
                value={formData.whats_new}
                onChange={(e) => setFormData({ ...formData, whats_new: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="has_in_app_purchases"
                type="checkbox"
                checked={formData.has_in_app_purchases}
                onChange={(e) => setFormData({ ...formData, has_in_app_purchases: e.target.checked })}
              />
              <Label htmlFor="has_in_app_purchases">Has In-App Purchases</Label>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Pricing & Network</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Pricing Model</Label>
                  <Select
                    value={formData.pricing_model}
                    onValueChange={(value: 'free' | 'paid') =>
                      setFormData({
                        ...formData,
                        pricing_model: value,
                        payment_type: value === 'free' ? 'free' : (formData.payment_type === 'free' ? 'onetime' : formData.payment_type),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Network</Label>
                  <Select
                    value={formData.network_type}
                    onValueChange={(value: 'mainnet' | 'testnet' | 'beta') => setFormData({ ...formData, network_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mainnet">Mainnet</SelectItem>
                      <SelectItem value="testnet">Testnet</SelectItem>
                      <SelectItem value="beta">Beta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.pricing_model === 'paid' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Payment Type</Label>
                    <Select
                      value={formData.payment_type}
                      onValueChange={(value: 'onetime' | 'monthly') => setFormData({ ...formData, payment_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onetime">One-time</SelectItem>
                        <SelectItem value="monthly">Monthly Subscription</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Price (Pi)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price_amount}
                      onChange={(e) => setFormData({ ...formData, price_amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Developer Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Any notes about your app (changelog, instructions, etc.)"
                />
              </div>
            </div>

            {/* Screenshots */}
            <div className="space-y-2">
              <Label>Screenshots</Label>
              
              {editingApp?.screenshots && editingApp.screenshots.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {editingApp.screenshots.map((ss) => (
                    <div key={ss.id} className="relative group">
                      <img
                        src={ss.image_url}
                        alt="Screenshot"
                        className="h-24 w-auto rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteScreenshot(ss.id)}
                        className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {screenshotFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {screenshotFiles.map((file, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="New screenshot"
                        className="h-24 w-auto rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setScreenshotFiles(files => files.filter((_, idx) => idx !== i))}
                        className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-3 transition-colors hover:border-primary">
                <Image className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Add screenshots</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setScreenshotFiles([...screenshotFiles, ...Array.from(e.target.files)]);
                    }
                  }}
                />
              </label>
            </div>

            {/* Marketing Video Ad */}
            <div className="space-y-3">
              <Label>Marketing Video Ad</Label>
              {isAdLoading ? (
                <p className="text-sm text-muted-foreground">Loading ad...</p>
              ) : existingAd && !adFile ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-muted">
                    <video src={existingAd.video_url} controls className="w-full max-h-64 object-contain" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ad_title_edit">Ad Title</Label>
                    <Input
                      id="ad_title_edit"
                      value={adTitle}
                      onChange={(e) => setAdTitle(e.target.value)}
                      placeholder="Catchy ad headline..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="ad_title_edit">Ad Title</Label>
                  <Input
                    id="ad_title_edit"
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    placeholder="Catchy ad headline..."
                  />
                </div>
              )}

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-3 transition-colors hover:border-primary">
                <Video className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {adFile ? 'Change video ad' : existingAd ? 'Replace video ad' : 'Upload video ad (30-60s, MP4)'}
                </span>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 100 * 1024 * 1024) {
                        toast.error('Video must be under 100MB');
                        return;
                      }
                      setAdFile(file);
                    }
                  }}
                />
              </label>

              {adFile && (
                <div className="relative rounded-xl overflow-hidden bg-muted">
                  <video src={URL.createObjectURL(adFile)} controls className="w-full max-h-64 object-contain" />
                  <button
                    type="button"
                    onClick={() => setAdFile(null)}
                    className="absolute top-2 right-2 rounded-full bg-destructive p-1.5 text-destructive-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Editing an app costs 5 Pi.</p>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-600 text-white"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    case 'rejected':
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    default:
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  }
}
