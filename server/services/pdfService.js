/**
 * pdfService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PDF resume generation service.
 *
 * Generates a professionally formatted PDF from a user's optimized resume text.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO (Task 2.1 — PDF Implementation):
 *
 *   Recommended approach: Use Puppeteer to render an HTML template to PDF.
 *   This gives full control over formatting and produces the best output.
 *
 *   Install Puppeteer:
 *     cd server && npm install puppeteer
 *
 *   Implementation pattern:
 *
 *   import puppeteer from 'puppeteer';
 *
 *   const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
 *   const page = await browser.newPage();
 *   await page.setContent(buildResumeHtml(user, resumeText), { waitUntil: 'networkidle0' });
 *   const pdfBuffer = await page.pdf({
 *     format: 'Letter',
 *     margin: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' },
 *     printBackground: true,
 *   });
 *   await browser.close();
 *   return pdfBuffer;
 *
 *   Alternative approach: Use the 'pdfkit' npm package for a pure Node.js solution
 *   that does not require a headless browser. Less flexible for formatting but
 *   more lightweight for a serverless/Render deployment.
 *     cd server && npm install pdfkit
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Build the HTML template for the resume PDF.
 * This is the template that Puppeteer will render.
 * TODO: Design this template to match Talendro's brand standards.
 */
function buildResumeHtml(user, resumeText) {
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Candidate';
  const email = user.email || '';
  const phone = user.phone || '';
  const location = user.location || '';

  // Convert plain text resume to basic HTML with line breaks
  const bodyHtml = resumeText
    .split('\n')
    .map(line => line.trim() === '' ? '<br/>' : `<p>${line}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Georgia', serif; font-size: 11pt; color: #1a1a1a; margin: 0; padding: 0; }
    .header { border-bottom: 2px solid #1a3a5c; padding-bottom: 12px; margin-bottom: 16px; }
    .name { font-size: 22pt; font-weight: bold; color: #1a3a5c; }
    .contact { font-size: 9pt; color: #555; margin-top: 4px; }
    p { margin: 2px 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${name}</div>
    <div class="contact">${[email, phone, location].filter(Boolean).join(' &nbsp;|&nbsp; ')}</div>
  </div>
  <div class="body">${bodyHtml}</div>
</body>
</html>`;
}

/**
 * Generate a PDF buffer from a user's resume text.
 * @param {Object} params
 * @param {Object} params.user        - Full user document from MongoDB
 * @param {string} params.resumeText  - The optimized resume text to render
 * @returns {Promise<Buffer>} PDF file as a Node.js Buffer
 */
async function generateResumePdf({ user, resumeText }) {
  // ── TODO (Task 2.1): Replace stub with Puppeteer implementation ───────────
  // See the detailed instructions in the file header above.
  throw new Error('PDF generation not yet implemented. See TODO in pdfService.js.');
}

export default { generateResumePdf, buildResumeHtml };
