

"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getFirestore, collection, getDocs, query, orderBy, doc, getDoc, where } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/lib/data";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import ResultDisplay from "@/app/result/page"; // Re-using the public result page component logic for display

type Exam = {
  id: string;
  name: string;
  status: 'published' | 'unpublished';
};

export default function ParentResultsPage() {
    const [exams, setExams] = React.useState<Exam[]>([]);
    const [children, setChildren] = React.useState<Student[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [view, setView] = React.useState<'search' | 'result'>('search');
    
    const [selectedExam, setSelectedExam] = React.useState("");
    const [selectedChildId, setSelectedChildId] = React.useState("");
    const [searching, setSearching] = React.useState(false);
    
    const [resultData, setResultData] = React.useState<any>(null);
    const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);

    const db = getFirestore(app);
    const auth = getAuth(app);
    const { toast } = useToast();
    
    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if(user) {
                setCurrentUser(user);
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [auth]);

    React.useEffect(() => {
        const fetchInitialData = async (user: FirebaseUser) => {
            setLoading(true);
            try {
                // Fetch published exams
                const examQuery = query(collection(db, "exams"), where("status", "==", "published"), orderBy("startDate", "desc"));
                const examsSnapshot = await getDocs(examQuery);
                setExams(examsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));

                // Fetch children
                const studentQueries = [];
                 if (user.email) {
                    studentQueries.push(query(collection(db, 'students'), where('email', '==', user.email)));
                    studentQueries.push(query(collection(db, 'students'), where('fatherEmail', '==', user.email)));
                }
                if (user.phoneNumber) {
                    studentQueries.push(query(collection(db, 'students'), where('phone', '==', user.phoneNumber)));
                    studentQueries.push(query(collection(db, 'students'), where('fatherPhone', '==', user.phoneNumber)));
                }
                
                const childrenData: Student[] = [];
                const studentIds = new Set<string>();

                for (const q of studentQueries) {
                    const querySnapshot = await getDocs(q);
                    querySnapshot.forEach((doc) => {
                        if (!studentIds.has(doc.id)) {
                            childrenData.push({ id: doc.id, ...doc.data() } as Student);
                            studentIds.add(doc.id);
                        }
                    });
                }
                setChildren(childrenData);

            } catch (error) {
                console.error("Error fetching data:", error);
                toast({ variant: "destructive", title: "ত্রুটি", description: "তথ্য আনতে সমস্যা হয়েছে।" });
            } finally {
                setLoading(false);
            }
        };
        
        if (currentUser) {
            fetchInitialData(currentUser);
        }

    }, [currentUser, db, toast]);

    const handleViewResult = async () => {
        const selectedChild = children.find(c => c.id === selectedChildId);
        if (!selectedExam || !selectedChild) {
            toast({ variant: "destructive", title: "ত্রুটি", description: "অনুগ্রহ করে সকল ঘর পূরণ করুন।" });
            return;
        }
        setSearching(true);
        
        try {
            const resultsDocRef = doc(db, 'exam_results', `${selectedExam}_${selectedChild.class}`);
            const resultsDocSnap = await getDoc(resultsDocRef);

            if (!resultsDocSnap.exists()) {
                toast({ variant: "destructive", title: "ফলাফল পাওয়া যায়নি", description: "এই পরীক্ষার ফলাফল এখনো প্রকাশ করা হয়নি।" });
                setSearching(false);
                return;
            }

            const results = resultsDocSnap.data().results as any[];
            const studentResult = results.find((r: any) => r.studentId === selectedChild.id);

            if (!studentResult) {
                toast({ variant: "destructive", title: "ফলাফল পাওয়া যায়নি", description: "আপনার সন্তানের ফলাফল এই পরীক্ষার জন্য পাওয়া যায়নি।" });
                setSearching(false);
                return;
            }

            const subjectsDocRef = doc(db, "exam_subjects", `${selectedExam}_${selectedChild.class}`);
            const subjectsDocSnap = await getDoc(subjectsDocRef);
            
            if (!subjectsDocSnap.exists()) {
                 toast({ variant: "destructive", title: "ত্রুটি", description: "বিষয় তালিকা পাওয়া যায়নি।" });
                 setSearching(false);
                 return;
            }
            
            const examName = exams.find(e => e.id === selectedExam)?.name || "";

            setResultData({
                student: selectedChild,
                result: studentResult,
                subjects: subjectsDocSnap.data().subjects,
                examName: examName
            });
            setView('result');

        } catch (error) {
            console.error("Error fetching result: ", error);
            toast({ variant: "destructive", title: "ত্রুটি", description: "ফলাফল আনতে একটি সমস্যা হয়েছে।" });
        } finally {
            setSearching(false);
        }
    };
    
    const handleSearchAgain = () => {
        setView('search');
        setResultData(null);
    }

    if (view === 'result' && resultData) {
        return <ResultDisplay preloadedResult={resultData} onSearchAgain={handleSearchAgain} />;
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>ফলাফল দেখুন</CardTitle>
                <CardDescription>আপনার সন্তানের পরীক্ষার ফলাফল দেখতে নিচের ফর্মটি পূরণ করুন।</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="child-select">সন্তান</Label>
                    <Select value={selectedChildId} onValueChange={setSelectedChildId} disabled={loading}>
                        <SelectTrigger id="child-select">
                            <SelectValue placeholder="আপনার সন্তান নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                            {children.map(child => (
                                <SelectItem key={child.id} value={child.id}>{child.name} ({child.class})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="exam-type">পরীক্ষার ধরণ</Label>
                    <Select value={selectedExam} onValueChange={setSelectedExam} disabled={loading}>
                        <SelectTrigger id="exam-type">
                            <SelectValue placeholder="পরীক্ষা নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                            {exams.map(exam => (
                                <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleViewResult} disabled={searching || loading}>
                    {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    ফলাফল দেখুন
                </Button>
            </CardFooter>
        </Card>
    );
}
