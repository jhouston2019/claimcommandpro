-- Tighten claims UPDATE RLS: require user_id to stay equal to auth.uid() after update.
-- Aligns with Claim Command Center client (upsert by user_id).

DROP POLICY IF EXISTS "Users can update their own claims" ON public.claims;

CREATE POLICY "Users can update their own claims" ON public.claims
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
