import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AppAd {
  id: string;
  app_id: string;
  user_id: string;
  video_url: string;
  title: string | null;
  description: string | null;
  is_active: boolean;
  skip_after_seconds: number;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export function useActiveAds() {
  return useQuery({
    queryKey: ['ads', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_ads')
        .select('*, app:apps(*, category:categories(*), screenshots:app_screenshots(*))')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Skip ads whose app is unavailable (e.g. unapproved or removed) to avoid null app crashes.
      return ((data as any[]) || []).filter((ad) => ad?.app?.id);
    },
  });
}

export function useCreateAd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ad: { app_id: string; user_id: string; video_url: string; title?: string; description?: string; skip_after_seconds?: number; duration_seconds?: number }) => {
      const { data, error } = await supabase
        .from('app_ads')
        .insert(ad)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
    },
  });
}

export function useDeleteAd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('app_ads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
    },
  });
}
