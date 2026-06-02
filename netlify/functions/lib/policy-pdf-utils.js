/**
 * Shared policy PDF helpers — stage + analyze paths.
 */

const { PDFDocument } = require('pdf-lib');

const DECLARATIONS_MAX_PAGES = 12;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

function detectMime(buf) {
  if (!buf || buf.length < 4) return 'application/octet-stream';
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return 'application/pdf';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  return 'application/octet-stream';
}

function resolveMime(buf, declared) {
  const d = detectMime(buf);
  if (d === 'application/pdf' || d === 'image/jpeg' || d === 'image/png') return d;
  if (['application/pdf', 'image/jpeg', 'image/png'].includes(declared)) return declared;
  return d;
}

function decodeBase64Payload(raw) {
  const clean = String(raw || '').replace(/^data:.+;base64,/, '');
  const buffer = Buffer.from(clean, 'base64');
  if (buffer.length === 0) throw new Error('Empty file data');
  if (buffer.length > MAX_FILE_BYTES) throw new Error('File too large (max 15MB)');
  return { buffer, clean, mime: resolveMime(buffer, 'application/pdf') };
}

/** Build a valid PDF with only the first N pages (raw byte slice breaks PDF structure). */
async function extractFirstPages(buffer, maxPages = DECLARATIONS_MAX_PAGES) {
  const src = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const total = src.getPageCount();
  const n = Math.min(maxPages, total);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(
    src,
    Array.from({ length: n }, (_, i) => i)
  );
  pages.forEach((page) => out.addPage(page));
  const bytes = await out.save();
  return { buffer: Buffer.from(bytes), pagesUsed: n, totalPages: total };
}

async function preparePdfBuffer(buffer, declarationsOnly) {
  if (declarationsOnly === false) {
    return {
      uploadBuffer: buffer,
      bytesStaged: buffer.length,
      declarationsOnly: false,
      pagesUsed: null
    };
  }

  try {
    const { buffer: subset, pagesUsed, totalPages } = await extractFirstPages(buffer);
    console.log(
      '[policy-pdf-utils] declarations PDF:',
      subset.length,
      'bytes, pages',
      pagesUsed,
      'of',
      totalPages
    );
    return {
      uploadBuffer: subset,
      bytesStaged: subset.length,
      declarationsOnly: true,
      pagesUsed
    };
  } catch (e) {
    console.warn('[policy-pdf-utils] page extract failed:', e.message);
    if (buffer.length <= 8 * 1024 * 1024) {
      return {
        uploadBuffer: buffer,
        bytesStaged: buffer.length,
        declarationsOnly: true,
        pagesUsed: null
      };
    }
    throw new Error(
      'Could not prepare a valid declarations PDF. Uncheck "Declarations only" or re-upload.'
    );
  }
}

async function uploadPdfToOpenAI(openai, uploadBuffer, filename = 'policy.pdf') {
  const { toFile } = require('openai');
  const uploaded = await openai.files.create({
    file: await toFile(uploadBuffer, filename, { type: 'application/pdf' }),
    purpose: 'user_data'
  });
  return uploaded.id;
}

async function deleteOpenAIFile(openai, fileId) {
  if (!fileId) return;
  try {
    await openai.files.del(fileId);
  } catch (e) {
    console.warn('[policy-pdf-utils] file delete:', e.message);
  }
}

module.exports = {
  DECLARATIONS_MAX_PAGES,
  MAX_FILE_BYTES,
  detectMime,
  resolveMime,
  decodeBase64Payload,
  extractFirstPages,
  preparePdfBuffer,
  uploadPdfToOpenAI,
  deleteOpenAIFile
};
