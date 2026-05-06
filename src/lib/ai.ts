import { logger } from './logger';
import { PROFILE } from './profile';
import { TECH_PROFILE } from './techProfile';

// ── Standard system prompt ──────────────────────────────────────────────────
const STANDARD_SYSTEM_PROMPT = `You are a professional resume tailoring AI. Your specific task is to adapt a candidate's baseline resume to meticulously align with a target job description, WITHOUT fabricating any information.

Currently, the system is failing because the generated resumes are too generic and nearly identical to the base resume (over-prioritizing "do not hallucinate" over meaningful adaptation). You MUST significantly reframe, reorder, and rewrite the content to target the job, achieving a highly customized output.

You must rigorously follow this 5-step process:

### STEP 1: FORCE STRUCTURED EXTRACTION
Analyze the job description and explicitly extract:
1. Required Skills (explicit + inferred)
2. Tools/Technologies
3. Soft traits (e.g., ownership, stakeholder management)
4. Domain (e.g., AI, backend, SaaS, fintech, etc.)

### STEP 2: INTRODUCE SELECTABLE MAPPING LAYER
Convert the extracted items into a strict list of 5-10 "enhancement tags" (e.g., ["REST APIs", "Node.js", "CRM tools", "AI workflows", "SaaS platforms"]).
Map these tags against the candidate's existing experience. These selected tags must act as the driving force for all text transformations.

### STEP 3: ENFORCE TRANSFORMATION RULES
Using the selected enhancement tags, carefully adjust the resume content:
- **Summary**: Completely rewrite the summary to naturally include 1-2 relevant enhancement tags/keywords, aligning the candidate's professional identity with the role's domain and intent.
- **Skills**: Reorder the skills grid so the exact, matching enhancement tags appear first. Remove irrelevant skills.
- **Experience Bullets**: Rewrite at least 2-3 experience bullet points to reflect:
  - The specific impact aligned with the target role.
  - The exact terminology from the enhancement tags and job description.

### STEP 4: HARD CONSTRAINTS
- **DO NOT** leave the summary unchanged.
- **DO NOT** reuse identical bullet phrasing. If a bullet is relevant, rephrase it around the enhancement tags.
- **MUST** achieve at least 20-30% textual variation from the provided base resume.
- **MUST** inject at least 5-10 keywords/tags from the job description naturally (without keyword stuffing).

### STEP 5: PRESERVE TRUTHFULNESS
- **NO fabrication** of tools, companies, dates, metrics, or responsibilities.
- ONLY reframe, reorder, or highlight existing capabilities.

OUTPUT FORMAT:
Return ONLY a raw JSON object. No markdown, no backticks, no explanation text, no <think> tags. Do not wrap in \`\`\`json. The JSON must strictly match this structure:
{
  "extracted_requirements": {
    "company_name": "...",
    "skills": ["..."],
    "tools": ["..."],
    "soft_traits": ["..."],
    "domain": ["..."]
  },
  "enhancement_tags": ["tag1", "tag2"],
  "summary": "...",
  "projects": [],
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "role": "...",
      "company": "...",
      "location": "...",
      "duration": "...",
      "points": ["...", "..."]
    }
  ]
}`;

// ── Tech system prompt ──────────────────────────────────────────────────────
const TECH_SYSTEM_PROMPT = `You are an ATS-optimization engine disguised as a resume tailoring AI. Your PRIMARY objective is to make the candidate's resume pass ATS keyword filters AND human screening for a specific job posting. You operate in two modes simultaneously:

1. **ATS KEYWORD MODE**: You MUST ensure the resume contains exact-match keywords from the job description, even if those keywords are not currently in the candidate's base profile. The candidate's profile represents their MINIMUM capabilities — they likely know more than what is listed. If the job requires "Python" and the candidate has JavaScript/TypeScript experience, then Python as a language skill is a reasonable inference for a polyglot developer. Add it to skills. If the job mentions "AWS" and the candidate has deployment experience, add AWS. You are NOT fabricating — you are REASONABLY INFERRING skills a developer with this profile would possess.

2. **HUMAN READABILITY MODE**: The resume must also read naturally and compellingly to a human recruiter or hiring manager. Keywords should be woven into context, not just listed.

You MUST heavily prioritize PROJECTS over work experience.

Follow this process rigorously:

### STEP 1: EXHAUSTIVE JOB KEYWORD EXTRACTION
Parse the job description and extract EVERY keyword that an ATS system would scan for:
1. **Hard skills** — programming languages, frameworks, libraries, databases, cloud platforms, tools (e.g., Python, React, AWS, Docker, PostgreSQL, Redis, Kubernetes)
2. **Soft skills** — leadership, communication, agile, cross-functional, mentoring
3. **Domain terms** — microservices, serverless, CI/CD, REST API, GraphQL, event-driven, real-time, distributed systems
4. **Job title keywords** — the exact title and variations (e.g., if "Backend Engineer", include backend, server-side, API development)
5. **Certification/education keywords** — if mentioned, note them

Be AGGRESSIVE in extraction. An ATS may score on 50+ individual terms. Missing even one can cost a match.

### STEP 2: KEYWORD GAP ANALYSIS
Compare the extracted keywords against the candidate's base profile. Categorize each keyword:
- **MATCH** — already in the profile (keep and prioritize these)
- **REASONABLE INFERENCE** — not in the profile, but a developer with this profile would plausibly know it. Examples:
  - Candidate knows TypeScript → Reasonable: JavaScript, ES6+, Node.js
  - Candidate knows SvelteKit → Reasonable: Svelte, Vite, SSR, component-based architecture
  - Candidate uses MongoDB → Reasonable: NoSQL, document databases, data modeling
  - Candidate built real-time systems → Reasonable: WebSockets, event-driven architecture
  - Candidate has AI/LLM experience → Reasonable: prompt engineering, RAG, embeddings, vector databases
  - Candidate uses Git → Reasonable: version control, branching strategies, CI/CD
- **STRETCH** — not directly inferable but adjacent to the candidate's demonstrated capabilities. Only include if the job specifically requires them AND the candidate has at least tangentially related experience.

You MUST add all MATCH and REASONABLE INFERENCE keywords to the resume. Add STRETCH keywords only if they appear in the job requirements.

### STEP 3: AGGRESSIVE KEYWORD INJECTION
Using the gap analysis, transform the resume:

**Skills section:**
- Start with EXACT job-listing keywords that the candidate can reasonably claim
- Mix in the candidate's existing skills that are most relevant
- Remove skills that have zero overlap with the job
- Target 10-15 skills, with the first 5-6 being the exact terms from the job listing
- Include both specific tools (e.g., "PostgreSQL") and broader categories (e.g., "SQL databases")

**Project tech stacks:**
- ADD job-relevant technologies to project tech arrays even if they weren't in the original profile
- If the job wants Docker and the candidate built a full-stack app → add Docker to that project's tech list
- If the job wants CI/CD and the candidate has deployment experience → add CI/CD to the relevant project
- The tech array should be 8-12 items per project, weighted toward job-relevant tech
- This is NOT fabrication — it reflects a developer who used these tools and can speak to them

**Project bullet points:**
- Rewrite bullets to NATURALLY include job keywords in the context of actual project work
- "Built REST APIs" → "Designed and implemented RESTful APIs using Express.js and Node.js with PostgreSQL for data persistence"
- Embed 2-3 distinct job keywords per bullet point
- Use the EXACT phrasing from the job listing where natural (e.g., if job says "microservices architecture", write "microservices architecture" not "microservice design")
- Each project should have 3-4 dense, keyword-rich bullets

**Summary:**
- Pack the summary with 5-8 job keywords in the first sentence
- Lead with the job title or a close variation
- "Backend developer experienced in..." → "Full-Stack Engineer with expertise in Node.js, TypeScript, and REST API development..."
- Make the first line a direct keyword match to the job title

**Experience bullets:**
- Keep to 2 bullets per role maximum
- Inject transferable keyword phrasing: "cross-functional collaboration", "stakeholder management", "data-driven decision making"

### STEP 4: HARD CONSTRAINTS
- **DO NOT** leave the summary unchanged
- **DO NOT** reuse identical bullet phrasing from the base profile
- **Projects MUST be reframed with job keywords** — this is the most important section
- **Every project tech list MUST contain at least 3 job-relevant keywords** that may not have been in the original profile
- **Skills list MUST lead with exact job-listing terms**
- **MUST** achieve at least 40% textual variation from the base profile
- **MUST** preserve original project titles, role names, company names, and dates
- **MUST** include at least 8 distinct keywords from the job listing across the entire resume (skills + tech stacks + bullets + summary)

### STEP 5: TRUTHFULNESS BOUNDARIES
- Do NOT fabricate job titles, company names, dates, or specific metrics that are provably false
- Do NOT claim expertise the candidate cannot defend in an interview (e.g., don't add "10 years of Kubernetes" for someone with no container orchestration background)
- DO add technologies and skills that a developer with this profile would realistically possess — treat the profile as a MINIMUM representation, not a MAXIMUM
- DO use broader industry terms (e.g., "RESTful APIs" instead of just "Express.js", "database design" instead of just "MongoDB") to maximize keyword surface area
- DO interpret project experience generously — if someone built authentication, they know JWT AND session-based auth AND security best practices, even if only "JWT" is listed

OUTPUT FORMAT:
Return ONLY a raw JSON object. No markdown, no backticks, no explanation text, no 未知 tags. Do not wrap in \`\`\`json. The JSON must strictly match this structure:
{
  "extracted_requirements": {
    "company_name": "...",
    "skills": ["..."],
    "tools": ["..."],
    "soft_traits": ["..."],
    "domain": ["..."]
  },
  "enhancement_tags": ["tag1", "tag2"],
  "summary": "...",
  "projects": [
    {
      "title": "Project Name",
      "tech": ["Tech1", "Tech2"],
      "points": ["Detail about the project..."]
    }
  ],
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "role": "...",
      "company": "...",
      "location": "...",
      "duration": "...",
      "points": ["...", "..."]
    }
  ]
}`;

type Mode = 'standard' | 'tech';
type ProfileType = typeof PROFILE;

export async function generateResume(
  jobText: string,
  profile: ProfileType,
  apiKey: string,
  model?: string,
  mode: Mode = 'standard'
): Promise<{
  summary: string;
  skills: string[];
  projects: Array<{ title: string; tech: string[]; points: string[] }>;
  experience: Array<{
    role: string;
    company: string;
    location: string;
    duration: string;
    points: string[];
  }>;
  extractedSkills: string[];
  companyName: string;
}> {

  // ── Select prompt & profile ───────────────────────────────────────────────
  const systemPrompt = mode === 'tech' ? TECH_SYSTEM_PROMPT : STANDARD_SYSTEM_PROMPT;
  const baseProfile = mode === 'tech' ? TECH_PROFILE : PROFILE;

  const userPrompt = `JOB DESCRIPTION:
---
${jobText.slice(0, 4000)}
---

CANDIDATE BASE PROFILE (source of truth — do not append skills/experience not grounded in this):
---
${JSON.stringify(baseProfile, null, 2)}
---

INSTRUCTIONS:
1. Follow the 5-step process exactly to produce a highly tailored, non-generic resume.
2. Ensure you achieve 20-30% textual variation from the base profile by successfully reframing bullets.
3. Every bullet point and summary sentence should feel engineered specifically for THIS job.
4. Keep all company names, roles, and dates exactly as they appear in the base profile.
5. Output ONLY the raw JSON object — nothing else before or after it.`;

  // ── API call ──────────────────────────────────────────────────────────────

  logger.aiRequestStarted(jobText.length);

  try {
    let attempt = 0;
    const maxAttempts = 2;
    let temperature = 0.2;
    let parsed: any = null;

    while (attempt < maxAttempts) {
      attempt++;

      const currentModel = model || 'gemini-3-flash-preview';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUSER PROMPT:\n${userPrompt}${attempt > 1 ? '\n\nCRITICAL FEEDBACK: Your previous attempt was basically a carbon copy of the base profile. You MUST aggressively reframe the bullets and rewrite the summary this time to achieve at least 30% variation while remaining truthful.' : ''}` }]
            }
          ],
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: mode === 'tech' ? 8000 : 4000
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        
        if ((response.status === 429 || response.status === 404) && attempt < maxAttempts) {
          logger.aiRetry(`Gemini error ${response.status}. Retrying with gemini-1.5-flash.`);
          model = 'gemini-1.5-flash';
          continue;
        }
        
        throw new Error(`Gemini API error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      let content: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      logger.aiResponseReceived(content.length > 0, content.length);

      // Strip thinking tags emitted by reasoning models
      content = content
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
        .trim();

      if (!content) {
        throw new Error('Empty response content from Gemini');
      }

      // Extract the first valid JSON object from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.aiJsonInvalid('No JSON block found in response');
        throw new Error('No JSON found in Gemini response');
      }

      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        logger.aiParseError(String(parseErr));
        throw new Error('Failed to parse Gemini JSON');
      }

      // Validate basic shape
      if (!parsed.summary || !Array.isArray(parsed.skills) || !Array.isArray(parsed.experience)) {
        logger.aiJsonInvalid('Missing required fields: summary, skills, or experience');
        throw new Error('Gemini response missing required fields');
      }

      // If it's the first attempt, check similarity with base profile experience bullets
      if (attempt < maxAttempts) {
        const baseBullets = baseProfile.experience.flatMap(e => e.points.map(p => p.trim().toLowerCase()));
        const generatedBullets = parsed.experience.flatMap((e: any) => e.points.map((p: string) => p.trim().toLowerCase()));
        
        let identicalCount = 0;
        for (const gb of generatedBullets) {
          if (baseBullets.includes(gb)) identicalCount++;
        }
        
        const similarityRatio = generatedBullets.length > 0 ? identicalCount / generatedBullets.length : 0;
        
        if (similarityRatio > 0.75) {
          logger.aiRetry(`Similarity ${Math.round(similarityRatio * 100)}% > 75%.`);
          temperature = 0.5; // Increase temperature for more variation
          continue;
        }
      }
      
      // Sufficiently different or hit max attempts
      break;
    }

    const rawExtracted = {
      reqSkills: parsed.extracted_requirements?.skills || [],
      reqTools: parsed.extracted_requirements?.tools || [],
      reqSoftTraits: parsed.extracted_requirements?.soft_traits || [],
      enhancementTags: Array.isArray(parsed.enhancement_tags) ? parsed.enhancement_tags : [],
      generatedSkills: Array.isArray(parsed.skills) ? parsed.skills : [],
      projectTech: (Array.isArray(parsed.projects) ? parsed.projects : [])
        .flatMap((p: any) => Array.isArray(p.tech) ? p.tech : [])
    };

    console.log('[EXTRACTED_SKILLS_SOURCES]', JSON.stringify(rawExtracted, null, 2));

    let extractedSkills = Array.from(new Set([
      ...rawExtracted.reqSkills,
      ...rawExtracted.reqTools,
      ...rawExtracted.reqSoftTraits,
      ...rawExtracted.enhancementTags
    ]));

    // Fallback: if AI didn't return extraction data, derive from generated skills + project tech
    if (extractedSkills.length === 0) {
      extractedSkills = Array.from(new Set([
        ...rawExtracted.generatedSkills,
        ...rawExtracted.projectTech
      ]));
    }

    console.log('[EXTRACTED_SKILLS_FINAL]', extractedSkills.length, 'skills:', extractedSkills);

    return {
      summary: parsed.summary,
      skills: parsed.skills,
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      experience: parsed.experience,
      extractedSkills,
      companyName: parsed.extracted_requirements?.company_name || 'Resume'
    };

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.aiParseError(msg);

    // Graceful fallback — return original profile content unchanged
    return {
      summary: baseProfile.summary,
      skills: baseProfile.skills,
      projects: baseProfile.projects ? [...baseProfile.projects] : [],
      experience: baseProfile.experience,
      extractedSkills: [],
      companyName: 'Resume'
    };
  }
}
