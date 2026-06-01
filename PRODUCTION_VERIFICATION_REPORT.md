# Production Verification Report

**Date:** 2026-06-01  
**Target:** `https://bnxvfxtpsxgfpltflyrr.supabase.co` (via production `get-supabase-config` on claimcommandpro.com)  
**Method:** Live PostgREST probes with production anon key — column existence, type filter errors, HEAD row counts, insert existence tests  
**Deliverable 1 reference:** Reconstructed schema from migrations + `20260530_fix_schema_mismatches.sql` (not live-verified at time of D1)

---

## Executive Verdict

| D1 assumption | Live result |
|---------------|-------------|
| `claim_policy_coverage` exists (CCC Variant A + intelligence ALTER) | **DISPROVEN** — table does not exist |
| `claim_policy_triggers` exists with full Variant B + intelligence columns | **DISPROVEN** — table exists but **7 columns only** |
| `claim_outputs` uses `content` (post-20260530 rename) | **CONFIRMED** — `content` present, `output_json` absent |
| `claim_outputs` has extended CCC columns (`input_document_ids`, `ai_model`, …) | **DISPROVEN** — all absent |
| `claim_documents` matches CCC + 20260530 (`file_path`, `extracted_text`, `user_id`, …) | **PARTIALLY DISPROVEN** — has `file_path`/`extracted_text`; **no** `user_id`, `file_url`, `storage_path`, etc. |
| `policy_summaries` exists | **DISPROVEN** — table does not exist |
| `free_policy_reviews` exists | **DISPROVEN** — table does not exist |
| Production has policy/coverage data in normalized tables | **DISPROVEN** for coverage (table missing); triggers **0 rows visible** |
| `policy_summaries` inserts succeed | **DISPROVEN** — PostgREST 404 (table missing) |

**Bottom line:** Production schema is **much sparser** than Deliverable 1 assumed. Three of six target tables **do not exist**. The two tables that do exist for policy outputs/documents diverge significantly from the reconstructed D1 model.

---

## Verification Method & Limits

### What was verified live

1. Table existence via PostgREST (`404 PGRST205` = not in schema cache)
2. Column existence via `?select=<column>&limit=0` (200 = column exists, 400/404 = absent or invalid)
3. Column types via invalid filter values (PostgreSQL cast error messages)
4. Row counts via `Prefer: count=exact` HEAD requests
5. Insert probes for missing tables (`policy_summaries`, `free_policy_reviews`)
6. `content` vs `output_json` on `claim_outputs`

### What could NOT be verified (blocker)

**Indexes, constraints, nullability, defaults, and authoritative row counts** require `information_schema` or `pg_catalog` access via **service role** or Supabase SQL Editor. No `SUPABASE_SERVICE_ROLE_KEY` was available locally; Netlify CLI is not logged in; OpenAPI introspection endpoint requires service role.

Sections below mark index/constraint data as **NOT OBTAINED** rather than inferred from migrations.

### Row count caveat

Counts below are **RLS-visible to unauthenticated anon**. `*/0` may mean truly empty **or** rows hidden by RLS. Service role count is required for definitive production row totals.

---

## 1. `claim_policy_coverage`

### Table status

| Property | Production truth |
|----------|------------------|
| **Exists** | **NO** |
| **PostgREST error** | `PGRST205 — Could not find the table 'public.claim_policy_coverage' in the schema cache` |
| **RLS-visible row count** | N/A |

### D1 assumption vs production

| D1 claim | Verdict |
|----------|---------|
| Table exists with ~30+ columns (CCC Variant A + intelligence ALTER) | **DISPROVEN** |
| FK to `claims`, UNIQUE on `claim_id` | **NOT OBTAINED** (table absent) |
| Indexes `idx_claim_policy_coverage_claim_id`, etc. | **NOT OBTAINED** (table absent) |
| Contains production policy data | **NO** — table does not exist; **zero rows possible** |

### Columns

**Actual columns:** none (table absent)

**D1 expected columns (sample):** `dwelling_limit`, `deductible_amount`, `settlement_type`, `exclusions`, intelligence ALTER columns — **none deployed**

### Production data check

**Does `claim_policy_coverage` contain production data?**  
**NO.** The table is not present. Any code calling `.from('claim_policy_coverage')` (`analyze-policy.js`, `generate-demand-letter.js`, `supplement-builder.js`, `evaluate-escalation-status.js`) will fail at runtime against this database.

---

## 2. `claim_policy_triggers`

### Table status

| Property | Production truth |
|----------|------------------|
| **Exists** | **YES** |
| **RLS-visible row count** | **0** (`Content-Range: */0`) |

### Actual columns (verified)

| Column | Inferred type (live) | D1 expected | Match? |
|--------|---------------------|-------------|--------|
| `id` | UUID | UUID PK | Partial |
| `claim_id` | (exists; type not probed) | UUID FK | Partial |
| `ordinance_trigger` | BOOLEAN | BOOLEAN | Yes |
| `ordinance_trigger_amount` | NUMERIC | NUMERIC(12,2) | Yes (precision not verified) |
| `matching_trigger` | (exists; type not probed) | BOOLEAN | Partial |
| `created_at` | TIMESTAMPTZ | TIMESTAMPTZ | Yes |
| `updated_at` | TIMESTAMPTZ | TIMESTAMPTZ | Yes |

### Columns D1 expected but **absent in production**

- `user_id`
- `policy_coverage_id`
- `ordinance_trigger_note`, `matching_trigger_note`
- `depreciation_trigger`, `depreciation_trigger_note`
- `sublimit_trigger`, `sublimit_trigger_type`, `sublimit_trigger_amount`, `sublimit_trigger_note`
- `settlement_type_trigger`, `settlement_type_trigger_note`
- `triggers_calculated_at`
- `coinsurance_penalty_trigger` (intelligence ALTER)

### Indexes — NOT OBTAINED

D1 expected: `idx_policy_triggers_claim_id`  
Cannot confirm without `information_schema` / `pg_indexes`.

### Constraints — NOT OBTAINED

D1 expected: FK `claim_id` → `claims`, FK `policy_coverage_id` → `claim_policy_coverage`, RLS on `user_id`  
Note: `user_id` column is **absent**, so D1 RLS model cannot match production.

### Production data check

**Does `claim_policy_triggers` contain production data?**  
**No rows visible** to anon (count 0). No sample rows returned (`select=* limit 1` → `[]`).  
Cannot rule out RLS-hidden rows without service role; **likely empty** given minimal schema and no writers besides mock `analyze-policy-v2.js`.

---

## 3. `claim_outputs`

### Table status

| Property | Production truth |
|----------|------------------|
| **Exists** | **YES** |
| **RLS-visible row count** | **0** (`Content-Range: */0`) |

### `content` vs `output_json`

| Column | Present | Verdict |
|--------|---------|---------|
| `content` | **YES** | Production uses this column |
| `output_json` | **NO** | Absent — rename (20260530) applied **or** table never had `output_json` |

**D1 assumption:** post-20260530 production uses `content`. **CONFIRMED.**

Legacy writers still using `output_json` (`analyze-policy.js`, `detect-coverage-gaps.js`, etc.) **will fail** column-not-found errors against this schema.

### Actual columns (verified)

| Column | Inferred type (live) | D1 expected | Match? |
|--------|---------------------|-------------|--------|
| `id` | UUID | UUID PK | Yes |
| `claim_id` | (exists) | UUID FK NOT NULL | Partial |
| `user_id` | (exists) | UUID, nullable after 20260530 | Column exists; nullability **NOT OBTAINED** |
| `step_number` | INTEGER | INTEGER, nullable after 20260530 | Column exists; nullability **NOT OBTAINED** |
| `output_type` | TEXT | TEXT + CHECK constraint | Column exists; CHECK list **NOT OBTAINED** |
| `content` | JSON | JSONB NOT NULL | Yes (JSONB inferred) |
| `created_at` | TIMESTAMPTZ | TIMESTAMPTZ | Yes |

### Columns D1 expected but **absent**

- `output_json`
- `input_document_ids`
- `ai_model`
- `processing_time_ms`
- `updated_at`

### Indexes — NOT OBTAINED

D1 expected (if 20260530 ran):

- `idx_claim_outputs_claim_id`, `idx_claim_outputs_user_id`, `idx_claim_outputs_type`, `idx_claim_outputs_step`
- `idx_claim_outputs_content` (GIN on `content`)

Cannot confirm. Old index `idx_claim_outputs_json` on `output_json` cannot exist (column absent).

### Constraints — NOT OBTAINED

D1 expected:

- `output_type` CHECK including `policy_analysis`, `contractor_estimate_analysis`, …
- FK `claim_id` → `claims`
- RLS policies

Insert probe with anon key returned **RLS violation** (not CHECK violation), so constraint list remains unverified:

```json
{"code":"42501","message":"new row violates row-level security policy for table \"claim_outputs\""}
```

---

## 4. `claim_documents`

### Table status

| Property | Production truth |
|----------|------------------|
| **Exists** | **YES** |
| **RLS-visible row count** | **0** (`Content-Range: */0`) |

### Actual columns (verified)

| Column | Inferred type (live) | D1 expected | Match? |
|--------|---------------------|-------------|--------|
| `id` | UUID | UUID PK | Yes |
| `claim_id` | (exists) | UUID FK | Partial |
| `document_type` | (exists) | TEXT + CHECK | Column exists; CHECK **NOT OBTAINED** |
| `file_name` | (exists) | TEXT NOT NULL | Partial |
| `file_size` | INTEGER | INTEGER | Yes |
| `file_path` | (exists) | TEXT (20260530) | Yes |
| `extracted_text` | TEXT | TEXT (20260530) | Yes |
| `file_type` | (exists) | **Not in D1** | Extra column in production |
| `uploaded_at` | (exists) | TIMESTAMPTZ | Partial |
| `created_at` | TIMESTAMPTZ | TIMESTAMPTZ | Yes |

### Columns D1 expected but **absent**

- `user_id`
- `file_url`
- `mime_type`
- `storage_path`
- `step_number`
- `description`
- `updated_at`

### Indexes — NOT OBTAINED

D1 expected: `idx_claim_documents_claim_id`, `idx_claim_documents_user_id`, `idx_claim_documents_type`, `idx_claim_documents_step`

### Constraints — NOT OBTAINED

D1 expected: `document_type` CHECK enum, FK to `claims`, RLS on `user_id`  
Note: **`user_id` absent** — RLS model from CCC migration does not match production column set.

---

## 5. `policy_summaries`

### Table status

| Property | Production truth |
|----------|------------------|
| **Exists** | **NO** |
| **PostgREST error** | `PGRST205 — Could not find the table 'public.policy_summaries' in the schema cache` |
| **RLS-visible row count** | N/A |

### Insert probe

| Test | Result |
|------|--------|
| `POST /policy_summaries` with `{ user_id, summary_json }` | **404 PGRST205** — table not found |

**Do `policy_summaries` inserts succeed?**  
**NO.** Inserts cannot succeed; the table is not deployed. Writers (`claim-analysis-policy-review.js`, `coverage-decoder.js`, `ai-coverage-decoder.js` path) will fail.

### D1 assumption vs production

| D1 claim | Verdict |
|----------|---------|
| Table exists per `schema-phase4-saas.sql` | **DISPROVEN** |
| Columns: `id`, `user_id`, `raw_policy_url`, `summary_json`, timestamps | **N/A** — table absent |
| Code writes `raw_policy_text`, `metadata` (extra columns) | **Moot** — table absent |
| Indexes on `user_id`, `created_at` | **NOT OBTAINED** (table absent) |

---

## 6. `free_policy_reviews`

### Table status

| Property | Production truth |
|----------|------------------|
| **Exists** | **NO** |
| **PostgREST error** | `PGRST205 — Could not find the table 'public.free_policy_reviews' in the schema cache` |
| **RLS-visible row count** | N/A |

### Insert probe

| Test | Result |
|------|--------|
| `POST /free_policy_reviews` with `{ email, analysis_result }` | **404 PGRST205** — table not found |

### D1 assumption vs production

| D1 claim | Verdict |
|----------|---------|
| Table exists per `20260226_free_policy_reviews.sql` | **DISPROVEN** — migration not applied to this Supabase project |
| Columns: `email`, `client_ip`, `policy_type`, `jurisdiction`, `analysis_result`, `duration_ms` | **N/A** |
| Indexes on `email`, `(client_ip, created_at)`, `created_at` | **NOT OBTAINED** (table absent) |

**Impact:** `ai-policy-review-free.js` persistence and 1-per-email dedup **cannot work** against this database unless errors are swallowed.

---

## Cross-Cutting Findings

### Missing RPC / intelligence layer

These functions from repo migrations **do not exist** in production (PostgREST 404):

- `calculate_total_coverage`
- `has_ordinance_coverage`
- `get_coverage_limit`
- `exec_sql`

Confirms policy intelligence migration bundle was **not fully applied**.

### Other absent tables (context)

Also return `PGRST205` when probed: `claim_policy_analysis`, `policy_analyses`, `claim_policy_data`, `payments` (referenced in D1 downstream paths).

### Evidence `20260530_fix_schema_mismatches.sql` partially applied

| 20260530 change | Production evidence |
|-----------------|---------------------|
| Rename `output_json` → `content` | **Yes** — `content` exists, `output_json` absent |
| Add `extracted_text`, `file_path` on `claim_documents` | **Yes** — both present |
| Relax `user_id` / `step_number` nullability on `claim_outputs` | **NOT OBTAINED** (columns still exist) |
| Expand `output_type` CHECK | **NOT OBTAINED** |
| GIN index on `content` | **NOT OBTAINED** |
| `claim_policy_coverage` / triggers / free tier tables | **Not created by this migration** |

---

## Deliverable 1 Assumption Scorecard

| # | D1 assumption | Production truth | Status |
|---|---------------|------------------|--------|
| 1 | `claim_policy_coverage` = CCC A + intelligence ALTER | Table **missing** | **DISPROVEN** |
| 2 | `claim_policy_triggers` = full Variant B + intelligence | **7 columns only** | **DISPROVEN** |
| 3 | `claim_outputs.content` is canonical JSON column | `content` yes, `output_json` no | **CONFIRMED** |
| 4 | `claim_outputs` retains CCC extension columns | `input_document_ids`, `ai_model`, `updated_at` **absent** | **DISPROVEN** |
| 5 | `claim_documents` has `user_id`, dual path fields | **`user_id` absent**; `file_path` yes; `storage_path` no | **PARTIALLY DISPROVEN** |
| 6 | `policy_summaries` deployed | Table **missing** | **DISPROVEN** |
| 7 | `free_policy_reviews` deployed | Table **missing** | **DISPROVEN** |
| 8 | Coverage table holds production policy data | Table absent | **DISPROVEN** |
| 9 | Triggers table holds production data | 0 rows visible | **LIKELY NO** (unconfirmed via service role) |
| 10 | `policy_summaries` inserts succeed | 404 on insert | **DISPROVEN** |

---

## Indexes & Constraints Summary

| Table | Indexes verified | Constraints verified |
|-------|------------------|----------------------|
| `claim_policy_coverage` | N/A (missing) | N/A (missing) |
| `claim_policy_triggers` | **NOT OBTAINED** | **NOT OBTAINED** |
| `claim_outputs` | **NOT OBTAINED** | **NOT OBTAINED** (RLS confirmed active) |
| `claim_documents` | **NOT OBTAINED** | **NOT OBTAINED** |
| `policy_summaries` | N/A (missing) | N/A (missing) |
| `free_policy_reviews` | N/A (missing) | N/A (missing) |

---

## Row Count Summary

| Table | RLS-visible count (anon) | Authoritative count |
|-------|--------------------------|---------------------|
| `claim_policy_coverage` | N/A | N/A (table missing) |
| `claim_policy_triggers` | **0** | **NOT OBTAINED** (service role required) |
| `claim_outputs` | **0** | **NOT OBTAINED** |
| `claim_documents` | **0** | **NOT OBTAINED** |
| `policy_summaries` | N/A | N/A (table missing) |
| `free_policy_reviews` | N/A | N/A (table missing) |

---

## Reproducibility

Probe script and raw JSON output:

- `_cursor/reports/verify-production-schema.js`
- `_cursor/reports/production-schema-probe.json`

Re-run:

```bash
node _cursor/reports/verify-production-schema.js
```

To complete index/constraint/nullability verification, run against production with service role:

```sql
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'claim_policy_coverage','claim_policy_triggers','claim_outputs',
    'claim_documents','policy_summaries','free_policy_reviews'
  )
ORDER BY table_name, ordinal_position;

SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'claim_policy_triggers','claim_outputs','claim_documents'
  );

SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid IN (
  SELECT oid FROM pg_class
  WHERE relnamespace = 'public'::regnamespace
    AND relname IN ('claim_policy_triggers','claim_outputs','claim_documents')
);

SELECT relname, n_live_tup
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN (
    'claim_policy_coverage','claim_policy_triggers','claim_outputs',
    'claim_documents','policy_summaries','free_policy_reviews'
  );
```

---

## Conclusion

Deliverable 1 reconstructed production schema from migration collision analysis. **Live verification disproves most of that model.**

Production at `bnxvfxtpsxgfpltflyrr.supabase.co` currently has:

- **No** `claim_policy_coverage`
- **No** `policy_summaries`
- **No** `free_policy_reviews`
- A **minimal** `claim_policy_triggers` (7 columns, 0 visible rows)
- A **trimmed** `claim_outputs` using **`content`** (not `output_json`) without several CCC extension columns
- A **trimmed** `claim_documents` with `file_path`/`extracted_text` but without `user_id` and several CCC columns

The only D1 assumption strongly confirmed is **`claim_outputs` uses `content`**. Everything else material to Policy Review persistence is wrong, missing, or unverified at the index/constraint level.

**Rebuild planning must treat this report as authoritative over Deliverable 1** until a service-role SQL pull completes the NOT OBTAINED sections.
