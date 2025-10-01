
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2, Loader2, RefreshCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFirestore, collection, onSnapshot, addDoc, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Subject {
  id: string;
  name: string;
  code: string;
  type: 'compulsory' | 'optional';
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingSubject, setEditingSubject] = React.useState<Subject | null>(null);
  
  // Form state
  const [subjectName, setSubjectName] = React.useState("");
  const [subjectCode, setSubjectCode] = React.useState("");
  const [subjectType, setSubjectType] = React.useState<'compulsory' | 'optional'>('compulsory');

  const [isSaving, setIsSaving] = React.useState(false);

  const db = getFirestore(app);
  const { toast } = useToast();

  const fetchSubjects = React.useCallback(() => {
    setLoading(true);
    const q = query(collection(db, "subjects"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const subjectsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
        setSubjects(subjectsData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching subjects: ", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: "বিষয় তালিকা আনতে সমস্যা হয়েছে।" });
        setLoading(false);
    });
    return unsubscribe;
  }, [db, toast]);

  React.useEffect(() => {
    const unsubscribe = fetchSubjects();
    return () => unsubscribe();
  }, [fetchSubjects]);

  const handleOpenDialog = (subject: Subject | null) => {
    setEditingSubject(subject);
    if (subject) {
      setSubjectName(subject.name);
      setSubjectCode(subject.code);
      setSubjectType(subject.type);
    } else {
      setSubjectName("");
      setSubjectCode("");
      setSubjectType("compulsory");
    }
    setDialogOpen(true);
  };
  
  const handleSave = async () => {
    if (!subjectName || !subjectCode) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "অনুগ্রহ করে বিষয়ের নাম এবং কোড পূরণ করুন।" });
        return;
    }
    setIsSaving(true);
    const subjectData = { name: subjectName, code: subjectCode, type: subjectType };

    try {
        if (editingSubject) {
            const subjectDoc = doc(db, "subjects", editingSubject.id);
            await setDoc(subjectDoc, subjectData);
            toast({ title: "সফল", description: "বিষয় সফলভাবে আপডেট করা হয়েছে।" });
        } else {
            await addDoc(collection(db, "subjects"), subjectData);
            toast({ title: "সফল", description: "নতুন বিষয় সফলভাবে যোগ করা হয়েছে।" });
        }
        setDialogOpen(false);
    } catch (error) {
        console.error("Error saving subject: ", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: "বিষয় সংরক্ষণ করতে সমস্যা হয়েছে।" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "subjects", id));
      toast({ title: "সফল", description: "বিষয়টি সফলভাবে মুছে ফেলা হয়েছে।" });
    } catch (error) {
       console.error("Error deleting subject: ", error);
       toast({ variant: "destructive", title: "ত্রুটি", description: "বিষয়টি মুছে ফেলতে সমস্যা হয়েছে।" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle>বিষয়সমূহ</CardTitle>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={fetchSubjects} disabled={loading}><RefreshCcw className="h-4 w-4"/></Button>
                <Button onClick={() => handleOpenDialog(null)}><PlusCircle className="mr-2 h-4 w-4" /> নতুন বিষয় যোগ করুন</Button>
            </div>
        </div>
        <CardDescription>আপনার প্রতিষ্ঠানের সকল পাঠ্যবিষয় পরিচালনা করুন।</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>বিষয়ের নাম</TableHead>
                        <TableHead>কোড</TableHead>
                        <TableHead>ধরন</TableHead>
                        <TableHead className="text-right">ক্রিয়াকলাপ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                         <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                            </TableCell>
                        </TableRow>
                    ) : subjects.map((subject) => (
                    <TableRow key={subject.id}>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell>{subject.code}</TableCell>
                        <TableCell>{subject.type === 'compulsory' ? 'আবশ্যিক' : 'ঐচ্ছিক'}</TableCell>
                        <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(subject)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(subject.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
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
                <DialogTitle>{editingSubject ? "বিষয় সম্পাদনা করুন" : "নতুন বিষয় যোগ করুন"}</DialogTitle>
                <DialogDescription>
                    অনুগ্রহ করে বিষয়ের বিবরণ পূরণ করুন।
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subject-name" className="text-right">বিষয়ের নাম</Label>
                    <Input id="subject-name" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subject-code" className="text-right">বিষয় কোড</Label>
                    <Input id="subject-code" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subject-type" className="text-right">ধরন</Label>
                    <Select value={subjectType} onValueChange={(value: 'compulsory' | 'optional') => setSubjectType(value)}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="compulsory">আবশ্যিক</SelectItem>
                            <SelectItem value="optional">ঐচ্ছিক</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">বাতিল</Button>
                </DialogClose>
                <Button onClick={handleSave} disabled={isSaving}>
                     {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingSubject ? "সংরক্ষণ করুন" : "তৈরি করুন"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
