/**
 * Replaces __CCC_SUPABASE_URL__ and __CCC_SUPABASE_ANON_KEY__ placeholders
 * in all HTML files that require Supabase config at build time.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const url = process.env.SUPABASE_URL || '';
const anon = process.env.SUPABASE_ANON_KEY || '';

const targetFiles = [
  'claim-command-center-v3.html',
  'app/login.html',
  'app/register.html'
];

if (!url || !anon) {
  console.warn('[inject-ccc-v3-config] SUPABASE_URL or SUPABASE_ANON_KEY missing — leaving __CCC_* placeholders unchanged (expected for local builds).');
} else {
  for (const file of targetFiles) {
    const filePath = path.join(root, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`[inject-ccc-v3-config] File not found, skipping: ${file}`);
      continue;
    }
    let html = fs.readFileSync(filePath, 'utf8');
    html = html.replace(/__CCC_SUPABASE_URL__/g, url);
    html = html.replace(/__CCC_SUPABASE_ANON_KEY__/g, anon);
    fs.writeFileSync(filePath, html);
    console.log(`[inject-ccc-v3-config] Injected Supabase config into ${file}`);
  }
}
