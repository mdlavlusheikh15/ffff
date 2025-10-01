

"use client"

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Student, Teacher, BookInventoryItem } from "@/lib/data";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, query, orderBy, runTransaction, Timestamp } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { MonthlyFeeCollection, AdmissionSessionFeeCollection, ExamFeeCollection } from "./fee-collection-forms";


interface FeeCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  defaultTab?: 'monthly' | 'admission' | 'exam';
  defaultMonth?: string;
  showTabs?: boolean;
}

type Exam = {
  id: string;
  name: string;
  startDate: Timestamp;
};


export default function FeeCollectionDialog({ isOpen, onClose, student, defaultTab = 'monthly', defaultMonth, showTabs = true }: FeeCollectionDialogProps) {
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [inventoryItems, setInventoryItems] = React.useState<BookInventoryItem[]>([]);
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [feeSettings, setFeeSettings] = React.useState<any>({});
  const [loading, setLoading] = React.useState(true);
  const db = getFirestore(app);
  
  React.useEffect(() => {
    const fetchPrerequisites = async () => {
        if (!isOpen) return;
        setLoading(true);
        try {
            const teachersSnapshot = await getDocs(collection(db, "teachers"));
            setTeachers(teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher)));
            
            const inventorySnapshot = await getDocs(collection(db, "inventory"));
            setInventoryItems(inventorySnapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id } as BookInventoryItem)));
            
            const examQuery = query(collection(db, "exams"), orderBy("startDate", "desc"));
            const examsSnapshot = await getDocs(examQuery);
            setExams(examsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));

            const settingsDocRef = doc(db, "settings", "general");
            const settingsDocSnap = await getDoc(settingsDocRef);
            if (settingsDocSnap.exists()) {
                setFeeSettings(settingsDocSnap.data() || {});
            }

        } catch (error) {
            console.error("Error fetching prerequisites:", error);
        } finally {
            setLoading(false);
        }
    }
    fetchPrerequisites();
  }, [isOpen, db])


  if (!student) return null;
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    if (!showTabs) {
        if (defaultTab === 'monthly') {
            return <MonthlyFeeCollection student={student} teachers={teachers} feeSettings={feeSettings} onClose={onClose} defaultMonth={defaultMonth} />;
        }
        if (defaultTab === 'admission') {
            return <AdmissionSessionFeeCollection student={student} teachers={teachers} inventoryItems={inventoryItems} feeSettings={feeSettings} onClose={onClose} />;
        }
        if (defaultTab === 'exam') {
            return <ExamFeeCollection student={student} teachers={teachers} exams={exams} feeSettings={feeSettings} onClose={onClose} />;
        }
    }
    
    return (
        <Tabs defaultValue={defaultTab}>
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="monthly">মাসিক ফি</TabsTrigger>
                <TabsTrigger value="admission">ভর্তি / সেশন ফি</TabsTrigger>
                <TabsTrigger value="exam">পরীক্ষার ফি</TabsTrigger>
            </TabsList>
            <TabsContent value="monthly">
                <MonthlyFeeCollection student={student} teachers={teachers} feeSettings={feeSettings} onClose={onClose} defaultMonth={defaultMonth} />
            </TabsContent>
            <TabsContent value="admission">
                <AdmissionSessionFeeCollection student={student} teachers={teachers} inventoryItems={inventoryItems} feeSettings={feeSettings} onClose={onClose} />
            </TabsContent>
            <TabsContent value="exam">
                <ExamFeeCollection student={student} teachers={teachers} exams={exams} feeSettings={feeSettings} onClose={onClose} />
            </TabsContent>
        </Tabs>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>ফি সংগ্রহ করুন: {student.name}</DialogTitle>
          <DialogDescription>
            রোল: {student.roll} | শ্রেণী: {student.class} - {student.section}
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
