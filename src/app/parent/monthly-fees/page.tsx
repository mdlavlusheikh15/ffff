
"use client"

import * as React from "react";
import { Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getFirestore, collection, getDocs, query, orderBy, doc, getDoc, where, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/lib/data";

type FeeStatus = 'paid' | 'due';
type Fee = { month: string; status: FeeStatus };

type StudentFee = {
    id: string;
    roll: number;
    name: string;
    class: string;
    section: string;
    fees: Fee[];
    totalPaid: number;
    totalDonation: number;
}

const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const years = ["2023", "2024", "2025", "2026"];

export default function ParentMonthlyFeePage() {
    const [students, setStudents] = React.useState<StudentFee[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [yearFilter, setYearFilter] = React.useState(new Date().getFullYear().toString());
    const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
    
    const { toast } = useToast();
    const db = getFirestore(app);
    const auth = getAuth(app);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [auth]);

    const fetchData = React.useCallback(async (user: FirebaseUser) => {
        setLoading(true);
        try {
            const studentQueries = [];
            if (user.email) {
                studentQueries.push(query(collection(db, 'students'), where('email', '==', user.email)));
                studentQueries.push(query(collection(db, 'students'), where('fatherEmail', '==', user.email)));
            }
            if (user.phoneNumber) {
                studentQueries.push(query(collection(db, 'students'), where('phone', '==', user.phoneNumber)));
                studentQueries.push(query(collection(db, 'students'), where('fatherPhone', '==', user.phoneNumber)));
            }

            const childrenData: Student[] = [];
            const studentIds = new Set<string>();

            for (const q of studentQueries) {
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach((doc) => {
                    if (!studentIds.has(doc.id)) {
                        childrenData.push({ id: doc.id, ...doc.data() } as Student);
                        studentIds.add(doc.id);
                    }
                });
            }
            
            const unsubscribes = childrenData.map(studentDoc => {
                return onSnapshot(doc(db, `student_fees/${yearFilter}/students`, studentDoc.id), (feeDocSnap) => {
                    const feeData = feeDocSnap.exists() ? feeDocSnap.data() : { totalPaid: 0, totalDonation: 0 };
                    const fees = months.map(month => ({
                        month,
                        status: feeData[month]?.status === 'paid' ? 'paid' : 'due'
                    }));

                    const studentFeeData = {
                        id: studentDoc.id,
                        roll: studentDoc.roll,
                        name: studentDoc.name,
                        class: studentDoc.class,
                        section: studentDoc.section,
                        fees: fees,
                        totalPaid: feeData.totalPaid || 0,
                        totalDonation: feeData.totalDonation || 0,
                    } as StudentFee;

                    setStudents(prevStudents => {
                        const existingIndex = prevStudents.findIndex(s => s.id === studentDoc.id);
                        if (existingIndex > -1) {
                            const newStudents = [...prevStudents];
                            newStudents[existingIndex] = studentFeeData;
                            return newStudents;
                        } else {
                            return [...prevStudents, studentFeeData];
                        }
                    });
                });
            });

            setLoading(false);

            return () => unsubscribes.forEach(unsub => unsub());

        } catch (error) {
            console.error("Error fetching data:", error);
            toast({ variant: "destructive", title: "ত্রুটি", description: "তথ্য আনতে সমস্যা হয়েছে।" });
            setLoading(false);
        }
    }, [db, toast, yearFilter]);

    React.useEffect(() => {
        if (!currentUser) return;
        const unsubscribe = fetchData(currentUser);
        
        return () => {
            if (unsubscribe) {
                unsubscribe.then(unsubFunc => {
                    if (unsubFunc) unsubFunc();
                });
            }
        };
    }, [currentUser, fetchData]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
              <CardTitle>মাসিক ফি স্ট্যাটাস</CardTitle>
              <CardDescription>আপনার সন্তানের মাসিক ফি প্রদানের অবস্থা দেখুন।</CardDescription>
            </div>
            <div className="w-[200px]">
                <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger><SelectValue placeholder="বছর" /></SelectTrigger>
                    <SelectContent>
                        {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>নাম</TableHead>
                <TableHead>শ্রেণি-শাখা</TableHead>
                {months.map(month => <TableHead key={month}>{month}</TableHead>)}
                <TableHead>মোট প্রদত্ত</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={15} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : students.length > 0 ? (
                students.map((student) => (
                    <TableRow key={student.id}>
                    <TableCell className="font-medium whitespace-nowrap">{student.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{student.class}-{student.section}</TableCell>
                    {student.fees.map(fee => (
                        <TableCell key={fee.month}>
                        <Badge 
                            variant={fee.status === 'due' ? 'destructive' : 'default'}
                            className={fee.status === 'paid' ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                            {fee.status === 'due' ? 'বকেয়া' : 'পরিশোধিত'}
                        </Badge>
                        </TableCell>
                    ))}
                    <TableCell className="whitespace-nowrap">৳{student.totalPaid.toLocaleString('bn-BD')}</TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={15} className="h-24 text-center">
                      আপনার সন্তানের জন্য কোনো ফি-এর রেকর্ড পাওয়া যায়নি।
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
