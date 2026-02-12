import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LinkEvent, AnalyticsSummary } from '@/types/features';

export const useAnalytics = (profileId: string | null) => {
  const [events, setEvents] = useState<LinkEvent[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    total_clicks: 0,
    total_views: 0,
    total_revenue: 0,
    total_leads: 0,
    top_links: [],
    devices: {},
    countries: {}
  });
  const [loading, setLoading] = useState(true);

  // Load link events
  useEffect(() => {
    if (!profileId) return;
    const loadEvents = async () => {
      try {
        const { data } = await (supabase
          .from('link_events' as any) as any)
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(1000);
        setEvents((data as LinkEvent[]) || []);
      } catch (e) {
        console.error('Failed to load events:', e);
      }
    };
    loadEvents();
  }, [profileId]);

  // Compute summary from events and orders
  useEffect(() => {
    if (!profileId) return;
    const computeSummary = async () => {
      try {
        // Load summary data
        const { data: clickData } = await (supabase
          .from('link_events' as any) as any)
          .select('*')
          .eq('profile_id', profileId)
          .eq('event_type', 'click');

        const { data: orderData } = await (supabase
          .from('orders' as any) as any)
          .select('*')
          .eq('profile_id', profileId)
          .eq('status', 'paid');

        const { count: leadCount } = await (supabase
          .from('email_leads' as any) as any)
          .select('*', { count: 'exact' })
          .eq('profile_id', profileId);

        // Aggregate
        const devices: Record<string, number> = {};
        const countries: Record<string, number> = {};
        const links: Record<string, { clicks: number; revenue: number }> = {};

        (clickData as any)?.forEach((evt: any) => {
          if (evt.device) devices[evt.device] = (devices[evt.device] || 0) + 1;
          if (evt.country) countries[evt.country] = (countries[evt.country] || 0) + 1;
          links[evt.link_id] = links[evt.link_id] || { clicks: 0, revenue: 0 };
          links[evt.link_id].clicks++;
        });

        let totalRevenue = 0;
        (orderData as any)?.forEach((order: any) => {
          totalRevenue += order.amount || 0;
          if (order.source_link_id) {
            links[order.source_link_id] = links[order.source_link_id] || { clicks: 0, revenue: 0 };
            links[order.source_link_id].revenue += order.amount || 0;
          }
        });

        const topLinks = Object.entries(links)
          .map(([link_id, data]) => ({ link_id, ...data }))
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 10);

        setSummary({
          total_clicks: clickData?.length || 0,
          total_views: clickData?.length || 0,
          total_revenue: totalRevenue,
          total_leads: leadCount || 0,
          top_links: topLinks,
          devices,
          countries
        });

        setLoading(false);
      } catch (e) {
        console.error('Failed to compute summary:', e);
        setLoading(false);
      }
    };

    computeSummary();
  }, [profileId]);

  // Log a click event
  const logClickEvent = async (linkId: string, metadata?: Partial<LinkEvent>) => {
    if (!profileId) return;
    try {
      await (supabase.from('link_events' as any) as any).insert({
        profile_id: profileId,
        link_id: linkId,
        event_type: 'click',
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        device: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop') : 'unknown',
        ...metadata
      });
    } catch (e) {
      console.error('Failed to log event:', e);
    }
  };

  // Export analytics as CSV
  const exportAnalytics = () => {
    const csv = [
      ['Link ID', 'Clicks', 'Revenue'],
      ...summary.top_links.map(l => [l.link_id, l.clicks.toString(), l.revenue.toString()])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return { events, summary, loading, logClickEvent, exportAnalytics };
};
