
"use client"

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Loader2,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Exam = {
  id: string;
  name: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: "published" | "unpublished";
};

export default function ManageExamsPage() {
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingExam, setEditingExam] = React.useState<Exam | null>(null);
  
  // Form state
  const [name, setName] = React.useState("");
  const [startDate, setStartDate] = React.useState<Date | undefined>();
  const [endDate, setEndDate] = React.useState<Date | undefined>();

  const [isSaving, setIsSaving] = React.useState(false);

  const db = getFirestore(app);
  const { toast } = useToast();

  React.useEffect(() => {
    const q = query(collection(db, "exams"), orderBy("startDate", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const examsData = querySnapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Exam)
        );
        setExams(examsData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching exams: ", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: "পরীক্ষার তালিকা আনতে সমস্যা হয়েছে।" });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db, toast]);

  const handleOpenDialog = (exam: Exam | null) => {
    setEditingExam(exam);
    if (exam) {
      setName(exam.name);
      setStartDate(exam.startDate.toDate());
      setEndDate(exam.endDate.toDate());
    } else {
      setName("");
      setStartDate(undefined);
      setEndDate(undefined);
    }
    setDialogOpen(true);
  };
  
  const handleSave = async () => {
    if (!name || !startDate || !endDate) {
        toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: "অনুগ্রহ করে সকল আবশ্যকীয় ঘর পূরণ করুন।",
        });
        return;
    }
    setIsSaving(true);
    const examData = { 
        name, 
        startDate: Timestamp.fromDate(startDate), 
        endDate: Timestamp.fromDate(endDate),
        status: editingExam?.status || 'unpublished' // Preserve status on edit
    };

    try {
        if (editingExam) {
            const examDoc = doc(db, "exams", editingExam.id);
            await setDoc(examDoc, examData, { merge: true });
            toast({ title: "সফল", description: "পরীক্ষা সফলভাবে আপডেট করা হয়েছে।" });
        } else {
            await addDoc(collection(db, "exams"), examData);
            toast({ title: "সফল", description: "নতুন পরীক্ষা সফলভাবে যোগ করা হয়েছে।" });
        }
        setDialogOpen(false);
    } catch (error) {
        console.error("Error saving exam: ", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: "পরীক্ষা সংরক্ষণ করতে সমস্যা হয়েছে।" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
     try {
        await deleteDoc(doc(db, "exams", id));
        toast({ title: "সফল", description: "পরীক্ষা সফলভাবে মুছে ফেলা হয়েছে।" });
    } catch (error) {
        console.error("Error deleting exam: ", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: "পরীক্ষা মুছে ফেলতে সমস্যা হয়েছে।" });
    }
  };
  
  const handleTogglePublish = async (exam: Exam) => {
    const newStatus = exam.status === 'published' ? 'unpublished' : 'published';
    try {
      const examDoc = doc(db, "exams", exam.id);
      await setDoc(examDoc, { status: newStatus }, { merge: true });
      toast({ title: "সফল", description: `পরীক্ষা সফলভাবে ${newStatus === 'published' ? 'প্রকাশিত' : 'অপ্রকাশিত'} করা হয়েছে।` });
    } catch(error) {
      console.error("Error toggling publish status:", error);
      toast({ variant: "destructive", title: "ত্রুটি", description: "স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে।" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>পরীক্ষা পরিচালনা</CardTitle>
          <Button onClick={() => handleOpenDialog(null)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            নতুন পরীক্ষা যোগ করুন
          </Button>
        </div>
        <CardDescription>
          আপনার প্রতিষ্ঠানের সকল পরীক্ষা যোগ, সম্পাদনা এবং পরিচালনা করুন।
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>পরীক্ষার নাম</TableHead>
                <TableHead>শুরুর তারিখ</TableHead>
                <TableHead>শেষের তারিখ</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
                <TableHead className="text-right">ক্রিয়াকলাপ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.name}</TableCell>
                  <TableCell>{format(exam.startDate.toDate(), "dd MMM, yyyy")}</TableCell>
                  <TableCell>{format(exam.endDate.toDate(), "dd MMM, yyyy")}</TableCell>
                  <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleTogglePublish(exam)}>
                        {exam.status === 'published' ? <Badge className="bg-green-600 hover:bg-green-700">প্রকাশিত</Badge> : <Badge variant="secondary">অপ্রকাশিত</Badge>}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(exam)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                          <AlertDialogDescription>
                            এই কাজটি ফিরিয়ে আনা যাবে না। এটি আপনার ডেটা থেকে পরীক্ষাটি স্থায়ীভাবে মুছে ফেলবে।
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>বাতিল</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(exam.id)}>
                            মুছে ফেলুন
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExam ? "পরীক্ষা সম্পাদনা করুন" : "নতুন পরীক্ষা যোগ করুন"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
             <div className="space-y-2">
                <Label htmlFor="exam-name">পরীক্ষার নাম*</Label>
                <Input id="exam-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন, বার্ষিক পরীক্ষা" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="start-date">শুরুর তারিখ*</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : <span>একটি তারিখ বাছুন</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="end-date">শেষের তারিখ*</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : <span>একটি তারিখ বাছুন</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">বাতিল</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              {editingExam ? "সংরক্ষণ করুন" : "তৈরি করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
