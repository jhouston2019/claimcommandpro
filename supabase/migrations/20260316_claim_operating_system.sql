-- =====================================================
-- CLAIM OPERATING SYSTEM DATABASE SCHEMA
-- Extends existing Claim Command Pro with full OS capabilities
-- =====================================================

-- =====================================================
-- 1. EXTEND CLAIMS TABLE
-- =====================================================
ALTER TABLE public.claims 
ADD COLUMN IF NOT EXISTS property_type TEXT,
ADD COLUMN IF NOT EXISTS claim_status TEXT DEFAULT 'active' CHECK (claim_status IN ('active', 'pending', 'settled', 'disputed', 'closed')),
ADD COLUMN IF NOT EXISTS adjuster_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS claim_workspace_active BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_claims_status ON public.claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_claims_workspace_active ON public.claims(claim_workspace_active);

-- =====================================================
-- 2. DOCUMENTS TABLE (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN (
        'policy',
        'estimate_carrier',
        'estimate_contractor',
        'photo',
        'receipt',
        'invoice',
        'report',
        'correspondence',
        'supplement',
        'settlement_letter',
        'other'
    )),
    file_category TEXT CHECK (file_category IN ('policy', 'estimates', 'photos', 'receipts', 'reports', 'correspondence')),
    
    file_size INTEGER,
    mime_type TEXT,
    storage_path TEXT NOT NULL,
    
    description TEXT,
    tags TEXT[],
    
    is_processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    processing_results JSONB,
    
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_claim_id ON public.documents(claim_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON public.documents(file_type);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(file_category);
CREATE INDEX IF NOT EXISTS idx_documents_processed ON public.documents(is_processed);

-- =====================================================
-- 3. COVERAGE ANALYSIS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.coverage_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    coverage_type TEXT NOT NULL CHECK (coverage_type IN (
        'dwelling',
        'contents',
        'ale',
        'ordinance_law',
        'code_upgrade',
        'matching',
        'debris_removal',
        'tree_removal',
        'equipment_breakdown',
        'water_backup',
        'loss_of_use'
    )),
    
    coverage_status TEXT DEFAULT 'detected' CHECK (coverage_status IN ('detected', 'applied', 'denied', 'pending')),
    coverage_limit NUMERIC(12,2),
    coverage_used NUMERIC(12,2) DEFAULT 0,
    coverage_remaining NUMERIC(12,2),
    
    notes TEXT,
    recommendation TEXT,
    
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    applied_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coverage_analysis_claim_id ON public.coverage_analysis(claim_id);
CREATE INDEX IF NOT EXISTS idx_coverage_analysis_type ON public.coverage_analysis(coverage_type);
CREATE INDEX IF NOT EXISTS idx_coverage_analysis_status ON public.coverage_analysis(coverage_status);

-- =====================================================
-- 4. PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    payment_type TEXT NOT NULL CHECK (payment_type IN (
        'acv_payment',
        'rcv_payment',
        'depreciation_recovery',
        'supplement_payment',
        'final_settlement',
        'partial_payment'
    )),
    
    amount NUMERIC(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT,
    check_number TEXT,
    
    description TEXT,
    notes TEXT,
    
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_claim_id ON public.payments(claim_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_type ON public.payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date DESC);

-- =====================================================
-- 5. CLAIM STRATEGY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_strategy (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    strategy_phase TEXT NOT NULL CHECK (strategy_phase IN (
        'initial_review',
        'gap_detection',
        'supplement_preparation',
        'negotiation',
        'escalation',
        'settlement'
    )),
    
    current_phase TEXT NOT NULL,
    phase_status TEXT DEFAULT 'in_progress' CHECK (phase_status IN ('not_started', 'in_progress', 'completed', 'blocked')),
    
    next_actions JSONB DEFAULT '[]'::jsonb,
    completed_actions JSONB DEFAULT '[]'::jsonb,
    blocked_reasons TEXT[],
    
    strategy_notes TEXT,
    ai_recommendations JSONB,
    
    phase_started_at TIMESTAMPTZ DEFAULT NOW(),
    phase_completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_strategy_claim_id ON public.claim_strategy(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_strategy_phase ON public.claim_strategy(current_phase);
CREATE INDEX IF NOT EXISTS idx_claim_strategy_status ON public.claim_strategy(phase_status);

-- =====================================================
-- 6. GENERATED LETTERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.generated_letters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    letter_type TEXT NOT NULL CHECK (letter_type IN (
        'supplement_request',
        'dispute_letter',
        'coverage_request',
        'escalation_letter',
        'demand_letter',
        'proof_of_loss',
        'depreciation_request',
        'appraisal_request'
    )),
    
    letter_title TEXT NOT NULL,
    letter_content TEXT NOT NULL,
    letter_html TEXT,
    
    recipient TEXT,
    subject_line TEXT,
    
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'sent', 'archived')),
    
    pdf_url TEXT,
    docx_url TEXT,
    
    sent_date DATE,
    sent_method TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_letters_claim_id ON public.generated_letters(claim_id);
CREATE INDEX IF NOT EXISTS idx_generated_letters_type ON public.generated_letters(letter_type);
CREATE INDEX IF NOT EXISTS idx_generated_letters_status ON public.generated_letters(status);

-- =====================================================
-- 7. CLAIM EVENTS LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_events_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    event_type TEXT NOT NULL CHECK (event_type IN (
        'claim_created',
        'document_uploaded',
        'estimate_analyzed',
        'coverage_detected',
        'letter_generated',
        'payment_received',
        'status_changed',
        'supplement_submitted',
        'action_completed'
    )),
    
    event_title TEXT NOT NULL,
    event_description TEXT,
    event_data JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_events_claim_id ON public.claim_events_log(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_events_type ON public.claim_events_log(event_type);
CREATE INDEX IF NOT EXISTS idx_claim_events_date ON public.claim_events_log(created_at DESC);

-- =====================================================
-- 8. CLAIM WORKSPACE SETTINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_workspace_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL,
    
    workspace_name TEXT,
    workspace_color TEXT DEFAULT '#3b82f6',
    
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_alerts BOOLEAN DEFAULT TRUE,
    
    preferred_view TEXT DEFAULT 'dashboard' CHECK (preferred_view IN ('dashboard', 'timeline', 'documents')),
    
    custom_fields JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_settings_claim_id ON public.claim_workspace_settings(claim_id);

-- =====================================================
-- TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coverage_analysis_updated_at ON public.coverage_analysis;
CREATE TRIGGER update_coverage_analysis_updated_at
    BEFORE UPDATE ON public.coverage_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_claim_strategy_updated_at ON public.claim_strategy;
CREATE TRIGGER update_claim_strategy_updated_at
    BEFORE UPDATE ON public.claim_strategy
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_generated_letters_updated_at ON public.generated_letters;
CREATE TRIGGER update_generated_letters_updated_at
    BEFORE UPDATE ON public.generated_letters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workspace_settings_updated_at ON public.claim_workspace_settings;
CREATE TRIGGER update_workspace_settings_updated_at
    BEFORE UPDATE ON public.claim_workspace_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverage_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_strategy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_events_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_workspace_settings ENABLE ROW LEVEL SECURITY;

-- Documents Policies
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
CREATE POLICY "Users can view their own documents" ON public.documents
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
CREATE POLICY "Users can insert their own documents" ON public.documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
CREATE POLICY "Users can update their own documents" ON public.documents
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
CREATE POLICY "Users can delete their own documents" ON public.documents
    FOR DELETE USING (auth.uid() = user_id);

-- Coverage Analysis Policies
DROP POLICY IF EXISTS "Users can view their own coverage analysis" ON public.coverage_analysis;
CREATE POLICY "Users can view their own coverage analysis" ON public.coverage_analysis
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own coverage analysis" ON public.coverage_analysis;
CREATE POLICY "Users can insert their own coverage analysis" ON public.coverage_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own coverage analysis" ON public.coverage_analysis;
CREATE POLICY "Users can update their own coverage analysis" ON public.coverage_analysis
    FOR UPDATE USING (auth.uid() = user_id);

-- Payments Policies
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
CREATE POLICY "Users can insert their own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
CREATE POLICY "Users can update their own payments" ON public.payments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own payments" ON public.payments;
CREATE POLICY "Users can delete their own payments" ON public.payments
    FOR DELETE USING (auth.uid() = user_id);

-- Claim Strategy Policies
DROP POLICY IF EXISTS "Users can view their own claim strategy" ON public.claim_strategy;
CREATE POLICY "Users can view their own claim strategy" ON public.claim_strategy
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own claim strategy" ON public.claim_strategy;
CREATE POLICY "Users can insert their own claim strategy" ON public.claim_strategy
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own claim strategy" ON public.claim_strategy;
CREATE POLICY "Users can update their own claim strategy" ON public.claim_strategy
    FOR UPDATE USING (auth.uid() = user_id);

-- Generated Letters Policies
DROP POLICY IF EXISTS "Users can view their own generated letters" ON public.generated_letters;
CREATE POLICY "Users can view their own generated letters" ON public.generated_letters
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own generated letters" ON public.generated_letters;
CREATE POLICY "Users can insert their own generated letters" ON public.generated_letters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own generated letters" ON public.generated_letters;
CREATE POLICY "Users can update their own generated letters" ON public.generated_letters
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own generated letters" ON public.generated_letters;
CREATE POLICY "Users can delete their own generated letters" ON public.generated_letters
    FOR DELETE USING (auth.uid() = user_id);

-- Claim Events Log Policies
DROP POLICY IF EXISTS "Users can view their own claim events" ON public.claim_events_log;
CREATE POLICY "Users can view their own claim events" ON public.claim_events_log
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own claim events" ON public.claim_events_log;
CREATE POLICY "Users can insert their own claim events" ON public.claim_events_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Workspace Settings Policies
DROP POLICY IF EXISTS "Users can view their own workspace settings" ON public.claim_workspace_settings;
CREATE POLICY "Users can view their own workspace settings" ON public.claim_workspace_settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own workspace settings" ON public.claim_workspace_settings;
CREATE POLICY "Users can insert their own workspace settings" ON public.claim_workspace_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own workspace settings" ON public.claim_workspace_settings;
CREATE POLICY "Users can update their own workspace settings" ON public.claim_workspace_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to initialize claim workspace
CREATE OR REPLACE FUNCTION initialize_claim_workspace(
    p_claim_id UUID,
    p_user_id UUID,
    p_claim_name TEXT
)
RETURNS void AS $$
BEGIN
    -- Initialize workspace settings
    INSERT INTO public.claim_workspace_settings (claim_id, user_id, workspace_name)
    VALUES (p_claim_id, p_user_id, p_claim_name)
    ON CONFLICT (claim_id) DO NOTHING;
    
    -- Initialize claim strategy
    INSERT INTO public.claim_strategy (claim_id, user_id, current_phase, strategy_phase)
    VALUES (p_claim_id, p_user_id, 'initial_review', 'initial_review')
    ON CONFLICT DO NOTHING;
    
    -- Initialize claim analysis
    INSERT INTO public.claim_analysis (claim_id, user_id)
    VALUES (p_claim_id, p_user_id)
    ON CONFLICT (claim_id) DO NOTHING;
    
    -- Initialize financial summary
    INSERT INTO public.claim_financial_summary (claim_id, user_id)
    VALUES (p_claim_id, p_user_id)
    ON CONFLICT (claim_id) DO NOTHING;
    
    -- Log event
    INSERT INTO public.claim_events_log (claim_id, user_id, event_type, event_title, event_description)
    VALUES (p_claim_id, p_user_id, 'claim_created', 'Claim Workspace Created', 'New claim workspace initialized');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log claim events
CREATE OR REPLACE FUNCTION log_claim_event(
    p_claim_id UUID,
    p_user_id UUID,
    p_event_type TEXT,
    p_event_title TEXT,
    p_event_description TEXT DEFAULT NULL,
    p_event_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO public.claim_events_log (
        claim_id,
        user_id,
        event_type,
        event_title,
        event_description,
        event_data
    )
    VALUES (
        p_claim_id,
        p_user_id,
        p_event_type,
        p_event_title,
        p_event_description,
        p_event_data
    )
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate payment summary
CREATE OR REPLACE FUNCTION calculate_payment_summary(p_claim_id UUID)
RETURNS TABLE (
    total_received NUMERIC,
    expected_value NUMERIC,
    remaining_balance NUMERIC,
    payment_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(p.amount), 0) as total_received,
        COALESCE(cfs.contractor_total, 0) as expected_value,
        COALESCE(cfs.contractor_total, 0) - COALESCE(SUM(p.amount), 0) as remaining_balance,
        COUNT(p.id)::INTEGER as payment_count
    FROM public.payments p
    RIGHT JOIN public.claim_financial_summary cfs ON cfs.claim_id = p_claim_id
    WHERE p.claim_id = p_claim_id OR p.claim_id IS NULL
    GROUP BY cfs.contractor_total;
END;
$$ LANGUAGE plpgsql;

-- Function to get claim workspace summary
CREATE OR REPLACE FUNCTION get_claim_workspace_summary(p_claim_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_summary JSONB;
BEGIN
    SELECT jsonb_build_object(
        'claim_id', c.id,
        'claim_name', c.claim_name,
        'carrier_name', c.carrier_name,
        'claim_status', c.claim_status,
        'date_of_loss', c.loss_date,
        'intelligence_score', ca.claim_intelligence_score,
        'claim_gap', ca.claim_gap,
        'risk_level', ca.claim_risk_level,
        'document_count', (SELECT COUNT(*) FROM public.documents WHERE claim_id = p_claim_id),
        'alert_count', (SELECT COUNT(*) FROM public.claim_alerts WHERE claim_id = p_claim_id AND NOT is_dismissed),
        'action_count', (SELECT COUNT(*) FROM public.recommended_actions WHERE claim_id = p_claim_id AND NOT is_completed),
        'payment_total', (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE claim_id = p_claim_id)
    ) INTO v_summary
    FROM public.claims c
    LEFT JOIN public.claim_analysis ca ON ca.claim_id = c.id
    WHERE c.id = p_claim_id;
    
    RETURN v_summary;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AUTOMATIC TRIGGERS
-- =====================================================

-- Trigger: Auto-analyze when estimate document is uploaded
CREATE OR REPLACE FUNCTION trigger_estimate_analysis()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.file_type IN ('estimate_carrier', 'estimate_contractor') THEN
        -- Log event
        PERFORM log_claim_event(
            NEW.claim_id,
            NEW.user_id,
            'document_uploaded',
            'Estimate Uploaded',
            'Estimate document uploaded: ' || NEW.file_name
        );
        
        -- Mark for processing
        NEW.is_processed := FALSE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_analyze_estimate ON public.documents;
CREATE TRIGGER auto_analyze_estimate
    BEFORE INSERT ON public.documents
    FOR EACH ROW
    WHEN (NEW.file_type IN ('estimate_carrier', 'estimate_contractor'))
    EXECUTE FUNCTION trigger_estimate_analysis();

-- Trigger: Log claim status changes
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.claim_status IS DISTINCT FROM NEW.claim_status THEN
        PERFORM log_claim_event(
            NEW.id,
            NEW.user_id,
            'status_changed',
            'Claim Status Changed',
            'Status changed from ' || OLD.claim_status || ' to ' || NEW.claim_status
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_claim_status_change ON public.claims;
CREATE TRIGGER log_claim_status_change
    AFTER UPDATE ON public.claims
    FOR EACH ROW
    WHEN (OLD.claim_status IS DISTINCT FROM NEW.claim_status)
    EXECUTE FUNCTION log_status_change();

-- =====================================================
-- VIEWS FOR QUICK ACCESS
-- =====================================================

-- View: Claim workspace overview
CREATE OR REPLACE VIEW claim_workspace_overview AS
SELECT 
    c.id as claim_id,
    c.user_id,
    c.claim_name,
    c.carrier_name,
    c.claim_status,
    c.loss_date,
    ca.claim_intelligence_score,
    ca.claim_gap,
    ca.claim_risk_level,
    ca.settlement_opportunity,
    (SELECT COUNT(*) FROM documents WHERE claim_id = c.id) as document_count,
    (SELECT COUNT(*) FROM claim_alerts WHERE claim_id = c.id AND NOT is_dismissed) as alert_count,
    (SELECT COUNT(*) FROM recommended_actions WHERE claim_id = c.id AND NOT is_completed) as action_count,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE claim_id = c.id) as total_payments,
    c.created_at
FROM public.claims c
LEFT JOIN public.claim_analysis ca ON ca.claim_id = c.id
WHERE c.claim_workspace_active = TRUE;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON public.documents TO authenticated;
GRANT ALL ON public.coverage_analysis TO authenticated;
GRANT ALL ON public.payments TO authenticated;
GRANT ALL ON public.claim_strategy TO authenticated;
GRANT ALL ON public.generated_letters TO authenticated;
GRANT ALL ON public.claim_events_log TO authenticated;
GRANT ALL ON public.claim_workspace_settings TO authenticated;
GRANT SELECT ON claim_workspace_overview TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.documents IS 'Document vault for claim files with categorization and processing';
COMMENT ON TABLE public.coverage_analysis IS 'Coverage detection and tracking for claim opportunities';
COMMENT ON TABLE public.payments IS 'Payment tracking for claim settlements';
COMMENT ON TABLE public.claim_strategy IS 'Claim strategy phase tracking and action management';
COMMENT ON TABLE public.generated_letters IS 'AI-generated letters and documents for claim correspondence';
COMMENT ON TABLE public.claim_events_log IS 'Audit log of all claim-related events and actions';
COMMENT ON TABLE public.claim_workspace_settings IS 'User preferences and settings for claim workspace';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
