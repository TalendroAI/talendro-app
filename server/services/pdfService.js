/**
 * pdfService.js
 *
 * Generates a beautifully formatted HTML resume rendered to PDF via Puppeteer.
 * Available to Pro and Concierge subscribers only (enforced in resume.js route).
 *
 * The resume JSON from resumeTailorService has this structure:
 * {
 *   name, email, phone, location, linkedin, summary,
 *   experience: [{ company, title, startDate, endDate, location, bullets }],
 *   education:  [{ institution, degree, field, graduationDate, gpa, honors }],
 *   skills:     ["Skill 1", "Skill 2"],
 *   certifications: [{ name, issuer, date }]
 * }
 */

import puppeteer from 'puppeteer';

// ─── HTML TEMPLATE ────────────────────────────────────────────────────────────

function buildResumeHtml(resumeData) {
  const r = resumeData || {};
  const name = r.name || 'Your Name';
  const contactParts = [r.email, r.phone, r.location, r.linkedin].filter(Boolean);

  const experienceHtml = (r.experience || []).map(job => `
    <div class="section-item">
      <div class="item-header">
        <div>
          <span class="item-title">${job.title || ''}</span>
          <span class="item-company"> · ${job.company || ''}</span>
        </div>
        <div class="item-dates">${[job.startDate, job.endDate].filter(Boolean).join(' – ')}</div>
      </div>
      ${job.location ? `<div class="item-location">${job.location}</div>` : ''}
      <ul class="bullets">
        ${(job.bullets || []).map(b => `<li>${b}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  const educationHtml = (r.education || []).map(edu => `
    <div class="section-item">
      <div class="item-header">
        <div>
          <span class="item-title">${edu.degree || ''} ${edu.field ? `in ${edu.field}` : ''}</span>
          <span class="item-company"> · ${edu.institution || ''}</span>
        </div>
        <div class="item-dates">${edu.graduationDate || ''}</div>
      </div>
      ${edu.gpa ? `<div class="item-location">GPA: ${edu.gpa}${edu.honors ? ` · ${edu.honors}` : ''}</div>` : ''}
    </div>
  `).join('');

  const skillsHtml = (r.skills || []).length > 0
    ? `<div class="skills-grid">${(r.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>`
    : '';

  const certsHtml = (r.certifications || []).map(c => `
    <div class="cert-item">
      <span class="cert-name">${c.name || ''}</span>
      ${c.issuer ? `<span class="cert-issuer"> · ${c.issuer}</span>` : ''}
      ${c.date ? `<span class="cert-date"> (${c.date})</span>` : ''}
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
      font-size: 10pt;
      color: #1a1a2e;
      background: #fff;
      padding: 0.65in 0.75in;
      line-height: 1.5;
    }

    /* ── Header ── */
    .header {
      border-bottom: 3px solid #2F6DF6;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }
    .header-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 26pt;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }
    .header-contact {
      margin-top: 6px;
      font-size: 9pt;
      color: #4b5563;
      display: flex;
      flex-wrap: wrap;
      gap: 4px 16px;
    }
    .header-contact span::before {
      content: '';
    }

    /* ── Section ── */
    .section {
      margin-bottom: 18px;
    }
    .section-title {
      font-size: 9pt;
      font-weight: 700;
      color: #2F6DF6;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
      margin-bottom: 10px;
    }

    /* ── Summary ── */
    .summary-text {
      font-size: 10pt;
      color: #374151;
      line-height: 1.6;
    }

    /* ── Experience / Education Items ── */
    .section-item {
      margin-bottom: 12px;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .item-title {
      font-weight: 700;
      font-size: 10.5pt;
      color: #111827;
    }
    .item-company {
      font-weight: 500;
      color: #374151;
    }
    .item-dates {
      font-size: 9pt;
      color: #6b7280;
      white-space: nowrap;
      margin-left: 12px;
    }
    .item-location {
      font-size: 9pt;
      color: #6b7280;
      margin-top: 1px;
    }
    .bullets {
      margin-top: 5px;
      padding-left: 16px;
    }
    .bullets li {
      font-size: 9.5pt;
      color: #374151;
      margin-bottom: 2px;
      line-height: 1.5;
    }

    /* ── Skills ── */
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    .skill-tag {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 8.5pt;
      font-weight: 500;
    }

    /* ── Certifications ── */
    .cert-item {
      font-size: 9.5pt;
      color: #374151;
      margin-bottom: 3px;
    }
    .cert-name { font-weight: 600; }
    .cert-issuer { color: #6b7280; }
    .cert-date { color: #9ca3af; }

    /* ── Footer ── */
    .footer {
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 7.5pt;
      color: #9ca3af;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="header-name">${name}</div>
    <div class="header-contact">
      ${contactParts.map(p => `<span>${p}</span>`).join('')}
    </div>
  </div>

  <!-- Professional Summary -->
  ${r.summary ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <div class="summary-text">${r.summary}</div>
  </div>` : ''}

  <!-- Experience -->
  ${(r.experience || []).length > 0 ? `
  <div class="section">
    <div class="section-title">Professional Experience</div>
    ${experienceHtml}
  </div>` : ''}

  <!-- Education -->
  ${(r.education || []).length > 0 ? `
  <div class="section">
    <div class="section-title">Education</div>
    ${educationHtml}
  </div>` : ''}

  <!-- Skills -->
  ${skillsHtml ? `
  <div class="section">
    <div class="section-title">Core Competencies & Skills</div>
    ${skillsHtml}
  </div>` : ''}

  <!-- Certifications -->
  ${(r.certifications || []).length > 0 ? `
  <div class="section">
    <div class="section-title">Certifications & Licenses</div>
    ${certsHtml}
  </div>` : ''}

  <div class="footer">
    Prepared by Talendro™ AI Career Platform · Optimized for ATS and Human Review
  </div>

</body>
</html>`;
}

// ─── MAIN: generateResumePdf() ────────────────────────────────────────────────

export async function generateResumePdf({ resumeData }) {
  if (!resumeData) {
    throw new Error('generateResumePdf() requires resumeData');
  }

  const html = buildResumeHtml(resumeData);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      printBackground: true,
      preferCSSPageSize: true,
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

export default { generateResumePdf, buildResumeHtml };
