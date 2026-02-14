import { useState } from 'react';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useAllBlogPosts, useCreateBlogPost, useUpdateBlogPost, useDeleteBlogPost } from '@/hooks/useBlog';
import { useApps } from '@/hooks/useApps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye, Image, Film, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useRef } from 'react';

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'untitled';
}

export default function AdminBlog() {
  const { user, isAdmin } = useAuth();
  const { data: posts, isLoading } = useAllBlogPosts();
  const { data: apps } = useApps();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [appId, setAppId] = useState<string>('none');
  const [coverUrl, setCoverUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const contentFileRef = useRef<HTMLInputElement>(null);
  const [insertingMedia, setInsertingMedia] = useState(false);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Admin access required</h1>
        </main>
      </div>
    );
  }

  const approvedApps = apps?.filter(a => a.status === 'approved') || [];

  const resetForm = () => {
    setEditId(null);
    setTitle('');
    setSlug('');
    setContent('');
    setAppId('none');
    setCoverUrl('');
    setIsPublished(false);
  };

  const openEdit = (post: any) => {
    setEditId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setContent(post.content);
    setAppId(post.app_id || 'none');
    setCoverUrl(post.cover_image_url || '');
    setIsPublished(post.is_published);
    setDialogOpen(true);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `blog/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage
      .from('app-assets')
      .upload(fileName, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from('app-assets').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setCoverUrl(url);
      toast.success('Cover uploaded!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleContentMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInsertingMedia(true);
    try {
      const url = await uploadFile(file);
      let tag = '';
      if (file.type.startsWith('video/')) {
        tag = `\n<video src="${url}" controls class="w-full rounded-xl my-4"></video>\n`;
      } else if (file.type === 'image/gif') {
        tag = `\n<img src="${url}" alt="GIF" class="w-full rounded-xl my-4" />\n`;
      } else {
        tag = `\n<img src="${url}" alt="Image" class="w-full rounded-xl my-4" />\n`;
      }
      setContent(prev => prev + tag);
      toast.success('Media inserted into content!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setInsertingMedia(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title required'); return; }
    const finalSlug = slug.trim() || slugify(title);

    try {
      if (editId) {
        await updatePost.mutateAsync({
          id: editId,
          title: title.trim(),
          slug: finalSlug,
          content,
          app_id: appId === 'none' ? null : appId,
          cover_image_url: coverUrl || null,
          is_published: isPublished,
        });
        toast.success('Post updated!');
      } else {
        await createPost.mutateAsync({
          title: title.trim(),
          slug: finalSlug,
          content,
          app_id: appId === 'none' ? null : appId,
          cover_image_url: coverUrl || null,
          is_published: isPublished,
          author_id: user!.id,
        });
        toast.success('Post created!');
      }
      resetForm();
      setDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      await deletePost.mutateAsync(id);
      toast.success('Post deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleAutoGenerate = () => {
    if (appId === 'none') { toast.error('Select an app first'); return; }
    const app = approvedApps.find(a => a.id === appId);
    if (!app) return;
    const html = `<h2>${app.name}</h2>
<p>${app.tagline || ''}</p>
<p>${app.description || 'No description available.'}</p>
${app.whats_new ? `<h3>What's New</h3><p>${app.whats_new}</p>` : ''}
<p><strong>Version:</strong> ${app.version || '1.0'}</p>
<p><strong>Developer:</strong> ${app.developer_name || 'Unknown'}</p>
<p><strong>Category:</strong> ${(app as any).category?.name || 'App'}</p>
<p><strong>Rating:</strong> ${app.average_rating?.toFixed(1) || '--'} (${app.ratings_count || 0} ratings)</p>
<p><a href="${window.location.origin}/app/${app.id}">View on OpenApp →</a></p>`;
    setContent(html);
    if (!title) setTitle(app.name);
    if (!slug) setSlug(slugify(app.name));
    if (!coverUrl && app.logo_url) setCoverUrl(app.logo_url);
    toast.success('Blog content auto-generated from app details!');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Blog Manager</h1>
          <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Post</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? 'Edit Post' : 'New Blog Post'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={e => { setTitle(e.target.value); if (!editId) setSlug(slugify(e.target.value)); }} />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="auto-generated" />
                </div>
                <div>
                  <Label>App (optional)</Label>
                  <Select value={appId} onValueChange={setAppId}>
                    <SelectTrigger><SelectValue placeholder="No app" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No app</SelectItem>
                      {approvedApps.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {appId !== 'none' && (
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={handleAutoGenerate}>
                      Auto-generate from app details
                    </Button>
                  )}
                </div>
                <div>
                  <Label>Cover Image</Label>
                  {coverUrl && <img src={coverUrl} alt="Cover" className="w-full h-32 object-cover rounded-xl mb-2" />}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                      Upload Cover
                    </Button>
                    <Input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="Or paste URL" className="flex-1" />
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>Content (HTML)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => contentFileRef.current?.click()} disabled={insertingMedia}>
                      {insertingMedia ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <><Image className="h-4 w-4 mr-1" /><Film className="h-4 w-4 mr-1" /></>}
                      Insert Media
                    </Button>
                    <input ref={contentFileRef} type="file" accept="image/*,video/*,image/gif" className="hidden" onChange={handleContentMediaUpload} />
                  </div>
                  <Textarea value={content} onChange={e => setContent(e.target.value)} rows={12} placeholder="<h2>Title</h2><p>Your blog content...</p>" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports HTML. Insert images, GIFs, videos using the button above. Embed YouTube: &lt;iframe src="..."&gt;&lt;/iframe&gt;
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                  <Label>Published</Label>
                </div>
                <Button onClick={handleSave} disabled={createPost.isPending || updatePost.isPending} className="w-full">
                  {editId ? 'Update Post' : 'Create Post'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading && <p className="text-muted-foreground">Loading...</p>}

        <div className="space-y-3">
          {posts?.map(post => (
            <div key={post.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              {post.cover_image_url && (
                <img src={post.cover_image_url} alt="" className="h-14 w-20 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{post.title}</p>
                <p className="text-xs text-muted-foreground">
                  {post.is_published ? '✅ Published' : '📝 Draft'}
                  {post.app ? ` · ${post.app.name}` : ''}
                  {post.published_at ? ` · ${formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}` : ''}
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => window.open(`/blog/${post.slug}`, '_blank')}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(post)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
