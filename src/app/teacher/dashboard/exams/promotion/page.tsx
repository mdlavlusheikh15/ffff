
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
import { Loader2, ArrowRight } from "lucide-react";
import { getFirestore, collection, getDocs, query, orderBy, where, writeBatch } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

type ClassItem = {
  id: string;
  name: string;
  numericName: string;
};

const sessions = ["2024", "2025", "2026", "2027"];

export default function PromotionPage() {
  const [classes, setClasses] = React.useState<ClassItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isPromoting, setIsPromoting] = React.useState(false);

  const [fromClass, setFromClass] = React.useState("");
  const [toClass, setToClass] = React.useState("");
  const [fromSession, setFromSession] = React.useState(new Date().getFullYear().toString());
  const [toSession, setToSession] = React.useState((new Date().getFullYear() + 1).toString());
  
  const db = getFirestore(app);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const classQuery = query(collection(db, "classes"), orderBy("numericName"));
        const classesSnapshot = await getDocs(classQuery);
        setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassItem)));
      } catch (error) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "শ্রেণী তালিকা আনতে সমস্যা হয়েছে।" });
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [db, toast]);

  const handlePromote = async () => {
    if (!fromClass || !toClass || !fromSession || !toSession) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "অনুগ্রহ করে সকল তথ্য পূরণ করুন।" });
        return;
    }
    setIsPromoting(true);
    try {
        const studentsToPromoteQuery = query(collection(db, "students"), where("class", "==", fromClass));
        const studentsSnapshot = await getDocs(studentsToPromoteQuery);
        
        if (studentsSnapshot.empty) {
            toast({ title: "কোনো শিক্ষার্থী নেই", description: `"${fromClass}" শ্রেণীতে প্রমোট করার জন্য কোনো শিক্ষার্থী পাওয়া যায়নি।` });
            setIsPromoting(false);
            return;
        }

        const batch = writeBatch(db);
        studentsSnapshot.forEach(studentDoc => {
            batch.update(studentDoc.ref, { class: toClass, admissionNo: `ADMT-${toSession}-${Math.floor(1000 + Math.random() * 9000)}` });
        });

        await batch.commit();
        toast({ title: "সফল", description: `${studentsSnapshot.size} জন শিক্ষার্থীকে "${toClass}" শ্রেণীতে সফলভাবে প্রমোট করা হয়েছে।` });

    } catch (error) {
        console.error("Error promoting students:", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: "শিক্ষার্থীদের প্রমোট করতে সমস্যা হয়েছে।" });
    } finally {
        setIsPromoting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>শিক্ষার্থী প্রমোশন</CardTitle>
        <CardDescription>
          একটি শিক্ষাবর্ষ শেষ হলে শিক্ষার্থীদের পরবর্তী শ্রেণীতে প্রমোট করুন।
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4 p-4 border rounded-md bg-muted/20">
            <h3 className="font-semibold">যেখান থেকে প্রমোট হবে</h3>
            <div className="space-y-2">
                <Label>সেশন</Label>
                <Select value={fromSession} onValueChange={setFromSession} disabled={loading}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{sessions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>শ্রেণী</Label>
                <Select value={fromClass} onValueChange={setFromClass} disabled={loading}>
                    <SelectTrigger><SelectValue placeholder="শ্রেণী নির্বাচন করুন" /></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
            </div>
        </div>

        <div className="space-y-4 p-4 border rounded-md bg-muted/20">
            <h3 className="font-semibold">যেখানে প্রমোট হবে</h3>
             <div className="space-y-2">
                <Label>সেশন</Label>
                <Select value={toSession} onValueChange={setToSession} disabled={loading}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{sessions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>শ্রেণী</Label>
                <Select value={toClass} onValueChange={setToClass} disabled={loading}>
                    <SelectTrigger><SelectValue placeholder="শ্রেণী নির্বাচন করুন" /></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
            </div>
        </div>
      </CardContent>
      <CardFooter>
         <Button 
            className="w-full md:w-auto mx-auto" 
            onClick={handlePromote} 
            disabled={isPromoting || loading || !fromClass || !toClass}>
            {isPromoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ArrowRight className="mr-2 h-4 w-4" />}
            প্রমোট করুন
        </Button>
      </CardFooter>
    </Card>
  );
}
