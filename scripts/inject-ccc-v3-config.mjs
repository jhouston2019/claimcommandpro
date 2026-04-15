/**
 * Replaces placeholders in claim-command-center-v3.html with Netlify build env vars.
 * Uses SUPABASE_URL and SUPABASE_ANON_KEY (same names as .env.example / Netlify UI).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'claim-command-center-v3.html');

const url = process.env.SUPABASE_URL || '';
const anon = process.env.SUPABASE_ANON_KEY || '';

const html = fs.readFileSync(htmlPath, 'utf8');

if (!url || !anon) {
  console.warn(
    '[inject-ccc-v3-config] SUPABASE_URL or SUPABASE_ANON_KEY missing — leaving __CCC_* placeholders unchanged (expected for local builds).'
  );
} else {
  let next = html;
  next = next.replace(/__CCC_SUPABASE_URL__/g, url);
  next = next.replace(/__CCC_SUPABASE_ANON_KEY__/g, anon);
  fs.writeFileSync(htmlPath, next);
  console.log('[inject-ccc-v3-config] Injected Supabase URL + anon key into claim-command-center-v3.html');
}
