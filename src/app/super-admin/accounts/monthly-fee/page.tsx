
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
import { getFirestore, collection, getDocs, query, orderBy, onSnapshot, doc, where, limit } from "firebase/firestore";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/lib/data";
import FeeCollectionDialog from "@/components/fee-collection-dialog";

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

type ClassItem = {
  id: string;
  name: string;
};


export default function MonthlyFeePage() {
    const [allStudents, setAllStudents] = React.useState<Student[]>([]);
    const [studentsWithFees, setStudentsWithFees] = React.useState<StudentFee[]>([]);
    const [classes, setClasses] = React.useState<ClassItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [yearFilter, setYearFilter] = React.useState(new Date().getFullYear().toString());
    const [classFilter, setClassFilter] = React.useState("all");
    const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
    const [selectedMonth, setSelectedMonth] = React.useState<string | undefined>(undefined);
    const [isFeeModalOpen, setIsFeeModalOpen] = React.useState(false);
    const [currentUserRole, setCurrentUserRole] = React.useState<string | null>(null);
    
    const { toast } = useToast();
    const db = getFirestore(app);
    const auth = getAuth(app);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user?.email) {
                const adminQuery = query(collection(db, "admins"), where("email", "==", user.email), limit(1));
                const adminSnapshot = await getDocs(adminQuery);
                if (!adminSnapshot.empty) {
                    setCurrentUserRole(adminSnapshot.docs[0].data().role);
                } else {
                    setCurrentUserRole('teacher');
                }
            }
        });
        return () => unsubscribe();
    }, [auth, db]);

    React.useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const studentsSnapshot = await getDocs(query(collection(db, "students"), orderBy("class"), orderBy("roll")));
                const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Student);
                setAllStudents(studentsData);

                const classesSnapshot = await getDocs(query(collection(db, "classes"), orderBy("numericName")));
                setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassItem)));

            } catch (error) {
                console.error("Error fetching initial data:", error);
                toast({ variant: "destructive", title: "ত্রুটি", description: "প্রাথমিক তথ্য আনতে সমস্যা হয়েছে।" });
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [db, toast]);
    
    React.useEffect(() => {
        if (allStudents.length === 0 || !yearFilter) {
            setStudentsWithFees([]);
            return;
        }

        const filtered = classFilter === 'all' 
            ? allStudents 
            : allStudents.filter(s => s.class === classFilter);

        const feeCollectionRef = collection(db, `student_fees/${yearFilter}/students`);
        const unsubscribe = onSnapshot(feeCollectionRef, (snapshot) => {
             const feeDataMap = new Map();
             snapshot.docs.forEach(doc => {
                feeDataMap.set(doc.id, doc.data());
             });

             const studentFeeList = filtered.map(student => {
                 const feeData = feeDataMap.get(student.id) || {};
                 const fees = months.map(month => ({
                     month,
                     status: feeData[month]?.status === 'paid' ? 'paid' : 'due'
                 }));
                 return {
                    id: student.id,
                    roll: student.roll,
                    name: student.name,
                    class: student.class,
                    section: student.section,
                    fees: fees,
                    totalPaid: feeData.totalPaid || 0,
                    totalDonation: feeData.totalDonation || 0,
                 } as StudentFee;
             });
             
             setStudentsWithFees(studentFeeList);
        });

        return () => unsubscribe();
    }, [allStudents, yearFilter, classFilter, db]);

  const handleCollectClick = (studentId: string, month?: string) => {
    const student = allStudents.find(s => s.id === studentId);
    if (student) {
        setSelectedStudent(student);
        setSelectedMonth(month);
        setIsFeeModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsFeeModalOpen(false);
    setSelectedStudent(null);
    setSelectedMonth(undefined);
  };
  
  const isSuperAdmin = currentUserRole === 'super-admin';

  return (
    <>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                  <CardTitle>মাসিক ফি স্ট্যাটাস</CardTitle>
                  <CardDescription>সকল শিক্ষার্থীর মাসিক ফি প্রদানের অবস্থা দেখুন।</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="বছর" /></SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={classFilter} onValueChange={setClassFilter}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="শ্রেণী" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">সকল শ্রেণী</SelectItem>
                            {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
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
                    {isSuperAdmin && <TableHead>মোট অনুদান</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={isSuperAdmin ? 16 : 15} className="h-24 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : studentsWithFees.length > 0 ? (
                    studentsWithFees.map((student) => (
                        <TableRow key={student.id}>
                        <TableCell className="font-medium whitespace-nowrap">{student.name}</TableCell>
                        <TableCell className="whitespace-nowrap">{student.class}-{student.section}</TableCell>
                        {student.fees.map(fee => (
                            <TableCell key={fee.month}>
                            <Badge 
                                variant={fee.status === 'due' ? 'destructive' : 'default'}
                                className={fee.status === 'paid' ? "bg-green-600 hover:bg-green-700" : (fee.status === 'due' ? "cursor-pointer" : "")}
                                onClick={() => fee.status === 'due' && handleCollectClick(student.id, fee.month)}
                            >
                                {fee.status === 'due' ? 'বকেয়া' : 'পরিশোধিত'}
                            </Badge>
                            </TableCell>
                        ))}
                        <TableCell className="whitespace-nowrap font-medium">৳{student.totalPaid.toLocaleString('bn-BD')}</TableCell>
                        {isSuperAdmin && <TableCell className="whitespace-nowrap font-medium">৳{student.totalDonation.toLocaleString('bn-BD')}</TableCell>}
                        </TableRow>
                    ))
                  ) : (
                    <TableRow>
                        <TableCell colSpan={isSuperAdmin ? 16 : 15} className="h-24 text-center">
                          কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি।
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        {selectedStudent && (
            <FeeCollectionDialog
                isOpen={isFeeModalOpen}
                onClose={handleModalClose}
                student={selectedStudent}
                defaultMonth={selectedMonth}
                showTabs={false}
            />
        )}
    </>
  );
}
