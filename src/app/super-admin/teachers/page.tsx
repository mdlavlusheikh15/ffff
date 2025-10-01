
"use client"

import * as React from "react";
import Link from "next/link";
import { 
  PlusCircle, 
  RefreshCcw, 
  Search,
  Pencil,
  Trash2,
  Loader2,
  Contact
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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
import { type Teacher } from "@/lib/data";
import { collection, getDocs, getFirestore, deleteDoc, doc, query, orderBy, onSnapshot } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function TeachersPage() {
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [nameSearch, setNameSearch] = React.useState("");
  const [subjectSearch, setSubjectSearch] = React.useState("");

  const db = getFirestore(app);
  const { toast } = useToast();
  const router = useRouter();

  const fetchTeachers = React.useCallback(() => {
    setLoading(true);
    const q = query(collection(db, "teachers"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const teachersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher));
        setTeachers(teachersData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching teachers: ", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch teachers." });
        setLoading(false);
    });
    return unsubscribe;
  }, [db, toast]);

  React.useEffect(() => {
    const unsubscribe = fetchTeachers();
    return () => unsubscribe();
  }, [fetchTeachers]);

  const handleDelete = async (teacherId: string) => {
    try {
        await deleteDoc(doc(db, "teachers", teacherId));
        toast({
            title: "সফল",
            description: "শিক্ষক সফলভাবে মুছে ফেলা হয়েছে।",
        });
    } catch (error) {
        console.error("Error deleting teacher: ", error);
        toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: "শিক্ষক মুছে ফেলতে একটি সমস্যা হয়েছে।",
        });
    }
  };

  const handleEditClick = (teacherId: string) => {
    router.push(`/super-admin/teachers/edit/${teacherId}`);
  };

  const filteredTeachers = React.useMemo(() => {
    return teachers.filter(teacher => {
        const nameMatch = teacher.name?.toLowerCase().includes(nameSearch.toLowerCase());
        const subjectMatch = teacher.subject?.toLowerCase().includes(subjectSearch.toLowerCase());
        return nameMatch && subjectMatch;
    });
  }, [teachers, nameSearch, subjectSearch]);


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>সকল শিক্ষক</CardTitle>
          <div className="flex items-center gap-2">
            <Link href="/super-admin/teachers/add">
                <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> শিক্ষক যোগ করুন</Button>
            </Link>
            <Button variant="outline" size="icon" onClick={fetchTeachers}><RefreshCcw className="h-4 w-4" /></Button>
             <Link href="/super-admin/teachers/id-card">
                <Button variant="outline" size="icon"><Contact className="h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
        <CardDescription>আপনার প্রতিষ্ঠানের সকল শিক্ষকের তালিকা দেখুন এবং পরিচালনা করুন।</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-muted/20">
          <Input 
            placeholder="নাম দিয়ে খুঁজুন" 
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
          />
          <Input 
            placeholder="বিষয় দিয়ে খুঁজুন" 
            value={subjectSearch}
            onChange={(e) => setSubjectSearch(e.target.value)}
          />
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ছবি</TableHead>
                <TableHead>নাম</TableHead>
                <TableHead>পদবি</TableHead>
                <TableHead>বিষয়</TableHead>
                <TableHead>ফোন</TableHead>
                <TableHead>ইমেইল</TableHead>
                <TableHead className="w-[120px]">ক্রিয়াকলাপ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={teacher.avatar} alt={teacher.name} data-ai-hint="teacher photo" />
                        <AvatarFallback>{teacher.name?.charAt(0) || 'T'}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>{teacher.designation || 'N/A'}</TableCell>
                    <TableCell>{teacher.subject}</TableCell>
                    <TableCell>{teacher.phone}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={() => handleEditClick(teacher.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                              <AlertDialogDescription>
                                এই কাজটি ফিরিয়ে আনা যাবে না। এটি আপনার ডেটা থেকে শিক্ষককে স্থায়ীভাবে মুছে ফেলবে।
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>বাতিল</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(teacher.id)}>
                                মুছে ফেলুন
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
               ) : (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        কোনো শিক্ষক পাওয়া যায়নি।
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
