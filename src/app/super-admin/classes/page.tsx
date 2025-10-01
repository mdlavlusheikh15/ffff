
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFirestore, collection, getDocs, addDoc, doc, setDoc, deleteDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface Class {
  id: string;
  name: string;
  numericName: string;
  sections: string[];
}

export default function ClassesPage() {
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingClass, setEditingClass] = React.useState<Class | null>(null);
  const [className, setClassName] = React.useState("");
  const [numericName, setNumericName] = React.useState("");
  const [sections, setSections] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const db = getFirestore(app);
  const { toast } = useToast();

  const fetchClasses = React.useCallback(() => {
    setLoading(true);
    const q = query(collection(db, "classes"), orderBy("numericName"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const classesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
        setClasses(classesData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching classes: ", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch classes." });
        setLoading(false);
    });
    return unsubscribe;
  }, [db, toast]);

  React.useEffect(() => {
    const unsubscribe = fetchClasses();
    return () => unsubscribe();
  }, [fetchClasses]);


  const handleOpenDialog = (cls: Class | null) => {
    setEditingClass(cls);
    if (cls) {
      setClassName(cls.name);
      setNumericName(cls.numericName);
      setSections(cls.sections.join(", "));
    } else {
      setClassName("");
      setNumericName("");
      setSections("");
    }
    setDialogOpen(true);
  };
  
  const handleSave = async () => {
    if (!className || !numericName) {
        toast({ variant: "destructive", title: "Error", description: "Class Name and Numeric Name are required." });
        return;
    }
    setIsSaving(true);
    const sectionsArray = sections.split(',').map(s => s.trim()).filter(s => s);
    const classData = { name: className, numericName, sections: sectionsArray };

    try {
        if (editingClass) {
            const classDoc = doc(db, "classes", editingClass.id);
            await setDoc(classDoc, classData);
            toast({ title: "Success", description: "Class updated successfully." });
        } else {
            await addDoc(collection(db, "classes"), classData);
            toast({ title: "Success", description: "Class added successfully." });
        }
        setDialogOpen(false);
    } catch (error) {
        console.error("Error saving class: ", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to save class." });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "classes", id));
      toast({ title: "Success", description: "Class deleted successfully." });
    } catch (error) {
       console.error("Error deleting class: ", error);
       toast({ variant: "destructive", title: "Error", description: "Failed to delete class." });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle>শ্রেণীসমূহ</CardTitle>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => fetchClasses()} disabled={loading}><RefreshCcw className="h-4 w-4"/></Button>
                <Button onClick={() => handleOpenDialog(null)}><PlusCircle className="mr-2 h-4 w-4" /> শ্রেণী যোগ করুন</Button>
            </div>
        </div>
        <CardDescription>আপনার প্রতিষ্ঠানের সকল শ্রেণী এবং তাদের শাখা পরিচালনা করুন।</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>শ্রেণীর নাম</TableHead>
                    <TableHead>সাংখ্যিক নাম</TableHead>
                    <TableHead>শাখা</TableHead>
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
                    ) : classes.map((cls) => (
                    <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>{cls.numericName}</TableCell>
                        <TableCell>{cls.sections.join(", ")}</TableCell>
                        <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(cls)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(cls.id)}>
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
                <DialogTitle>{editingClass ? "শ্রেণী সম্পাদনা করুন" : "নতুন শ্রেণী যোগ করুন"}</DialogTitle>
                <DialogDescription>
                    অনুগ্রহ করে শ্রেণীর বিবরণ পূরণ করুন।
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="class-name" className="text-right">শ্রেণীর নাম</Label>
                    <Input id="class-name" value={className} onChange={(e) => setClassName(e.target.value)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="numeric-name" className="text-right">সাংখ্যিক নাম</Label>
                    <Input id="numeric-name" value={numericName} onChange={(e) => setNumericName(e.target.value)} className="col-span-3" placeholder="যেমন, 6, 7, 10" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sections" className="text-right">শাখা</Label>
                    <Input id="sections" value={sections} onChange={(e) => setSections(e.target.value)} className="col-span-3" placeholder="কমা দিয়ে আলাদা করুন, যেমন, A, B, C" />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">বাতিল</Button>
                </DialogClose>
                <Button onClick={handleSave} disabled={isSaving}>
                     {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingClass ? "সংরক্ষণ করুন" : "তৈরি করুন"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
