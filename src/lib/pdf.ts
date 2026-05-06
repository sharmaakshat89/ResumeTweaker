import puppeteer from 'puppeteer-core';
import { env } from '$env/dynamic/private';
import { logger } from './logger';

export interface ResumeData {
  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  summary: string;
  skills: string[];
  projects: Array<{
    title: string;
    tech: string[];
    points: string[];
  }>;
  experience: Array<{
    role: string;
    company: string;
    location: string;
    duration: string;
    points: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    location: string;
    score: string;
    year: string;
  }>;
}

// ── Pre-truncation ─────────────────────────────────────────────────────────────
// Enforces ATS limits BEFORE Puppeteer renders the HTML.
// This prevents silent mid-sentence truncation at page boundary.
function enforceContentLimits(data: ResumeData): ResumeData {
  return {
    ...data,
    skills: data.skills.slice(0, 12),
    projects: data.projects.slice(0, 3).map((proj) => ({
      ...proj,
      points: proj.points.slice(0, 3)
    })),
    experience: data.experience.map((exp) => ({
      ...exp,
      points: exp.points.slice(0, 4)
    }))
  };
}

// ── HTML generator ─────────────────────────────────────────────────────────────
// Produces a strictly ATS-compliant HTML document:
//   • Single column — no sidebars, no multi-column layouts
//   • Black text on white background — no colors
//   • No icons, no images, no decorative elements
//   • Standard section order: Name, Contact, Summary, Skills, Experience, Education
//   • Semantic HTML with clear section labels

function generateATSHtml(data: ResumeData): string {
  const skillsLine = data.skills.join(' • ');

  const projectsHtml = data.projects && data.projects.length > 0
    ? data.projects
        .map(
          (proj) => `
    <div class="section-block">
      <div class="entry-title">${proj.title}</div>
      <div class="tech-stack">${proj.tech.join(' • ')}</div>
      <ul>
        ${proj.points.map((p) => `<li>${p}</li>`).join('\n        ')}
      </ul>
    </div>`
        )
        .join('')
    : '';

  const experienceHtml = data.experience
    .map(
      (exp) => `
    <div class="section-block">
      <div class="entry-header">
        <span class="entry-title">${exp.role}</span>
        <span class="entry-date">${exp.duration}</span>
      </div>
      <div class="entry-sub">${exp.company}, ${exp.location}</div>
      <ul>
        ${exp.points.map((p) => `<li>${p}</li>`).join('\n        ')}
      </ul>
    </div>`
    )
    .join('');

  const educationHtml = data.education
    .map(
      (edu) => `
    <div class="section-block">
      <div class="entry-header">
        <span class="entry-title">${edu.degree}</span>
        <span class="entry-date">${edu.year}</span>
      </div>
      <div class="entry-sub">${edu.institution}, ${edu.location}${edu.score ? ` | ${edu.score}` : ''}</div>
    </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${data.personal.name} — Resume</title>
  <style>
    /* ── Reset ── */
    * { margin: 0; padding: 0; box-sizing: border-box; }

    /* ── Page ── */
    html, body {
      width: 8.5in;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      line-height: 1.35;
      color: #000000;
      background: #ffffff;
    }
    body {
      padding: 0.4in 0.5in;
    }

    /* ── Header ── */
    .resume-name {
      font-size: 16pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 3px;
    }
    .resume-contact {
      font-size: 9pt;
      color: #000;
      margin-bottom: 8px;
    }

    /* ── Section ── */
    .section {
      margin-bottom: 6px;
    }
    .section-label {
      font-size: 9.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border-bottom: 1px solid #000;
      padding-bottom: 1px;
      margin-bottom: 5px;
    }

    /* ── Summary ── */
    .summary-text {
      font-size: 9pt;
      line-height: 1.4;
    }

    /* ── Skills ── */
    .skills-text {
      font-size: 9pt;
      line-height: 1.4;
    }

    /* ── Tech stack (for project entries) ── */
    .tech-stack {
      font-size: 9pt;
      color: #000;
      margin: 1px 0 3px 0;
    }

    /* ── Experience / Education entries ── */
    .section-block {
      margin-bottom: 5px;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .entry-title {
      font-weight: bold;
      font-size: 10pt;
    }
    .entry-date {
      font-size: 9pt;
      white-space: nowrap;
    }
    .entry-sub {
      font-size: 9pt;
      margin: 1px 0 3px 0;
    }
    ul {
      padding-left: 14px;
      margin: 0;
    }
    li {
      font-size: 9pt;
      line-height: 1.35;
      margin-bottom: 1px;
    }
  </style>
</head>
<body>

  <!-- NAME & CONTACT -->
  <div class="resume-name">${data.personal.name}</div>
  <div class="resume-contact">${data.personal.email} | ${data.personal.phone} | ${data.personal.location}</div>

  <!-- SUMMARY -->
  <div class="section">
    <div class="section-label">Summary</div>
    <div class="summary-text">${data.summary}</div>
  </div>

  <!-- SKILLS -->
  <div class="section">
    <div class="section-label">Skills</div>
    <div class="skills-text">${skillsLine}</div>
  </div>

  ${data.projects && data.projects.length > 0 ? `
  <!-- PROJECTS -->
  <div class="section">
    <div class="section-label">Projects</div>
    ${projectsHtml}
  </div>` : ''}

  <!-- EXPERIENCE -->
  <div class="section">
    <div class="section-label">Experience</div>
    ${experienceHtml}
  </div>

  <!-- EDUCATION -->
  <div class="section">
    <div class="section-label">Education</div>
    ${educationHtml}
  </div>

</body>
</html>`;
}

// ── generatePDF ────────────────────────────────────────────────────────────────
export async function generatePDF(resumeData: ResumeData): Promise<Buffer> {
  // Enforce hard limits before rendering
  const limitedData = enforceContentLimits(resumeData);

  logger.pdfStarted(limitedData.skills.length, limitedData.experience.length);

  const html = generateATSHtml(limitedData);

  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${env.BROWSERLESS_TOKEN}`
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: false,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
      // Capture only page 1 — content is pre-truncated so this is a safety net
      pageRanges: '1'
    });

    const buf = Buffer.from(pdfBuffer);
    logger.pdfSuccess(buf.byteLength);
    return buf;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.pdfFailed(msg);
    throw err;
  } finally {
    await browser.close();
  }
}