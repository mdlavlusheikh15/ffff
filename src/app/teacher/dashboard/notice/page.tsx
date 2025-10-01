
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
import { Textarea } from "@/components/ui/textarea";
import {
  PlusCircle,
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
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

type Notice = {
  id: string;
  title: string;
  details: string;
  date: string; // YYYY-MM-DD
  author: string;
};

export default function NoticePage() {
  const [notices, setNotices] = React.useState<Notice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  
  // Form state
  const [title, setTitle] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);

  const db = getFirestore(app);
  const auth = getAuth(app);
  const { toast } = useToast();

   React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  React.useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const noticesData = querySnapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Notice)
        );
        setNotices(noticesData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching notices: ", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: "নোটিশ আনতে সমস্যা হয়েছে।" });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db, toast]);

  const clearForm = () => {
    setTitle("");
    setDetails("");
    setDate(new Date());
  };

  const handleAddNotice = async () => {
    if (!title || !details || !date) {
        toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: "অনুগ্রহ করে শিরোনাম, বিবরণ এবং তারিখ পূরণ করুন।",
        });
        return;
    }
    setIsSaving(true);
    try {
        await addDoc(collection(db, "notices"), {
            title,
            details,
            date: format(date, "yyyy-MM-dd"),
            author: currentUser?.displayName || currentUser?.email || "কর্তৃপক্ষ",
            createdAt: serverTimestamp(),
        });
        toast({ title: "সফল", description: "নোটিশ সফলভাবে যোগ করা হয়েছে।" });
        clearForm();
        setDialogOpen(false);
    } catch (error) {
        console.error("Error adding notice: ", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: "নোটিশ যোগ করতে সমস্যা হয়েছে।" });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDeleteNotice = async (id: string) => {
     try {
        await deleteDoc(doc(db, "notices", id));
        toast({ title: "সফল", description: "নোটিশ সফলভাবে মুছে ফেলা হয়েছে।" });
    } catch (error) {
        console.error("Error deleting notice: ", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: "নোটিশ মুছে ফেলতে সমস্যা হয়েছে।" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>নোটিশ বোর্ড</CardTitle>
           <Button onClick={() => setDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                নতুন নোটিশ যোগ করুন
            </Button>
        </div>
        <CardDescription>
          আপনার প্রতিষ্ঠানের সকল নোটিশ দেখুন এবং পরিচালনা করুন।
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>শিরোনাম</TableHead>
                <TableHead>লেখক</TableHead>
                <TableHead>তারিখ</TableHead>
                <TableHead>বিবরণ</TableHead>
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
                ) : notices.map((notice) => (
                <TableRow key={notice.id}>
                    <TableCell className="font-medium">{notice.title}</TableCell>
                    <TableCell>{notice.author}</TableCell>
                    <TableCell>{format(new Date(notice.date), "dd MMM, yyyy")}</TableCell>
                    <TableCell className="max-w-xs truncate">{notice.details}</TableCell>
                    <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteNotice(notice.id)}>
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
             <DialogTitle>নতুন নোটিশ যোগ করুন</DialogTitle>
           </DialogHeader>
            <div className="grid gap-6 py-4">
                <div className="space-y-2">
                    <Label htmlFor="title">শিরোনাম*</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="নোটিশের শিরোনাম"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="details">বিবরণ*</Label>
                    <Textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="নোটিশের সম্পূর্ণ বিবরণ" rows={5}/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="date">তারিখ*</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            id="date"
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal",!date && "text-muted-foreground")}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>একটি তারিখ বাছুন</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus/>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
           <DialogFooter>
             <DialogClose asChild><Button variant="outline">বাতিল</Button></DialogClose>
             <Button onClick={handleAddNotice} disabled={isSaving}>
               {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
               প্রকাশ করুন
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
    </Card>
  );
}
