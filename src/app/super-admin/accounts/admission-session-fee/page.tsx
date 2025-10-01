
"use client"

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
import { Loader2, Search } from "lucide-react";
import { getFirestore, collection, getDocs, query, where, orderBy, doc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/lib/data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import FeeCollectionDialog from "@/components/fee-collection-dialog";


type AdmissionFeeData = {
  id: string; // student id
  name: string;
  admissionNo: string;
  class: string;
  section: string;
  feeType: 'Admission' | 'Session';
  status: 'paid' | 'due' | 'partial';
  totalFee: number;
  totalStock: number;
  feeDeposited: number;
  stockDeposited: number;
  discount: number;
};

type ClassItem = {
  id: string;
  name: string;
};

export default function AdmissionSessionFeePage() {
  const [feeData, setFeeData] = React.useState<AdmissionFeeData[]>([]);
  const [allStudents, setAllStudents] = React.useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = React.useState<Student[]>([]);
  const [classes, setClasses] = React.useState<ClassItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [classFilter, setClassFilter] = React.useState("all");
  const [nameFilter, setNameFilter] = React.useState("");
  const [admissionNoFilter, setAdmissionNoFilter] = React.useState("");
  const [yearFilter, setYearFilter] = React.useState(new Date().getFullYear().toString());
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [isFeeModalOpen, setIsFeeModalOpen] = React.useState(false);

  const db = getFirestore(app);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const studentsSnapshot = await getDocs(query(collection(db, "students"), orderBy("class"), orderBy("roll")));
            const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
            setAllStudents(studentsData);
            setFilteredStudents(studentsData);

            const classesSnapshot = await getDocs(query(collection(db, "classes"), orderBy("numericName")));
            setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassItem)));

        } catch (error) {
            console.error("Error fetching data:", error);
            toast({ variant: "destructive", title: "ত্রুটি", description: "ডেটা আনতে একটি সমস্যা হয়েছে।" });
        }
        setLoading(false);
    };
    fetchData();
  }, [db, toast]);

   React.useEffect(() => {
        let students = allStudents;
        if (classFilter !== "all") {
            students = students.filter(s => s.class === classFilter);
        }
        if (nameFilter) {
            students = students.filter(s => s.name.toLowerCase().includes(nameFilter.toLowerCase()));
        }
        if (admissionNoFilter) {
            students = students.filter(s => s.admissionNo.includes(admissionNoFilter));
        }
        setFilteredStudents(students);
    }, [classFilter, nameFilter, admissionNoFilter, allStudents]);

  const getStatusBadge = (student: Student) => {
    // This is a placeholder. A more robust solution would involve checking fee records.
    // For now, we can use a simple logic.
    return <Badge variant="destructive">বকেয়া</Badge>;
  };
  
  const handleCollectClick = (student: Student) => {
    setSelectedStudent(student);
    setIsFeeModalOpen(true);
  }

  const handleModalClose = () => {
    setIsFeeModalOpen(false);
    setSelectedStudent(null);
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>ভর্তি এবং সেশন ফি</CardTitle>
          <div className="flex items-center gap-4">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="বছর নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="2023">২০২৩</SelectItem>
                    <SelectItem value="2024">২০২৪</SelectItem>
                    <SelectItem value="2025">২০২৫</SelectItem>
                </SelectContent>
              </Select>
          </div>
        </div>
        <CardDescription>
          শিক্ষার্থীদের ভর্তি এবং সেশন ফি সংগ্রহ ও পরিচালনা করুন।
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-muted/20">
             <Input 
              placeholder="শিক্ষার্থীর নাম দিয়ে খুঁজুন" 
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
             <Input 
              placeholder="ভর্তি নম্বর দিয়ে খুঁজুন" 
              value={admissionNoFilter}
              onChange={(e) => setAdmissionNoFilter(e.target.value)}
            />
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="সকল শ্রেণী" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল শ্রেণী</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ভর্তি নং</TableHead>
                <TableHead>নাম</TableHead>
                <TableHead>শ্রেণী</TableHead>
                <TableHead>শাখা</TableHead>
                <TableHead>ফি'র প্রকার</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
                <TableHead>অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.admissionNo}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>{student.section}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.admissionNo?.startsWith('ADMT-') ? 'সেশন ফি' : 'ভর্তি ফি'}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(student)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleCollectClick(student)}>
                        সংগ্রহ করুন
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        কোনো শিক্ষার্থী পাওয়া যায়নি।
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
            defaultTab="admission"
            showTabs={false}
        />
    )}
    </>
  );
}
