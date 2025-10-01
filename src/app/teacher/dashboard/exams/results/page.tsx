
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Download, Wand2, BookUp } from "lucide-react";
import { getFirestore, collection, getDocs, query, orderBy, doc, getDoc, setDoc, where } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Student, Teacher } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { analyzeResult } from "@/ai/flows/result-analysis-flow";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Image from "next/image";

type Exam = {
  id: string;
  name: string;
  status: "published" | "unpublished";
};

type ClassItem = {
  id: string;
  name: string;
  sections: string[];
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
    teacherComment?: string;
};

type DocumentSettings = {
  logoUrl?: string;
  headerContent?: string;
};

export default function ResultsPage() {
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [classes, setClasses] = React.useState<ClassItem[]>([]);
  const [loadingMeta, setLoadingMeta] = React.useState(true);

  const [selectedExam, setSelectedExam] = React.useState("");
  const [selectedClass, setSelectedClass] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  
  const [results, setResults] = React.useState<Result[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [examStatus, setExamStatus] = React.useState<'published' | 'unpublished' | null>(null);
  const [generatingComment, setGeneratingComment] = React.useState<string | null>(null);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [docSettings, setDocSettings] = React.useState<DocumentSettings>({});

  const db = getFirestore(app);
  const { toast } = useToast();
  const resultsTableRef = React.useRef<HTMLDivElement>(null);


  React.useEffect(() => {
    const fetchMeta = async () => {
      setLoadingMeta(true);
      try {
        const examQuery = query(collection(db, "exams"), orderBy("startDate", "desc"));
        const examsSnapshot = await getDocs(examQuery);
        setExams(examsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));

        const classQuery = query(collection(db, "classes"), orderBy("numericName"));
        const classesSnapshot = await getDocs(classQuery);
        setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassItem)));
        
        const settingsDocRef = doc(db, "settings", "documents");
        const settingsDocSnap = await getDoc(settingsDocRef);
        if (settingsDocSnap.exists()) {
            setDocSettings(settingsDocSnap.data() as DocumentSettings);
        }

      } catch (error) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "মেটাডেটা আনতে সমস্যা হয়েছে।" });
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchMeta();
  }, [db, toast]);
  
  const handleSearch = async () => {
    if (!selectedExam || !selectedClass) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "অনুগ্রহ করে পরীক্ষা এবং শ্রেণী নির্বাচন করুন।" });
        return;
    }
    setSearching(true);
    setResults([]);
    setSubjects([]);

    try {
        const resultsDocRef = doc(db, 'exam_results', `${selectedExam}_${selectedClass}`);
        const resultsDocSnap = await getDoc(resultsDocRef);

        const subjectsDocRef = doc(db, "exam_subjects", `${selectedExam}_${selectedClass}`);
        const subjectsDocSnap = await getDoc(subjectsDocRef);
        
        if (resultsDocSnap.exists()) {
            setResults((resultsDocSnap.data().results as Result[]).sort((a,b) => a.studentRoll - b.studentRoll));
        } else {
             toast({ variant: "destructive", title: "ফলাফল পাওয়া যায়নি", description: "এই পরীক্ষার জন্য কোনো ফলাফল তৈরি করা হয়নি।" });
        }
        
        if (subjectsDocSnap.exists()) {
            setSubjects(subjectsDocSnap.data().subjects as Subject[]);
        }

        const exam = exams.find(e => e.id === selectedExam);
        setExamStatus(exam?.status || 'unpublished');

    } catch (error) {
        console.error("Error searching results:", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: "ফলাফল খুঁজতে সমস্যা হয়েছে।" });
    } finally {
        setSearching(false);
    }
  }
  
  const handleGenerateComment = async (rowIndex: number) => {
    const result = results[rowIndex];
    setGeneratingComment(result.studentId);
    try {
        const student = (await getDoc(doc(db, 'students', result.studentId))).data();
        const exam = exams.find(e => e.id === selectedExam);

        const analysisInput = {
            studentName: result.studentName,
            className: selectedClass,
            examName: exam?.name || "Exam",
            totalMarks: result.totalMarks,
            gpa: result.gpa,
            position: result.position,
            results: subjects.map(s => ({
                subjectName: s.name,
                marks: result.subjectMarks[s.id] || 0,
                grade: "N/A" // Grade calculation can be complex, let AI handle interpretation
            }))
        };
        
        const comment = await analyzeResult(analysisInput);

        const updatedResults = [...results];
        updatedResults[rowIndex].teacherComment = comment;
        setResults(updatedResults);

        // Also save this to Firestore immediately
        const resultsDocRef = doc(db, 'exam_results', `${selectedExam}_${selectedClass}`);
        await setDoc(resultsDocRef, { results: updatedResults }, { merge: true });
        
        toast({ title: "মন্তব্য তৈরি", description: `${result.studentName} এর জন্য মন্তব্য সফলভাবে তৈরি হয়েছে।` });

    } catch (error) {
        console.error("Error generating comment:", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: "মন্তব্য তৈরি করতে সমস্যা হয়েছে।" });
    } finally {
        setGeneratingComment(null);
    }
  };

  const handleTogglePublish = async () => {
    setIsPublishing(true);
    const newStatus = examStatus === 'published' ? 'unpublished' : 'published';
    try {
      const examDoc = doc(db, "exams", selectedExam);
      await setDoc(examDoc, { status: newStatus }, { merge: true });
      
      const updatedExams = exams.map(e => e.id === selectedExam ? {...e, status: newStatus} : e);
      setExams(updatedExams);
      setExamStatus(newStatus);
      
      toast({ title: "সফল", description: `ফলাফল সফলভাবে ${newStatus === 'published' ? 'প্রকাশিত' : 'অপ্রকাশিত'} করা হয়েছে।` });
    } catch(error) {
      console.error("Error toggling publish status:", error);
      toast({ variant: "destructive", title: "ত্রুটি", description: "স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে।" });
    } finally {
      setIsPublishing(false);
    }
  }
  
  const handleExportPdf = async () => {
    const element = resultsTableRef.current;
    if (!element) return;
    setIsExporting(true);
    try {
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = pdfWidth;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`${selectedClass}-${exams.find(e => e.id === selectedExam)?.name}-results.pdf`);

    } catch(e) {
         toast({ variant: "destructive", title: "ত্রুটি", description: "পিডিএফ তৈরি করতে সমস্যা হয়েছে।" });
    } finally {
        setIsExporting(false);
    }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>ফলাফল দেখুন এবং প্রকাশ করুন</CardTitle>
        <CardDescription>
          পরীক্ষা এবং শ্রেণী নির্বাচন করে ফলাফল দেখুন, মন্তব্য করুন এবং প্রকাশ করুন।
        </CardDescription>
        <div className="flex flex-wrap items-end gap-4 pt-4">
          <Select value={selectedClass} onValueChange={setSelectedClass} disabled={loadingMeta}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="শ্রেণী নির্বাচন করুন" /></SelectTrigger>
            <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedExam} onValueChange={setSelectedExam} disabled={loadingMeta}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="পরীক্ষা নির্বাচন করুন" /></SelectTrigger>
            <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={handleSearch} disabled={searching || loadingMeta || !selectedExam || !selectedClass}>
            {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
            ফলাফল খুঁজুন
          </Button>
           {results.length > 0 && (
                <div className="ml-auto flex items-center gap-2">
                     <Button onClick={handleExportPdf} variant="outline" disabled={isExporting}>
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        PDF
                    </Button>
                    <Button onClick={handleTogglePublish} disabled={isPublishing}>
                        {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookUp className="mr-2 h-4 w-4" />}
                        {examStatus === 'published' ? 'অপ্রকাশিত করুন' : 'প্রকাশ করুন'}
                    </Button>
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent>
         {results.length > 0 ? (
            <div className="border rounded-lg overflow-x-auto" ref={resultsTableRef}>
                <div className="p-4 print:block hidden">
                    <div className="flex justify-center items-center gap-4">
                       {docSettings.logoUrl && <Image src={docSettings.logoUrl} alt="Logo" width={60} height={60} />}
                       <div className="text-center">
                            <h3 className="text-2xl font-bold">{docSettings.headerContent || 'ইকরা নূরানী একাডেমী'}</h3>
                            <p>ফলাফল - {exams.find(e => e.id === selectedExam)?.name} - {selectedClass}</p>
                       </div>
                    </div>
                </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>রোল</TableHead>
                    <TableHead>নাম</TableHead>
                    {subjects.map(s => <TableHead key={s.id}>{s.name}</TableHead>)}
                    <TableHead>মোট</TableHead>
                    <TableHead>গ্রেড</TableHead>
                    <TableHead>GPA</TableHead>
                    <TableHead>স্থান</TableHead>
                    <TableHead className="print:hidden">শিক্ষকের মন্তব্য</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={result.studentId}>
                      <TableCell>{result.studentRoll}</TableCell>
                      <TableCell className="font-medium">{result.studentName}</TableCell>
                      {subjects.map(s => <TableCell key={s.id}>{result.subjectMarks[s.id] || '-'}</TableCell>)}
                      <TableCell>{result.totalMarks}</TableCell>
                      <TableCell><Badge variant={result.grade === "F" ? "destructive" : "default"}>{result.grade}</Badge></TableCell>
                      <TableCell>{result.gpa.toFixed(2)}</TableCell>
                      <TableCell>{result.position}</TableCell>
                      <TableCell className="print:hidden">
                        {result.teacherComment ? <p className="text-xs w-48 whitespace-pre-wrap">{result.teacherComment}</p> : (
                            <Button size="sm" variant="outline" onClick={() => handleGenerateComment(index)} disabled={generatingComment === result.studentId}>
                                {generatingComment === result.studentId ? <Loader2 className="h-4 w-4 animate-spin"/> : <Wand2 className="h-4 w-4"/>}
                            </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
         ) : !searching && (
            <div className="h-40 flex items-center justify-center text-muted-foreground">
                ফলাফল দেখতে অনুগ্রহ করে পরীক্ষা এবং শ্রেণী নির্বাচন করুন।
            </div>
         )}
      </CardContent>
    </Card>
  );
}

    