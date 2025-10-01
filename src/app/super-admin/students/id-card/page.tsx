
"use client"

import * as React from "react";
import { useSearchParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getFirestore, collection, getDocs, query, where, doc, getDoc, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Loader2, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

type ClassItem = {
  id: string;
  name: string;
  sections: string[];
};

type IdCardInfo = {
    logoUrl?: string;
    schoolName?: string;
    address?: string;
    validity?: string;
    idCardVersion?: string;
};

const IdCardTemplate = React.forwardRef<HTMLDivElement, { student: Student, info: IdCardInfo }>(({ student, info }, ref) => {
    return (
        <div ref={ref} className="bg-white text-black p-2 rounded-lg" style={{ width: '204px', height: '324px', fontFamily: 'sans-serif' }}>
            <div className="h-full border-2 border-blue-800 rounded-lg flex flex-col items-center p-2 text-center text-[10px] leading-tight">
                <Image src={info.logoUrl || "https://picsum.photos/seed/school-logo/40/40"} alt="Logo" width={32} height={32} />
                <p className="font-bold text-sm mt-1">{info.schoolName || 'ইকরা নূরানী একাডেমী'}</p>
                <p className="text-[8px]">{info.address || 'চান্দাইকোনা, রায়গঞ্জ, সিরাজগঞ্জ'}</p>

                <div className="w-24 h-24 mt-2 border-2 border-blue-800 rounded-md overflow-hidden">
                    <Image src={student.avatar} alt={student.name} width={96} height={96} className="object-cover" />
                </div>
                <p className="mt-2 font-bold text-base bg-blue-800 text-white w-full rounded-md py-1">{student.name}</p>
                
                <div className="text-left mt-2 w-full space-y-0.5">
                    <p><strong>শ্রেণী:</strong> {student.class} ({student.section})</p>
                    <p><strong>রোল:</strong> {student.roll}</p>
                    <p><strong>বাবার নাম:</strong> {student.fatherName}</p>
                    <p><strong>মোবাইল:</strong> {student.phone}</p>
                    <p><strong>রক্তের গ্রুপ:</strong> {student.bloodGroup}</p>
                </div>

                <div className="mt-auto text-center">
                    <p className="font-bold">অধ্যক্ষ</p>
                    <p className="text-[8px] mt-1">কার্ডটি {info.validity || '২০২৫'} পর্যন্ত বৈধ</p>
                </div>
            </div>
        </div>
    );
});
IdCardTemplate.displayName = "IdCardTemplate";


function StudentIdCardContent() {
  const searchParams = useSearchParams();
  const [classes, setClasses] = React.useState<ClassItem[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = React.useState(searchParams.get('class') || "");
  const [selectedSection, setSelectedSection] = React.useState(searchParams.get('section') || "");
  const [selectedStudents, setSelectedStudents] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searching, setSearching] = React.useState(false);
  const [cardInfo, setCardInfo] = React.useState<IdCardInfo>({});
  const [isMounted, setIsMounted] = React.useState(false);


  const db = getFirestore(app);
  const { toast } = useToast();
  const printRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const classQuery = query(collection(db, "classes"), orderBy("numericName"));
        const classesSnapshot = await getDocs(classQuery);
        setClasses(classesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ClassItem)));
        
        const settingsDoc = await getDoc(doc(db, "settings", "documents"));
        if(settingsDoc.exists()) {
            const data = settingsDoc.data();
            setCardInfo({
                logoUrl: data.logoUrl,
                schoolName: data.headerContent,
                address: "চান্দাইকোনা, রায়গঞ্জ, সিরাজগঞ্জ", // Placeholder
                validity: "২০২৫", // Placeholder
            });
        }

      } catch (error) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "প্রাথমিক তথ্য আনতে সমস্যা হয়েছে।" });
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [db, toast]);

  React.useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass || !selectedSection) {
        setStudents([]);
        return;
      }
      setSearching(true);
      setSelectedStudents([]);
      try {
        const studentQuery = query(
          collection(db, "students"),
          where("class", "==", selectedClass),
          where("section", "==", selectedSection)
        );
        const studentsSnapshot = await getDocs(studentQuery);
        const fetchedStudents = studentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Student));
        setStudents(fetchedStudents);
      } catch (error) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "শিক্ষার্থী আনতে সমস্যা হয়েছে। Firestore ইন্ডেক্স চেক করুন।" });
      } finally {
        setSearching(false);
      }
    };
    if (isMounted) {
      fetchStudents();
    }
  }, [selectedClass, selectedSection, db, toast, isMounted]);
  
  const handleSelectAll = (checked: boolean | string) => {
    if (checked) {
      setSelectedStudents(students.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  }
  
  const handleSelectStudent = (id: string, checked: boolean | string) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, id]);
    } else {
      setSelectedStudents(prev => prev.filter(sId => sId !== id));
    }
  }

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printableArea = document.createElement('div');
    printableArea.innerHTML = printContent.innerHTML;

    const printWindow = window.open('', '', 'height=800,width=800');
    if (printWindow) {
        printWindow.document.write('<html><head><title>Print ID Cards</title>');
        printWindow.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; } .card-container { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 5px !important; page-break-inside: avoid !important; } .card-item { border: none !important; } }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(printableArea.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }
  };

  const availableSections = React.useMemo(() => {
    return classes.find(c => c.name === selectedClass)?.sections || [];
  }, [classes, selectedClass]);
  
  const studentsToPrint = students.filter(s => selectedStudents.includes(s.id));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>শিক্ষার্থীর আইডি কার্ড</CardTitle>
          <CardDescription>আইডি কার্ড তৈরি এবং প্রিন্ট করার জন্য শ্রেণী ও শাখা নির্বাচন করুন।</CardDescription>
        </CardHeader>
        <CardContent className="flex items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="class">শ্রেণী</Label>
            {!isMounted || loading ? <Skeleton className="h-10 w-[180px]" /> :
            <Select value={selectedClass} onValueChange={setSelectedClass} disabled={loading}>
              <SelectTrigger id="class" className="w-[180px]"><SelectValue placeholder="শ্রেণী" /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => (<SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
            }
          </div>
          <div className="space-y-2">
            <Label htmlFor="section">শাখা</Label>
            {!isMounted || loading ? <Skeleton className="h-10 w-[180px]" /> :
            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
              <SelectTrigger id="section" className="w-[180px]"><SelectValue placeholder="শাখা" /></SelectTrigger>
              <SelectContent>
                {availableSections.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
            }
          </div>
        </CardContent>
      </Card>
      
      {(selectedClass && selectedSection) && (
        <Card>
            <CardHeader>
                 <div className="flex items-center justify-between">
                    <CardTitle>শিক্ষার্থী নির্বাচন করুন</CardTitle>
                    <Button onClick={handlePrint} disabled={selectedStudents.length === 0}><Printer className="mr-2 h-4 w-4" /> প্রিন্ট করুন</Button>
                </div>
            </CardHeader>
            <CardContent>
                {searching ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : students.length > 0 ? (
                    <>
                        <div className="flex items-center gap-4 border-b pb-4 mb-4">
                            <Checkbox id="select-all" 
                                onCheckedChange={handleSelectAll}
                                checked={students.length > 0 && selectedStudents.length === students.length}
                                indeterminate={selectedStudents.length > 0 && selectedStudents.length < students.length}
                            />
                            <Label htmlFor="select-all">সবাইকে নির্বাচন করুন ({students.length} জন)</Label>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {students.map(student => (
                                <div key={student.id} className="flex items-center space-x-2 border rounded-md p-2">
                                    <Checkbox 
                                        id={`student-${student.id}`} 
                                        checked={selectedStudents.includes(student.id)}
                                        onCheckedChange={(checked) => handleSelectStudent(student.id, checked)}
                                    />
                                    <Label htmlFor={`student-${student.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer">
                                        {student.name} (রোল: {student.roll})
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="text-center text-muted-foreground py-8">এই শ্রেণীতে কোনো শিক্ষার্থী পাওয়া যায়নি।</p>
                )}
            </CardContent>
        </Card>
      )}

      {studentsToPrint.length > 0 && (
         <div className="bg-gray-200 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-4 text-center">প্রিভিউ</h3>
             <div ref={printRef} className="card-container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {studentsToPrint.map(student => (
                    <div key={student.id} className="card-item mx-auto">
                        <IdCardTemplate student={student} info={cardInfo} />
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}

export default function StudentIdCardPage() {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin" /></div>}>
            <StudentIdCardContent />
        </React.Suspense>
    )
}
