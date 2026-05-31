-- =====================================================
-- Fix schema mismatches for claim-command-center-v3.html
-- Aligns deployed schema with app insert/update field names
-- =====================================================

-- =====================================================
-- 1. claim_documents: extracted_text + file_path
-- App inserts file_path; text-extract updates by file_path.
-- Legacy schema used storage_path only.
-- =====================================================

ALTER TABLE public.claim_documents
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

DO $$
BEGIN
  -- Prefer file_path as the canonical column (matches CCP v3 + text-extract DB queries)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'claim_documents' AND column_name = 'storage_path'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'claim_documents' AND column_name = 'file_path'
  ) THEN
    ALTER TABLE public.claim_documents RENAME COLUMN storage_path TO file_path;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'claim_documents' AND column_name = 'storage_path'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'claim_documents' AND column_name = 'file_path'
  ) THEN
    -- Both exist: keep storage_path, expose file_path as generated alias for reads/writes that expect it
    ALTER TABLE public.claim_documents
    DROP COLUMN IF EXISTS file_path;

    ALTER TABLE public.claim_documents
    ADD COLUMN file_path TEXT GENERATED ALWAYS AS (storage_path) STORED;
  END IF;
END $$;

-- =====================================================
-- 2. claim_outputs: content column + relaxed inserts from CCP v3
-- App inserts: claim_id, output_type, content, created_at
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'claim_outputs' AND column_name = 'output_json'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'claim_outputs' AND column_name = 'content'
  ) THEN
    ALTER TABLE public.claim_outputs RENAME COLUMN output_json TO content;
  END IF;
END $$;

ALTER TABLE public.claim_outputs
ADD COLUMN IF NOT EXISTS content JSONB;

-- Allow CCP v3 inserts without user_id / step_number
ALTER TABLE public.claim_outputs
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.claim_outputs
ALTER COLUMN step_number DROP NOT NULL;

ALTER TABLE public.claim_outputs
ALTER COLUMN step_number SET DEFAULT 1;

-- Expand output_type values used by CCP v3
ALTER TABLE public.claim_outputs
DROP CONSTRAINT IF EXISTS claim_outputs_output_type_check;

ALTER TABLE public.claim_outputs
ADD CONSTRAINT claim_outputs_output_type_check
CHECK (output_type IN (
  'policy_analysis',
  'contractor_estimate_analysis',
  'carrier_estimate_analysis',
  'estimate_comparison',
  'supplement_letter',
  'settlement_analysis',
  'release_analysis',
  'demand_letter',
  'code_analysis',
  'financial_summary'
));

-- Recreate GIN index on renamed content column
DROP INDEX IF EXISTS public.idx_claim_outputs_json;
CREATE INDEX IF NOT EXISTS idx_claim_outputs_content ON public.claim_outputs USING GIN (content);

-- =====================================================
-- 3. claim_financial_summary: column names used by CCP v3
-- App uses insurer_estimate, claimant_estimate, gap_amount,
-- contents_total, ale_total, updated_at
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'claim_financial_summary' AND column_name = 'carrier_total'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'claim_financial_summary' AND column_name = 'insurer_estimate'
  ) THEN
    ALTER TABLE public.claim_financial_summary RENAME COLUMN carrier_total TO insurer_estimate;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'claim_financial_summary' AND column_name = 'contractor_total'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'claim_financial_summary' AND column_name = 'claimant_estimate'
  ) THEN
    ALTER TABLE public.claim_financial_summary RENAME COLUMN contractor_total TO claimant_estimate;
  END IF;
END $$;

ALTER TABLE public.claim_financial_summary
ADD COLUMN IF NOT EXISTS gap_amount NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.claim_financial_summary
ADD COLUMN IF NOT EXISTS contents_total NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.claim_financial_summary
ADD COLUMN IF NOT EXISTS ale_total NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.claim_financial_summary
ADD COLUMN IF NOT EXISTS insurer_estimate NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.claim_financial_summary
ADD COLUMN IF NOT EXISTS claimant_estimate NUMERIC(12,2) DEFAULT 0;

-- Update helper that referenced old column names
CREATE OR REPLACE FUNCTION calculate_claim_financial_summary(p_claim_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.claim_financial_summary
    SET
        underpayment_estimate = GREATEST(0, claimant_estimate - insurer_estimate),
        gap_amount = GREATEST(0, claimant_estimate - insurer_estimate),
        depreciation_outstanding = GREATEST(0, depreciation_withheld - depreciation_recovered),
        outstanding_balance = GREATEST(0, final_settlement_amount - total_paid_to_date),
        last_calculated_at = NOW()
    WHERE claim_id = p_claim_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update payment summary helper if present (20260316 OS migration)
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
        COALESCE(cfs.claimant_estimate, 0) as expected_value,
        COALESCE(cfs.claimant_estimate, 0) - COALESCE(SUM(p.amount), 0) as remaining_balance,
        COUNT(p.id)::INTEGER as payment_count
    FROM public.payments p
    RIGHT JOIN public.claim_financial_summary cfs ON cfs.claim_id = p_claim_id
    WHERE p.claim_id = p_claim_id OR p.claim_id IS NULL
    GROUP BY cfs.claimant_estimate;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. claims: custom_fields for saveState/loadState progress
-- =====================================================

ALTER TABLE public.claims
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_claims_custom_fields ON public.claims USING GIN (custom_fields);

-- =====================================================
-- END
-- =====================================================
