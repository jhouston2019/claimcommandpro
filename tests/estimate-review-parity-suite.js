/**
 * ESTIMATE REVIEW PARITY SUITE
 * Unified runner comparing Claim Command Pro vs Estimate Review Pro capabilities.
 *
 * Usage: node tests/estimate-review-parity-suite.js [--verbose] [--skip-parser]
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

const SUITES = [
  {
    id: 'engine-parity',
    name: 'Canonical Engine Parity (estimate-engine.js)',
    erpEquivalent: 'estimate-lineitem-analyzer + estimate-risk-guardrails + estimate-classifier',
    file: 'tests/estimate-engine-parity-test.js',
    tier: 'P0',
    blocksRelease: true
  },
  {
    id: 'functional-parity',
    name: 'Functional Parity Audit (16 scenarios)',
    erpEquivalent: 'Wizard analyze-estimate safety + classification behavior',
    file: 'tests/estimate-functional-parity-audit.js',
    tier: 'P0',
    blocksRelease: true
  },
  {
    id: 'delta-engine',
    name: 'Estimate Delta Engine (structural comparison)',
    erpEquivalent: 'compare-estimates version diff + local fallback',
    file: 'tests/estimate-delta-engine-test.js',
    tier: 'P1',
    blocksRelease: false
  },
  {
    id: 'parser-pipeline',
    name: 'Deterministic Parser → Matcher → Reconciler',
    erpEquivalent: 'xactimate-parser + compare-estimates LINE_COMPARE',
    file: 'tests/estimate-parser.test.js',
    tier: 'P1',
    blocksRelease: false,
    skipFlag: '--skip-parser'
  },
  {
    id: 'line-compare',
    name: 'LINE_COMPARE Engine (fixture pair)',
    erpEquivalent: 'compare-estimates LINE_COMPARE',
    file: 'tests/estimate-comparison-engine.test.js',
    tier: 'P0',
    blocksRelease: true
  },
  {
    id: 'intelligence-pipeline',
    name: 'Intelligence Engines (loss/trade/code/labor)',
    erpEquivalent: 'claimIntelligencePipeline engines 1–7',
    file: 'tests/comprehensive-pipeline-test.js',
    tier: 'P1',
    blocksRelease: false
  },
  {
    id: 'rcv-acv',
    name: 'RCV/ACV Extraction',
    erpEquivalent: 'Xactimate RCV/ACV pairing',
    file: 'tests/rcv-acv-extraction.test.js',
    tier: 'P2',
    blocksRelease: false
  }
];

const ERP_ONLY_GAPS = [
  {
    feature: '6-step wizard (upload → analysis → comparison → strategy → summary → letter)',
    ccpPath: 'claim-command-center-v3.html Phases 05–06 + generate-letter',
    status: 'PARTIAL',
    notes: 'CCP has upload/analyze/gap/letters but no dedicated strategy step or deliverables hub'
  },
  {
    feature: 'compare-estimates LINE_COMPARE (carrier text vs contractor text)',
    ccpPath: 'analyze-estimates-v2 → estimate-comparison-engine',
    status: 'PARITY',
    notes: 'Deterministic LINE_COMPARE wired; V3 passes contractor text + line items'
  },
  {
    feature: 'compare-estimates RECON_VS_CARRIER (fair-market reconstruction)',
    ccpPath: '—',
    status: 'MISSING',
    notes: 'No scope reconstruction mode in V3 production path'
  },
  {
    feature: '12-engine deterministic intelligence pipeline',
    ccpPath: 'estimate-comparison-engine + ai-estimate-comparison',
    status: 'PARTIAL',
    notes: 'Loss/trade/scope engines in V3 path; full 12-engine stack still in L3 tools only'
  },
  {
    feature: 'Founder scenario (geometry + engineering report deviation)',
    ccpPath: '—',
    status: 'MISSING',
    notes: 'ERP has room-aware deviation engine; CCP has no equivalent test'
  },
  {
    feature: 'Multi-format export (Negotiation/Pushback/Appraisal/FULL ZIP)',
    ccpPath: 'downloadGapAnalysis PDF only',
    status: 'PARTIAL',
    notes: 'CCP exports gap PDF; ERP has 4 report templates + DOCX'
  },
  {
    feature: 'OCR / vision PDF extraction',
    ccpPath: 'text-extract',
    status: 'PARTIAL',
    notes: 'CCP uses pdf-parse; ERP has vision OCR fallback'
  },
  {
    feature: 'Per-category multi-document analysis',
    ccpPath: '—',
    status: 'MISSING',
    notes: 'ERP analyzes Building/Contents/ALE separately'
  }
];

function parseArgs(argv) {
  return {
    verbose: argv.includes('--verbose'),
    skipParser: argv.includes('--skip-parser')
  };
}

function runSuite(suite) {
  const filePath = path.join(ROOT, suite.file);
  if (!fs.existsSync(filePath)) {
    return { id: suite.id, status: 'SKIP', reason: 'File not found', durationMs: 0 };
  }

  const start = Date.now();
  const result = spawnSync('node', [filePath], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 120000
  });
  const durationMs = Date.now() - start;
  const output = (result.stdout || '') + (result.stderr || '');
  const passed = result.status === 0;

  return {
    id: suite.id,
    name: suite.name,
    status: passed ? 'PASS' : 'FAIL',
    exitCode: result.status,
    durationMs,
    output: output.trim()
  };
}

function printGapMatrix() {
  console.log('\n' + '─'.repeat(80));
  console.log('ERP FEATURE PARITY MATRIX (manual / integration gaps)');
  console.log('─'.repeat(80));
  console.log('');
  console.log('| Feature | CCP Path | Status |');
  console.log('|---------|----------|--------|');
  for (const gap of ERP_ONLY_GAPS) {
    console.log(`| ${gap.feature} | ${gap.ccpPath} | **${gap.status}** |`);
  }
  console.log('');
  for (const gap of ERP_ONLY_GAPS) {
    console.log(`  • ${gap.feature}: ${gap.notes}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  CLAIM COMMAND PRO — ESTIMATE REVIEW PARITY SUITE vs ESTIMATE REVIEW PRO      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  const results = [];
  let p0Failures = 0;
  let totalFailures = 0;

  for (const suite of SUITES) {
    if (args.skipParser && suite.skipFlag === '--skip-parser') {
      console.log(`⏭  SKIP  ${suite.name}`);
      results.push({ id: suite.id, status: 'SKIP', reason: '--skip-parser' });
      continue;
    }

    process.stdout.write(`▶  RUN   ${suite.name} ... `);
    const result = runSuite(suite);
    results.push(result);

    if (result.status === 'PASS') {
      console.log(`✅ PASS (${result.durationMs}ms)`);
    } else if (result.status === 'SKIP') {
      console.log(`⏭  SKIP (${result.reason})`);
    } else {
      console.log(`❌ FAIL (exit ${result.exitCode}, ${result.durationMs}ms)`);
      totalFailures++;
      if (suite.tier === 'P0') p0Failures++;
      if (args.verbose && result.output) {
        console.log('\n' + result.output.split('\n').slice(-30).join('\n') + '\n');
      }
    }
  }

  printGapMatrix();

  console.log('\n' + '═'.repeat(80));
  console.log('SUITE SUMMARY');
  console.log('═'.repeat(80));
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;
  console.log(`  Automated suites: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log(`  P0 blockers:      ${p0Failures}`);

  if (p0Failures === 0 && failed === 0) {
    console.log('\n  ✅ All automated parity tests passed.');
    console.log('  ⚠  Review ERP gap matrix above for V3 integration / E2E items still needed.\n');
    process.exit(0);
  }

  if (p0Failures === 0) {
    console.log('\n  ⚠  P0 engine parity OK; P1/P2 suites have failures (parser or intelligence pipeline).');
    console.log('  See docs/ESTIMATE_REVIEW_PARITY_TEST_PLAN.md for manual V3 E2E steps.\n');
    process.exit(1);
  }

  console.log('\n  ❌ P0 parity failures — canonical engine does not match ERP behavior.\n');
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { SUITES, ERP_ONLY_GAPS, runSuite };
