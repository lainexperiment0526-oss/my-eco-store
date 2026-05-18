import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useBlogPost } from '@/hooks/useBlog';
import { Skeleton } from '@/components/ui/skeleton';
import { AppIcon } from '@/components/AppIcon';
import { ArrowLeft, Share2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useBlogPost(slug || '');

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post?.title, url }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    } catch {
      toast.error('Unable to copy link');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-6">
          <Skeleton className="h-64 w-full rounded-2xl mb-6" />
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Post not found</h1>
          <Link to="/blog" className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
        </main>
      </div>
    );
  }

  const canonicalUrl = `https://openappspaeces.lovable.app/blog/${post.slug}`;
  const excerpt = post.content?.replace(/<[^>]+>/g, '').slice(0, 155) || 'Read this post on OpenApp.';
  return (
    <div className="min-h-screen bg-background pb-20">
      <Helmet>
        <title>{`${post.title} — OpenApp Blog`}</title>
        <meta name="description" content={excerpt} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={excerpt} />
        <meta property="og:url" content={canonicalUrl} />
        {post.cover_image_url && <meta property="og:image" content={post.cover_image_url} />}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          datePublished: post.published_at,
          image: post.cover_image_url || undefined,
          description: excerpt,
          author: { "@type": "Organization", name: "OpenApp" }
        })}</script>
      </Helmet>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/blog" className="text-primary text-sm hover:underline flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Blog
          </Link>
        </div>

        {post.cover_image_url && (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-64 object-cover rounded-2xl mb-6"
          />
        )}

        <h1 className="text-3xl font-bold text-foreground mb-2">{post.title}</h1>

        <div className="flex items-center gap-3 mb-6">
          {post.app && (
            <Link to={`/app/${post.app.id}`} className="flex items-center gap-2 hover:opacity-80">
              <AppIcon src={post.app.logo_url} name={post.app.name} size="sm" />
              <span className="text-sm font-medium text-primary">{post.app.name}</span>
            </Link>
          )}
          <span className="text-xs text-muted-foreground">
            {post.published_at
              ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
              : ''}
          </span>
          <Button variant="ghost" size="icon" className="ml-auto rounded-full" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Blog content rendered as HTML */}
        <article
          className="prose prose-sm max-w-none dark:prose-invert text-foreground
            prose-headings:text-foreground prose-p:text-foreground/90
            prose-a:text-primary prose-strong:text-foreground
            prose-img:rounded-xl prose-img:w-full"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.app && (
          <div className="mt-8 p-4 rounded-2xl border border-border bg-card">
            <p className="text-sm text-muted-foreground mb-2">This post is about</p>
            <Link to={`/app/${post.app.id}`} className="flex items-center gap-3 hover:opacity-80">
              <AppIcon src={post.app.logo_url} name={post.app.name} size="md" />
              <div>
                <p className="font-bold text-foreground">{post.app.name}</p>
                {post.app.tagline && <p className="text-sm text-muted-foreground">{post.app.tagline}</p>}
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
