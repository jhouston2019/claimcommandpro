/**
 * Injects crawlable Resources footer links into public HTML pages (idempotent).
 * Removes legacy shared-footer.js script tags and JS-injected blocks.
 */
import { readdir, readFile, writeFile } from "fs/promises";
import { join, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "_cursor", "next-app"]);

const RESOURCES_BLOCK = `
<div data-site-resources-footer="true" class="site-resources-footer" style="border-top:1px solid #e5e7eb;background:#f9fafb;color:#4b5563;">
  <div class="site-resources-footer-inner" style="max-width:1200px;margin:0 auto;padding:1.25rem 1.5rem;">
    <h4 style="margin:0 0 0.75rem;font-size:0.95rem;font-weight:700;">Resources</h4>
    <nav style="display:flex;flex-wrap:wrap;gap:0.5rem 1.25rem;font-size:0.9rem;">
      <a href="/guides/insurance-claim-knowledge-hub.html">Knowledge Hub</a>
      <a href="/app/learn/">Insurance Glossary</a>
      <a href="/cities/">City Claim Help</a>
      <a href="/complaints/">State Complaint Guides</a>
      <a href="/case-studies/">Case Studies</a>
      <a href="/research/">Research</a>
      <a href="/about/">About</a>
      <a href="/seo/">SEO Resources</a>
    </nav>
  </div>
</div>`;

const SCRIPT_RE = /\s*<script[^>]*\bsrc=["'][^"']*\/assets\/js\/shared-footer\.js["'][^>]*>\s*<\/script>\s*/gi;
const LEGACY_STYLE_RE =
  /\s*<style>\s*\.site-resources-footer\{border-top:1px solid #e5e7eb;background:#f9fafb;color:#4b5563;\}\s*\.site-resources-footer a\{color:#0d9488;text-decoration:none;font-weight:500;\}\s*\.site-resources-footer a:hover\{text-decoration:underline;\}\s*<\/style>\s*/gi;
const RESOURCES_BLOCK_RE =
  /\s*<div data-site-resources-footer="true"[^>]*class="site-resources-footer"[\s\S]*?<\/div>\s*<\/div>\s*/i;

const SKIP_FILES = new Set(["sections/footer.html"]);

function isPublicPage(rel) {
  if (SKIP_FILES.has(rel)) return false;
  if (rel.startsWith("Older pages - do not use/")) return false;
  if (rel.startsWith("admin/")) return false;
  if (rel.startsWith("app/admin/")) return false;
  if (/^(admin-|admin\.)/.test(rel) || /^admin-.*\.html$/.test(rel)) return false;
  if (
    rel === "admin-dashboard.html" ||
    rel === "admin-console.html" ||
    rel === "admin-login.html"
  )
    return false;
  if (rel.startsWith("paywall/")) return false;
  if (rel === "professional-login.html" || rel === "professional-dashboard.html") return false;
  if (rel.startsWith("app/")) {
    return rel.startsWith("app/learn/");
  }
  return true;
}

async function walk(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) await walk(p, out);
    } else if (e.name.endsWith(".html")) {
      out.push(p);
    }
  }
  return out;
}

function stripLegacy(html) {
  let next = html.replace(SCRIPT_RE, "\n");
  next = next.replace(LEGACY_STYLE_RE, "\n");
  next = next.replace(RESOURCES_BLOCK_RE, "\n");
  return next;
}

function hasResourcesBlock(html) {
  return html.includes('data-site-resources-footer="true"');
}

function injectResources(html) {
  if (hasResourcesBlock(html)) return html;

  const re = /<footer\b[^>]*>/gi;
  let match;
  let last = null;
  while ((match = re.exec(html)) !== null) last = match;
  if (last) {
    const insertAt = last.index + last[0].length;
    return html.slice(0, insertAt) + RESOURCES_BLOCK + html.slice(insertAt);
  }
  if (html.includes("</body>")) {
    return html.replace("</body>", `${RESOURCES_BLOCK}\n</body>`);
  }
  return html;
}

const files = await walk(ROOT);
let changed = 0;
let injected = 0;
let cleaned = 0;

for (const file of files) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const original = await readFile(file, "utf8");
  const hadMarker = original.includes('data-site-resources-footer="true"');
  let html = stripLegacy(original);

  if (isPublicPage(rel)) {
    html = injectResources(html);
    if (!hadMarker && hasResourcesBlock(html)) injected++;
  }

  if (html !== original) {
    await writeFile(file, html, "utf8");
    changed++;
    if (!isPublicPage(rel)) cleaned++;
  }
}

console.log(
  `[inject-shared-footer] Changed ${changed} files (${injected} injected, ${cleaned} cleanup-only on non-public).`
);
