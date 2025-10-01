
"use client"

import * as React from "react";
import { BrainCircuit, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getAttendanceInsights } from "./actions";
import type { AnalyzeAttendanceOutput } from "@/ai/flows/attendance-insights-and-truancy-detection";
import { studentData } from "@/lib/data";

export default function InsightsPage() {
  const [loading, setLoading] = React.useState(false);
  const [insights, setInsights] = React.useState<AnalyzeAttendanceOutput | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setInsights(null);
    const result = await getAttendanceInsights();
    if ("error" in result) {
      setError(result.error);
    } else {
      setInsights(result);
    }
    setLoading(false);
  };

  const getStudentName = (studentId: string) => {
    return studentData.find(s => s.id === studentId)?.name || studentId;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>উপস্থিতির অন্তর্দৃষ্টি এবং স্কুল পালানো সনাক্তকরণ</CardTitle>
          <CardDescription>
            ছাত্রদের উপস্থিতির ডেটা বিশ্লেষণ করে সম্ভাব্য স্কুল পালানোর প্যাটার্ন শনাক্ত করতে কৃত্রিম বুদ্ধিমত্তা ব্যবহার করুন।
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm text-muted-foreground">
              শুরু করতে নিচের বোতামে ক্লিক করুন। সিস্টেমটি সাম্প্রতিক উপস্থিতির রেকর্ড বিশ্লেষণ করবে এবং যেসব ছাত্রের স্কুল পালানোর ঝুঁকি আছে তাদের জন্য সতর্কতা তৈরি করবে।
            </p>
            <Button onClick={handleAnalyze} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  বিশ্লেষণ চলছে...
                </>
              ) : (
                <>
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  হাজিরা বিশ্লেষণ করুন
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>ত্রুটি</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {insights && (
        <Card>
          <CardHeader>
            <CardTitle>বিশ্লেষণের ফলাফল</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.truancyAlerts.length === 0 ? (
              <p>কোনো ছাত্রের স্কুল পালানোর ঝুঁকি পাওয়া যায়নি।</p>
            ) : (
              insights.truancyAlerts.map((alert) => (
                <Alert key={alert.studentId}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>সতর্কতা: {getStudentName(alert.studentId)}</AlertTitle>
                  <AlertDescription>
                    <p>{alert.alertMessage}</p>
                    <p className="font-medium mt-1">অনুপস্থিতির হার: {(alert.truancyRate * 100).toFixed(2)}%</p>
                  </AlertDescription>
                </Alert>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
