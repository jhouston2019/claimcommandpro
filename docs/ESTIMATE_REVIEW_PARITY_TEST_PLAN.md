# Estimate Review Parity Test Plan

**Goal:** Verify Claim Command Pro (CCP) estimate review and analysis matches Estimate Review Pro (ERP) at the capability level users expect.

**Reference product:** `estimate review pro` (6-step wizard + 12-engine intelligence stack)  
**CCP surfaces:** Command Center V3 Phases 05–06, L3 tools (`ai-estimate-comparison`), deterministic parser libs

---

## Quick start — automated tests

```bash
# Run all estimate parity suites (recommended)
npm run test:estimate

# P0 only (canonical engine — must pass for release)
npm run test:estimate:p0

# Skip parser pipeline if iterating on engine only
node tests/estimate-review-parity-suite.js --skip-parser --verbose
```

### Expected automated results (June 2026)

| Suite | ERP equivalent | Tier | Target |
|-------|----------------|------|--------|
| `estimate-engine-parity-test.js` | classifier + guardrails + lineitem-analyzer | P0 | 6/6 pass |
| `estimate-functional-parity-audit.js` | wizard analyze-estimate safety matrix | P0 | 16/16 pass |
| `estimate-delta-engine-test.js` | compare-estimates version diff | P1 | 10/10 pass |
| `estimate-parser.test.js` | xactimate-parser + LINE_COMPARE local | P1 | full pipeline pass |
| `comprehensive-pipeline-test.js` | intelligence engines 1–7 | P1 | 5/5 pass |
| `rcv-acv-extraction.test.js` | Xactimate RCV/ACV pairing | P2 | pass |
| `estimate-comparison-engine.test.js` | compare-estimates LINE_COMPARE | P0 | pass |

---

## Parity matrix — ERP vs CCP

| ERP capability | CCP implementation | Automated test | Manual E2E | Status |
|----------------|-------------------|----------------|------------|--------|
| Estimate classification (Property/Auto/Commercial) | `estimate-engine.js` | ✅ P0 suites | L3 Estimate Review tool | **PARITY** |
| Safety guardrails (no negotiation/legal advice) | `estimate-engine.js` | ✅ TC-GR-* | Paste prohibited phrase in tool | **PARITY** |
| Scope omissions / under-scoping | `estimate-engine.js` | ✅ TC-OM/US | L3 scope-omission mode | **PARITY** |
| Single-estimate structural analysis | `ai-estimate-comparison` | Engine parity | `/app/tools/estimate-review.html` | **PARITY** |
| Loss expectation / trade completeness | Intelligence engines in `ai-estimate-comparison` | `comprehensive-pipeline-test.js` | Resource Center tool | **PARTIAL** (not in V3) |
| Carrier vs contractor LINE_COMPARE | `analyze-estimates-v2` → `estimate-comparison-engine` | `estimate-comparison-engine.test.js` | Phase 06.1 | **PARITY** |
| Deterministic parse → match → reconcile | `estimate-comparison-engine.js` | `estimate-parser.test.js` + LINE_COMPARE | V3 Phase 06 | **LIVE** |
| RECON_VS_CARRIER (no contractor est.) | — | — | — | **MISSING** |
| 6-step wizard + deliverables hub | Phases 05–06 + letters | — | V3 walkthrough | **PARTIAL** |
| Strategy selection step | — | — | — | **MISSING** |
| Multi-format report export (4 templates + ZIP) | `downloadGapAnalysis` PDF | — | Export after Phase 06 | **PARTIAL** |
| Vision OCR PDF fallback | `text-extract` (pdf-parse) | — | Upload scanned PDF | **PARTIAL** |
| Per-category docs (Building/Contents/ALE) | — | — | — | **MISSING** |
| Founder scenario (geometry + eng. report) | — | — | — | **MISSING** |

---

## Manual E2E — Command Center V3 (Phases 05–06)

**Prerequisites:** `netlify dev` running, Supabase configured, authenticated user with claim access.

### Fixture files

Use sample estimates in `tests/fixtures/`:
- `sample-contractor-estimate.txt` — $5,780.70 total
- `sample-carrier-estimate.txt` — $4,127.76 total
- Expected gap: **~$1,652.94**

### Phase 05 — Contractor estimate

| Step | Action | Pass criteria |
|------|--------|---------------|
| 05.0 | Upload contractor PDF **or** paste `sample-contractor-estimate.txt` via text-extract path | `userEstimate` ≈ $5,781; `contractorAnalysis.line_items.length` ≥ 5 |
| 05.0 | Click Analyze | No error toast; activity log entry |
| 05.1 | Open Scope Review | Table shows line items from `contractorAnalysis`, not static $68,450 demo |
| Nav | Check metrics | "Your Est. Value" matches `userEstimate` |

### Phase 06 — Carrier estimate & analysis

| Step | Action | Pass criteria |
|------|--------|---------------|
| 06.0 | Upload carrier PDF **or** paste carrier text | `carrierEstimateText` populated |
| 06.0 | Run analyze | `insurerEstimate` ≈ $4,128; `gap` ≈ $1,653 |
| 06.1 | Line-item comparison | Rows show carrier vs contractor amounts; statuses (Match/Undervalued/Missing) |
| 06.2 | Gap analysis | `gap_categories` sum ≈ total gap; hero shows live gap $ |
| 06.3 | Supplement letter | `generate-letter` uses live financials |
| Financial view | Open Financial Summary | Insurer / Your Est. / Gap match nav pills |
| Export | Download Gap Analysis PDF | Totals live; line items from analysis (not hardcoded $38,200 / $68,450) |

### ERP equivalence checks (same scenario in Estimate Review Pro)

Run the same two fixture files through ERP `/upload` wizard:

| Output field | ERP (Step 2–3) | CCP (Phase 06) | Acceptable variance |
|--------------|----------------|----------------|---------------------|
| Carrier total | ~$4,128 | `insurerEstimate` | ±$50 |
| Contractor total | ~$5,781 | `userEstimate` | ±$50 |
| Gap | ~$1,653 | `structure.gap` | ±$100 |
| Line items flagged | ≥ 3 discrepancies | `carrierAnalysis.line_items` flagged rows | qualitative match |
| Gap categories | pricing/scope/depreciation | `gap_categories[]` | categories present |

---

## Manual E2E — L3 tools (ERP engine path)

| Tool | URL | Mode | Pass criteria |
|------|-----|------|---------------|
| Estimate Review | `/app/tools/estimate-review.html` | default | Classification + scope findings |
| Estimate Comparison | `/app/tools/estimate-comparison.html` | `comparison` | Side-by-side analysis |
| Scope omission | same backend | `scope-omission` | Missing trade categories listed |
| Code upgrade | same backend | `code-upgrade` | Code-related flags |
| Pricing deviation | same backend | `pricing-deviation` | Pricing flags (when engines enabled) |

**API:** `POST /.netlify/functions/ai-estimate-comparison`  
Requires `Authorization: Bearer <jwt>` and completed payment.

---

## API integration tests (local Netlify)

Start dev server: `npm run dev`

### Contractor interpreter (Phase 05 backend)

```powershell
$body = @{
  estimateText = Get-Content "tests/fixtures/sample-contractor-estimate.txt" -Raw
  claimType = "property-claim"
} | ConvertTo-Json

Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8888/.netlify/functions/contractor-estimate-interpreter" `
  -Headers @{ Authorization = "Bearer YOUR_JWT"; "Content-Type" = "application/json" } `
  -Body $body
```

**Pass:** `total` between 5700–5900; `line_items` array non-empty.

### Carrier analysis (Phase 06 backend)

```powershell
$body = @{
  carrierEstimateText = Get-Content "tests/fixtures/sample-carrier-estimate.txt" -Raw
  contractor_estimate = 5781
  claimType = "property-claim"
  claim_id = "YOUR_CLAIM_UUID"
} | ConvertTo-Json

Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8888/.netlify/functions/analyze-estimates-v2" `
  -Headers @{ Authorization = "Bearer YOUR_JWT"; "Content-Type" = "application/json" } `
  -Body $body
```

**Pass:** `carrier_total` ≈ 4128; `line_items.length` ≥ 5; `gap_categories` non-empty.

---

## Engineering sequence (recommended)

1. **Vision OCR fallback** — shared `text-extract` path for policy + estimates when `pdf-parse` yields thin/garbled text (character count, word density, encoding). Highest leverage.
2. **RECON_VS_CARRIER** — carrier-only users without a contractor estimate (majority early in claim).
3. **6-step wizard + multi-format export** — delivery polish after infrastructure gaps close.

## Known gaps to close for full ERP parity

1. ~~Wire deterministic pipeline into `analyze-estimates-v2`~~ — **DONE** (June 2026).
2. ~~Feed full contractor text into carrier comparison~~ — **DONE** via `contractor_estimate_text` + `contractor_line_items`.
3. **Hydrate `claim_outputs`** on V3 load so re-opened claims show prior analysis.
4. **Add strategy step** or map ERP `recommendedStrategy` into Phase 06 summary.
5. **Port founder scenario** as `tests/founder-scenario-test.js` once geometry engine exists.

---

## Release gate checklist

- [ ] `npm run test:estimate:p0` — all P0 suites green
- [ ] `npm run test:estimate` — no unexpected P1 regressions
- [ ] V3 Phase 05–06 E2E with fixture files — financials + tables live
- [ ] Gap PDF export — no static fallback amounts when analysis succeeded
- [ ] L3 Estimate Review tool — classification + guardrails match ERP
- [ ] Side-by-side with ERP on same fixtures — gap within ±$100

---

## Related docs

- `docs/CLAIM_COMMAND_CENTER_V3_AUDIT.md` — Phase 05–06 status
- `ESTIMATE_REVIEWER_ANALYZER_AUDIT.md` — parser pipeline design (aspirational wiring)
- `POLICY_ESTIMATE_REVIEW_FORENSIC_AUDIT.md` — enterprise pricing gaps
- ERP: `docs/API_DOCUMENTATION.md`, `tests/founder-scenario.test.ts`
