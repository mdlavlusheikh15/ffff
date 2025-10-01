
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
import { Loader2, Save } from "lucide-react";
import { getFirestore, collection, getDocs, query, orderBy, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";

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
  type: string;
};

export default function AssignExamSubjectsPage() {
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [classes, setClasses] = React.useState<ClassItem[]>([]);
  const [allSubjects, setAllSubjects] = React.useState<Subject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const [selectedExam, setSelectedExam] = React.useState("");
  const [selectedClass, setSelectedClass] = React.useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = React.useState<string[]>([]);
  
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

        const subjectsQuery = query(collection(db, "subjects"), orderBy("name"));
        const subjectsSnapshot = await getDocs(subjectsQuery);
        setAllSubjects(subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));

      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: "ডেটা আনতে সমস্যা হয়েছে।" });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [db, toast]);

  React.useEffect(() => {
    const fetchAssignedSubjects = async () => {
      if (!selectedExam || !selectedClass) {
        setSelectedSubjectIds([]);
        return;
      }
      try {
        const docRef = doc(db, "exam_subjects", `${selectedExam}_${selectedClass}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // The stored data is an array of subject objects, we need just the IDs
            setSelectedSubjectIds((data.subjects || []).map((s: Subject) => s.id));
        } else {
            setSelectedSubjectIds([]);
        }
      } catch (error) {
        console.error("Error fetching assigned subjects:", error);
        setSelectedSubjectIds([]);
      }
    };
    fetchAssignedSubjects();
  }, [selectedExam, selectedClass, db]);

  const handleSave = async () => {
    if (!selectedExam || !selectedClass) {
      toast({ variant: "destructive", title: "ত্রুটি", description: "অনুগ্রহ করে পরীক্ষা এবং শ্রেণী নির্বাচন করুন।" });
      return;
    }
    setIsSaving(true);
    try {
      const docRef = doc(db, "exam_subjects", `${selectedExam}_${selectedClass}`);
      // We need to store the full subject object, not just the ID
      const subjectsToSave = allSubjects.filter(subject => selectedSubjectIds.includes(subject.id));

      await setDoc(docRef, { subjects: subjectsToSave });
      toast({ title: "সফল", description: "পরীক্ষার বিষয় সফলভাবে সংরক্ষণ করা হয়েছে।" });
    } catch (error) {
      console.error("Error saving assigned subjects:", error);
      toast({ variant: "destructive", title: "ত্রুটি", description: "বিষয় সংরক্ষণ করতে সমস্যা হয়েছে।" });
    } finally {
      setIsSaving(false);
    }
  };

  const subjectOptions: MultiSelectOption[] = allSubjects.map(subject => ({
    value: subject.id,
    label: subject.name,
  }));

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>পরীক্ষার বিষয় নির্ধারণ করুন</CardTitle>
        <CardDescription>
          কোন শ্রেণীর কোন পরীক্ষায় কি কি বিষয় থাকবে তা নির্ধারণ করুন।
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex flex-col sm:flex-row items-end gap-4 p-4 border rounded-lg bg-muted/50">
          <div className="w-full sm:w-auto flex-1 space-y-2">
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
          <div className="w-full sm:w-auto flex-1 space-y-2">
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
        </div>
        
        {selectedExam && selectedClass && (
             <div className="space-y-2">
                <Label className="text-base font-medium">বিষয়সমূহ</Label>
                <MultiSelect
                    options={subjectOptions}
                    selected={selectedSubjectIds}
                    onChange={setSelectedSubjectIds}
                    placeholder="বিষয় নির্বাচন করুন..."
                    className="w-full"
                />
            </div>
        )}
      </CardContent>
      <CardFooter className="justify-end border-t pt-6">
        <Button onClick={handleSave} disabled={isSaving || loading || !selectedExam || !selectedClass}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
            সংরক্ষণ করুন
        </Button>
      </CardFooter>
    </Card>
  );
}
