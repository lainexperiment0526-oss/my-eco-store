import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useIsBookmarked(appId: string, userId: string | undefined) {
  return useQuery({
    queryKey: ['bookmark', appId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_bookmarks')
        .select('id')
        .eq('app_id', appId)
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!appId && !!userId,
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ app_id, user_id, isBookmarked }: { app_id: string; user_id: string; isBookmarked: boolean }) => {
      if (isBookmarked) {
        const { error } = await supabase
          .from('app_bookmarks')
          .delete()
          .eq('app_id', app_id)
          .eq('user_id', user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_bookmarks')
          .insert({ app_id, user_id });
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', vars.app_id] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks', vars.user_id] });
    },
  });
}
