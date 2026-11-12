#!/usr/bin/env node
/**
 * Production schema verification via PostgREST (anon key).
 * Read-only probes — no inserts except policy_summaries existence test.
 */

const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (r) => {
        let d = '';
        r.on('data', (c) => (d += c));
        r.on('end', () => resolve({ status: r.statusCode, body: d }));
      })
      .on('error', reject);
  });
}

async function main() {
  const cfg = JSON.parse(
    (await get('https://claimcommandpro.com/.netlify/functions/get-supabase-config')).body
  );
  const base = cfg.SUPABASE_URL + '/rest/v1';
  const anon = cfg.SUPABASE_ANON_KEY;
  const authHeaders = { apikey: anon, Authorization: 'Bearer ' + anon };
  const countHeaders = { ...authHeaders, Prefer: 'count=exact' };

  const tables = {
    claim_policy_coverage: [
      'id', 'claim_id', 'user_id', 'output_id', 'dwelling_limit', 'contents_limit', 'ale_limit',
      'ordinance_law_limit', 'deductible_amount', 'deductible_type', 'settlement_type',
      'ordinance_law_coverage', 'code_upgrade_coverage', 'matching_coverage', 'exclusions',
      'limitations', 'endorsements', 'risk_notes', 'extracted_at', 'created_at', 'updated_at',
      'policy_type', 'form_numbers', 'coinsurance_percent', 'other_structures_limit', 'deductible',
      'ordinance_law_percent', 'matching_endorsement', 'raw_policy_text_hash', 'parsed_by',
    ],
    claim_policy_triggers: [
      'id', 'claim_id', 'user_id', 'policy_coverage_id', 'ordinance_trigger',
      'ordinance_trigger_amount', 'ordinance_trigger_note', 'matching_trigger',
      'matching_trigger_note', 'depreciation_trigger', 'depreciation_trigger_note',
      'sublimit_trigger', 'sublimit_trigger_type', 'sublimit_trigger_amount',
      'sublimit_trigger_note', 'settlement_type_trigger', 'settlement_type_trigger_note',
      'triggers_calculated_at', 'coinsurance_penalty_trigger', 'created_at', 'updated_at',
    ],
    claim_outputs: [
      'id', 'claim_id', 'user_id', 'step_number', 'output_type', 'content', 'output_json',
      'input_document_ids', 'ai_model', 'processing_time_ms', 'created_at', 'updated_at',
    ],
    claim_documents: [
      'id', 'claim_id', 'user_id', 'document_type', 'file_name', 'file_url', 'file_size',
      'mime_type', 'storage_path', 'file_path', 'extracted_text', 'step_number', 'description',
      'file_type', 'uploaded_at', 'created_at', 'updated_at',
    ],
    policy_summaries: [
      'id', 'user_id', 'raw_policy_url', 'raw_policy_text', 'summary_json', 'metadata',
      'created_at', 'updated_at',
    ],
    free_policy_reviews: [
      'id', 'email', 'client_ip', 'policy_type', 'jurisdiction', 'analysis_result',
      'duration_ms', 'created_at',
    ],
  };

  async function colExists(table, col) {
    const r = await fetch(
      `${base}/${table}?select=${encodeURIComponent(col)}&limit=0`,
      { headers: authHeaders }
    );
    return r.status;
  }

  async function headCount(table) {
    const r = await fetch(`${base}/${table}?select=id&limit=0`, { headers: countHeaders });
    const cr = r.headers.get('content-range') || '';
    const m = cr.match(/\/(\d+)$/);
    return { status: r.status, contentRange: cr, count: m ? m[1] : 'N/A' };
  }

  async function inferType(table, col, badValue) {
    const r = await fetch(
      `${base}/${table}?${col}=eq.${encodeURIComponent(badValue)}&limit=0`,
      { headers: authHeaders }
    );
    const text = await r.text();
    return { status: r.status, body: text.slice(0, 300) };
  }

  const out = {
    verified_at: new Date().toISOString(),
    supabase_url: cfg.SUPABASE_URL,
    method: 'PostgREST anon key — column probe, HEAD count, type filter errors',
    limitations: [
      'Indexes and constraints require service_role + information_schema (not available)',
      'Row counts may be 0 due to RLS when unauthenticated',
    ],
  };

  for (const [table, cols] of Object.entries(tables)) {
    const head = await headCount(table);
    out[table] = {
      table_exists: head.status !== 404,
      row_count_rls_visible: head.count,
      content_range: head.contentRange,
      present_columns: [],
      absent_columns: [],
    };
    if (head.status === 404) {
      out[table].postgrest_error = 'PGRST205 — table not in schema cache';
      continue;
    }
    for (const c of cols) {
      if ((await colExists(table, c)) === 200) out[table].present_columns.push(c);
      else out[table].absent_columns.push(c);
    }
    const sample = await fetch(`${base}/${table}?select=*&limit=1`, { headers: authHeaders });
    if (sample.status === 200) {
      out[table].sample_rows = JSON.parse(await sample.text());
    }
  }

  // Type inference via bad filter values
  if (out.claim_outputs?.table_exists) {
    out.claim_outputs.type_inference = {};
    for (const [col, bad] of [
      ['id', 'not-a-uuid'],
      ['content', 'not-json'],
      ['step_number', 'not-int'],
      ['created_at', 'not-a-date'],
      ['output_type', 'x'],
    ]) {
      if (out.claim_outputs.present_columns.includes(col)) {
        out.claim_outputs.type_inference[col] = await inferType('claim_outputs', col, bad);
      }
    }
  }

  if (out.claim_policy_triggers?.table_exists) {
    out.claim_policy_triggers.type_inference = {};
    for (const [col, bad] of [
      ['id', 'not-a-uuid'],
      ['ordinance_trigger', 'not-bool'],
      ['ordinance_trigger_amount', 'not-num'],
      ['created_at', 'not-a-date'],
    ]) {
      if (out.claim_policy_triggers.present_columns.includes(col)) {
        out.claim_policy_triggers.type_inference[col] = await inferType(
          'claim_policy_triggers',
          col,
          bad
        );
      }
    }
  }

  if (out.claim_documents?.table_exists) {
    out.claim_documents.type_inference = {};
    for (const [col, bad] of [
      ['id', 'not-a-uuid'],
      ['file_size', 'not-int'],
      ['extracted_text', 'eq.x'],
      ['created_at', 'not-a-date'],
    ]) {
      if (out.claim_documents.present_columns.includes(col)) {
        out.claim_documents.type_inference[col] = await inferType('claim_documents', col, bad);
      }
    }
  }

  // policy_summaries insert probe (confirms table missing vs RLS)
  const psInsert = await fetch(`${base}/policy_summaries`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({
      user_id: '00000000-0000-0000-0000-000000000001',
      summary_json: {},
    }),
  });
  out.policy_summaries_insert_probe = {
    status: psInsert.status,
    body: (await psInsert.text()).slice(0, 400),
  };

  // free_policy_reviews insert probe
  const fprInsert = await fetch(`${base}/free_policy_reviews`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ email: 'probe@test.invalid', analysis_result: {} }),
  });
  out.free_policy_reviews_insert_probe = {
    status: fprInsert.status,
    body: (await fprInsert.text()).slice(0, 400),
  };

  // claim_policy_coverage REST probe
  const cpc = await fetch(`${base}/claim_policy_coverage?select=id&limit=0`, {
    headers: countHeaders,
  });
  out.claim_policy_coverage_rest = {
    status: cpc.status,
    body: (await cpc.text()).slice(0, 300),
    contentRange: cpc.headers.get('content-range'),
  };

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
