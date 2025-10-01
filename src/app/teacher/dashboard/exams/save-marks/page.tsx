
"use client"

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Zap } from "lucide-react";
import { getFirestore, collection, getDocs, query, orderBy, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/lib/data";

type Exam = {
  id: string;
  name: string;
};

type ClassItem = {
  id: string;
  name: string;
};

type Subject = {
  id: string;
  name: string;
  code: string;
  marks: string;
};

type Result = {
    studentId: string;
    studentName: string;
    studentRoll: number;
    grade: string;
    totalMarks: number;
    subjectMarks: { [subjectId: string]: number };
    gpa: number;
    position: string;
};

const gpaScale: { [grade: string]: number } = {
  "A+": 5.0,
  "A": 4.0,
  "A-": 3.5,
  "B": 3.0,
  "C": 2.0,
  "D": 1.0,
  "F": 0.0,
};

const getGrade = (mark: number, total: number): string => {
    const percentage = (mark / total) * 100;
    if (percentage >= 80) return "A+";
    if (percentage >= 70) return "A";
    if (percentage >= 60) return "A-";
    if (percentage >= 50) return "B";
    if (percentage >= 40) return "C";
    if (percentage >= 33) return "D";
    return "F";
};


export default function SaveMarksPage() {
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [classes, setClasses] = React.useState<ClassItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const [selectedExam, setSelectedExam] = React.useState("");
  const [selectedClass, setSelectedClass] = React.useState("");
  
  const db = getFirestore(app);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const examQuery = query(collection(db, "exams"), orderBy("startDate", "desc"));
        const examsSnapshot = await getDocs(examQuery);
        setExams(examsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));

        const classQuery = query(collection(db, "classes"), orderBy("numericName"));
        const classesSnapshot = await getDocs(classQuery);
        setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassItem)));
      } catch (error) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "ডেটা আনতে সমস্যা হয়েছে।" });
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [db, toast]);

  const handleProcessResults = async () => {
    if (!selectedExam || !selectedClass) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "অনুগ্রহ করে পরীক্ষা এবং শ্রেণী নির্বাচন করুন।" });
        return;
    }
    setIsProcessing(true);

    try {
        // 1. Fetch subjects for the exam and class
        const subjectsDocRef = doc(db, "exam_subjects", `${selectedExam}_${selectedClass}`);
        const subjectsDocSnap = await getDoc(subjectsDocRef);
        if (!subjectsDocSnap.exists()) {
            throw new Error("এই পরীক্ষার জন্য কোনো বিষয় নির্ধারণ করা হয়নি।");
        }
        const subjects = subjectsDocSnap.data().subjects as Subject[];

        // 2. Fetch all students for the class
        const studentQuery = query(collection(db, "students"), where("class", "==", selectedClass), orderBy("roll"));
        const studentsSnapshot = await getDocs(studentQuery);
        const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));

        // 3. Fetch all marks for all subjects
        const allMarks: { [subjectId: string]: { [studentId: string]: number } } = {};
        for (const subject of subjects) {
            const marksDocRef = doc(db, "exam_marks", `${selectedExam}_${selectedClass}_${subject.id}`);
            const marksDocSnap = await getDoc(marksDocRef);
            if (marksDocSnap.exists()) {
                allMarks[subject.id] = marksDocSnap.data().marks || {};
            } else {
                allMarks[subject.id] = {}; // Subject marks not entered
            }
        }

        // 4. Process results for each student
        let processedResults: Result[] = students.map(student => {
            let totalMarks = 0;
            let totalGpaPoints = 0;
            let hasFailed = false;
            const subjectMarks: { [subjectId: string]: number } = {};

            subjects.forEach(subject => {
                const mark = Number(allMarks[subject.id]?.[student.id] || 0);
                subjectMarks[subject.id] = mark;
                totalMarks += mark;
                
                const grade = getGrade(mark, Number(subject.marks));
                if (grade === "F") {
                    hasFailed = true;
                }
                totalGpaPoints += gpaScale[grade] || 0;
            });
            
            const gpa = hasFailed ? 0.0 : totalGpaPoints / subjects.length;
            const finalGrade = hasFailed ? "F" : getGrade(totalMarks, subjects.reduce((sum, s) => sum + Number(s.marks), 0));

            return {
                studentId: student.id,
                studentName: student.name,
                studentRoll: student.roll,
                totalMarks,
                subjectMarks,
                gpa,
                grade: finalGrade,
                position: '' // will be calculated next
            };
        });

        // 5. Calculate positions
        processedResults.sort((a, b) => b.totalMarks - a.totalMarks);
        let currentRank = 1;
        for (let i = 0; i < processedResults.length; i++) {
            if (i > 0 && processedResults[i].totalMarks < processedResults[i-1].totalMarks) {
                currentRank = i + 1;
            }
             if (processedResults[i].grade === 'F') {
                processedResults[i].position = 'N/A';
            } else {
                processedResults[i].position = String(currentRank);
            }
        }
        
        // 6. Save the final results to a single document
        const resultsDocRef = doc(db, 'exam_results', `${selectedExam}_${selectedClass}`);
        await setDoc(resultsDocRef, { results: processedResults });
        
        toast({ title: "সফল", description: `${selectedClass} শ্রেণীর ফলাফল সফলভাবে তৈরি করা হয়েছে।`});

    } catch (error: any) {
        console.error("Error processing results:", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: error.message || "ফলাফল তৈরি করতে সমস্যা হয়েছে।" });
    } finally {
        setIsProcessing(false);
    }
  };


  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>ফলাফল তৈরি করুন</CardTitle>
        <CardDescription>
          পরীক্ষার মার্ক এন্ট্রি শেষ হলে, এখানে চূড়ান্ত ফলাফল, জিপিএ এবং মেধাস্থান তৈরি করুন।
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <Label htmlFor="exam-select">পরীক্ষা</Label>
            <Select value={selectedExam} onValueChange={setSelectedExam} disabled={loading}>
              <SelectTrigger id="exam-select">
                <SelectValue placeholder="পরীক্ষা নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {exams.map(exam => (
                  <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
            <Label htmlFor="class-select">শ্রেণী</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass} disabled={loading}>
              <SelectTrigger id="class-select">
                <SelectValue placeholder="শ্রেণী নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
      </CardContent>
      <CardFooter>
         <Button 
            className="w-full"
            onClick={handleProcessResults} 
            disabled={isProcessing || loading || !selectedExam || !selectedClass}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />}
            ফলাফল তৈরি করুন
        </Button>
      </CardFooter>
    </Card>
  );
}
