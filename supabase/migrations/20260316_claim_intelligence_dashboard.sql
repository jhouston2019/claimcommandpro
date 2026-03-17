-- =====================================================
-- CLAIM INTELLIGENCE DASHBOARD SCHEMA
-- Enhanced intelligence features for Command Center
-- =====================================================

-- =====================================================
-- 1. CARRIER BEHAVIOR PATTERNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.carrier_patterns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    carrier_name TEXT NOT NULL,
    issue_type TEXT NOT NULL CHECK (issue_type IN (
        'labor_suppression',
        'missing_scope',
        'op_omission',
        'pricing_suppression',
        'quantity_reduction',
        'material_downgrade',
        'code_upgrade_denial',
        'depreciation_abuse'
    )),
    frequency INTEGER DEFAULT 0,
    avg_claim_gap NUMERIC(12,2) DEFAULT 0,
    avg_severity_score NUMERIC(4,2) DEFAULT 0,
    common_missing_items JSONB DEFAULT '[]'::jsonb,
    detection_count INTEGER DEFAULT 0,
    last_detected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carrier_patterns_carrier ON public.carrier_patterns(carrier_name);
CREATE INDEX IF NOT EXISTS idx_carrier_patterns_issue_type ON public.carrier_patterns(issue_type);
CREATE INDEX IF NOT EXISTS idx_carrier_patterns_frequency ON public.carrier_patterns(frequency DESC);

-- =====================================================
-- 2. CLAIM ANALYSIS TABLE (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL,
    
    -- Intelligence Scores
    claim_intelligence_score INTEGER CHECK (claim_intelligence_score BETWEEN 0 AND 100),
    claim_risk_level TEXT CHECK (claim_risk_level IN ('low', 'moderate', 'high', 'critical')),
    settlement_opportunity TEXT CHECK (settlement_opportunity IN ('low', 'medium', 'high', 'very_high')),
    
    -- Financial Analysis
    insurance_estimate NUMERIC(12,2) DEFAULT 0,
    contractor_estimate NUMERIC(12,2) DEFAULT 0,
    predicted_true_scope NUMERIC(12,2) DEFAULT 0,
    claim_gap NUMERIC(12,2) DEFAULT 0,
    potential_settlement_increase NUMERIC(12,2) DEFAULT 0,
    
    -- Detected Issues
    missing_scope_items JSONB DEFAULT '[]'::jsonb,
    pricing_suppressions JSONB DEFAULT '[]'::jsonb,
    coverage_gaps JSONB DEFAULT '[]'::jsonb,
    settlement_opportunities JSONB DEFAULT '[]'::jsonb,
    
    -- Carrier Intelligence
    carrier_behavior_flags JSONB DEFAULT '[]'::jsonb,
    labor_suppression_rate NUMERIC(5,2),
    op_omission_detected BOOLEAN DEFAULT FALSE,
    
    -- Analysis Metadata
    analysis_completed_at TIMESTAMPTZ,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_analysis_claim_id ON public.claim_analysis(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_analysis_user_id ON public.claim_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_claim_analysis_score ON public.claim_analysis(claim_intelligence_score DESC);
CREATE INDEX IF NOT EXISTS idx_claim_analysis_risk ON public.claim_analysis(claim_risk_level);

-- =====================================================
-- 3. COVERAGE FLAGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.coverage_flags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    coverage_type TEXT NOT NULL CHECK (coverage_type IN (
        'ordinance_law',
        'code_upgrade',
        'matching',
        'additional_living_expense',
        'loss_of_use',
        'debris_removal',
        'tree_removal',
        'equipment_breakdown',
        'water_backup'
    )),
    
    coverage_alert TEXT NOT NULL,
    alert_severity TEXT CHECK (alert_severity IN ('info', 'warning', 'critical')),
    estimated_value NUMERIC(12,2),
    description TEXT,
    recommendation TEXT,
    
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coverage_flags_claim_id ON public.coverage_flags(claim_id);
CREATE INDEX IF NOT EXISTS idx_coverage_flags_type ON public.coverage_flags(coverage_type);
CREATE INDEX IF NOT EXISTS idx_coverage_flags_severity ON public.coverage_flags(alert_severity);
CREATE INDEX IF NOT EXISTS idx_coverage_flags_resolved ON public.coverage_flags(is_resolved);

-- =====================================================
-- 4. CLAIM TIMELINE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_timeline (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    milestone_type TEXT NOT NULL CHECK (milestone_type IN (
        'claim_filed',
        'estimate_received',
        'review_completed',
        'supplement_submitted',
        'supplement_approved',
        'settlement_pending',
        'settlement_received',
        'dispute_filed',
        'appraisal_requested',
        'litigation_filed'
    )),
    
    milestone_date DATE NOT NULL,
    milestone_status TEXT DEFAULT 'completed' CHECK (milestone_status IN ('pending', 'completed', 'overdue')),
    description TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_timeline_claim_id ON public.claim_timeline(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_timeline_type ON public.claim_timeline(milestone_type);
CREATE INDEX IF NOT EXISTS idx_claim_timeline_date ON public.claim_timeline(milestone_date);

-- =====================================================
-- 5. CLAIM ALERTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.claim_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'missing_scope',
        'pricing_suppression',
        'coverage_gap',
        'deadline_approaching',
        'settlement_opportunity',
        'carrier_tactic_detected',
        'action_required'
    )),
    
    alert_title TEXT NOT NULL,
    alert_message TEXT NOT NULL,
    alert_severity TEXT DEFAULT 'info' CHECK (alert_severity IN ('info', 'warning', 'critical')),
    
    action_required BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_alerts_claim_id ON public.claim_alerts(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_alerts_user_id ON public.claim_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_claim_alerts_type ON public.claim_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_claim_alerts_severity ON public.claim_alerts(alert_severity);
CREATE INDEX IF NOT EXISTS idx_claim_alerts_read ON public.claim_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_claim_alerts_dismissed ON public.claim_alerts(is_dismissed);

-- =====================================================
-- 6. RECOMMENDED ACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.recommended_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    action_type TEXT NOT NULL CHECK (action_type IN (
        'run_estimate_review',
        'generate_claim_letter',
        'request_contractor_comparison',
        'review_policy_coverage',
        'submit_supplement',
        'request_appraisal',
        'escalate_claim',
        'document_evidence'
    )),
    
    action_title TEXT NOT NULL,
    action_description TEXT NOT NULL,
    estimated_impact NUMERIC(12,2),
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    
    action_url TEXT,
    
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommended_actions_claim_id ON public.recommended_actions(claim_id);
CREATE INDEX IF NOT EXISTS idx_recommended_actions_type ON public.recommended_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_recommended_actions_priority ON public.recommended_actions(priority DESC);
CREATE INDEX IF NOT EXISTS idx_recommended_actions_completed ON public.recommended_actions(is_completed);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
DROP TRIGGER IF EXISTS update_carrier_patterns_updated_at ON public.carrier_patterns;
CREATE TRIGGER update_carrier_patterns_updated_at
    BEFORE UPDATE ON public.carrier_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_claim_analysis_updated_at ON public.claim_analysis;
CREATE TRIGGER update_claim_analysis_updated_at
    BEFORE UPDATE ON public.claim_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coverage_flags_updated_at ON public.coverage_flags;
CREATE TRIGGER update_coverage_flags_updated_at
    BEFORE UPDATE ON public.coverage_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_claim_timeline_updated_at ON public.claim_timeline;
CREATE TRIGGER update_claim_timeline_updated_at
    BEFORE UPDATE ON public.claim_timeline
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_claim_alerts_updated_at ON public.claim_alerts;
CREATE TRIGGER update_claim_alerts_updated_at
    BEFORE UPDATE ON public.claim_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recommended_actions_updated_at ON public.recommended_actions;
CREATE TRIGGER update_recommended_actions_updated_at
    BEFORE UPDATE ON public.recommended_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================
ALTER TABLE public.carrier_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverage_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommended_actions ENABLE ROW LEVEL SECURITY;

-- Carrier Patterns (Public read for intelligence)
DROP POLICY IF EXISTS "Anyone can read carrier patterns" ON public.carrier_patterns;
CREATE POLICY "Anyone can read carrier patterns" ON public.carrier_patterns
    FOR SELECT USING (true);

-- Claim Analysis Policies
DROP POLICY IF EXISTS "Users can view their own claim analysis" ON public.claim_analysis;
CREATE POLICY "Users can view their own claim analysis" ON public.claim_analysis
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own claim analysis" ON public.claim_analysis;
CREATE POLICY "Users can insert their own claim analysis" ON public.claim_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own claim analysis" ON public.claim_analysis;
CREATE POLICY "Users can update their own claim analysis" ON public.claim_analysis
    FOR UPDATE USING (auth.uid() = user_id);

-- Coverage Flags Policies
DROP POLICY IF EXISTS "Users can view their own coverage flags" ON public.coverage_flags;
CREATE POLICY "Users can view their own coverage flags" ON public.coverage_flags
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own coverage flags" ON public.coverage_flags;
CREATE POLICY "Users can insert their own coverage flags" ON public.coverage_flags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own coverage flags" ON public.coverage_flags;
CREATE POLICY "Users can update their own coverage flags" ON public.coverage_flags
    FOR UPDATE USING (auth.uid() = user_id);

-- Claim Timeline Policies
DROP POLICY IF EXISTS "Users can view their own claim timeline" ON public.claim_timeline;
CREATE POLICY "Users can view their own claim timeline" ON public.claim_timeline
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own claim timeline" ON public.claim_timeline;
CREATE POLICY "Users can insert their own claim timeline" ON public.claim_timeline
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own claim timeline" ON public.claim_timeline;
CREATE POLICY "Users can update their own claim timeline" ON public.claim_timeline
    FOR UPDATE USING (auth.uid() = user_id);

-- Claim Alerts Policies
DROP POLICY IF EXISTS "Users can view their own claim alerts" ON public.claim_alerts;
CREATE POLICY "Users can view their own claim alerts" ON public.claim_alerts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own claim alerts" ON public.claim_alerts;
CREATE POLICY "Users can insert their own claim alerts" ON public.claim_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own claim alerts" ON public.claim_alerts;
CREATE POLICY "Users can update their own claim alerts" ON public.claim_alerts
    FOR UPDATE USING (auth.uid() = user_id);

-- Recommended Actions Policies
DROP POLICY IF EXISTS "Users can view their own recommended actions" ON public.recommended_actions;
CREATE POLICY "Users can view their own recommended actions" ON public.recommended_actions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own recommended actions" ON public.recommended_actions;
CREATE POLICY "Users can insert their own recommended actions" ON public.recommended_actions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recommended actions" ON public.recommended_actions;
CREATE POLICY "Users can update their own recommended actions" ON public.recommended_actions
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate claim intelligence score
CREATE OR REPLACE FUNCTION calculate_claim_intelligence_score(p_claim_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 100;
    v_missing_count INTEGER;
    v_coverage_count INTEGER;
    v_alert_count INTEGER;
BEGIN
    -- Deduct points for missing scope items
    SELECT COUNT(*) INTO v_missing_count
    FROM public.claim_estimate_discrepancies
    WHERE claim_id = p_claim_id AND discrepancy_type = 'missing_item' AND NOT resolved;
    
    v_score := v_score - (v_missing_count * 5);
    
    -- Deduct points for coverage gaps
    SELECT COUNT(*) INTO v_coverage_count
    FROM public.coverage_flags
    WHERE claim_id = p_claim_id AND NOT is_resolved;
    
    v_score := v_score - (v_coverage_count * 8);
    
    -- Deduct points for critical alerts
    SELECT COUNT(*) INTO v_alert_count
    FROM public.claim_alerts
    WHERE claim_id = p_claim_id AND alert_severity = 'critical' AND NOT is_dismissed;
    
    v_score := v_score - (v_alert_count * 10);
    
    -- Ensure score stays within 0-100 range
    v_score := GREATEST(0, LEAST(100, v_score));
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update carrier pattern statistics
CREATE OR REPLACE FUNCTION update_carrier_pattern(
    p_carrier_name TEXT,
    p_issue_type TEXT,
    p_claim_gap NUMERIC,
    p_severity_score NUMERIC,
    p_missing_items JSONB
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.carrier_patterns (
        carrier_name,
        issue_type,
        frequency,
        avg_claim_gap,
        avg_severity_score,
        common_missing_items,
        detection_count,
        last_detected_at
    )
    VALUES (
        p_carrier_name,
        p_issue_type,
        1,
        p_claim_gap,
        p_severity_score,
        p_missing_items,
        1,
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Update existing pattern if found
    UPDATE public.carrier_patterns
    SET
        frequency = frequency + 1,
        avg_claim_gap = ((avg_claim_gap * detection_count) + p_claim_gap) / (detection_count + 1),
        avg_severity_score = ((avg_severity_score * detection_count) + p_severity_score) / (detection_count + 1),
        detection_count = detection_count + 1,
        last_detected_at = NOW(),
        updated_at = NOW()
    WHERE carrier_name = p_carrier_name AND issue_type = p_issue_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED DATA FOR DEMO
-- =====================================================

-- Insert sample carrier patterns (for demo purposes)
INSERT INTO public.carrier_patterns (carrier_name, issue_type, frequency, avg_claim_gap, avg_severity_score, common_missing_items) VALUES
('State Farm', 'labor_suppression', 156, 11800, 7.2, '["flashing", "starter course", "drip edge", "interior paint"]'::jsonb),
('State Farm', 'op_omission', 98, 8400, 6.5, '[]'::jsonb),
('Allstate', 'labor_suppression', 142, 10200, 6.8, '["flashing", "underlayment", "ventilation"]'::jsonb),
('Allstate', 'missing_scope', 134, 9800, 7.1, '["decking", "insulation", "drywall"]'::jsonb),
('USAA', 'pricing_suppression', 89, 7600, 5.9, '[]'::jsonb),
('Farmers', 'labor_suppression', 112, 9400, 6.4, '["flashing", "starter course", "ridge vent"]'::jsonb),
('Liberty Mutual', 'missing_scope', 98, 8900, 6.7, '["decking", "flashing", "interior damage"]'::jsonb),
('Progressive', 'quantity_reduction', 76, 6800, 5.5, '[]'::jsonb)
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.carrier_patterns IS 'Aggregated carrier behavior patterns for intelligence dashboard';
COMMENT ON TABLE public.claim_analysis IS 'Comprehensive claim intelligence analysis and scoring';
COMMENT ON TABLE public.coverage_flags IS 'Detected coverage gaps and opportunities';
COMMENT ON TABLE public.claim_timeline IS 'Claim milestone tracking for timeline intelligence';
COMMENT ON TABLE public.claim_alerts IS 'Active alerts and notifications for claim issues';
COMMENT ON TABLE public.recommended_actions IS 'AI-generated recommended next actions';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON public.carrier_patterns TO authenticated;
GRANT ALL ON public.claim_analysis TO authenticated;
GRANT ALL ON public.coverage_flags TO authenticated;
GRANT ALL ON public.claim_timeline TO authenticated;
GRANT ALL ON public.claim_alerts TO authenticated;
GRANT ALL ON public.recommended_actions TO authenticated;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
