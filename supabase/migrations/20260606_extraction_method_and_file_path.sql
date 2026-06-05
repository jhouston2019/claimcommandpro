-- Add extraction_method column if not present
ALTER TABLE claim_documents
  ADD COLUMN IF NOT EXISTS extraction_method TEXT;

-- Normalize file_path: production has file_path but not storage_path in some rows.
-- Ensure storage_path exists and is populated from file_path where null.
ALTER TABLE claim_documents
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

UPDATE claim_documents
  SET storage_path = file_path
  WHERE storage_path IS NULL AND file_path IS NOT NULL;

-- Add evidence to document_type CHECK constraint.
-- Drop and recreate the constraint only — do not alter any other column.
ALTER TABLE claim_documents
  DROP CONSTRAINT IF EXISTS claim_documents_document_type_check;

ALTER TABLE claim_documents
  ADD CONSTRAINT claim_documents_document_type_check
  CHECK (document_type IN (
    'policy','contractor_estimate','carrier_estimate','settlement_letter',
    'release','photo','invoice','receipt','correspondence','supplement',
    'proof_of_loss','engineer_report','expert_opinion','appraisal_award',
    'moisture_report','contractor_narrative','roofing_consultant_report',
    'causation_report','evidence','supporting_document','other'
  ));

-- Index for hydration query performance
CREATE INDEX IF NOT EXISTS idx_claim_documents_claim_id_type
  ON claim_documents(claim_id, document_type);
