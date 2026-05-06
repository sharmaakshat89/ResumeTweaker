import { json } from '@sveltejs/kit';
import { generateResume } from '$lib/ai';
import { PROFILE } from '$lib/profile';
import { TECH_PROFILE } from '$lib/techProfile';
import { sanitizeOutput, formatATSResume } from '$lib/ats';
import { logger } from '$lib/logger';
import { env } from '$env/dynamic/private';

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { jobText, mode } = body as { jobText?: string; mode?: 'standard' | 'tech' };
    const resumeMode: 'standard' | 'tech' = mode === 'tech' ? 'tech' : 'standard';

    // ── Select profile based on mode ─────────────────────────────────────────
    const baseProfile = resumeMode === 'tech' ? TECH_PROFILE : PROFILE;

    // ── API key check ────────────────────────────────────────────────────────
    const finalApiKey = env.GEMINI_API_KEY;
    if (!finalApiKey) {
      logger.pipelineError('API_KEY', 'GEMINI_API_KEY not set in environment');
      return json({ error: 'API key not configured on server.' }, { status: 500 });
    }

    // ── Input validation ─────────────────────────────────────────────────────
    if (!jobText?.trim()) {
      return json({ error: 'Please paste a job description.' }, { status: 400 });
    }

    const extractedText = jobText.trim();

    if (extractedText.length < 50) {
      return json({ error: 'Job description is too short. Please paste more content.' }, { status: 400 });
    }

    logger.inputReceived('text', extractedText.length);

    // ── Step 2: AI tailoring ─────────────────────────────────────────────────
    let tailored: Awaited<ReturnType<typeof generateResume>>;
    try {
      tailored = await generateResume(extractedText, baseProfile, finalApiKey, env.MODEL, resumeMode);
    } catch (aiErr) {
      const reason = aiErr instanceof Error ? aiErr.message : String(aiErr);
      logger.pipelineError('AI', reason);
      tailored = {
        summary: baseProfile.summary,
        skills: baseProfile.skills,
        projects: baseProfile.projects ? [...baseProfile.projects] : [],
        experience: baseProfile.experience,
        extractedSkills: [],
        companyName: 'Resume'
      };
    }

    // ── Step 3: Sanitization ─────────────────────────────────────────────────
    const sanitized = sanitizeOutput(tailored, baseProfile);

    // ── Step 4: Assemble full resume ─────────────────────────────────────────
    const fullResume = {
      personal: baseProfile.personal,
      summary: sanitized.summary,
      skills: sanitized.skills,
      projects: sanitized.projects,
      experience: sanitized.experience,
      education: baseProfile.education
    };

    // ── Step 5: Format for preview ───────────────────────────────────────────
    const atsFormatted = formatATSResume(fullResume);

    logger.pipelineComplete();

    return json({
      resume: fullResume,
      formatted: atsFormatted,
      extractedSkills: tailored.extractedSkills,
      companyName: tailored.companyName
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.pipelineError('SERVER', message);
    return json({ error: `Server error: ${message}` }, { status: 500 });
  }
}
