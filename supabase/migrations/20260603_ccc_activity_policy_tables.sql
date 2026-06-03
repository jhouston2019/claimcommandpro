-- Claim Command Center v3: activity log + policy analysis persistence

CREATE TABLE IF NOT EXISTS public.claim_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID,
    icon TEXT,
    text TEXT,
    amount NUMERIC,
    date TEXT,
    time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (claim_id, date, time, text)
);

CREATE INDEX IF NOT EXISTS idx_claim_activity_log_claim_id ON public.claim_activity_log(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_activity_log_created_at ON public.claim_activity_log(claim_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.claim_policy_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE UNIQUE,
    analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    analyzed_at TIMESTAMPTZ,
    policy_file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_policy_analysis_claim_id ON public.claim_policy_analysis(claim_id);

ALTER TABLE public.claim_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_policy_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their claim activity log" ON public.claim_activity_log;
CREATE POLICY "Users can view their claim activity log" ON public.claim_activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.claims c
            WHERE c.id = claim_activity_log.claim_id AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their claim activity log" ON public.claim_activity_log;
CREATE POLICY "Users can insert their claim activity log" ON public.claim_activity_log
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.claims c
            WHERE c.id = claim_activity_log.claim_id AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their claim activity log" ON public.claim_activity_log;
CREATE POLICY "Users can update their claim activity log" ON public.claim_activity_log
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.claims c
            WHERE c.id = claim_activity_log.claim_id AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view their claim policy analysis" ON public.claim_policy_analysis;
CREATE POLICY "Users can view their claim policy analysis" ON public.claim_policy_analysis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.claims c
            WHERE c.id = claim_policy_analysis.claim_id AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their claim policy analysis" ON public.claim_policy_analysis;
CREATE POLICY "Users can insert their claim policy analysis" ON public.claim_policy_analysis
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.claims c
            WHERE c.id = claim_policy_analysis.claim_id AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their claim policy analysis" ON public.claim_policy_analysis;
CREATE POLICY "Users can update their claim policy analysis" ON public.claim_policy_analysis
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.claims c
            WHERE c.id = claim_policy_analysis.claim_id AND c.user_id = auth.uid()
        )
    );

GRANT ALL ON public.claim_activity_log TO authenticated;
GRANT ALL ON public.claim_policy_analysis TO authenticated;

COMMENT ON TABLE public.claim_activity_log IS 'CCC v3 activity log entries synced from the client';
COMMENT ON TABLE public.claim_policy_analysis IS 'CCC v3 AI policy analysis JSON per claim';
