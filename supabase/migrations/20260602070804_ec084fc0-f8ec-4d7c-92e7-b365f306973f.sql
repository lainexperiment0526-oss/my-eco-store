DROP POLICY IF EXISTS "Anyone can view apps" ON public.apps;

CREATE POLICY "Anyone can view approved apps"
ON public.apps
FOR SELECT
USING (
  status = 'approved'
  OR auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
);