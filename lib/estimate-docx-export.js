/**
 * Client helper — download structured estimate exports as Word (.docx)
 * via Netlify export-docx function.
 */
(function (global) {
  'use strict';

  function claimMetadata(claimData) {
    const initial = (claimData && claimData.initial) || {};
    return {
      title: '',
      claim_number: initial.claimNumber || '',
      policyholder_name: initial.insuredName || '',
      date_of_loss: initial.dateOfLoss || '',
      insurer: initial.insurer || ''
    };
  }

  async function downloadStructuredDocx(structured, filename, claimData) {
    if (!structured) {
      throw new Error('No document content to export');
    }

    const metadata = {
      ...claimMetadata(claimData),
      title: structured.title || 'Claim Document'
    };

    const res = await fetch('/.netlify/functions/export-docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structured,
        filename: filename || 'document.docx',
        metadata
      })
    });

    if (!res.ok) {
      let msg = 'DOCX export failed';
      try {
        const err = await res.json();
        msg = err.details || err.error || msg;
      } catch (e) { /* ignore */ }
      throw new Error(msg);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'document.docx';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadEstimateDocx(content, filename, claimData) {
    return downloadStructuredDocx(content, filename, claimData);
  }

  global.EstimateDocxExport = {
    downloadStructuredDocx,
    downloadEstimateDocx,
    claimMetadata
  };
})(typeof window !== 'undefined' ? window : global);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    downloadStructuredDocx: async () => {},
    downloadEstimateDocx: async () => {},
    claimMetadata: () => ({})
  };
}
