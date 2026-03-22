/**
 * Generates app/admin/site-index.html — searchable list of all site HTML pages.
 * Run: node scripts/generate-site-index.mjs
 */
import { readdir } from 'fs/promises';
import { join, relative, sep } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

const SKIP_DIR_NAMES = new Set(['node_modules', '.git', 'dist', '.next']);
const SKIP_PATH_SUBSTR = ['backup-phase3-before-delete', '.backup'];

function shouldSkipDir(name) {
  return SKIP_DIR_NAMES.has(name) || name.startsWith('.');
}

function shouldSkipFile(relPath) {
  const n = relPath.replace(/\\/g, '/');
  return SKIP_PATH_SUBSTR.some((s) => n.includes(s));
}

async function* walkHtml(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (shouldSkipDir(e.name)) continue;
      yield* walkHtml(p);
    } else if (e.isFile() && e.name.endsWith('.html')) {
      const rel = relative(ROOT, p).split(sep).join('/');
      if (!shouldSkipFile(rel)) yield rel;
    }
  }
}

function toUrlPath(rel) {
  return '/' + rel.split('/').map(encodeURIComponent).join('/');
}

async function main() {
  const files = [];
  for await (const rel of walkHtml(ROOT)) {
    files.push(rel);
  }
  files.sort((a, b) => a.localeCompare(b, 'en'));

  const bySection = new Map();
  for (const f of files) {
    const parts = f.split('/');
    const seg = parts.length === 1 ? '(root)' : parts[0];
    if (!bySection.has(seg)) bySection.set(seg, []);
    bySection.get(seg).push(f);
  }

  const sections = [...bySection.keys()].sort((a, b) => a.localeCompare(b, 'en'));

  let sectionHtml = '';
  for (const sec of sections) {
    const list = bySection.get(sec);
    const items = list
      .map((rel) => {
        const href = toUrlPath(rel);
        const label = rel;
        return `<li data-label="${escapeAttr(label.toLowerCase())}"><a href="${href}">${escapeHtml(label)}</a></li>`;
      })
      .join('\n');
    sectionHtml += `
      <section class="site-index-section" data-section="${escapeAttr(sec.toLowerCase())}">
        <h2 class="site-index-h2">${escapeHtml(sec)} <span class="site-index-count">${list.length}</span></h2>
        <ul class="site-index-list">${items}</ul>
      </section>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Full site index — Admin</title>
  <link rel="stylesheet" href="/app/assets/css/style.css">
  <link rel="stylesheet" href="/app/assets/css/design-system.css">
  <link rel="stylesheet" href="/app/assets/css/tool-visual-alignment.css">
  <link rel="stylesheet" href="/app/assets/css/admin-hub.css">
  <style>
    .site-index-wrap { max-width: 900px; margin: 0 auto 2rem; }
    .site-index-wrap input {
      width: 100%; padding: 0.75rem 1rem; font-size: 1rem; border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.2); background: rgba(15,23,42,0.8); color: #f8fafc;
      box-sizing: border-box;
    }
    .site-index-wrap .hint { font-size: 0.85rem; color: rgba(255,255,255,0.45); margin: 0.5rem 0 0 0; }
    .site-index-meta { color: rgba(255,255,255,0.55); margin-bottom: 1.5rem; font-size: 0.95rem; }
    .site-index-h2 { font-size: 1rem; color: #94a3b8; margin: 1.75rem 0 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
    .site-index-count { font-size: 0.75rem; color: rgba(255,255,255,0.35); font-weight: 600; }
    .site-index-list { list-style: none; margin: 0; padding: 0; columns: 1; }
    @media (min-width: 640px) { .site-index-list { columns: 2; } }
    @media (min-width: 1100px) { .site-index-list { columns: 3; } }
    .site-index-list li { break-inside: avoid; margin-bottom: 0.35rem; }
    .site-index-list a { color: #38bdf8; text-decoration: none; font-size: 0.88rem; word-break: break-word; }
    .site-index-list a:hover { text-decoration: underline; }
    .site-index-section.hidden { display: none; }
    .site-index-list li.hidden { display: none; }
  </style>
</head>
<body>
  <div class="admin-container" style="display: block; max-width: 1200px; margin: 0 auto; padding: 1.5rem;">
    <p style="margin: 0 0 1rem;"><a href="/app/admin/monitoring/index.html" style="color: #38bdf8;">← Admin dashboard</a></p>
    <div class="warning-banner"><strong>⚠️ Admin only</strong> — Every HTML page in the repo (generated list). Regenerate after adding pages: <code style="color: #fde047;">node scripts/generate-site-index.mjs</code></div>
    <h1 style="margin-bottom: 0.5rem;">Full site index</h1>
    <p class="site-index-meta">${files.length} pages · grouped by top-level folder · search filters the list</p>
    <div class="site-index-wrap">
      <input type="search" id="site-index-filter" placeholder="Filter by path (e.g. seo, cities, complaints)…" autocomplete="off" />
      <p class="hint">Tip: use a segment like <code>seo/</code> or a filename fragment.</p>
    </div>
    <div id="site-index-sections">
${sectionHtml}
    </div>
  </div>
  <script type="module">
    import { requireAdminAuth } from '/app/assets/js/utils/admin-auth.js';
    await requireAdminAuth();

    const input = document.getElementById('site-index-filter');
    const sections = document.querySelectorAll('.site-index-section');
    function runFilter() {
      const q = (input.value || '').trim().toLowerCase();
      sections.forEach((sec) => {
        const lis = sec.querySelectorAll('li[data-label]');
        let visible = 0;
        lis.forEach((li) => {
          const ok = !q || li.getAttribute('data-label').includes(q);
          li.classList.toggle('hidden', !ok);
          if (ok) visible++;
        });
        const showSec = !q || visible > 0 || sec.getAttribute('data-section').includes(q);
        sec.classList.toggle('hidden', !showSec);
      });
    }
    input.addEventListener('input', runFilter);
  </script>
</body>
</html>`;

  const outDir = join(ROOT, 'app', 'admin');
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, 'site-index.html');
  await writeFile(outPath, html, 'utf8');
  console.log('Wrote', outPath, `(${files.length} pages)`);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
