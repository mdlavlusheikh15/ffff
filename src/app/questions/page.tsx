
"use client"

import * as React from "react";
import MainLayout from "@/app/(main)/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getFirestore, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Loader2, Download, FileQuestion, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Exam = {
  id: string;
  name: string;
  status: 'published' | 'unpublished';
};

type ClassItem = {
  id: string;
  name: string;
  sections: string[];
};

type QuestionPaper = {
    id: string;
    className: string;
    examName: string;
    examId: string;
    year: string;
    subject: string;
    fileUrl: string;
}

const years = ["2023", "2024", "2025", "2026"];

export default function QuestionsPage() {
    const [exams, setExams] = React.useState<Exam[]>([]);
    const [classes, setClasses] = React.useState<ClassItem[]>([]);
    const [questions, setQuestions] = React.useState<QuestionPaper[]>([]);
    const [filteredQuestions, setFilteredQuestions] = React.useState<QuestionPaper[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searching, setSearching] = React.useState(false);
    const [hasSearched, setHasSearched] = React.useState(false);
    
    const [selectedExam, setSelectedExam] = React.useState("");
    const [selectedClass, setSelectedClass] = React.useState("");
    const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear().toString());
    
    const db = getFirestore(app);
    const { toast } = useToast();
    
    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, "exams"), orderBy("startDate", "desc"));
                const examsSnapshot = await getDocs(q);
                const allExams = examsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
                setExams(allExams);

                const classQuery = query(collection(db, "classes"), orderBy("numericName"));
                const classesSnapshot = await getDocs(classQuery);
                setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassItem)));

            } catch (error) {
                console.error("Error fetching data:", error);
                toast({ variant: "destructive", title: "ত্রুটি", description: "তথ্য আনতে সমস্যা হয়েছে।" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [db, toast]);

    const handleViewQuestions = async () => {
        if (!selectedExam || !selectedClass || !selectedYear) {
            toast({ variant: "destructive", title: "ত্রুটি", description: "অনুগ্রহ করে সকল ঘর পূরণ করুন।" });
            return;
        }
        setSearching(true);
        setHasSearched(true);
        
        try {
            const q = query(
                collection(db, "questions"),
                where("examId", "==", selectedExam),
                where("className", "==", selectedClass),
                where("year", "==", selectedYear)
            );
            const querySnapshot = await getDocs(q);
            const fetchedQuestions = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as QuestionPaper));
            setFilteredQuestions(fetchedQuestions);
            
        } catch (error) {
            console.error("Error fetching questions: ", error);
            toast({ variant: "destructive", title: "ত্রুটি", description: "প্রশ্ন আনতে একটি সমস্যা হয়েছে।" });
        } finally {
            setSearching(false);
        }
    };
    
    const handleDownload = (fileUrl: string, fileName: string) => {
        fetch(fileUrl, {
            headers: new Headers({
                'Origin': location.origin
            }),
            mode: 'cors'
        })
        .then(response => response.blob())
        .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(blobUrl);
        })
        .catch(e => {
            console.error("Could not download file:", e);
            toast({ variant: "destructive", title: "ডাউনলোড ব্যর্থ", description: "ফাইলটি ডাউনলোড করা সম্ভব হয়নি।" });
        });
    };


    return (
        <MainLayout>
            <div className="bg-gray-50/50 min-h-[calc(100vh-14rem)] py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl">বিগত বছরের প্রশ্ন</CardTitle>
                        <CardDescription>
                            অনুশীলনের জন্য বিগত বছরের প্রশ্ন খুঁজে দেখুন এবং ডাউনলোড করুন।
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-gray-50/50">
                            <Select value={selectedClass} onValueChange={setSelectedClass} disabled={loading}>
                                <SelectTrigger>
                                    <SelectValue placeholder="শ্রেণী নির্বাচন করুন" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={selectedYear} onValueChange={setSelectedYear} disabled={loading}>
                                <SelectTrigger>
                                    <SelectValue placeholder="বছর নির্বাচন করুন" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={selectedExam} onValueChange={setSelectedExam} disabled={loading}>
                                <SelectTrigger>
                                    <SelectValue placeholder="পরীক্ষা নির্বাচন করুন" />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleViewQuestions} disabled={searching || loading} className="bg-green-600 hover:bg-green-700">
                                {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                প্রশ্ন দেখুন
                            </Button>
                        </div>
                        
                         <div className="mt-8 space-y-4">
                            {searching ? (
                                <div className="flex justify-center items-center h-24">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : hasSearched ? (
                                filteredQuestions.length > 0 ? (
                                    filteredQuestions.map(q => (
                                        <div key={q.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <FileQuestion className="h-6 w-6 text-primary" />
                                                <div>
                                                    <p className="font-semibold">{q.subject || 'সাধারণ প্রশ্ন'}</p>
                                                    <p className="text-sm text-muted-foreground">{q.examName} - {q.year}</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" onClick={() => handleDownload(q.fileUrl, `${q.subject || 'question'}-${q.examName}.pdf`)}>
                                                <Download className="mr-2 h-4 w-4" />
                                                ডাউনলোড
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground">
                                        <p>আপনার নির্বাচনের জন্য কোনো প্রশ্ন পাওয়া যায়নি।</p>
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    <p>অনুগ্রহ করে ফিল্টার নির্বাচন করে প্রশ্ন অনুসন্ধান করুন।</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    )
}
