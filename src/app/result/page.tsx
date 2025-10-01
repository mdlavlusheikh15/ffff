
"use client"

import * as React from "react"
import MainLayout from "@/app/(main)/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getFirestore, collection, getDocs, query, orderBy, doc, getDoc, where } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Loader2, Download, Wand2, Search, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/lib/data";
import Image from "next/image";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

type Result = {
    studentId: string;
    studentName: string;
    studentRoll: number;
    grade: string;
    totalMarks: number;
    subjectMarks: { [subjectId: string]: number };
    gpa: number;
    position: string;
}

type Subject = {
    id: string;
    name: string;
    code: string;
    marks: string;
}

type DocumentSettings = {
  logoUrl?: string;
  headerContent?: string;
  footerContent?: string;
};

type GeneralSettings = {
    contact?: {
        address?: string;
    };
    academic?: {
        schoolMotto?: string;
        schoolBoard?: string;
        schoolClass?: string;
    }
}

const toBengaliNumerals = (englishNumber: number | string | undefined | null): string => {
    if (englishNumber === undefined || englishNumber === null) return "N/A";
    const englishString = String(englishNumber);
    const bengaliNumerals: { [key: string]: string } = {
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
        '.': '.'
    };
    return englishString.replace(/[0-9.]/g, (d) => bengaliNumerals[d] || d);
}


const ResultDisplay = ({ student, result, subjects, onSearchAgain, examName, schoolInfo }: { student: Student, result: Result, subjects: Subject[], onSearchAgain?: () => void, examName: string, schoolInfo: DocumentSettings & GeneralSettings }) => {
    const resultCardRef = React.useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = React.useState(false);
    
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
    
     const formatGpa = (gpa: number) => {
        if (!gpa) return "N/A";
        const fixedGpa = gpa.toFixed(2);
        return toBengaliNumerals(fixedGpa);
    };

    const handleDownload = async () => {
        const element = resultCardRef.current;
        if (!element) return;
        
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgWidth = pdfWidth;
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`${student.name}-result.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Card className="max-w-4xl mx-auto">
            <div ref={resultCardRef} className="p-6 bg-white">
                <CardHeader className="items-center p-0 mb-4">
                    <div className="w-full relative text-center">
                        {schoolInfo?.logoUrl && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2">
                                <Image src={schoolInfo.logoUrl} alt="School Logo" width={80} height={80} data-ai-hint='school logo'/>
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-blue-900">{schoolInfo?.headerContent || 'ইকরা নূরানী একাডেমী'}</h1>
                            <p className="text-sm">{schoolInfo?.contact?.address || 'চান্দাইকোনা, রায়গঞ্জ, সিরাজগঞ্জ'}</p>
                            <p className="text-xs">স্থাপিতঃ ২০১৮</p>
                        </div>
                    </div>
                     <div className="w-full text-center mt-2">
                        <p className="text-lg font-semibold inline-block border-2 border-gray-800 rounded-md px-4 py-1">{examName}</p>
                        <h2 className="text-xl font-bold mt-1">EXAMINATION RESULT</h2>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm border p-4 rounded-md">
                        <div className="space-y-2">
                            <div className="flex justify-between border-b pb-1">
                                <span className="font-medium">রোল নম্বর</span>
                                <span>{toBengaliNumerals(student.roll)}</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                                <span className="font-medium">বোর্ড</span>
                                <span>{schoolInfo?.academic?.schoolBoard || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                                <span className="font-medium">বিভাগ</span>
                                <span>বিজ্ঞান</span>
                            </div>
                            <div className="flex justify-between pb-1">
                                <span className="font-medium">ফলাফল</span>
                                <span className="font-bold">{result.grade === 'F' ? 'FAILED' : 'PASSED'}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between border-b pb-1">
                                <span className="font-medium">নাম</span>
                                <span>{student.name}</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                                <span className="font-medium">বাবার নাম</span>
                                <span>{student.fatherName}</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                                <span className="font-medium">মায়ের নাম</span>
                                <span>{student.motherName}</span>
                            </div>
                            <div className="flex justify-between pb-1">
                                <span className="font-medium">জন্ম তারিখ</span>
                                <span>{student.dob ? toBengaliNumerals(format(new Date(student.dob), "dd/MM/yyyy")) : "N/A"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-lg font-bold text-center mb-2">STATEMENT OF MARKS</h3>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-center">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2 text-left border">SL</th>
                                        <th className="p-2 text-left border">SUBJECT CODE</th>
                                        <th className="p-2 text-left border">NAME OF SUBJECTS</th>
                                        <th className="p-2 border">FULL MARKS</th>
                                        <th className="p-2 border">OBTAINED MARKS</th>
                                        <th className="p-2 border">LETTER GRADE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjects.map((subject, index) => {
                                        const mark = result.subjectMarks[subject.id] || 0;
                                        const totalMarks = Number(subject.marks) || 100;
                                        const grade = getGrade(mark, totalMarks);
                                        return (
                                            <tr key={subject.id} className="border-b">
                                                <td className="p-2 text-left border">{toBengaliNumerals(index + 1)}</td>
                                                <td className="p-2 text-left border">{toBengaliNumerals(subject.code)}</td>
                                                <td className="p-2 text-left border">{subject.name}</td>
                                                <td className="p-2 border">{toBengaliNumerals(totalMarks)}</td>
                                                <td className="p-2 border">{toBengaliNumerals(mark)}</td>
                                                <td className="p-2 border">{grade}</td>
                                            </tr>
                                        )
                                    })}
                                    <tr className="font-bold bg-gray-50">
                                        <td colSpan={4} className="p-2 text-right border">সর্বমোট নম্বর</td>
                                        <td className="p-2 border">{toBengaliNumerals(result.totalMarks)}</td>
                                        <td className="p-2 border"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 mt-4 gap-4">
                        <div className="border rounded-md p-2 text-center">
                            <p className="font-bold">GPA</p>
                            <p className="text-lg">{formatGpa(result.gpa)}</p>
                        </div>
                         <div className="border rounded-md p-2 text-center">
                            <p className="font-bold">CLASS POSITION</p>
                            <p className="text-lg">{toBengaliNumerals(result.position)}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-end mt-20 text-center">
                        <div>
                            <p className="border-t border-gray-400 pt-1 px-4">Guardian</p>
                        </div>
                         <div>
                            <p className="border-t border-gray-400 pt-1 px-4">Class Teacher</p>
                        </div>
                         <div>
                             <Image src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=result" alt="QR Code" width={60} height={60} />
                             <p className="text-xs">Scan for details</p>
                         </div>
                         <div>
                            <p className="border-t border-gray-400 pt-1 px-4">Principal</p>
                        </div>
                    </div>
                     <p className="text-xs text-left mt-2">Print Date: {toBengaliNumerals(format(new Date(), "dd/MM/yyyy"))}</p>
                </CardContent>
            </div>
            <CardFooter className="justify-center mt-4 gap-4 print:hidden">
                <Button onClick={handleDownload} disabled={isDownloading}>
                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                     ডাউনলোড
                </Button>
                {onSearchAgain && (
                  <Button variant="link" onClick={onSearchAgain}>পুনরায় অনুসন্ধান করুন</Button>
                )}
            </CardFooter>
        </Card>
    )
}

export default function ResultPage({ preloadedResult, onSearchAgain }: { preloadedResult?: any, onSearchAgain?: () => void }) {
    const [exams, setExams] = React.useState<Exam[]>([]);
    const [classes, setClasses] = React.useState<ClassItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    
    const [selectedExam, setSelectedExam] = React.useState("");
    const [selectedClass, setSelectedClass] = React.useState("");
    const [selectedSection, setSelectedSection] = React.useState("");
    const [rollNumber, setRollNumber] = React.useState("");
    const [searching, setSearching] = React.useState(false);
    
    const [resultData, setResultData] = React.useState<any>(preloadedResult || null);
    const [schoolInfo, setSchoolInfo] = React.useState<DocumentSettings & GeneralSettings>({});
    const [searchResults, setSearchResults] = React.useState<any[]>([]);

    const db = getFirestore(app);
    const { toast } = useToast();
    
    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, "exams"), where("status", "==", "published"), orderBy("startDate", "desc"));
                const examsSnapshot = await getDocs(q);
                const allExams = examsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
                setExams(allExams);

                const classQuery = query(collection(db, "classes"), orderBy("numericName"));
                const classesSnapshot = await getDocs(classQuery);
                setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassItem)));

                const docSettingsRef = doc(db, "settings", "documents");
                const docSettingsSnap = await getDoc(docSettingsRef);
                const generalSettingsRef = doc(db, "settings", "general");
                const generalSettingsSnap = await getDoc(generalSettingsRef);

                let combinedSettings: DocumentSettings & GeneralSettings = {};
                if (docSettingsSnap.exists()) {
                    combinedSettings = {...combinedSettings, ...docSettingsSnap.data()}
                }
                if (generalSettingsSnap.exists()) {
                    combinedSettings = {...combinedSettings, ...generalSettingsSnap.data()}
                }
                setSchoolInfo(combinedSettings);

            } catch (error) {
                console.error("Error fetching data:", error);
                toast({ variant: "destructive", title: "ত্রুটি", description: "তথ্য আনতে সমস্যা হয়েছে।" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [db, toast]);

    const handleSearch = async () => {
        setSearching(true);
        setSearchResults([]);
        try {
            const resultsDocRef = doc(db, 'exam_results', `${selectedExam}_${selectedClass}`);
            const resultsDocSnap = await getDoc(resultsDocRef);

            if (!resultsDocSnap.exists()) {
                toast({ variant: "destructive", title: "ফলাফল পাওয়া যায়নি", description: "এই পরীক্ষার ফলাফল এখনো প্রকাশ করা হয়নি।" });
                setSearching(false);
                return;
            }

            let results = resultsDocSnap.data().results as Result[];
            
            if (rollNumber) {
                results = results.filter(r => String(r.studentRoll).includes(rollNumber));
            }
            if (selectedSection !== 'all') {
                const studentsQuery = query(collection(db, 'students'), where('class', '==', selectedClass), where('section', '==', selectedSection));
                const studentsSnapshot = await getDocs(studentsQuery);
                const studentIdsInSection = new Set(studentsSnapshot.docs.map(d => d.id));
                results = results.filter(r => studentIdsInSection.has(r.studentId));
            }

            const populatedResults = await Promise.all(results.map(async (res) => {
                const studentSnap = await getDoc(doc(db, 'students', res.studentId));
                return { ...res, student: studentSnap.data() };
            }));

            setSearchResults(populatedResults);

        } catch (error) {
            console.error("Error searching results: ", error);
            toast({ variant: "destructive", title: "ত্রুটি", description: "ফলাফল খুঁজতে একটি সমস্যা হয়েছে।" });
        } finally {
            setSearching(false);
        }
    };
    
    const handleViewSingleResult = async (resultItem: any) => {
        try {
            const subjectsDocRef = doc(db, "exam_subjects", `${selectedExam}_${selectedClass}`);
            const subjectsDocSnap = await getDoc(subjectsDocRef);
             if (!subjectsDocSnap.exists()) {
                toast({ variant: "destructive", title: "ত্রুটি", description: "বিষয় তালিকা পাওয়া যায়নি।" });
                return;
            }

            setResultData({
                student: resultItem.student,
                result: resultItem,
                subjects: subjectsDocSnap.data().subjects,
                examName: exams.find(e => e.id === selectedExam)?.name || ""
            });
        } catch(e) {
             toast({ variant: "destructive", title: "ত্রুটি", description: "ফলাফল দেখাতে সমস্যা হয়েছে।" });
        }
    }

    const availableSections = React.useMemo(() => {
        const currentClass = classes.find(c => c.name === selectedClass);
        return currentClass?.sections || [];
    }, [classes, selectedClass]);
    
    if (resultData) {
        return (
            <MainLayout>
                 <div className="bg-gray-50/50 min-h-[calc(100vh-14rem)] py-12">
                    <ResultDisplay 
                        student={resultData.student} 
                        result={resultData.result}
                        subjects={resultData.subjects}
                        onSearchAgain={() => setResultData(null)}
                        examName={resultData.examName}
                        schoolInfo={schoolInfo}
                    />
                 </div>
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <div className="bg-gray-50/50 min-h-[calc(100vh-14rem)] py-12 space-y-8">
               <Card>
                    <CardHeader>
                        <CardTitle>Search Student Results</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Exam Type</Label>
                            <Select value={selectedExam} onValueChange={setSelectedExam} disabled={loading}>
                                <SelectTrigger><SelectValue placeholder="All Exams" /></SelectTrigger>
                                <SelectContent>
                                    {exams.map(exam => (<SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Select Class</Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass} disabled={loading}>
                                <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (<SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Select Section</Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                                <SelectTrigger><SelectValue placeholder="All Sections" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sections</SelectItem>
                                    {availableSections.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Student Roll</Label>
                            <Input placeholder="Enter Roll..." value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
                        </div>
                        <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleSearch} disabled={searching || !selectedClass || !selectedExam}>
                            {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>} Search
                        </Button>
                         <Button variant="outline" disabled><FileText className="mr-2 h-4 w-4"/> Export</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>All Exam Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Roll</TableHead>
                                        <TableHead>Photo</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Exam Type</TableHead>
                                        <TableHead>Total Marks</TableHead>
                                        <TableHead>GPA</TableHead>
                                        <TableHead>Grade</TableHead>
                                        <TableHead>Position</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {searching ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin"/></TableCell>
                                        </TableRow>
                                    ) : searchResults.length > 0 ? (
                                        searchResults.map(res => (
                                            <TableRow key={res.studentId}>
                                                <TableCell>{res.studentRoll}</TableCell>
                                                <TableCell><Avatar className="h-9 w-9"><AvatarImage src={res.student.avatar}/><AvatarFallback>{res.studentName.charAt(0)}</AvatarFallback></Avatar></TableCell>
                                                <TableCell>{res.studentName}</TableCell>
                                                <TableCell>{res.student.class}</TableCell>
                                                <TableCell>{exams.find(e => e.id === selectedExam)?.name}</TableCell>
                                                <TableCell>{res.totalMarks}</TableCell>
                                                <TableCell>{res.gpa.toFixed(2)}</TableCell>
                                                <TableCell>{res.grade}</TableCell>
                                                <TableCell>{res.position}</TableCell>
                                                <TableCell><Button variant="link" onClick={() => handleViewSingleResult(res)}>View</Button></TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">অনুগ্রহ করে ফলাফল খুঁজুন।</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    )
}
