# CCP Wizard & Export Spec (ERP Parity)

**Version:** 1.0 — 2026-06-05  
**Scope:** Estimate-review wizard parity for Claim Command Center V3 (`claim-command-center-v3.html`)  
**Reference product:** Estimate Review Pro (`estimate review pro/app/upload/UploadWizardClient.tsx`)  
**Out of scope:** Changing `analyze-estimates-v2.js` comparison engine, policy review flow (Phases 01–04), or global 10-phase journey titles.

---

## 1. Surface model (decision)

### Decision: **Reshape existing phase/substep nav** — do not add a parallel wizard or a separate deliverables route in v1.

| Option | Verdict | Rationale |
|--------|---------|-----------|
| New linear 6-step wizard inside Phases 05–06 | **Reject** | Duplicates `renderP05*` / `renderP06*`, breaks `phases[]` + `completedSubsteps` keys (`'4-0'…'5-3'`), and forks navigation from the 10-phase claim journey audited in `docs/CLAIM_COMMAND_CENTER_V3_AUDIT.md`. |
| Standalone `/deliverables` hub (ERP-style) | **Defer** | ERP uses `reviewId` + `DeliverablesHubClient.tsx`. CCP is `claim_id`-scoped (`window.CCC_CLAIM_ID`). A new route adds auth/routing without estimate data unless `claim_outputs` is already hydrated. |
| **Reshape phase/substep nav** | **Adopt** | Insert **one** new Phase 06 substep for ERP Step 4 (Strategy). Extend Phase 06 Gap Analysis substep for ERP Step 5 (Summary + exports). Keep existing ✉ substep for ERP Step 6 (Letter). Phase 05 unchanged structurally. |

### In-page deliverables panel (v1 hub)

Embed a **Deliverables panel** inside the new Phase 06 Strategy substep (`renderP06S2Strategy`) — not a new page. Panel sections mirror ERP `DeliverablesHubClient.tsx` section IDs:

| Panel section ID | ERP equivalent | CCP data source |
|------------------|----------------|-----------------|
| `ccp-deliverables-analysis` | `deliverables-analysis` | `claimData.structure.contractorAnalysis`, `claimData.structure.carrierAnalysis` |
| `ccp-deliverables-comparison` | `deliverables-comparison` | `claimData.structure.carrierAnalysis.line_items`, `compare_mode` |
| `ccp-deliverables-strategy` | `deliverables-strategy` | `claimData.structure.negotiationStrategy` (new field) |
| `ccp-deliverables-summary` | `deliverables-summary` | `claimData.structure.gap`, `gap_categories`, nav metrics |
| `ccp-deliverables-letter` | `deliverables-letter` | Link/button → `setSubstep(4)` on Phase 06 (✉ substep) |

Optional v2: `renderDocumentsView()` add-only section listing exports generated for this claim (reads `claim_generated_documents`).

---

## 2. Step mapping — ERP 1–6 → V3 phases, substeps, functions

### Index convention

- `activePhase` is **0-based** in code; `phases[n].num` is **1-based** display.
- Renderer key = `` `${activePhase}-${activeSubstep}` `` in `renderContent()` (`claim-command-center-v3.html` ~L1805–1816).
- **Current** Phase 05 = `activePhase 4`. Phase 06 = `activePhase 5`.

### ERP step labels (source of truth)

`UploadWizardClient.tsx` `stepLabels`: **Input → Analysis → Comparison → Strategy → Summary → Letter**

---

### ERP Step 1 — Input

| ERP surface | CCP mapping | Renderer / function | `activePhase` / `activeSubstep` |
|-------------|-------------|---------------------|----------------------------------|
| Claim metadata form | Phase 01 + `claimInfoStrip()` on upload panels | `renderP01S0`, `editClaimInfo()` | `0-0` |
| Carrier estimate upload/paste | Phase 06 upload | `renderP06S0()`, `uploadClaimFile(file,'carrier_estimate')`, `handlePasteExtract()` | `5-0` |
| Contractor estimate upload/paste | Phase 05 upload | `renderP05S0()`, `uploadClaimFile(file,'contractor_estimate')`, `handlePasteExtract()` | `4-0` |
| Policy upload (ERP optional) | Phase 02 | `renderP02S0()`, `analyzePolicyDoc()` | `2-0` |

**Cold-session hydrate (done):** `loadState()` §7 → `hydrateDocumentText()` restores `claimData.structure.*EstimateText`, `claimData.policy.rawText` from `claim_documents.extracted_text`.

**Nav entry:** User reaches Step 1 equivalents via Full Plan phase sidebar (`setPhase(4)` / `setPhase(5)`), not a wizard step indicator.

---

### ERP Step 2 — Analysis

| ERP surface | CCP mapping | Function | Backend | Persisted field / table |
|-------------|-------------|----------|---------|------------------------|
| Contractor analysis | Phase 05 analyze | `analyzeContractorEst()` | `/.netlify/functions/contractor-estimate-interpreter` | `claimData.structure.contractorAnalysis`; `claim_outputs.output_type = 'contractor_estimate_analysis'` |
| Carrier + comparison analysis | Phase 06 analyze | `analyzeCarrierEst()` | `/.netlify/functions/analyze-estimates-v2` | `claimData.structure.carrierAnalysis`; `claim_outputs.output_type = 'carrier_estimate_analysis'` |
| Analysis confidence UI | Both phases | `renderConfidenceBanner()`, `renderEstimateAnalysisConfidence()` | — | Reads `parse_method`, `analysis_method`, `recon_path` on analysis objects |

**Hydrate on load:** `loadState()` §8 restores `contractorAnalysis`, `carrierAnalysis` from `claim_outputs` when local `claimData.structure.*` is empty.

**Gap vs ERP:** CCP has no `AnalysisResult` shape (`trueLossRange`, `scopeOmissions`, `recommendedStrategy` from ERP `step2-analysis-panel.tsx`). Those fields must be **derived or net-new** (see §3).

---

### ERP Step 3 — Comparison

| ERP surface | CCP mapping | Function | Data fields |
|-------------|-------------|----------|-------------|
| Comparison table | Phase 06 substep 1 | `renderP06S1()` | `claimData.structure.carrierAnalysis.line_items` |
| RECON_VS_CARRIER mode | Same renderer | `renderP06S1()`, `isReconCompareMode()`, `renderReconModeBanner()` | `carrierAnalysis.compare_mode`, `reconstructedTotal`, `recon_path` |
| Re-run comparison CTA | RECON fallback banner | `goToContractorEstimateUpload()` → `setPhase(4); setSubstep(0)` | — |
| Compare PDF (ERP) | Partial | `downloadGapAnalysis()` on `renderP06S1` button | Uses line items + gap — not a dedicated comparison-only export |

**Renderer key (current):** `5-1` → `renderP06S1`.

**Persist:** `analyze-estimates-v2` should also write `claim_outputs.output_type = 'estimate_comparison'` (verify in `persistResults()`); hydrate in `loadState()` §8 → `claimData.structure.estimateComparison`.

---

### ERP Step 4 — Strategy

**Currently missing** from the Phase 05–06 estimate path. See §3 for full spec.

| ERP surface | CCP mapping (after reshape) | New function | Renderer key (target) |
|-------------|----------------------------|--------------|------------------------|
| `Step4StrategyPanel` | **New** Phase 06 substep | `renderP06S2Strategy()` | `5-2` (new) |
| Strategy persistence | New | `saveNegotiationStrategy()` | `claimData.structure.negotiationStrategy` + `claim_outputs.output_type = 'negotiation_strategy'` |

**Renumber after insert:**

| New `activeSubstep` | Title (update `phases[5].substeps`) | Function |
|---------------------|-------------------------------------|----------|
| 0 | Upload Carrier Estimate | `renderP06S0` (unchanged) |
| 1 | Line-Item Comparison | `renderP06S1` (unchanged) |
| 2 | **Negotiation Strategy** | `renderP06S2Strategy` (**new**) |
| 3 | Gap Analysis | `renderP06S3` (rename from `renderP06S2`) |
| 4 | ✉ Supplement Request Letter | `renderCorrespondenceWizard('✉ Supplement Request Letter')` (was substep 3) |

**`renderContent()` map change:** add `'5-2': renderP06S2Strategy`, rename `'5-2': renderP06S2` → `'5-3': renderP06S3`. Mail substep resolves via `phases[5].substeps[4].startsWith('✉')` — no renderer key.

**`completedSubsteps` migration:** On `loadState()`, if `'5-3'` (old Gap) completed, map to `'5-3'` (new Gap index) — document one-time key remap in `loadState()` when `phases[5].substeps.length` changes.

---

### ERP Step 5 — Summary

| ERP surface | CCP mapping | Function | Notes |
|-------------|-------------|----------|-------|
| `step5-summary-panel.tsx` gap card | Phase 06 Gap Analysis | `renderP06S3()` (renamed) | `buildGapCategoryTable()`, money-moment hero |
| Comprehensive PDF/DOCX | Partial | `downloadGapAnalysis()` | Client-side `jsPDF` — gap + line items only |
| Financial rollup | Financial view | `renderFinancial()`, `downloadFinancialSummary()` | `claimData.structure.*`, `claim_financial_summary` hydrate |

**Export buttons belong on `renderP06S3`** (deliverables summary section) — see §4.

---

### ERP Step 6 — Letter

| ERP surface | CCP mapping | Function | Backend |
|-------------|-------------|----------|---------|
| `step6-letter-panel.tsx` | Phase 06 ✉ substep | `renderCorrespondenceWizard('✉ Supplement Request Letter')` | — |
| Letter generation | Wizard step 4 | `generateLetterContent()` → `callLetterAI()` | `/.netlify/functions/generate-letter` (via `callNetlify('letter',…)`) |
| Letter PDF | Wizard step 4 | `downloadWizardLetterPDF(letterType)` | Client `jsPDF` |
| Letter persist | Wizard step 4 | `logCorrespondence()` | `generated_letters` + `correspondenceJournal` |

**Entry from deliverables panel:** `onclick="setSubstep(4)"` while `activePhase===5`.

**Do not use** Compose tab `renderComposeView()` step 4 (audit M5: template timeout) — in-flow ✉ wizard only.

---

### Phase 05 ↔ ERP (contractor side of Input + Analysis)

| Substep | Title | Function | ERP steps covered |
|---------|-------|----------|-------------------|
| `4-0` | Upload Estimate | `renderP05S0`, `analyzeContractorEst()` | Step 1 (contractor doc) + Step 2 (contractor analysis) |
| `4-1` | Scope Review | `renderP05S1` | Step 2 review UI |
| `4-2` | ✉ Estimate Submission Letter | `renderCorrespondenceWizard` | Step 6 (adjacent letter, not supplement) |

---

### Summary matrix (implementation prompt table)

| ERP Step | ERP label | CCP Phase | `activePhase` | `activeSubstep` | Primary render function | Primary action function |
|----------|-----------|-----------|---------------|-----------------|-------------------------|-------------------------|
| 1 | Input | 05 + 06 | 4, 5 | 0 | `renderP05S0`, `renderP06S0` | `uploadClaimFile`, `handlePasteExtract` |
| 2 | Analysis | 05 + 06 | 4, 5 | 0 | `renderP05S0`, `renderP06S0` | `analyzeContractorEst`, `analyzeCarrierEst` |
| 3 | Comparison | 06 | 5 | 1 | `renderP06S1` | (read-only; data from `analyzeCarrierEst`) |
| 4 | Strategy | 06 | 5 | 2 | **`renderP06S2Strategy`** (new) | **`saveNegotiationStrategy`** (new) |
| 5 | Summary | 06 | 5 | 3 | **`renderP06S3`** (rename) | `downloadGapAnalysis`, new export fns §4 |
| 6 | Letter | 06 | 5 | 4 | `renderCorrespondenceWizard` | `generateLetterContent`, `downloadWizardLetterPDF` |

---

## 3. Strategy step — data model and sources

### Problem

ERP Step 4 (`step4-strategy-panel.tsx`) reads `AnalysisResult`:

- `recommendedStrategy`: `FULL_SUPPLEMENT_DEMAND | PARTIAL_DISPUTE | DEMAND_REINSPECTION | INVOKE_APPRAISAL | OTHER_CUSTOM`
- `availableStrategies[]`, `trueLossRange`, `carrierAmount`, `scopeOmissions`, `pricingFlags`, `disputeAngles`, `riskLevel`

**CCP today has no equivalent persisted on the estimate path.** Related but **not** ERP Step 4:

| Existing CCP surface | Location | Taxonomy | Why not ERP Step 4 |
|----------------------|----------|----------|---------------------|
| Correspondence wizard step 3 | `renderWizardStep(3, letterType)` ~L4202 | `assert`, `clarification`, `escalation`, `custom` | Letter-tone strategy, not supplement/dispute/appraisal codes |
| Phase 09 negotiation calculator | `renderP09S0`, `calcNegotiation()` | Dollar counter-offer range | No strategy code; runs **after** demand phase |
| Phase 09 escalation cards | `renderP09S1` | Appraisal, mediation, DOI | Escalation **options**, not selected strategy |

### Target data model (create)

```javascript
// claim-command-center-v3.html — claimData.structure (new fields)
claimData.structure.negotiationStrategy = null;  // ERP code string
claimData.structure.strategySource = null;       // 'auto' | 'user'
claimData.structure.strategyRationale = null;    // plain text shown in UI
```

**Persist:**

| Store | `output_type` | `content` shape |
|-------|---------------|-----------------|
| `claim_outputs` | `negotiation_strategy` | `{ code, source, rationale, recommended_at, inputs_snapshot }` |

**Hydrate:** extend `loadState()` §8:

```javascript
.in('output_type', [..., 'negotiation_strategy'])
// → claimData.structure.negotiationStrategy = parsed.code
```

### Strategy recommendation engine (new file)

**Create:** `lib/estimate-strategy-resolver.js` (ported from ERP `step4-strategy-panel.tsx` `buildAutoRationale` + card rules; no React).

**Input object** `buildStrategyContext(claimData)`:

| Field | Source in CCP |
|-------|----------------|
| `carrierAmount` | `claimData.structure.insurerEstimate` or `carrierAnalysis.carrier_total` |
| `contractorAmount` | `claimData.structure.userEstimate` |
| `gap` | `claimData.structure.gap` |
| `compare_mode` | `carrierAnalysis.compare_mode` |
| `flagged_line_count` | `carrierAnalysis.line_items.filter(i => i.flagged \|\| i.status === 'Undervalued' \|\| i.status === 'Missing').length` |
| `gap_categories` | `carrierAnalysis.gap_categories` |
| `has_contractor_text` | `hasSubstantiveContractorText(claimData.structure.contractorEstimateText)` |
| `recon_path` | `carrierAnalysis.recon_path` |

**Output:**

```javascript
{
  recommendedStrategy: 'FULL_SUPPLEMENT_DEMAND', // ERP code
  availableStrategies: ['FULL_SUPPLEMENT_DEMAND', 'PARTIAL_DISPUTE', ...],
  rationale: string,
  riskLevel: 'low' | 'moderate' | 'high'  // derived from gap % and flagged count
}
```

**Resolver rules (deterministic v1 — match ERP card copy intent):**

| Condition | Recommended code |
|-----------|------------------|
| `gap >= 5000` OR `flagged_line_count >= 3` | `FULL_SUPPLEMENT_DEMAND` |
| `compare_mode === 'RECON_VS_CARRIER'` AND `!has_contractor_text` | `PARTIAL_DISPUTE` (carrier-only recon) |
| `gap > 0` AND `gap < 5000` | `PARTIAL_DISPUTE` |
| `flagged_line_count === 0` AND `gap <= 0` | `DEMAND_REINSPECTION` |
| User on Phase 09 path / appraisal CTA already used | `INVOKE_APPRAISAL` (manual only, never auto-default) |

**UI:** `renderP06S2Strategy()` — reuse existing CSS `.strategy-grid`, `.strategy-card` (already in V3 ~L478). Five cards map to ERP codes (not correspondence `assert/clarification`).

**Auto-apply:** On first render when `!claimData.structure.negotiationStrategy`, call `estimateStrategyResolver.recommend(buildStrategyContext(claimData))` and pre-select recommended card (mirror ERP `step4StrategyAutoAppliedRef`).

**User override:** `selectNegotiationStrategy(code)` → `saveNegotiationStrategy(code, 'user')`.

### Letter wizard integration

When opening ✉ Supplement Request Letter, pass strategy into letter payload:

- Extend `letterClaimPayload()` to include `negotiationStrategy: claimData.structure.negotiationStrategy`
- `generate-letter` handler: use code to pick prompt template section (map `FULL_SUPPLEMENT_DEMAND` → supplement tone, etc.)

**Do not** reuse correspondence wizard `selectStrategy(1|2|3|4)` for estimate strategy — keep letter-tone strategy as secondary display only or hide step 3 when `letterType === 'Supplement Request'` and strategy already set on Phase 06 S2.

---

## 4. Export matrix — ERP 4 templates + ZIP

### ERP reference

| ERP template | `ExportControls.tsx` value | ERP builder |
|--------------|---------------------------|-------------|
| Negotiation Brief | `NEGOTIATION` | `lib/templates/negotiation-template.ts` → `buildNegotiationTemplate()` |
| Pushback Response | `PUSHBACK` | `lib/templates/pushback-template.ts` → `buildPushbackTemplate()` |
| Appraisal Exhibit | `APPRAISAL` | `lib/templates/appraisal-template.ts` → `buildAppraisalTemplate()` |
| Full Enforcement Report | `FULL` | `lib/review-export-text.ts` → `buildComprehensiveWizardPlainText()` |
| All formats ZIP | `type=ALL` | ERP `/api/reports/[id]/export?format=pdf&type=ALL` |

ERP also exports DOCX via `buildComprehensiveWizardDocxPayload()` + Netlify `generate-docx` (ERP only).

---

### CCP existing exports (estimate-relevant)

| Function | File | Format | Data consumed | ERP template overlap |
|----------|------|--------|---------------|---------------------|
| `downloadGapAnalysis()` | `claim-command-center-v3.html` ~L5238 | PDF (`jsPDF`) | `structure.insurerEstimate`, `userEstimate`, `gap`, `carrierAnalysis.gap_categories`, `carrierAnalysis.line_items` | **~40% of FULL** — gap + comparison tables only |
| `downloadFinancialSummary()` | ~L5569 | PDF | `structure`, `contents`, `ALE`, financial hydrate | Financial rollup, not ERP analysis narrative |
| `downloadDemandPackage()` | ~L5471 | PDF | Phase 08 demand assembly | Adjacent to NEGOTIATION, not line-compare-centric |
| `downloadWizardLetterPDF(letterType)` | ~L4731 | PDF | Wizard letter text | Letter only (ERP Step 6 partial) |
| `downloadComposeLetterPDF(letterType)` | ~L4717 | PDF | Compose tab (avoid for supplement path) | — |

### CCP backend export functions (exist, not wired in V3 Phase 06)

| Function | File | Formats | Wire target |
|----------|------|---------|-------------|
| `export-reconciliation-report` | `netlify/functions/export-reconciliation-report.js` | `json`, `csv`, `pdf`, `supplement` | `downloadReconciliationReport(format)` (**new** client wrapper) |
| `generate-archive` | `netlify/functions/generate-archive.js` | ZIP of `claim_documents` + optional `claim_generated_documents` | `downloadEstimateReviewBundle()` (**new**) |

---

### Export matrix (implementation table)

| ERP export | CCP v1 function (target) | Status | Primary data fields | Implementation notes |
|------------|--------------------------|--------|---------------------|-------------------|
| **Negotiation Brief** | `downloadNegotiationBrief()` | **Net-new** | `claimData.initial.*`, `structure.gap`, `structure.negotiationStrategy`, `carrierAnalysis.line_items` (flagged), `policy.analysis` | **Create** `lib/estimate-export-templates.js` → `buildNegotiationBriefPdf(doc, claimData)` porting ERP `negotiation-template.ts` section titles. Button on `renderP06S3`. |
| **Pushback Response** | `downloadPushbackPacket()` | **Net-new** | Same + `correspondenceJournal` (carrier letters), `messages` | Same lib file → `buildPushbackPacketPdf()`. Requires ≥1 logged carrier message OR user confirms skip. |
| **Appraisal Exhibit** | `downloadAppraisalExhibit()` | **Net-new** | `structure.*`, `documents` (photos, engineer reports), `carrierAnalysis` | Same lib file → `buildAppraisalExhibitPdf()`. Show only when `negotiationStrategy === 'INVOKE_APPRAISAL'` or user override. |
| **Full Enforcement Report** | `downloadFullEnforcementReport()` | **Net-new** (supersedes gap-only as "full") | All above + `contractorAnalysis`, `estimateComparison`, `buildGapCategoryTable` data | Compose sections matching ERP `buildComprehensiveWizardPlainText` order: claim meta → analysis summary → comparison → strategy → gap categories. Keep `downloadGapAnalysis()` as **short** export. |
| **ZIP bundle** | `downloadEstimateReviewBundle()` | **Net-new** | `claim_id`, outputs, generated PDFs | POST `/.netlify/functions/generate-archive` with `include_types: ['policy','contractor_estimate','carrier_estimate']`, `include_outputs: true`. Add client-generated PDFs as blobs before upload OR extend `generate-archive.js` to accept `claim_outputs` JSON attachments. |

### DOCX (parity gap — v1.1)

| ERP | CCP target | Status |
|-----|------------|--------|
| `buildComprehensiveWizardDocxPayload()` + `generate-docx` | `downloadFullEnforcementReportDocx()` | **Net-new** — requires `netlify/functions/generate-docx.js` (copy from ERP or add docx builder). Defer if not in v1 scope; note in UI as "PDF only for now". |

### UI placement

Add **Export row** to `renderP06S3()` below existing `downloadGapAnalysis` button:

```html
<div class="export-matrix" id="estimate-export-matrix">
  <button onclick="downloadNegotiationBrief()">Negotiation Brief (PDF)</button>
  <button onclick="downloadPushbackPacket()">Pushback Packet (PDF)</button>
  <button onclick="downloadAppraisalExhibit()">Appraisal Exhibit (PDF)</button>
  <button onclick="downloadFullEnforcementReport()">Full Report (PDF)</button>
  <button onclick="downloadEstimateReviewBundle()">Download All (ZIP)</button>
</div>
```

**Enable guards** (disable button + `title` tooltip when data missing):

| Export | Guard function | Minimum data |
|--------|----------------|--------------|
| Negotiation Brief | `canExportNegotiationBrief()` | `carrierAnalysis` + `negotiationStrategy` |
| Pushback Packet | `canExportPushback()` | `carrierAnalysis` + (`correspondenceJournal.length` OR confirm) |
| Appraisal Exhibit | `canExportAppraisal()` | `carrierAnalysis` + (`negotiationStrategy === 'INVOKE_APPRAISAL'` OR manual) |
| Full Report | `canExportFullReport()` | `carrierAnalysis` + `contractorAnalysis` |
| ZIP | `canExportBundle()` | `window.CCC_CLAIM_ID` + ≥1 `claim_documents` row |

### `downloadGapAnalysis()` — keep, relabel

| Current label | New label (UI only) |
|---------------|---------------------|
| Download Gap Analysis PDF | **Gap & Comparison Summary (PDF)** |

Maps to ERP comparison + partial summary; not one of the four named templates.

---

## 5. Files to create or modify (implementation checklist)

### Create

| File | Purpose |
|------|---------|
| `lib/estimate-strategy-resolver.js` | ERP Step 4 deterministic strategy recommendation |
| `lib/estimate-export-templates.js` | PDF section builders for NEGOTIATION / PUSHBACK / APPRAISAL / FULL |
| `tests/estimate-strategy-resolver.test.js` | Unit tests for resolver rules |
| `tests/estimate-export-templates.test.js` | Smoke tests: builders don't throw on fixture `claimData` |

### Modify

| File | Changes |
|------|---------|
| `claim-command-center-v3.html` | `phases[5].substeps` renumber; `renderP06S2Strategy`, rename `renderP06S2`→`renderP06S3`; renderer map; `loadState()` hydrate `negotiation_strategy`; export buttons; new download functions; `letterClaimPayload()` strategy field |
| `netlify/functions/generate-letter.js` | Accept `negotiationStrategy` in payload; map ERP codes to prompt fragments |
| `netlify/functions/generate-archive.js` | Optional: accept `extra_attachments[]` for client-built PDFs in ZIP |
| `supabase/migrations/YYYYMMDD_negotiation_strategy_output.sql` | Optional: extend `claim_outputs.output_type` CHECK if constrained |

### Do not modify (per prior constraints)

- `netlify/functions/analyze-estimates-v2.js` (comparison engine)
- `lib/estimate-comparison-engine.js`
- ERP repo files (read-only reference)

---

## 6. Cursor implementation prompt (ready to paste)

```
Implement CCP wizard/export parity per docs/CCP_WIZARD_EXPORT_SPEC.md:

1. Reshape Phase 06 substeps: insert 5-2 renderP06S2Strategy; rename renderP06S2 → renderP06S3; move ✉ to substep 4; update phases[5].substeps and renderContent() map; remap completedSubsteps keys in loadState().

2. Create lib/estimate-strategy-resolver.js; wire renderP06S2Strategy() with five ERP strategy cards; persist via saveNegotiationStrategy() to claimData.structure and claim_outputs (negotiation_strategy); hydrate in loadState() §8.

3. Create lib/estimate-export-templates.js; add downloadNegotiationBrief, downloadPushbackPacket, downloadAppraisalExhibit, downloadFullEnforcementReport, downloadEstimateReviewBundle to claim-command-center-v3.html; place export-matrix on renderP06S3 with canExport* guards.

4. Pass negotiationStrategy through letterClaimPayload() to generate-letter for Supplement Request letters.

5. Add tests/estimate-strategy-resolver.test.js with fixture claimData from tests/fixtures/ sample estimates.

Do not add a parallel 6-step wizard or /deliverables route. Do not modify analyze-estimates-v2.js.
```

---

## 7. Acceptance criteria

| # | Criterion | Verify |
|---|-----------|--------|
| 1 | Phase 06 shows 5 substeps; Strategy appears between Comparison and Gap Analysis | UI + `phases[5].substeps.length === 5` |
| 2 | Cold session restores strategy from `claim_outputs` | Reload after `saveNegotiationStrategy` |
| 3 | Each export button produces a non-empty PDF when guards pass | Manual + fixture claim |
| 4 | ZIP contains policy + estimate docs + at least one generated PDF | `generate-archive` response |
| 5 | Supplement letter references selected ERP strategy code | Inspect `generate-letter` request payload |
| 6 | `downloadGapAnalysis()` still works unchanged | Regression test |

---

## 8. Reference links (repo paths)

| Asset | Path |
|-------|------|
| V3 phase definitions | `claim-command-center-v3.html` L705–716 |
| V3 render map | `claim-command-center-v3.html` L1805–1816 |
| V3 loadState hydrate | `claim-command-center-v3.html` L1207–1438 |
| ERP wizard client | `estimate review pro/app/upload/UploadWizardClient.tsx` |
| ERP strategy panel | `estimate review pro/app/upload/step4-strategy-panel.tsx` |
| ERP export text | `estimate review pro/lib/review-export-text.ts` |
| ERP report templates | `estimate review pro/lib/templates/*.ts` |
| Parity gap list | `tests/estimate-review-parity-suite.js` L106–110 |
