import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { useApps, useCategories, useUpdateApp, useDeleteApp, useDeleteScreenshot } from '@/hooks/useApps';
import { App, Category, Screenshot } from '@/types/app';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Pencil, Trash2, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { AppIcon } from '@/components/AppIcon';
import { PageLoader } from '@/components/PageLoader';

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const { data: apps, isLoading: appsLoading, refetch } = useApps();
  const { data: categories } = useCategories();
  
  const updateApp = useUpdateApp();
  const deleteApp = useDeleteApp();
  const deleteScreenshot = useDeleteScreenshot();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<(App & { category?: Category; screenshots?: Screenshot[] }) | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    website_url: '',
    category_id: '',
    tags: '',
    is_featured: false,
    is_popular: false,
    version: '1.0',
    developer_name: '',
    age_rating: '4+',
    whats_new: '',
    status: 'pending' as 'pending' | 'approved' | 'rejected',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, loading, navigate]);

  const resetForm = () => {
    setFormData({
      name: '',
      tagline: '',
      description: '',
      website_url: '',
      category_id: '',
      tags: '',
      is_featured: false,
      is_popular: false,
      version: '1.0',
      developer_name: '',
      age_rating: '4+',
      whats_new: '',
      status: 'pending',
    });
    setEditingApp(null);
  };

  const openEditDialog = (app: App & { category?: Category; screenshots?: Screenshot[] }) => {
    setEditingApp(app);
    setFormData({
      name: app.name,
      tagline: app.tagline || '',
      description: app.description || '',
      website_url: app.website_url,
      category_id: app.category_id || '',
      tags: app.tags?.join(', ') || '',
      is_featured: app.is_featured,
      is_popular: app.is_popular,
      version: app.version,
      developer_name: app.developer_name || '',
      age_rating: app.age_rating || '4+',
      whats_new: app.whats_new || '',
      status: app.status || 'pending',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    setIsSubmitting(true);
    try {
      await updateApp.mutateAsync({
        id: editingApp.id,
        name: formData.name,
        tagline: formData.tagline || null,
        description: formData.description || null,
        website_url: formData.website_url,
        category_id: formData.category_id || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        is_featured: formData.is_featured,
        is_popular: formData.is_popular,
        version: formData.version,
        developer_name: formData.developer_name || null,
        age_rating: formData.age_rating,
        whats_new: formData.whats_new || null,
        status: formData.status,
      });
      
      toast.success('App updated successfully');
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateApp.mutateAsync({ id, status: 'approved' });
      toast.success('App approved');
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateApp.mutateAsync({ id, status: 'rejected' });
      toast.success('App rejected');
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this app?')) return;
    
    try {
      await deleteApp.mutateAsync(id);
      toast.success('App deleted');
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

  const filteredApps = apps?.filter(app => {
    if (activeTab === 'all') return true;
    return app.status === activeTab;
  }) || [];

  const pendingCount = apps?.filter(a => a.status === 'pending').length || 0;

  if (loading || !isAdmin) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground">Manage and approve submitted apps</p>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            All Apps
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'pending' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            Pending
            {pendingCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'approved' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'rejected' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            Rejected
          </button>
        </div>

        {/* Apps List */}
        {appsLoading ? (
          <PageLoader label="Loading apps..." fullscreen={false} />
        ) : filteredApps.length > 0 ? (
          <div className="space-y-4">
            {filteredApps.map((app) => (
              <div key={app.id} className="flex items-center gap-4 p-4 rounded-2xl bg-card">
                <AppIcon src={app.logo_url} name={app.name} size="md" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">{app.name}</h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{app.tagline}</p>
                  <p className="text-xs text-muted-foreground">
                    by {app.developer_name || 'Unknown'} • {app.category?.name || 'Uncategorized'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {app.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(app.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(app.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </>
                  )}
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
            <p className="text-muted-foreground">No apps found</p>
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit App</DialogTitle>
            <DialogDescription>
              Update the details for this app.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">App Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website_url">Website URL</Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
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
              </TabsContent>

              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="developer_name">Developer Name</Label>
                  <Input
                    id="developer_name"
                    value={formData.developer_name}
                    onChange={(e) => setFormData({ ...formData, developer_name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="age_rating">Age Rating</Label>
                  <Select
                    value={formData.age_rating}
                    onValueChange={(value) => setFormData({ ...formData, age_rating: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4+">4+</SelectItem>
                      <SelectItem value="9+">9+</SelectItem>
                      <SelectItem value="12+">12+</SelectItem>
                      <SelectItem value="17+">17+</SelectItem>
                    </SelectContent>
                  </Select>
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
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'pending' | 'approved' | 'rejected') => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="is_featured" className="text-base">Featured App</Label>
                    <p className="text-sm text-muted-foreground">Display prominently on the homepage</p>
                  </div>
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="is_popular" className="text-base">Popular App</Label>
                    <p className="text-sm text-muted-foreground">Show in the "Top Apps" section</p>
                  </div>
                  <Switch
                    id="is_popular"
                    checked={formData.is_popular}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                  />
                </div>

                {/* Screenshots */}
                {editingApp?.screenshots && editingApp.screenshots.length > 0 && (
                  <div className="space-y-2">
                    <Label>Screenshots</Label>
                    <div className="flex flex-wrap gap-2">
                      {editingApp.screenshots.map((ss) => (
                        <div key={ss.id} className="relative group">
                          <img
                            src={ss.image_url}
                            alt="Screenshot"
                            className="h-24 w-40 rounded-lg object-cover"
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
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
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
      return <Badge className="bg-green-600 text-white">Approved</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  }
}
