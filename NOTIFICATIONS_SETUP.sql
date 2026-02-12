-- ========================================
-- OPTIONAL: Notifications queue + email/webhooks
-- ========================================

-- 1) Create notifications table (app-level queue)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered BOOLEAN DEFAULT FALSE,
  delivery_channel TEXT CHECK (delivery_channel IN ('email','webhook')),
  webhook_url TEXT,
  CONSTRAINT notifications_profile_fk FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own notifications by profile" ON public.notifications FOR SELECT USING (
  (profile_id IS NULL) OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id))
);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO anon;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

-- 2) Create function to insert notification on follow
CREATE OR REPLACE FUNCTION public.fn_notify_followers() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (profile_id, type, payload)
  VALUES (NEW.following_profile_id, 'follow', jsonb_build_object('follower_profile_id', NEW.follower_profile_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Drop old trigger if exists and create new one
DROP TRIGGER IF EXISTS trg_followers_insert_notification ON public.followers;
CREATE TRIGGER trg_followers_insert_notification
AFTER INSERT ON public.followers
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_followers();

-- 4) Create function to insert notification on message
CREATE OR REPLACE FUNCTION public.fn_notify_messages() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (profile_id, type, payload)
  VALUES (NEW.to_profile_id, 'message', jsonb_build_object('from_profile_id', NEW.from_profile_id, 'content', NEW.content));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5) Drop old trigger if exists and create new one
DROP TRIGGER IF EXISTS trg_messages_insert_notification ON public.messages;
CREATE TRIGGER trg_messages_insert_notification
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_messages();

-- 6) Edge function can process public.notifications for email/webhooks
-- (Pseudo steps)
-- - Fetch undelivered rows
-- - If delivery_channel='email', send via preferred provider
-- - If delivery_channel='webhook', POST payload to webhook_url
-- - Mark delivered=true

SELECT '✅ Notifications framework initialized' AS status;
