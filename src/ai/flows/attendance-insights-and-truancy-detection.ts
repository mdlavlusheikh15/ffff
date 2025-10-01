
'use server';
/**
 * @fileOverview Analyzes attendance data to identify potential truancy patterns.
 *
 * - analyzeAttendance - A function that analyzes attendance data and identifies potential truancy patterns.
 * - AnalyzeAttendanceInput - The input type for the analyzeAttendance function.
 * - AnalyzeAttendanceOutput - The return type for the analyzeAttendance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeAttendanceInputSchema = z.object({
  attendanceRecords: z.array(
    z.object({
      studentId: z.string().describe('The unique identifier for the student.'),
      date: z.string().describe('The date of the attendance record (YYYY-MM-DD).'),
      isPresent: z.boolean().describe('Whether the student was present or not.'),
    })
  ).describe('An array of attendance records for students.'),
  threshold: z.number().default(0.8).describe('The threshold for truancy detection (0.0 to 1.0).'),
});
export type AnalyzeAttendanceInput = z.infer<typeof AnalyzeAttendanceInputSchema>;

const AnalyzeAttendanceOutputSchema = z.object({
  truancyAlerts: z.array(
    z.object({
      studentId: z.string().describe('The unique identifier for the student.'),
      truancyRate: z.number().describe('The calculated truancy rate for the student (0.0 to 1.0).'),
      alertMessage: z.string().describe('A message in Bengali indicating potential truancy and suggesting intervention.'),
    })
  ).describe('An array of truancy alerts for students exceeding the threshold.'),
});
export type AnalyzeAttendanceOutput = z.infer<typeof AnalyzeAttendanceOutputSchema>;

export async function analyzeAttendance(input: AnalyzeAttendanceInput): Promise<AnalyzeAttendanceOutput> {
  return analyzeAttendanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeAttendancePrompt',
  input: {schema: AnalyzeAttendanceInputSchema},
  output: {schema: AnalyzeAttendanceOutputSchema},
  prompt: `You are an expert in student attendance analysis and truancy detection for a school in Bangladesh.

You are provided with student attendance records and a truancy threshold. Your task is to analyze the attendance data and identify students who may be at risk of truancy.

The output language must be in Bengali.

Attendance Records:
{{#each attendanceRecords}}
- Student ID: {{studentId}}, Date: {{date}}, Present: {{isPresent}}
{{/each}}

Truancy Threshold: {{threshold}}

Analyze the attendance records and identify students whose truancy rate (percentage of days absent) exceeds the given threshold. For each student exceeding the threshold, generate a truancy alert message in Bengali suggesting intervention strategies.

Consider factors such as consistent absences, patterns of absences (e.g., specific days of the week), and overall attendance rate when determining truancy risk.

Output the results in JSON format, including the student ID, truancy rate, and a detailed alert message in Bengali for each student identified as potentially truant.
`,
});

const analyzeAttendanceFlow = ai.defineFlow(
  {
    name: 'analyzeAttendanceFlow',
    inputSchema: AnalyzeAttendanceInputSchema,
    outputSchema: AnalyzeAttendanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
