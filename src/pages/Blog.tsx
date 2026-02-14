import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { usePublishedBlogPosts } from '@/hooks/useBlog';
import { Skeleton } from '@/components/ui/skeleton';
import { AppIcon } from '@/components/AppIcon';
import { formatDistanceToNow } from 'date-fns';

export default function Blog() {
  const { data: posts, isLoading } = usePublishedBlogPosts();

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Blog</h1>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {!isLoading && (!posts || posts.length === 0) && (
          <p className="text-center text-muted-foreground py-12">No blog posts yet.</p>
        )}

        <div className="space-y-4">
          {posts?.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="block rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
            >
              {post.cover_image_url && (
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="text-lg font-bold text-foreground mb-1">{post.title}</h2>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {post.content.replace(/<[^>]*>/g, '').slice(0, 160)}
                </p>
                <div className="flex items-center gap-2">
                  {post.app && (
                    <>
                      <AppIcon src={post.app.logo_url} name={post.app.name} size="sm" />
                      <span className="text-sm font-medium text-foreground">{post.app.name}</span>
                      <span className="text-muted-foreground">·</span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {post.published_at
                      ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
                      : ''}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
