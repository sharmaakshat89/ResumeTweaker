// ─── Pipeline Logger ──────────────────────────────────────────────────────────
// Structured server-side logger for the resume generation pipeline.
// All output goes to console so it's visible in the `npm run dev` terminal.

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function log(level: LogLevel, step: string, message: string, meta?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
  console.log(`[${ts}] [${level}] [${step}] ${message}${metaStr}`);
}

export const logger = {
  // ── Input ──────────────────────────────────────────────────────────────────
  inputReceived(source: 'url' | 'text', length: number) {
    log('INFO', 'INPUT', `Source: ${source} | Length: ${length} chars`, { source, length });
  },

  urlExtractionStarted(url: string) {
    log('INFO', 'EXTRACT', `Fetching URL: ${url}`);
  },

  urlExtractionSuccess(url: string, textLength: number) {
    log('INFO', 'EXTRACT', `URL extracted OK`, { url, textLength });
  },

  urlExtractionFailed(url: string, reason: string) {
    log('WARN', 'EXTRACT', `URL extraction failed — falling back to manual input`, { url, reason });
  },

  // ── AI ─────────────────────────────────────────────────────────────────────
  aiRequestStarted(jobTextLength: number) {
    log('INFO', 'AI', `Sending to OpenRouter`, { jobTextLength });
  },

  aiResponseReceived(valid: boolean, contentLength: number) {
    log(valid ? 'INFO' : 'WARN', 'AI', `Response received`, { valid, contentLength });
  },

  aiParseError(error: string) {
    log('ERROR', 'AI', `JSON parse failed — falling back to original profile`, { error });
  },

  aiJsonInvalid(reason: string) {
    log('WARN', 'AI', `AI JSON invalid: ${reason}`);
  },

  aiRetry(reason: string) {
    log('WARN', 'AI', `Retrying AI generation: ${reason}`);
  },

  // ── Validation / Sanitization ───────────────────────────────────────────────
  sanitizationStarted() {
    log('INFO', 'SANITIZE', 'Running output sanitization');
  },

  skillsRemoved(removed: string[]) {
    if (removed.length > 0) {
      log('WARN', 'SANITIZE', `Removed ${removed.length} hallucinated/unmatched skill(s)`, { removed });
    }
  },

  skillsTruncated(original: number, final: number) {
    if (original > final) {
      log('INFO', 'SANITIZE', `Skills truncated`, { original, final });
    }
  },

  bulletsTruncated(role: string, original: number, final: number) {
    if (original > final) {
      log('INFO', 'SANITIZE', `Bullets truncated for role: ${role}`, { original, final });
    }
  },

  experienceFallback(role: string, reason: string) {
    log('WARN', 'SANITIZE', `Experience fallback for "${role}": ${reason}`);
  },

  // ── PDF ────────────────────────────────────────────────────────────────────
  pdfStarted(skillCount: number, expCount: number) {
    log('INFO', 'PDF', `Generating PDF`, { skillCount, expCount });
  },

  pdfSuccess(sizeBytes: number) {
    log('INFO', 'PDF', `PDF generated OK`, { sizeBytes });
  },

  pdfFailed(error: string) {
    log('ERROR', 'PDF', `PDF generation failed`, { error });
  },

  // ── General ────────────────────────────────────────────────────────────────
  pipelineComplete() {
    log('INFO', 'PIPELINE', '✓ Resume pipeline completed successfully');
  },

  pipelineError(step: string, error: string) {
    log('ERROR', 'PIPELINE', `✗ Pipeline failed at step: ${step}`, { error });
  }
};
