import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BlogPost {
  id: string;
  app_id: string | null;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  cover_image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  app?: { id: string; name: string; logo_url: string | null; tagline: string | null } | null;
}

export function usePublishedBlogPosts() {
  return useQuery({
    queryKey: ['blog-posts', 'published'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*, app:apps(id, name, logo_url, tagline)')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data as unknown as BlogPost[];
    },
  });
}

export function useAllBlogPosts() {
  return useQuery({
    queryKey: ['blog-posts', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*, app:apps(id, name, logo_url, tagline)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as BlogPost[];
    },
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*, app:apps(id, name, logo_url, tagline)')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as BlogPost | null;
    },
    enabled: !!slug,
  });
}

export function useBlogPostsByApp(appId: string) {
  return useQuery({
    queryKey: ['blog-posts', 'app', appId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('app_id', appId)
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data as unknown as BlogPost[];
    },
    enabled: !!appId,
  });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: {
      title: string;
      slug: string;
      content: string;
      app_id?: string | null;
      cover_image_url?: string | null;
      is_published: boolean;
      author_id: string;
    }) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          ...post,
          published_at: post.is_published ? new Date().toISOString() : null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blog-posts'] }),
  });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      title?: string;
      slug?: string;
      content?: string;
      app_id?: string | null;
      cover_image_url?: string | null;
      is_published?: boolean;
    }) => {
      const payload: Record<string, unknown> = { ...updates };
      if (updates.is_published) {
        payload.published_at = new Date().toISOString();
      }
      const { data, error } = await supabase
        .from('blog_posts')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blog-posts'] }),
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blog-posts'] }),
  });
}
