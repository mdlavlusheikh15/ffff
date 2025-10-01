"use server";

import { analyzeAttendance, type AnalyzeAttendanceOutput } from "@/ai/flows/attendance-insights-and-truancy-detection";
import { attendanceRecordsForAI } from "@/lib/data";

export async function getAttendanceInsights(): Promise<AnalyzeAttendanceOutput | { error: string }> {
  try {
    const result = await analyzeAttendance({
      attendanceRecords: attendanceRecordsForAI,
      threshold: 0.4, // Alert if absence rate is 40% or more
    });
    return result;
  } catch (error) {
    console.error("Error analyzing attendance:", error);
    return { error: "অন্তর্দৃষ্টি বিশ্লেষণ করতে একটি ত্রুটি ঘটেছে।" };
  }
}
