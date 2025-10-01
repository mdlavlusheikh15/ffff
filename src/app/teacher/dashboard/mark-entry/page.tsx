
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
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

export default function MarkEntryPage() {
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [classes, setClasses] = React.useState<ClassItem[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [marks, setMarks] = React.useState<{ [studentId: string]: number | string }>({});
  
  const [loading, setLoading] = React.useState(true);
  const [searching, setSearching] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [selectedExam, setSelectedExam] = React.useState("");
  const [selectedClass, setSelectedClass] = React.useState("");
  const [selectedSubject, setSelectedSubject] = React.useState("");
  
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
        toast({ variant: "destructive", title: "ত্রুটি", description: "প্রাথমিক তথ্য আনতে সমস্যা হয়েছে।" });
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [db, toast]);

  React.useEffect(() => {
    const fetchSubjectsAndStudents = async () => {
      if (!selectedExam || !selectedClass) {
        setSubjects([]);
        setStudents([]);
        return;
      }
      setSearching(true);
      try {
        const subjectsDocRef = doc(db, "exam_subjects", `${selectedExam}_${selectedClass}`);
        const subjectsDocSnap = await getDoc(subjectsDocRef);
        setSubjects(subjectsDocSnap.exists() ? (subjectsDocSnap.data().subjects || []) : []);
        
        const studentQuery = query(collection(db, "students"), where("class", "==", selectedClass), orderBy("roll"));
        const studentsSnapshot = await getDocs(studentQuery);
        setStudents(studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));

      } catch (error) {
         toast({ variant: "destructive", title: "ত্রুটি", description: "বিষয় বা শিক্ষার্থী আনতে সমস্যা হয়েছে।" });
      } finally {
        setSearching(false);
      }
    };
    fetchSubjectsAndStudents();
  }, [selectedExam, selectedClass, db, toast]);
  
  React.useEffect(() => {
    const fetchMarks = async () => {
        if (!selectedExam || !selectedClass || !selectedSubject || students.length === 0) {
            setMarks({});
            return;
        }
        setSearching(true);
        try {
            const marksDocRef = doc(db, "exam_marks", `${selectedExam}_${selectedClass}_${selectedSubject}`);
            const marksDocSnap = await getDoc(marksDocRef);
            if(marksDocSnap.exists()) {
                setMarks(marksDocSnap.data().marks || {});
            } else {
                setMarks({});
            }
        } catch(e) {
            console.error("Error fetching marks:", e);
            setMarks({});
        } finally {
            setSearching(false);
        }
    }
    fetchMarks();
  }, [selectedExam, selectedClass, selectedSubject, students, db]);

  const handleMarkChange = (studentId: string, value: string) => {
    setMarks(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSaveMarks = async () => {
    if (!selectedExam || !selectedClass || !selectedSubject) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "অনুগ্রহ করে পরীক্ষা, শ্রেণী এবং বিষয় নির্বাচন করুন।" });
        return;
    }
    setSaving(true);
    try {
        const marksDocRef = doc(db, "exam_marks", `${selectedExam}_${selectedClass}_${selectedSubject}`);
        await setDoc(marksDocRef, { marks });
        toast({ title: "সফল", description: "মার্ক সফলভাবে সংরক্ষণ করা হয়েছে।" });
    } catch(error) {
        console.error("Error saving marks:", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: "মার্ক সংরক্ষণ করতে সমস্যা হয়েছে।" });
    } finally {
        setSaving(false);
    }
  }
  
  const subjectTotalMarks = subjects.find(s => s.id === selectedSubject)?.marks || 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>পরীক্ষার মার্ক এন্ট্রি</CardTitle>
        <CardDescription>
          শিক্ষার্থীদের পরীক্ষার নম্বর ইনপুট করতে ফর্মটি ব্যবহার করুন।
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label>পরীক্ষা</Label>
            <Select value={selectedExam} onValueChange={setSelectedExam} disabled={loading}>
              <SelectTrigger><SelectValue placeholder="পরীক্ষা নির্বাচন করুন" /></SelectTrigger>
              <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>শ্রেণী</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass} disabled={loading || !selectedExam}>
              <SelectTrigger><SelectValue placeholder="শ্রেণী নির্বাচন করুন" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>বিষয়</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={loading || !selectedClass}>
              <SelectTrigger><SelectValue placeholder="বিষয় নির্বাচন করুন" /></SelectTrigger>
              <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {searching ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin"/></div>
        ) : (selectedClass && selectedExam && selectedSubject) && (
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>রোল</TableHead>
                            <TableHead>নাম</TableHead>
                            <TableHead>মার্ক (মোট {subjectTotalMarks})</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.length > 0 ? (
                            students.map(student => (
                                <TableRow key={student.id}>
                                    <TableCell>{student.roll}</TableCell>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            className="max-w-[120px]"
                                            value={marks[student.id] || ''}
                                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                            max={subjectTotalMarks}
                                            min={0}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    এই শ্রেণীর জন্য কোনো শিক্ষার্থী পাওয়া যায়নি।
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        )}
      </CardContent>
      {(selectedClass && selectedExam && selectedSubject && students.length > 0) && (
        <CardFooter className="justify-end">
            <Button onClick={handleSaveMarks} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                মার্ক সংরক্ষণ করুন
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
