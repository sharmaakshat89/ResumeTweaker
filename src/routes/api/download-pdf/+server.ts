import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generatePDF, type ResumeData } from '$lib/pdf';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const resumeData: ResumeData = await request.json();
    
    const pdfBuffer = await generatePDF(resumeData);
    
    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"'
      }
    });
  } catch (error) {
    return json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
};