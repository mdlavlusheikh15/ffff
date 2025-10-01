
'use server';
/**
 * @fileOverview Analyzes student results to provide comments and suggestions.
 *
 * - analyzeResult - A function that analyzes student results and provides comments.
 * - ResultAnalysisInput - The input type for the analyzeResult function.
 * - ResultAnalysisOutput - The return type for the analyzeResult function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SubjectResultSchema = z.object({
  subjectName: z.string().describe('The name of the subject.'),
  marks: z.number().describe('The marks obtained in the subject.'),
  grade: z.string().describe('The grade obtained in the subject.'),
});

const ResultAnalysisInputSchema = z.object({
    studentName: z.string().describe('The name of the student.'),
    className: z.string().describe("The student's class."),
    examName: z.string().describe('The name of the exam.'),
    totalMarks: z.number().describe('The total marks obtained by the student.'),
    gpa: z.number().describe('The GPA obtained by the student.'),
    position: z.string().describe("The student's rank/position in the class."),
    results: z.array(SubjectResultSchema).describe("An array of the student's results for each subject."),
});

export type ResultAnalysisInput = z.infer<typeof ResultAnalysisInputSchema>;

const ResultAnalysisOutputSchema = z.string().describe("The teacher's comment in Bengali about the student's performance, including suggestions for improvement.");
export type ResultAnalysisOutput = z.infer<typeof ResultAnalysisOutputSchema>;


export async function analyzeResult(input: ResultAnalysisInput): Promise<ResultAnalysisOutput> {
  return analyzeResultFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeResultPrompt',
  input: {schema: ResultAnalysisInputSchema},
  output: {schema: ResultAnalysisOutputSchema},
  prompt: `You are an experienced teacher at a Bangladeshi school. Your task is to analyze a student's exam results and provide a thoughtful, encouraging, and constructive comment in Bengali.

Student Information:
- Name: {{studentName}}
- Class: {{className}}
- Exam: {{examName}}
- Total Marks: {{totalMarks}}
- GPA: {{gpa}}
- Position in Class: {{position}}

Subject-wise Performance:
{{#each results}}
- Subject: {{subjectName}}, Marks: {{marks}}, Grade: {{grade}}
{{/each}}

Based on this information, please provide a detailed analysis.
- Start by congratulating the student if the performance is good.
- Mention subjects where the student has done well.
- Identify subjects where there is room for improvement.
- Provide specific, actionable advice for the weaker subjects. For example, if the student is weak in Math, suggest practicing more, or for a subject like English, suggest reading more.
- Conclude with an encouraging and motivational statement.
- The entire comment must be in fluent, natural-sounding Bengali.
- Do not just list the marks again. Provide a qualitative assessment.
`,
});

const analyzeResultFlow = ai.defineFlow(
  {
    name: 'analyzeResultFlow',
    inputSchema: ResultAnalysisInputSchema,
    outputSchema: ResultAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output || '';
  }
);
