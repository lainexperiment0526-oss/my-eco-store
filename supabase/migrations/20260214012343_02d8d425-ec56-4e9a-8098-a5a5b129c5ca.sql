
-- Blog posts table
CREATE TABLE public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id uuid REFERENCES public.apps(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  cover_image_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  published_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view published blog posts
CREATE POLICY "Anyone can view published posts"
  ON public.blog_posts FOR SELECT
  USING (is_published = true);

-- Admins can view all posts
CREATE POLICY "Admins can view all posts"
  ON public.blog_posts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert posts
CREATE POLICY "Admins can insert posts"
  ON public.blog_posts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update posts
CREATE POLICY "Admins can update posts"
  ON public.blog_posts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete posts
CREATE POLICY "Admins can delete posts"
  ON public.blog_posts FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- App views table (replaces downloads concept - counts every visit)
CREATE TABLE public.app_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id uuid NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views
CREATE POLICY "Anyone can insert views"
  ON public.app_views FOR INSERT
  WITH CHECK (true);

-- App owners and admins can view counts
CREATE POLICY "App owners and admins can view"
  ON public.app_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM apps WHERE apps.id = app_views.app_id
      AND (apps.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- Rename downloads_count to views_count on apps table
ALTER TABLE public.apps RENAME COLUMN downloads_count TO views_count;
