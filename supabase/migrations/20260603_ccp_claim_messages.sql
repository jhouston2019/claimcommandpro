-- Claim Command Center v3: inbound message log persistence

CREATE TABLE IF NOT EXISTS public.claim_messages (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id     UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    from_name    TEXT,
    subject      TEXT,
    date         TEXT,
    preview      TEXT,
    body         TEXT,
    read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS claim_messages_claim_id_idx
    ON public.claim_messages (claim_id, created_at DESC);

ALTER TABLE public.claim_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own claim messages" ON public.claim_messages;
CREATE POLICY "Users can read own claim messages"
    ON public.claim_messages FOR SELECT
    USING (claim_id IN (SELECT id FROM public.claims WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own claim messages" ON public.claim_messages;
CREATE POLICY "Users can insert own claim messages"
    ON public.claim_messages FOR INSERT
    WITH CHECK (claim_id IN (SELECT id FROM public.claims WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own claim messages" ON public.claim_messages;
CREATE POLICY "Users can update own claim messages"
    ON public.claim_messages FOR UPDATE
    USING (claim_id IN (SELECT id FROM public.claims WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own claim messages" ON public.claim_messages;
CREATE POLICY "Users can delete own claim messages"
    ON public.claim_messages FOR DELETE
    USING (claim_id IN (SELECT id FROM public.claims WHERE user_id = auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.claim_messages TO authenticated;

COMMENT ON TABLE public.claim_messages IS 'CCC v3 manually logged inbound messages (adjuster calls, emails, letters)';
