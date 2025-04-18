'use server';
/**
 * @fileOverview Parses a resume and extracts information to pre-fill a referral form.
 *
 * - parseResume - A function that takes a resume URL and returns the extracted information.
 * - ParseResumeInput - The input type for the parseResume function, which is the resume URL.
 * - ParseResumeOutput - The return type for the parseResume function, which includes name, email, target company, job role.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ParseResumeInputSchema = z.object({
  resumeUrl: z.string().describe('The URL of the resume file.'),
});
export type ParseResumeInput = z.infer<typeof ParseResumeInputSchema>;

const ParseResumeOutputSchema = z.object({
  name: z.string().describe('The name of the person.'),
  email: z.string().email().describe('The email address of the person.'),
  targetCompany: z.string().describe('The target company for the referral.'),
  jobRole: z.string().describe('The job role the person is applying for.'),
});
export type ParseResumeOutput = z.infer<typeof ParseResumeOutputSchema>;

export async function parseResume(input: ParseResumeInput): Promise<ParseResumeOutput> {
  return parseResumeFlow(input);
}

const resumeParserPrompt = ai.definePrompt({
  name: 'resumeParserPrompt',
  input: {
    schema: z.object({
      resumeUrl: z.string().describe('The URL of the resume file.'),
    }),
  },
  output: {
    schema: z.object({
      name: z.string().describe('The name of the person.'),
      email: z.string().email().describe('The email address of the person.'),
      targetCompany: z.string().describe('The target company for the referral.'),
      jobRole: z.string().describe('The job role the person is applying for.'),
    }),
  },
  prompt: `You are an expert resume parser. Extract the following information from the resume:

- Name
- Email
- Target Company
- Job Role

Resume: {{media url=resumeUrl}}

Make sure the email field is a valid email.
`,
});

const parseResumeFlow = ai.defineFlow<
  typeof ParseResumeInputSchema,
  typeof ParseResumeOutputSchema
>(
  {
    name: 'parseResumeFlow',
    inputSchema: ParseResumeInputSchema,
    outputSchema: ParseResumeOutputSchema,
  },
  async input => {
    const {output} = await resumeParserPrompt(input);
    return output!;
  }
);
