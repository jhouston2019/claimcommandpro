# Claim Command Center v3 — Full Functional Audit

**Scope:** `claim-command-center-v3.html` only (~4,620 lines of application logic in a ~4,920-line file, self-contained SPA).  
**Out of scope:** `claim-command-center.html` (redirect stub), `/app/tools/*`, `next-app/src/lib/claimSteps.ts`.  
**Method:** Full source review of HTML/CSS/inline JS; no live browser QA; Netlify functions audited only at call sites.  
**Initial audit:** June 2026  
**Last updated:** June 2026 — after commits `ba64817c` (UX/data sync) and `56da569a` (infrastructure fixes)

### Revision summary

| Area | Prior audit | After updates |
|------|-------------|---------------|
| Activity log | localStorage only | **LIVE** sync ↔ `claim_activity_log` (requires migration) |
| Policy analysis | memory + localStorage | **LIVE** upsert/load ↔ `claim_policy_analysis` |
| Photo damage AI | not built | **LIVE** `analyze-photos` + Phase 03 UI |
| Messages | 2 demo seeds | **LIVE** manual inbox log (`claimData.messages`) |
| Damage vs contents inventory | shared `contents.items` | **LIVE** split: `structureItems` vs `contents.items` |
| Journal tab | BROKEN ID mismatch | **LIVE** `#journal-list` + filters |
| Documents / Missing panels | static | **LIVE** `updateDocumentsPanel` / `updateMissingPanel` |
| Deadlines | hardcoded Nov 2024 | **LIVE** from `initial.dateOfLoss` |
| Documents view | demo checklist | **LIVE** from `claimData.documents` + journal |
| `claim_documents` on init | not loaded | **LIVE** merged in `loadState()` |
| Onboarding | demo pre-fill | empty defaults; `obStart` creates claim |
| Dispute letter | mock spinner | **LIVE** `generate-letter` |
| Coverage PDFs | hardcoded | **LIVE** from `policy.analysis` when analyzed |

**Deploy prerequisite:** Run `supabase/migrations/20260603_ccc_activity_policy_tables.sql` in production for activity/policy tables.

---

## 1. Executive summary

| Dimension | Assessment |
|-----------|------------|
| **Architecture** | Single-file app: 10 phases × 33 substeps, 8 top-level views, localStorage cache + Supabase when `CCC_CLAIM_ID` + JWT |
| **Strongest** | Policy AI (`ai-policy-review` + DB persist), letters (`generate-letter`), estimates, photo vision (`analyze-photos`), financial rollup, dynamic documents/deadlines, PDF exports |
| **Weakest** | Compose-tab wizard still template-only (step 4); line-item/gap tables still static; tool chips non-functional; messages not email-synced (manual log only) |
| **Production readiness** | Suitable for guided claims with configured Netlify + Supabase after migration + QA on checklist §13; remaining gaps are P1 polish, not blockers for core workflow |

### Status legend

| Code | Meaning |
|------|---------|
| **LIVE** | Real logic; persists or calls backend |
| **UI** | Interactive UI; local/browser state only |
| **DEMO** | Static/sample content or timed mock |
| **STUB** | Alert, placeholder, or non-functional button |
| **BROKEN** | Intended feature fails due to code defect |

---

## 2. File inventory

| Asset | Role |
|-------|------|
| `claim-command-center-v3.html` | Entire UI + application logic |
| `/app/assets/js/supabase-client.js` | Supabase client |
| `/app/assets/js/auth-session.js` | `CNAuth` (requireAuth, getToken, currentUser) |
| `/app/assets/js/paywall-enforcement.js` | `checkPaywall()` |
| CDN | jsPDF 2.5.1 + autotable plugin |
| Netlify | See §8 |

**Build placeholders:** `__CCC_SUPABASE_URL__`, `__CCC_SUPABASE_ANON_KEY__` in `<head>`.

---

## 3. Application shell

### 3.1 Boot sequence (`init` on `window.load`)

| Step | Behavior | Status |
|------|----------|--------|
| 1 | `CNAuth.requireAuth(true)` — redirect if not logged in | **LIVE** (depends on auth-session.js) |
| 2 | `checkPaywall()` — redirect if no active claim access | **LIVE** |
| 3 | Resolve `claim_id` from URL `?claim_id=` or latest active `claims` row for user | **LIVE** |
| 4 | `window.CCC_CLAIM_ID = claimId` | **LIVE** |
| 5 | `loadState()` — localStorage then Supabase overlay | **LIVE** |
| 6 | Reset corrupt `claimData` if missing `initial.insurer` | **LIVE** |
| 7 | Hydrate `claims` row fields into `claimData.initial` | **LIVE** |
| 8 | If onboarded: hide overlay, `showView('fullplan')` | **LIVE** |

**Guest/admin:** `isAdminPreview()` (`sessionStorage.adminAuthenticated`) allows Netlify calls with `X-Admin-Preview`; Supabase storage uploads disabled via `canUseSupabaseStorage()`.

### 3.2 Navigation

| UI | Behavior | Status |
|----|----------|--------|
| **Nav row 1** | Brand, property pill, day count, Insurer Offered / Your Est. Value / Recoverable Gap, avatar initials | **LIVE** metrics from `claimData.structure` |
| **Nav row 2** (desktop) | 8 pills: Full Plan, Claim Summary, Financial, Correspondence, Activity, Messages, Documents, Deadlines | **LIVE** |
| **Mobile tab bar** (≤768px) | Plan, Summary, Letters, Messages, Docs — hides nav row 2 | **LIVE** |
| **Phase row** | 10 cards; click `setPhase`; done badge if phase in `completedPhases` | **LIVE** |
| **Substep bar** | Circles per substep; click `setSubstep`; ✉ substeps use mail wizard | **LIVE** |
| **Status strip** | 6 dropdowns (Recovery, Progress, Findings, Missing, Documents, Activity) | **Partial** — see §4 |

### 3.3 Onboarding overlay

| Feature | Status | Notes |
|---------|--------|-------|
| Step 1 form | **UI** | Empty defaults (no demo pre-fill) |
| Carrier estimate on signup | **LIVE** | `#ob-est-amt` applied in `obNext` / `obSkip` to `structure.insurerEstimate` |
| Step 2 summary | **UI** | `obNext()` builds summary cards |
| Skip / Start | **LIVE** | `obSkip` local only; `obStart` inserts `claims` row + sets `CCC_CLAIM_ID` |
| Persist onboarding fields | **UI** | Updates `claimData.initial` + `saveState()` |

### 3.4 Global UX patterns

| Pattern | Status | Notes |
|---------|--------|-------|
| **Task chips** | **UI** | Toggle done visually; not required to advance |
| **Tool chips** | **STUB** | No `onclick`; hover only — labels only |
| **Mark Complete** | **LIVE** | `completedSubsteps[phase-substep]`; auto-advance substep/phase |
| **Load Sample** | **LIVE** | Populates claim + structure sample inventory |
| **Edit claim info** | **LIVE** | Modal `editClaimInfo()` |
| **hardReset** | **LIVE** | `localStorage.clear()` + reload (if invoked) |

---

## 4. Status strip dropdowns

| Dropdown | Display | Data source | Status |
|----------|---------|-------------|--------|
| **Recovery** | Collected total | `insurerEstimate + ALE.total` as proxy | **Partial** — not actual payments |
| **Progress** | `N of 33 complete` | `Object.keys(completedSubsteps).length` vs sum of all substeps | **LIVE** count; milestone list uses separate 14-item `milestones` array with `done*2` heuristic | **Partial** |
| **Findings** | Gap $ | `structure.gap` | **LIVE** |
| **Missing** | Dynamic checklist + Fix → | `updateMissingPanel()` — policy, estimates, contents, ALE | **LIVE** |
| **Documents** | Upload counts | `updateDocumentsPanel()` from `claimData.documents` + contents | **LIVE** |
| **Activity** | Last 8 log lines | `activityLog` (+ Supabase when migrated) | **LIVE** |

---

## 5. Top-level views (nav row 2)

### 5.1 Full Plan (`showView('fullplan')`)

Shows phase row + substep bar + `renderContent()`. See §6.

### 5.2 Claim Summary

| Field | Source | Status |
|-------|--------|--------|
| Insured, claim #, carrier, DOL, property type, days since loss | `claimData.initial` | **LIVE** |
| Loss description | `initial.description` | **LIVE** |
| Adjuster block | Name + carrier; status hardcoded "Active — Under Review" | **Partial** |
| CTA | Return to Full Plan | **LIVE** |

**Not shown:** policy limits, gap, phase progress, financials.

### 5.3 Financial Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Hero gap | **LIVE** | `(userEstimate + contents + ALE) - insurerEstimate` |
| Stat cards | **LIVE** | Structure, contents, ALE |
| Table | **LIVE** | Insurer columns for contents/ALE hardcoded **$0** |
| Policy cards | **LIVE** | Deductible, RCV, dwelling limit from `claimData.policy` |
| Phase progress bar | **LIVE** | `completedPhases.length * 10%` |
| Download PDF | **LIVE** | `downloadFinancialSummary()` — uses live totals; policy table uses defaults if not analyzed |
| Supabase | **LIVE** | Synced on `saveState` → `claim_financial_summary` |

### 5.4 Correspondence Center

| Tab | Status | Notes |
|-----|--------|-------|
| **Compose New Letter** | **Partial** | 4-step wizard; step 4 uses **2s timeout + static template** — does **not** call `generate-letter` |
| **Journal** | **LIVE** | `renderJournalTab()` targets `#journal-list`; direction + phase filters applied |
| Journal filters | **LIVE** | Sent/Received/Phase filters on `correspondenceJournal` |
| Copy / PDF per entry | **LIVE** | `copyLetterToClipboard`, `downloadLetterPDF` (if journal rendered) |

**In-flow ✉ wizards (Full Plan):** Step 4 calls `generateLetterContent` → **LIVE** `generate-letter` + `logCorrespondence` + optional `generated_letters` insert.

### 5.5 Activity Log

| Feature | Status |
|---------|--------|
| Full chronological list | **LIVE** |
| Max 50 entries | **LIVE** |
| Amount column when provided | **LIVE** |
| Supabase persistence | **LIVE** — last 50 entries upserted to `claim_activity_log` on `saveState`; merged on `loadState` |
| Status strip preview | **LIVE** |

**Auto-logged events include:** step completion, uploads, policy analyze, estimates, letters, ALE, inspection save, PDF downloads.

### 5.6 Messages

| Feature | Status |
|---------|--------|
| Message list | **LIVE** — `claimData.messages[]`; empty state when none |
| Log Incoming Message | **LIVE** — modal (`openLogIncomingMessage` / `saveIncomingMessage`); persists via `saveState` |
| Read | **LIVE** — modal with full body; marks `read: true` |
| Respond | **UI** — navigates to Correspondence compose |
| Email/IMAP sync | **Not built** — manual log only (by design) |

### 5.7 Documents

| Feature | Status |
|---------|--------|
| Category checklist | **LIVE** — Policy, photos, estimates, evidence, correspondence from `claimData.documents` + journal |
| + Upload button | **LIVE** — routes to Phase 03 Evidence Organizer |
| Supabase rows | **LIVE** — `claim_documents` merged on `loadState()`; uploads insert on auth path |

### 5.8 Deadlines

| Deadline | Calculation | Status |
|----------|-------------|--------|
| Proof of Loss (+60d) | DOL + 60 days | **LIVE** when DOL set |
| Lawsuit (+365d) | DOL + 365 days | **LIVE** |
| ALE request (+30d) | DOL + 30 days | **LIVE** |
| Appraisal (+300d) | DOL + 300 days | **LIVE** |
| RCV (+180d) | `meta.rcvRepairDate` + 180d, else pending | **Partial** — needs repair date logged |

**Empty DOL:** shows placeholder rows + amber callout to use Edit Claim Info.

---

## 6. Full Plan — phases and substeps (33 total)

**Correspondence substeps (10):** Render `renderCorrespondenceWizard()` → 4-step wizard (Context, Analysis, Strategy, Letter).

**Renderer map:** `renderContent()` keys `phaseIndex-substepIndex`. Unmapped keys show "Content coming soon".

| Phase | Title | Substeps | Renderers |
|-------|-------|----------|-----------|
| 01 | Understand & Report | 3 | `0-0` P01S0, `0-1` P01S1, `0-2` ✉ wizard |
| 02 | Policy Analysis | 4 | `1-0` P02S0, `1-1` P02S1, `1-2` P02S2, `1-3` ✉ |
| 03 | Document Damage | 4 | `2-0` P03S0, `2-1` P03S1, `2-2` P03S2, `2-3` ✉ |
| 04 | Adjuster Inspection | 3 | `3-0` P04S0, `3-1` P04S1, `3-2` ✉ |
| 05 | Contractor Estimate | 3 | `4-0` P05S0, `4-1` P05S1, `4-2` ✉ |
| 06 | Estimate Analysis | 4 | `5-0` P06S0, `5-1` P06S1, `5-2` P06S2, `5-3` ✉ |
| 07 | Contents & ALE | 3 | `6-0` P07S0, `6-1` P07S1, `6-2` ✉ (`renderP07S2` exists but **unwired**) |
| 08 | Demand & Dispute | 3 | `7-0` P08S0, `7-1` P08S1, `7-2` ✉ (delegates to wizard) |
| 09 | Negotiate & Escalate | 3 | `8-0` P09S0, `8-1` P09S1, `8-2` ✉ |
| 10 | Close & Recover | 4 | `9-0` P10S0, `9-1` P10S1, `9-2` P10S2, `9-3` ✉ |

---

### Phase 01 — Understand & Report

#### 01.0 Claim Overview

| Capability | Status |
|------------|--------|
| 5-stage education cards | **UI** |
| Insurer tactics warning | **UI** |
| Task chips | **UI** |
| Tool chips | **STUB** |
| Mark Complete | **LIVE** |

#### 01.1 Report the Loss

| Capability | Status |
|------------|--------|
| Form fields (DOL, cause, claim #, description) | **UI** |
| Warning: no estimates on initial call | **UI** |
| Generate Written Notice | **LIVE** → `generate-written-notice` |
| Copy letter button | **LIVE** — `copyToClipboard()` defined |
| Log to correspondence + activity | **LIVE** |

#### 01.2 ✉ Written Notice of Loss

| Capability | Status |
|------------|--------|
| 4-step wizard | **LIVE** letter via `generate-letter` on step 4 |
| Wizard steps 2–3 | **DEMO** spinners + static analysis/strategy |

---

### Phase 02 — Policy Analysis

#### 02.0 Upload Your Policy

| Capability | Status |
|------------|--------|
| PDF upload / drag-drop | **LIVE** (local or Supabase) |
| Declarations-only checkbox | **LIVE** |
| Paste clause textarea | **LIVE** |
| Load Sample Policy | **UI** — sets `rawText` + sample doc metadata |
| Analyze My Policy | **LIVE** → `policy-file-stage` + `ai-policy-review` |
| Results UI | **LIVE** — coverages, gaps, `claimData.policy.analysis` |
| Persist analysis to Supabase | **LIVE** — `claim_policy_analysis` upsert on analyze; load on `loadState` if local empty |

#### 02.1 Coverage Analysis

| Capability | Status |
|------------|--------|
| Table from `policy.analysis.coverages` | **LIVE** after analyze |
| Empty state before analyze | **UI** |
| Download Coverage Analysis PDF | **LIVE** — from `policy.analysis` coverages/gaps; empty state if not analyzed |

#### 02.2 Coverage Map

| Capability | Status |
|------------|--------|
| Cards from analysis | **LIVE** after analyze |
| Download Coverage Map PDF | **LIVE** — from `policy.analysis.coverages`; prompt to analyze if empty |

#### 02.3 ✉ Coverage Clarification Request

| Capability | Status |
|------------|--------|
| Wizard + `generate-letter` | **LIVE** |

---

### Phase 03 — Document Damage

#### 03.0 Photo Documentation

| Capability | Status |
|------------|--------|
| Multi upload `photo` | **LIVE** — count + color from `documents` filter `type==='photo'` |
| Analyze Photos with AI | **LIVE** → `analyze-photos` (up to 5 images); result in `meta.photoAnalysis` |
| Documentation tips | **UI** |

#### 03.1 Damage Inventory

| Capability | Status |
|------------|--------|
| Add items → `claimData.structureItems` | **LIVE** — separate from Phase 07 contents |
| Running total, list UI | **LIVE** |
| localStorage key | `ccc_structure_items` |
| Download Damage Inventory PDF | **LIVE** — reads `structureItems` |
| Legacy migration | **LIVE** — old damage rows in `contents.items` (room/type, no `name`) moved on load |

#### 03.2 Evidence Organizer

| Capability | Status |
|------------|--------|
| Upload `evidence` | **LIVE** |
| Doc grid from `claimData.documents` | **Partial** — often empty template |
| Tag/category select | **UI** — not persisted on items |

#### 03.3 ✉ Proof of Loss Letter

| Capability | Status |
|------------|--------|
| Wizard + `generate-letter` | **LIVE** |

---

### Phase 04 — Adjuster Inspection

#### 04.0 Pre-Inspection Prep

| Capability | Status |
|------------|--------|
| Checklist cards, never-sign warning | **UI** |

#### 04.1 Inspection Log

| Capability | Status |
|------------|--------|
| Form save | **UI** — shows saved banner; **not stored** in structured object (only activity log) |

#### 04.2 ✉ Post-Inspection Follow-Up

| Capability | Status |
|------------|--------|
| Wizard + `generate-letter` | **LIVE** |

---

### Phase 05 — Contractor Estimate

#### 05.0 Upload Contractor Estimate

| Capability | Status |
|------------|--------|
| Upload `contractor_estimate` | **LIVE** + optional `text-extract` |
| Analyze | **LIVE** → `contractor-estimate-interpreter`; sets `userEstimate` |
| `claim_outputs` insert | **LIVE** when `CCC_CLAIM_ID` |
| Error container id | **LIVE** — `showNetlifyError('ce-result', …)` |

#### 05.1 Scope Review

| Capability | Status |
|------------|--------|
| Line-item table | **DEMO** — static $68,450 / ABC Restoration |

#### 05.2 ✉ Estimate Submission Letter

| Capability | Status |
|------------|--------|
| Wizard + `generate-letter` | **LIVE** |

---

### Phase 06 — Estimate Analysis

#### 06.0 Upload Carrier Estimate

| Capability | Status |
|------------|--------|
| Upload `carrier_estimate` | **LIVE** |
| Manual carrier total input | **UI** — not wired to analyze unless in PDF text |
| Analyze | **LIVE** → `analyze-estimates-v2`; sets `insurerEstimate`, `gap` |
| Error container id | **LIVE** — `showNetlifyError('ce2-result', …)` |

#### 06.1 Line-Item Comparison

| Capability | Status |
|------------|--------|
| Header totals | **LIVE** from `claimData.structure` |
| Table rows | **DEMO** static line items |
| Download Comparison PDF | **LIVE** gap PDF uses live totals; line items static inside PDF |

#### 06.2 Gap Analysis

| Capability | Status |
|------------|--------|
| Hero underpayment | **LIVE** gap from estimates |
| Category breakdown table | **DEMO** static $/% |
| Download Gap Analysis PDF | **Mixed** — hero live, categories static |

#### 06.3 ✉ Supplement Request Letter

| Capability | Status |
|------------|--------|
| Wizard + `generate-letter` | **LIVE** |

---

### Phase 07 — Contents & ALE

#### 07.0 Contents Inventory

| Capability | Status |
|------------|--------|
| Add items (name, cat, RCV, etc.) | **LIVE** — `contents.items` only (personal property schema) |
| PDF export | **LIVE** — filters `i.name` |

#### 07.1 ALE Daily Log

| Capability | Status |
|------------|--------|
| Log expenses | **LIVE** → `claimData.ALE.entries`, updates metrics |
| PDF export | **LIVE** |

#### 07.2 ✉ Contents & ALE Demand Letter

| Capability | Status |
|------------|--------|
| Wizard (substep 2) | **LIVE** |

**Dead code:** `renderP07S2()` duplicate ALE UI — not in renderer map.

---

### Phase 08 — Demand & Dispute

#### 08.0 Build Demand Package

| Capability | Status |
|------------|--------|
| Rollup table | **LIVE** totals |
| Checklist | **DEMO** static checkmarks |
| Download Demand Package PDF | **Mixed** — totals live, checklist static |

#### 08.1 Dispute Letter Generator

| Capability | Status |
|------------|--------|
| Form + Generate | **LIVE** → `generate-letter` with dispute fields |
| Log to journal | **LIVE** — `logCorrespondence` on success + PDF download |

#### 08.2 ✉ Formal Demand Letter

| Capability | Status |
|------------|--------|
| `renderP08S2` → correspondence wizard | **LIVE** |

---

### Phase 09 — Negotiate & Escalate

#### 09.0 Negotiation Strategy

| Capability | Status |
|------------|--------|
| Calculator (min, recommended counter) | **UI** |
| Offer log | **DEMO** one static row |

#### 09.1 Escalation Options

| Capability | Status |
|------------|--------|
| Appraisal / Mediation / DOI cards | **UI** |
| Action buttons | **STUB** — alerts only |

#### 09.2 ✉ Counter-Offer/Appraisal Demand

| Capability | Status |
|------------|--------|
| Wizard + `generate-letter` | **LIVE** |

---

### Phase 10 — Close & Recover

#### 10.0 Final Offer Review

| Capability | Status |
|------------|--------|
| Analyze settlement vs documented | **UI** client-side math |

#### 10.1 RCV Recovery

| Capability | Status |
|------------|--------|
| Form + receipt upload | **UI** |
| Submit RCV | **STUB** — message only; no API |

#### 10.2 Claim Archive

| Capability | Status |
|------------|--------|
| Summary counts | **LIVE** from arrays |
| Download package PDFs | **LIVE** buttons |
| Mark claim complete | **LIVE** `markComplete()` |

#### 10.3 ✉ RCV Claim Submission Letter

| Capability | Status |
|------------|--------|
| Wizard + `generate-letter` | **LIVE** |

---

## 7. Correspondence wizard (shared)

| Step | In-flow ✉ (Full Plan) | Compose tab (Correspondence view) |
|------|------------------------|-----------------------------------|
| 1 Context | **LIVE** | **LIVE** |
| 2 Analysis | **DEMO** ~1.8s spinner + static bullets | **DEMO** ~1.5s spinner |
| 3 Strategy | **UI** card selection | **UI** |
| 4 Letter | **LIVE** `generateLetterContent` → `generate-letter` | **DEMO** 2s timeout + template |
| Copy / PDF / Word (wizard) | Copy clipboard API; PDF/Word often **STUB** alert | PDF/Word **STUB** |
| Log to Journal | **LIVE** | **LIVE** alert + `logCorrespondence` |
| Supabase `generated_letters` | **LIVE** on AI success | N/A (no AI) |

**Letter types supported in wizard select:** Written Notice, Coverage Clarification, Proof of Loss, Post-Inspection Follow-Up, Estimate Submission, Supplement Request, Contents & ALE Demand, Formal Demand, Counter-Offer, Appraisal Demand, RCV Recovery, Custom.

---

## 8. Netlify functions (v3 call sites)

| Function | Triggered from | Payload highlights | Status |
|----------|----------------|-------------------|--------|
| `policy-file-stage` | Policy upload / pre-analyze | `file_base64`, `declarations_only`, `claim_id` | **LIVE** |
| `ai-policy-review` | Analyze policy | `openai_file_id`, `policy_text`, insurer, DOL, jurisdiction | **LIVE** |
| `generate-written-notice` | Phase 01.1 | insured, claim #, insurer, DOL, description | **LIVE** |
| `contractor-estimate-interpreter` | Phase 05.0 | `estimate_text`, claim/property type | **LIVE** |
| `analyze-estimates-v2` | Phase 06.0 | `carrier_estimate_text`, contractor total | **LIVE** |
| `generate-letter` | ✉ wizard step 4, `generateLetterContent` | letter_type, financials, endorsements, phase | **LIVE** |
| `text-extract` | After Supabase upload of estimate PDFs | `storage_path`, `claim_id` | **LIVE** |
| `analyze-photos` | Phase 03.0 Analyze Photos | `photos[]`, `claim_type`, `description`, `claim_id` | **LIVE** |

All calls: `POST /.netlify/functions/{name}`, optional `Authorization`, `X-Admin-Preview`, body includes `claim_id`.

**Not called from v3:** `evaluate-escalation-status`, `generate-escalation-template`, `analyze-evidence-gaps`, `analyze-settlement`, `analyze-release`, etc. (legacy/other pages).

---

## 9. Data model & persistence

### 9.1 `claimData` (in-memory)

| Branch | Fields | Persisted |
|--------|--------|-----------|
| `initial` | insuredName, claimNumber, insurer, adjuster, DOL, propertyType, claimType, description, daysSinceLoss | localStorage + partial Supabase `claims` row on init |
| `policy` | uploaded, limits, analysis, openaiFileId, fileBase64 | localStorage + `claim_policy_analysis` JSONB |
| `structure` | insurerEstimate, userEstimate, gap, texts, analyses | localStorage + `claim_financial_summary` |
| `structureItems` | room, type, desc, val, cond — damage inventory | localStorage `ccc_structure_items` |
| `contents` | items[] (name, rcv, qty…) — personal property only | localStorage + financial `contents_total` |
| `meta` | photoAnalysis, inspectionLog, offerLog, … | localStorage (in `claimData`) |
| `ALE` | entries[], total, baseline | localStorage + financial `ale_total` |
| `documents` | upload metadata array | localStorage; DB on Supabase upload |
| `messages` | id, from, subject, date, preview, body, read | localStorage via `ccc_claim_data`; manual log only |
| `meta` | valueIdentified, documentsGenerated | localStorage |

### 9.2 localStorage keys

| Key | Content |
|-----|---------|
| `ccc_claim_data` | Serialized claimData (strips large policy base64) |
| `ccc_completed_substeps` | Map of `"phase-substep": true` |
| `ccc_completed_phases` | Array of completed phase indices |
| `ccc_current_phase` / `ccc_current_substep` | Navigation |
| `ccc_correspondence_journal` | Letter entries |
| `ccc_activity_log` | Activity array |
| `ccc_structure_items` | Damage inventory (`structureItems`) |
| `ccc_onboarded` | `"true"` |
| `ccc_policy_file_*` | sessionStorage policy cache |

### 9.3 Supabase (when `CCC_CLAIM_ID` + JWT)

| Table / bucket | Read | Write |
|----------------|------|-------|
| `claims` | Row + `custom_fields` progress | `custom_fields` on saveState |
| `claim_financial_summary` | On loadState | Upsert on saveState |
| `generated_letters` | Hydrates journal on load | Insert on letter gen |
| `claim_activity_log` | Last 50 merged on load | Upsert last 50 on saveState |
| `claim_policy_analysis` | If local analysis empty | Upsert on policy analyze |
| `claim_documents` | Merged into `claimData.documents` on load | Insert on upload |
| `claim_outputs` | No | Insert after estimate analyses |
| Storage `claim-documents` | Public URL + analyze-photos download | Upload |

---

## 10. PDF export engine

| Function | Data source | Status |
|----------|-------------|--------|
| `downloadCoverageAnalysis` | `policy.analysis` coverages/gaps | **LIVE** |
| `downloadCoverageMap` | `policy.analysis.coverages` | **LIVE** |
| `downloadGapAnalysis` | Live totals + static line/category tables | **Mixed** |
| `downloadDamageInventory` | `structureItems` | **LIVE** |
| `downloadContentsInventory` | Live contents items (`name`) | **LIVE** |
| `downloadALELog` | Live ALE entries | **LIVE** |
| `downloadDemandPackage` | Live totals + static checklist | **Mixed** |
| `downloadFinancialSummary` | Live totals + policy defaults | **Mixed** |
| `downloadLetterPDF` | Journal entry content | **LIVE** |

Shared: `pdfHeader`, `pdfFooter`, branded layout, disclaimer footer.

---

## 11. Upload & file handling

| `docType` | Max size | Allowed types | Notes |
|-----------|----------|---------------|-------|
| `policy` | 20MB | PDF, images | Staging + analyze path |
| `contractor_estimate` | 20MB | PDF, images | text-extract when Supabase |
| `carrier_estimate` | 20MB | PDF, images | text-extract when Supabase |
| `photo` | 20MB | PDF, images | |
| `evidence` | 20MB | PDF, images | |
| `supporting_document` | 20MB | PDF, images | Wizard optional |
| `rcv_receipts` | 20MB | PDF, images | |

**Policy session cap:** 3MB in sessionStorage for base64 cache.

---

## 12. Defects & technical debt (prioritized)

### Resolved (June 2026)

| ID | Issue | Resolution |
|----|-------|------------|
| B1 | Journal tab empty (ID mismatch) | `renderJournalTab` → `#journal-list` |
| B2 | `copyToClipboard` undefined | Function added |
| B3 | Estimate error container IDs | `ce-result` / `ce2-result` |
| M1 | Messages demo-only | Manual log + read modal |
| M2 | Documents view disconnected | `renderDocumentsView` + `claim_documents` load |
| M3 | Deadlines hardcoded | DOL-based `renderDeadlinesView` |
| M4 | Static Missing/Documents panels | `updateMissingPanel` / `updateDocumentsPanel` |
| M7 | Coverage PDFs hardcoded | Uses `policy.analysis` |
| M8 | Dispute letter mock | `generateDisputeLetter` → `generate-letter` |
| M9 | Onboarding estimate ignored | `ob-est-amt` in `obNext`/`obSkip` |
| D1 | Shared damage/contents array | `structureItems` + `ccc_structure_items` |
| D5 | Demo onboarding pre-fill | Cleared defaults |
| — | Activity log browser-only | `claim_activity_log` sync |
| — | Policy analysis browser-only | `claim_policy_analysis` sync |
| — | No photo AI | `analyze-photos` function + UI |

### P0 — Still broken / blocking QA

| ID | Issue |
|----|-------|
| — | *(none identified in source after June fixes)* |

### P1 — Misleading / demo in production path

| ID | Issue |
|----|-------|
| M5 | Compose tab letter step 4 does not call AI (in-flow ✉ wizards do) |
| M6 | Line-item comparison, gap categories, scope review — static tables |
| M10 | Messages not synced to Supabase (localStorage via `claimData` only) |
| M11 | Activity/policy tables require migration before Supabase sync works |

### P2 — Design / maintainability

| ID | Issue |
|----|-------|
| D2 | `renderP07S2` dead code (unwired duplicate ALE UI) |
| D3 | Progress milestones (14) vs substeps (33) inconsistent |
| D4 | Tool chips non-functional (labels only) |
| D6 | `generated_letters` reload may need journal merge QA across devices |
| D7 | Wizard PDF/Word download buttons often alert-only |
| D8 | Inspection log fields not persisted structurally (banner only) |
| D9 | `meta.photoAnalysis` not persisted to Supabase (localStorage only) |

---

## 13. QA checklist (recommended before release)

- [ ] Apply migration `20260603_ccc_activity_policy_tables.sql` on target Supabase project
- [ ] Auth redirect + paywall with/without `claim_id`
- [ ] Onboarding (`obStart`) creates claim; refresh preserves progress
- [ ] Policy upload + analyze; reload in new browser — analysis restores from `claim_policy_analysis`
- [ ] Activity log survives localStorage clear when claim_id set (Supabase merge)
- [ ] Photo upload + **Analyze Photos with AI** (≥1 image)
- [ ] Damage inventory (Phase 03) does not appear in Contents inventory (Phase 07)
- [ ] Log Incoming Message → appears in Messages view after refresh
- [ ] Each ✉ substep generates letter and appears in journal with filters
- [ ] Written notice copy button
- [ ] Contractor + carrier analyze error display in-panel
- [ ] Supabase upload + `claim_documents` visible in Documents view
- [ ] Deadlines update when DOL edited
- [ ] Financial Summary matches nav metrics after estimates
- [ ] Coverage Analysis + Coverage Map PDFs after policy analyze
- [ ] Dispute letter generates via AI
- [ ] Mobile tab bar navigation
- [ ] Admin preview mode Netlify calls (storage still disabled)
- [ ] Compose tab vs in-flow wizard parity (M5 — known gap)

---

## 14. Function index (inline script)

~95 functions including: `init`, `loadState`, `saveState`, `callNetlify`, `uploadClaimFile`, `analyzePolicyDoc`, `analyzePhotosWithAI`, `generateNotice`, `generateDisputeLetter`, `generateLetterContent`, `openLogIncomingMessage`, `saveIncomingMessage`, `updateDocumentsPanel`, `updateMissingPanel`, `editClaimInfo`, `renderWizardStep`, all `renderP**`, all `render*View`, all `download*`, `logActivity`, `logCorrespondence`, `markComplete`, `showView`, `obStart`, `obSkip`, etc.

**Entry point:** `window.addEventListener('load', init);`

---

## 15. Infrastructure implementation reference (`56da569a`)

| Issue | Tables / functions | Client hooks |
|-------|-------------------|--------------|
| Activity log sync | `claim_activity_log` | `saveState` upsert; `loadState` merge |
| Policy analysis persist | `claim_policy_analysis` | `analyzePolicyDoc` upsert; `loadState` restore |
| Photo AI | `analyze-photos.js` | `renderP03S0`, `analyzePhotosWithAI`, `meta.photoAnalysis` |
| Manual messages | — (local `messages[]`) | `openLogIncomingMessage`, `saveIncomingMessage` |
| Structure inventory | `ccc_structure_items` | `structureItems`, Phase 03 only |

**Git:** `main` @ `56da569a` (June 2026)

---

*End of v3-only audit (updated post-infrastructure fixes).*
