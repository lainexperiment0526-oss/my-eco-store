import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Category, Screenshot } from '@/types/app';
import { supabase } from '@/integrations/supabase/client';

export function useApps() {
  return useQuery({
    queryKey: ['apps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apps')
        .select(`
          *,
          category:categories(*),
          screenshots:app_screenshots(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (App & { category: Category; screenshots: Screenshot[] })[];
    },
  });
}

export function useApp(id: string) {
  return useQuery({
    queryKey: ['app', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apps')
        .select(`
          *,
          category:categories(*),
          screenshots:app_screenshots(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as App & { category: Category; screenshots: Screenshot[] };
    },
    enabled: !!id,
  });
}

export function useFeaturedApps() {
  return useQuery({
    queryKey: ['apps', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apps')
        .select(`
          *,
          category:categories(*),
          screenshots:app_screenshots(*)
        `)
        .eq('is_featured', true)
        .limit(5);
      
      if (error) throw error;
      return data as (App & { category: Category; screenshots: Screenshot[] })[];
    },
  });
}

export function usePopularApps() {
  return useQuery({
    queryKey: ['apps', 'popular'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apps')
        .select(`
          *,
          category:categories(*),
          screenshots:app_screenshots(*)
        `)
        .eq('is_popular', true)
        .limit(10);
      
      if (error) throw error;
      return data as (App & { category: Category; screenshots: Screenshot[] })[];
    },
  });
}

export function useNewApps() {
  return useQuery({
    queryKey: ['apps', 'new'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apps')
        .select(`
          *,
          category:categories(*),
          screenshots:app_screenshots(*)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as (App & { category: Category; screenshots: Screenshot[] })[];
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useCreateApp() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (app: Omit<App, 'id' | 'created_at' | 'updated_at' | 'category' | 'screenshots'>) => {
      const { data, error } = await supabase
        .from('apps')
        .insert(app)
        .select()
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('App created but no row returned');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });
}

export function useUpdateApp() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...app }: Partial<App> & { id: string }) => {
      const { data, error } = await supabase
        .from('apps')
        .update(app)
        .eq('id', id)
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) {
        // Avoid hard failure when PostgREST cannot coerce single-object responses.
        return { id };
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });
}

export function useDeleteApp() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('apps')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });
}

export function useAddScreenshot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (screenshot: Omit<Screenshot, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('app_screenshots')
        .insert(screenshot)
        .select()
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Screenshot inserted but no row returned');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });
}

export function useDeleteScreenshot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('app_screenshots')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });
}
