
-- 1) Anonymize ad_campaign_events: drop IP and user agent columns
ALTER TABLE public.ad_campaign_events DROP COLUMN IF EXISTS ip_address;
ALTER TABLE public.ad_campaign_events DROP COLUMN IF EXISTS user_agent;

-- 2) Tighten anonymous insert policies (replace WITH CHECK true)
DROP POLICY IF EXISTS "Allow anonymous event inserts" ON public.ad_campaign_events;
CREATE POLICY "Allow event inserts for active campaigns"
ON public.ad_campaign_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ad_campaigns c
    WHERE c.id = ad_campaign_events.campaign_id
      AND c.status = 'active'
  )
);

DROP POLICY IF EXISTS "Anyone can insert ad events" ON public.ad_events;
CREATE POLICY "Insert ad events for active ads"
ON public.ad_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_ads a
    WHERE a.id = ad_events.ad_id
      AND a.is_active = true
  )
);

DROP POLICY IF EXISTS "Anyone can insert views" ON public.app_views;
CREATE POLICY "Insert views for existing apps"
ON public.app_views
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.apps a WHERE a.id = app_views.app_id)
);

-- 3) Restrict developer earnings inserts (was WITH CHECK true)
DROP POLICY IF EXISTS "System can insert earnings" ON public.developer_earnings;
CREATE POLICY "Admins can insert earnings"
ON public.developer_earnings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
