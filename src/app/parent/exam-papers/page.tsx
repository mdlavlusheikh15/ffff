
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/lib/data";
import { Loader2, Search, Download, File as FileIcon } from "lucide-react";

type Exam = {
  id: string;
  name: string;
};

type Subject = {
    id: string;
    name: string;
}

export default function ExamPapersPage() {
    const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
    const [children, setChildren] = React.useState<Student[]>([]);
    const [exams, setExams] = React.useState<Exam[]>([]);
    const [subjects, setSubjects] = React.useState<Subject[]>([]);
    
    const [selectedChild, setSelectedChild] = React.useState<string>("");
    const [selectedExam, setSelectedExam] = React.useState<string>("");
    const [selectedSubject, setSelectedSubject] = React.useState<string>("");
    
    const [loading, setLoading] = React.useState(true);
    const [searching, setSearching] = React.useState(false);
    const [examPaperUrls, setExamPaperUrls] = React.useState<Record<string, string[]> | null>(null);
    const [noPaperFound, setNoPaperFound] = React.useState(false);

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

                const examQuery = query(collection(db, "exams"), where("status", "==", "published"));
                const examsSnapshot = await getDocs(examQuery);
                setExams(examsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));
            } catch (error) {
                 toast({ variant: "destructive", title: "ত্রুটি", description: "প্রাথমিক তথ্য আনতে সমস্যা হয়েছে।" });
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchInitialData(currentUser);
        }
    }, [currentUser, db, toast]);
    
     React.useEffect(() => {
        const fetchSubjects = async () => {
            if (!selectedExam || !selectedChild) return;
            const child = children.find(c => c.id === selectedChild);
            if (!child) return;

            try {
                const docRef = doc(db, "exam_subjects", `${selectedExam}_${child.class}`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSubjects(docSnap.data().subjects || []);
                } else {
                    setSubjects([]);
                }
            } catch(e) {
                console.error("Error fetching subjects:", e);
                setSubjects([]);
            }
        };
        fetchSubjects();
    }, [selectedExam, selectedChild, children, db]);

    React.useEffect(() => {
        const searchPapers = async () => {
             if (!selectedChild || !selectedExam || !selectedSubject) {
                setExamPaperUrls(null);
                setNoPaperFound(false);
                return;
            };

            setSearching(true);
            setExamPaperUrls(null);
            setNoPaperFound(false);

            try {
                const papersDocRef = doc(db, "exam_papers", `${selectedExam}_${selectedChild}`);
                const papersDocSnap = await getDoc(papersDocRef);

                if (papersDocSnap.exists()) {
                    const papersData = papersDocSnap.data();
                    let papersFound = false;
                    let urlsToSet: Record<string, string[]> = {};

                    if (selectedSubject === 'all') {
                        // Get all papers for the student for that exam
                         subjects.forEach(subject => {
                            if (papersData[subject.id] && papersData[subject.id].length > 0) {
                                urlsToSet[subject.name] = papersData[subject.id];
                                papersFound = true;
                            }
                        });
                    } else {
                        // Get papers for a specific subject
                        const urls = papersData[selectedSubject] as string[] | undefined;
                        if (urls && urls.length > 0) {
                            const subjectName = subjects.find(s => s.id === selectedSubject)?.name || 'Unknown Subject';
                            urlsToSet[subjectName] = urls;
                            papersFound = true;
                        }
                    }

                    if (papersFound) {
                        setExamPaperUrls(urlsToSet);
                    } else {
                        setNoPaperFound(true);
                    }

                } else {
                    setNoPaperFound(true);
                }
            } catch (error) {
                toast({ variant: "destructive", title: "ত্রুটি", description: "খাতা আনতে সমস্যা হয়েছে।" });
            } finally {
                setSearching(false);
            }
        };

        if (selectedChild && selectedExam && selectedSubject) {
            searchPapers();
        }

    }, [selectedChild, selectedExam, selectedSubject, db, subjects, toast]);
    
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
    <Card>
      <CardHeader>
        <CardTitle>পরীক্ষার খাতা দেখুন</CardTitle>
        <CardDescription>
          আপনার সন্তানের পরীক্ষার খাতা দেখতে নিচের ফর্মটি পূরণ করুন।
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
                <Label>সন্তান</Label>
                <Select value={selectedChild} onValueChange={setSelectedChild} disabled={loading}>
                    <SelectTrigger><SelectValue placeholder="সন্তান নির্বাচন করুন" /></SelectTrigger>
                    <SelectContent>
                        {children.map(child => <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label>পরীক্ষা</Label>
                <Select value={selectedExam} onValueChange={setSelectedExam} disabled={loading}>
                    <SelectTrigger><SelectValue placeholder="পরীক্ষা নির্বাচন করুন" /></SelectTrigger>
                    <SelectContent>
                        {exams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label>বিষয়</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedChild || !selectedExam}>
                    <SelectTrigger><SelectValue placeholder="বিষয় নির্বাচন করুন" /></SelectTrigger>
                    <SelectContent>
                         <SelectItem value="all">সকল বিষয়</SelectItem>
                        {subjects.map(subject => <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="mt-8 border-t pt-8">
            {searching ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin"/></div>
            ) : examPaperUrls ? (
                 <div className="space-y-6">
                    {Object.entries(examPaperUrls).map(([subjectName, urls]) => (
                        <div key={subjectName}>
                            <h3 className="font-semibold text-lg mb-2">{subjectName}</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                {urls.map((url, index) => (
                                     <li key={index} className="flex items-center justify-between p-2 border rounded-md">
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                                            <FileIcon className="h-4 w-4" />
                                            পাতা {index + 1}
                                        </a>
                                        <Button size="sm" variant="outline" onClick={() => handleDownload(url, `${subjectName}-Page-${index + 1}`)}>
                                            <Download className="mr-2 h-4 w-4" />
                                            ডাউনলোড
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            ) : noPaperFound ? (
                 <p className="text-center text-muted-foreground">এই নির্বাচনের জন্য কোনো খাতা আপলোড করা হয়নি।</p>
            ) : (
                <p className="text-center text-muted-foreground">অনুসন্ধান করে পরীক্ষার খাতা দেখুন।</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
