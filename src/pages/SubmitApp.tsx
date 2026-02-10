import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePiNetwork } from '@/hooks/usePiNetwork';
import { Header } from '@/components/Header';
import { useCategories, useAddScreenshot } from '@/hooks/useApps';
import { useCreateAd } from '@/hooks/useAds';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, X, Image, ArrowLeft, CheckCircle, Video, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

type SubmitStep = 'details' | 'payment' | 'submitting' | 'done';

export default function SubmitApp() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { createPiPayment, isPiReady, authenticateWithPi, isPiAuthenticated } = usePiNetwork();
  const { data: categories } = useCategories();
  const addScreenshot = useAddScreenshot();
  const createAd = useCreateAd();

  const [step, setStep] = useState<SubmitStep>('details');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

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
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [videoAdFile, setVideoAdFile] = useState<File | null>(null);
  const [adTitle, setAdTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing drafts
  const [drafts, setDrafts] = useState<any[]>([]);
  useEffect(() => {
    if (user) {
      supabase
        .from('app_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .then(({ data }) => {
          if (data) setDrafts(data);
        });
    }
  }, [user]);

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Sign in to Submit</h1>
          <p className="text-muted-foreground mb-6">You need to be signed in to submit an app.</p>
          <Link to="/auth"><Button>Sign In</Button></Link>
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

  const saveDraft = async (): Promise<string> => {
    if (!user) throw new Error('Not authenticated');

    let logo_url: string | null = null;
    if (logoFile) {
      logo_url = await uploadFile(logoFile, 'logos');
    }

    const screenshotUrls: string[] = [];
    for (const file of screenshotFiles) {
      const url = await uploadFile(file, 'screenshots');
      screenshotUrls.push(url);
    }

    let videoAdUrl: string | null = null;
    if (videoAdFile) {
      videoAdUrl = await uploadFile(videoAdFile, 'ads');
    }

    const draftData = {
      user_id: user.id,
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
      screenshot_urls: screenshotUrls,
      video_ad_url: videoAdUrl,
      ad_title: adTitle || null,
      payment_status: 'pending' as const,
    };

    if (draftId) {
      const { error } = await supabase
        .from('app_drafts')
        .update(draftData)
        .eq('id', draftId);
      if (error) throw error;
      return draftId;
    } else {
      const { data, error } = await supabase
        .from('app_drafts')
        .insert(draftData)
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.name || !formData.website_url) {
      toast.error('Name and website URL are required to save draft');
      return;
    }
    try {
      const id = await saveDraft();
      setDraftId(id);
      toast.success('Draft saved!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save draft');
    }
  };

  const loadDraft = (draft: any) => {
    setFormData({
      name: draft.name || '',
      tagline: draft.tagline || '',
      description: draft.description || '',
      website_url: draft.website_url || '',
      category_id: draft.category_id || '',
      tags: draft.tags?.join(', ') || '',
      version: draft.version || '1.0',
      developer_name: draft.developer_name || '',
      age_rating: draft.age_rating || '4+',
      whats_new: draft.whats_new || '',
      privacy_policy_url: draft.privacy_policy_url || '',
      developer_website_url: draft.developer_website_url || '',
    });
    setDraftId(draft.id);
    setAdTitle(draft.ad_title || '');
    if (draft.payment_status === 'paid') {
      setStep('details');
    }
    toast.success('Draft loaded');
  };

  const handleProceedToPayment = async () => {
    if (!formData.name || !formData.website_url) {
      toast.error('Name and website URL are required');
      return;
    }
    try {
      const id = await saveDraft();
      setDraftId(id);
      setStep('payment');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save draft');
    }
  };

  const handlePiPayment = async () => {
    if (!isPiReady) {
      toast.error('Pi Network not available. Please use Pi Browser.');
      return;
    }

    // Ensure Pi authentication with payments scope
    if (!isPiAuthenticated) {
      const piUser = await authenticateWithPi();
      if (!piUser) {
        toast.error('Pi authentication required for payment');
        return;
      }
    }

    setPaymentLoading(true);
    try {
      await createPiPayment(
        25,
        'App listing fee - OpenApp',
        { type: 'app_listing', draft_id: draftId }
      );

      // Payment completed - update draft and submit
      if (draftId) {
        await supabase
          .from('app_drafts')
          .update({ payment_status: 'paid' })
          .eq('id', draftId);
      }

      await submitApp();
    } catch (error: any) {
      if (error.message === 'Payment cancelled') {
        toast.info('Payment cancelled. Your draft has been saved.');
        setStep('details');
      } else {
        toast.error(error.message || 'Payment failed');
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const submitApp = async () => {
    if (!user) return;
    setStep('submitting');
    setIsSubmitting(true);

    try {
      // Get draft data
      const { data: draft } = draftId
        ? await supabase.from('app_drafts').select('*').eq('id', draftId).single()
        : { data: null };

      const logoUrl = draft?.logo_url || null;

      const { data: newApp, error: appError } = await supabase
        .from('apps')
        .insert({
          name: formData.name,
          tagline: formData.tagline || null,
          description: formData.description || null,
          website_url: formData.website_url,
          category_id: formData.category_id || null,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          version: formData.version,
          logo_url: logoUrl,
          user_id: user.id,
          developer_name: formData.developer_name || null,
          age_rating: formData.age_rating,
          whats_new: formData.whats_new || null,
          privacy_policy_url: formData.privacy_policy_url || null,
          developer_website_url: formData.developer_website_url || null,
          status: 'pending',
          is_featured: false,
          is_popular: false,
        })
        .select()
        .single();

      if (appError) throw appError;

      // Add screenshots from draft
      if (draft?.screenshot_urls) {
        for (let i = 0; i < draft.screenshot_urls.length; i++) {
          await addScreenshot.mutateAsync({
            app_id: newApp.id,
            image_url: draft.screenshot_urls[i],
            display_order: i,
          });
        }
      }

      // Add video ad from draft
      if (draft?.video_ad_url) {
        await createAd.mutateAsync({
          app_id: newApp.id,
          user_id: user.id,
          video_url: draft.video_ad_url,
          title: draft.ad_title || null,
          skip_after_seconds: 5,
        });
      }

      // Mark draft as submitted
      if (draftId) {
        await supabase.from('app_drafts').delete().eq('id', draftId);
      }

      setStep('done');
      toast.success('App submitted for review!');
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to submit app');
      setStep('payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">App Submitted!</h1>
          <p className="text-muted-foreground mb-8">Your app has been submitted for review. We'll notify you once it's approved.</p>
          <div className="flex gap-4 justify-center">
            <Link to="/"><Button>Browse Apps</Button></Link>
            <Button variant="outline" onClick={() => {
              setStep('details');
              setDraftId(null);
              setFormData({ name: '', tagline: '', description: '', website_url: '', category_id: '', tags: '', version: '1.0', developer_name: '', age_rating: '4+', whats_new: '', privacy_policy_url: '', developer_website_url: '' });
              setLogoFile(null);
              setScreenshotFiles([]);
              setVideoAdFile(null);
              setAdTitle('');
            }}>Submit Another</Button>
          </div>
        </main>
      </div>
    );
  }

  if (step === 'submitting') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="animate-pulse text-muted-foreground text-lg">Submitting your app...</div>
        </main>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-6">
          <button onClick={() => setStep('details')} className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Details
          </button>

          <div className="rounded-2xl bg-card p-8 shadow-lg border border-border text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Pay 25 Pi to List Your App</h2>
            <p className="text-muted-foreground mb-2">
              A one-time fee of 25 Pi is required to submit <strong>{formData.name}</strong> on OpenApp.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Your app details have been saved as a draft. If you cancel, you can come back to it later.
            </p>

            <Button
              onClick={handlePiPayment}
              disabled={!isPiReady || paymentLoading}
              className="w-full bg-[#7B2FF2] hover:bg-[#6B1FE2] dark:bg-[#9B59B6] dark:hover:bg-[#8E44AD] text-white font-semibold"
              size="lg"
            >
              {paymentLoading ? 'Processing Payment...' : 'Pay 25 Pi'}
            </Button>
            {!isPiReady && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Pi payment requires Pi Browser
              </p>
            )}

            <Button
              variant="ghost"
              className="w-full mt-3"
              onClick={() => {
                toast.info('Draft saved. You can pay later.');
                setStep('details');
              }}
            >
              Cancel & Save Draft
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Submit Your App</h1>
          <p className="text-muted-foreground">Share your app with the community • Listing fee: 25 Pi</p>
        </div>

        {/* Drafts */}
        {drafts.length > 0 && !draftId && (
          <div className="mb-6 rounded-2xl bg-card p-4 border border-border">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Your Drafts
            </h3>
            <div className="space-y-2">
              {drafts.map((draft) => (
                <button
                  key={draft.id}
                  onClick={() => loadDraft(draft)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-foreground">{draft.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {draft.payment_status === 'paid' ? '✅ Paid' : '⏳ Payment pending'} •
                      Updated {new Date(draft.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-primary text-sm">Load</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleProceedToPayment(); }} className="space-y-8">
          {/* App Icon */}
          <div className="space-y-2">
            <Label>App Icon *</Label>
            <div className="flex items-center gap-4">
              {logoFile && (
                <div className="h-20 w-20 app-icon overflow-hidden bg-secondary">
                  <img src={URL.createObjectURL(logoFile)} alt="Logo preview" className="h-full w-full object-cover" />
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-4 transition-colors hover:border-primary hover:bg-secondary/50">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{logoFile ? 'Change icon' : 'Upload app icon'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">App Name *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="My Awesome App" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" value={formData.tagline} onChange={(e) => setFormData({ ...formData, tagline: e.target.value })} placeholder="A short catchy description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Full description of your app..." rows={4} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL *</Label>
              <Input id="website_url" type="url" value={formData.website_url} onChange={(e) => setFormData({ ...formData, website_url: e.target.value })} placeholder="https://example.com" required />
            </div>
          </div>

          {/* Developer Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Developer Information</h3>
            <div className="space-y-2">
              <Label htmlFor="developer_name">Developer Name</Label>
              <Input id="developer_name" value={formData.developer_name} onChange={(e) => setFormData({ ...formData, developer_name: e.target.value })} placeholder="Your name or company" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="developer_website_url">Developer Website</Label>
              <Input id="developer_website_url" type="url" value={formData.developer_website_url} onChange={(e) => setFormData({ ...formData, developer_website_url: e.target.value })} placeholder="https://yourwebsite.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="privacy_policy_url">Privacy Policy URL</Label>
              <Input id="privacy_policy_url" type="url" value={formData.privacy_policy_url} onChange={(e) => setFormData({ ...formData, privacy_policy_url: e.target.value })} placeholder="https://example.com/privacy" />
            </div>
          </div>

          {/* App Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">App Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="age_rating">Age Rating</Label>
                <Select value={formData.age_rating} onValueChange={(value) => setFormData({ ...formData, age_rating: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4+">4+</SelectItem>
                    <SelectItem value="9+">9+</SelectItem>
                    <SelectItem value="12+">12+</SelectItem>
                    <SelectItem value="17+">17+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input id="version" value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} placeholder="1.0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="web, tool, free" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="whats_new">What's New</Label>
              <Textarea id="whats_new" value={formData.whats_new} onChange={(e) => setFormData({ ...formData, whats_new: e.target.value })} placeholder="Latest updates and changes..." rows={3} />
            </div>
          </div>

          {/* Screenshots */}
          <div className="space-y-2">
            <Label>Screenshots</Label>
            {screenshotFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {screenshotFiles.map((file, i) => (
                  <div key={i} className="relative group">
                    <img src={URL.createObjectURL(file)} alt="Screenshot" className="h-32 w-auto rounded-lg object-cover" />
                    <button type="button" onClick={() => setScreenshotFiles(files => files.filter((_, idx) => idx !== i))} className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-4 transition-colors hover:border-primary hover:bg-secondary/50">
              <Image className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Add screenshots</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) setScreenshotFiles([...screenshotFiles, ...Array.from(e.target.files)]); }} />
            </label>
          </div>

          {/* Video Ad */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Marketing Video Ad (Optional)</h3>
            <p className="text-sm text-muted-foreground">Upload a 30-60 second video ad to promote your app on the home feed.</p>
            
            {videoAdFile ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-muted">
                  <video src={URL.createObjectURL(videoAdFile)} controls className="w-full max-h-64 object-contain" />
                  <button type="button" onClick={() => setVideoAdFile(null)} className="absolute top-2 right-2 rounded-full bg-destructive p-1.5 text-destructive-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ad_title">Ad Title</Label>
                  <Input id="ad_title" value={adTitle} onChange={(e) => setAdTitle(e.target.value)} placeholder="Catchy ad headline..." />
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-4 transition-colors hover:border-primary hover:bg-secondary/50">
                <Video className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload video ad (30-60s, MP4)</span>
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
                      setVideoAdFile(file);
                    }
                  }}
                />
              </label>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={handleSaveDraft}>
              Save Draft
            </Button>
            <Button type="submit" className="flex-1" size="lg" disabled={isSubmitting}>
              Proceed to Payment (25 Pi)
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
