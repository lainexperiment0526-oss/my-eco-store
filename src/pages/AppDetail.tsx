import { useParams, Link, useLocation } from 'react-router-dom';
import { useApp } from '@/hooks/useApps';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useIsBookmarked, useToggleBookmark } from '@/hooks/useBookmarks';
import { Header } from '@/components/Header';
import { AppIcon } from '@/components/AppIcon';
import { StarRating } from '@/components/StarRating';
import { ReviewSection } from '@/components/ReviewSection';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { RecommendedApps } from '@/components/RecommendedApps';
import { ImagePreviewDialog } from '@/components/ImagePreviewDialog';
import { ArrowLeft, ExternalLink, Share2, ChevronRight, ChevronDown, Bookmark, BookmarkCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export default function AppDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { data: app, isLoading, error, refetch } = useApp(id || '');
  const { user } = useAuth();
  const { theme } = useTheme();
  const { data: isBookmarked } = useIsBookmarked(id || '', user?.id);
  const toggleBookmark = useToggleBookmark();
  const queryClient = useQueryClient();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isOpening, setIsOpening] = useState(false);

  const normalizeUrl = useCallback((url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }, []);

  const recordDownload = useCallback(async (appId: string, userId: string) => {
    const { error: insertError } = await supabase
      .from('app_downloads')
      .upsert({ app_id: appId, user_id: userId }, { onConflict: 'app_id,user_id', ignoreDuplicates: true });
    if (!insertError) {
      queryClient.invalidateQueries({ queryKey: ['app', appId] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    }
  }, [queryClient]);

  const handleOpenApp = useCallback((url: string, appId: string) => {
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) {
      toast.error('No app link available');
      return;
    }
    if (user?.id) {
      recordDownload(appId, user.id).catch(() => {});
    }
    setIsOpening(true);
    setTimeout(() => setIsOpening(false), 1500);
    window.location.assign(normalizedUrl);
  }, [normalizeUrl, recordDownload, user?.id]);

  const handleShare = async () => {
    const url = app?.website_url ? normalizeUrl(app.website_url) : window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: app?.name, url }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied!');
      } catch {
        toast.error('Unable to copy link');
      }
    }
  };

  const handleBookmark = () => {
    if (!user) { toast.error('Sign in to bookmark'); return; }
    toggleBookmark.mutate({ app_id: id!, user_id: user.id, isBookmarked: !!isBookmarked });
  };

  useEffect(() => {
    if (location.search.includes('refresh=')) {
      refetch();
    }
  }, [location.search, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-6">
          <Skeleton className="h-48 w-full rounded-2xl mb-6" />
          <div className="flex items-start gap-4">
            <Skeleton className="h-24 w-24 rounded-[22%]" />
            <div className="flex-1">
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-5 w-32 mb-4" />
              <Skeleton className="h-10 w-20 rounded-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">App not found</h1>
          <Link to="/" className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Apps
          </Link>
        </main>
      </div>
    );
  }

  const sortedScreenshots = app.screenshots?.sort((a, b) => a.display_order - b.display_order) || [];
  const appKey = app.name.toLowerCase();
  const badgeMap: Record<string, { light: string; dark: string }> = {
    'flappy pi': {
      light: 'https://i.ibb.co/BVQYVbyb/verified.png',
      dark: 'https://i.ibb.co/BVQYVbyb/verified.png',
    },
    'droplink': {
      light: 'https://i.ibb.co/BVQYVbyb/verified.png',
      dark: 'https://i.ibb.co/BVQYVbyb/verified.png',
    },
    'mrwain hub': {
      light: 'https://i.ibb.co/p6HtQ2c5/verify-3.png',
      dark: 'https://i.ibb.co/p6HtQ2c5/verify-3.png',
    },
  };
  const badge = badgeMap[appKey];
  const isVerified = !!badge;
  const badgeSrc = badge ? (theme === 'dark' ? badge.dark : badge.light) : '';

  return (
    <>
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="mx-auto max-w-4xl">
        {/* Hero Image / Banner */}
        {sortedScreenshots[0] && (
          <div className="relative h-64 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
            <img src={sortedScreenshots[0].image_url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            <Link to="/" className="absolute top-4 left-4 h-8 w-8 rounded-full bg-background/50 backdrop-blur flex items-center justify-center">
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </Link>
          </div>
        )}

        <div className="px-4">
          {/* App Header */}
          <div className={`flex items-start gap-4 ${sortedScreenshots.length ? '-mt-12 relative z-10' : 'pt-6'}`}>
            <AppIcon src={app.logo_url} name={app.name} size="lg" className="shadow-lg" />
            <div className="flex-1 min-w-0 pt-2">
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                {app.name}
                {isVerified && (
                  <img src={badgeSrc} alt="Verified" className="h-5 w-5" />
                )}
              </h1>
              <p className="text-sm text-muted-foreground">{app.tagline}</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => handleOpenApp(app.website_url, app.id)}
                  disabled={isOpening}
                  className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-70"
                >
                  {isOpening ? 'Opening...' : 'Open App'}
                </button>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={handleShare}>
                  <Share2 className="h-5 w-5 text-primary" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={handleBookmark}>
                  {isBookmarked ? <BookmarkCheck className="h-5 w-5 text-primary fill-primary" /> : <Bookmark className="h-5 w-5 text-primary" />}
                </Button>
                <FeedbackDialog appId={app.id} />
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-6 flex items-center justify-around border-y border-border py-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase">Ratings</p>
              <p className="text-xl font-bold text-foreground">{app.average_rating > 0 ? app.average_rating.toFixed(1) : '--'}</p>
              {app.ratings_count > 0 && <StarRating rating={app.average_rating} size="sm" />}
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase">Age</p>
              <p className="text-xl font-bold text-foreground">{app.age_rating}</p>
              <p className="text-xs text-muted-foreground">Years Old</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase">Category</p>
              <p className="text-sm font-medium text-foreground mt-1">{app.category?.name || 'App'}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase">Developer</p>
              <p className="text-sm font-medium text-foreground mt-1 truncate max-w-20">{app.developer_name || 'Unknown'}</p>
            </div>
          </div>

          {/* What's New */}
          {app.whats_new && (
            <section className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-foreground">What's New</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                Version {app.version} · {formatDistanceToNow(new Date(app.updated_at), { addSuffix: true })}
              </p>
              <p className="text-foreground whitespace-pre-wrap">{app.whats_new}</p>
            </section>
          )}

          {/* Preview Screenshots */}
          {sortedScreenshots.length > 0 && (
            <section className="mt-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Preview</h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
                {sortedScreenshots.map((screenshot, idx) => (
                  <button
                    key={screenshot.id}
                    onClick={() => { setPreviewIndex(idx); setPreviewOpen(true); }}
                    className="flex-shrink-0 w-48 overflow-hidden rounded-2xl bg-card cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <img src={screenshot.image_url} alt="App screenshot" className="w-full h-auto" />
                  </button>
                ))}
              </div>
            </section>
          )}

          <ImagePreviewDialog
            images={sortedScreenshots}
            initialIndex={previewIndex}
            open={previewOpen}
            onOpenChange={setPreviewOpen}
          />

          {/* Description */}
          {app.description && (
            <section className="mt-6">
              <p className={`text-foreground whitespace-pre-wrap ${!showFullDescription ? 'line-clamp-3' : ''}`}>
                {app.description}
              </p>
              {app.description.length > 150 && (
                <button onClick={() => setShowFullDescription(!showFullDescription)} className="text-primary text-sm font-medium mt-1">
                  {showFullDescription ? 'less' : 'more'}
                </button>
              )}
            </section>
          )}

          {/* Reviews & Ratings */}
          <ReviewSection appId={app.id} />

          {/* Developer */}
          {app.developer_name && (
            <section className="mt-6 py-4 border-y border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary font-medium">{app.developer_name}</p>
                  <p className="text-sm text-muted-foreground">Developer</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </section>
          )}

          {/* Information */}
          <section className="mt-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Information</h2>
            <div className="space-y-4">
              {app.developer_name && <InfoRow label="Provider" value={app.developer_name} />}
              <InfoRow label="Category" value={app.category?.name || 'App'} />
              <InfoRow label="Downloads" value={app.downloads_count?.toLocaleString() || '0'} />
              <InfoRow label="Compatibility" value={app.compatibility} expandable />
              <InfoRow label="Languages" value={app.languages?.join(', ') || 'English'} expandable />
              <InfoRow label="Age Rating" value={app.age_rating} expandable />
              <InfoRow label="In-App Purchases" value={app.has_in_app_purchases ? 'Yes' : 'No'} />
              <InfoRow label="Version" value={app.version} />
              
              {app.developer_website_url && (
                <a href={app.developer_website_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-primary">Developer Website</span>
                  <ExternalLink className="h-4 w-4 text-primary" />
                </a>
              )}
              
              {app.privacy_policy_url && (
                <a href={app.privacy_policy_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-primary">Privacy Policy</span>
                  <ExternalLink className="h-4 w-4 text-primary" />
                </a>
              )}
            </div>
          </section>

          {/* Tags */}
          {app.tags && app.tags.length > 0 && (
            <section className="mt-6">
              <div className="flex flex-wrap gap-2">
                {app.tags.map((tag, i) => (
                  <span key={i} className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">{tag}</span>
                ))}
              </div>
            </section>
          )}

          {/* Recommended Apps */}
          <RecommendedApps currentAppId={app.id} categoryId={app.category_id} />
        </div>
      </main>
    </div>
    </>
  );
}

function InfoRow({ label, value, expandable }: { label: string; value: string; expandable?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-foreground">{value}</span>
        {expandable && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </div>
    </div>
  );
}
