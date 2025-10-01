
"use client"

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFirestore, collection, getDocs, query, doc, getDoc, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Loader2, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Teacher } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

type IdCardInfo = {
    logoUrl?: string;
    schoolName?: string;
    address?: string;
    validity?: string;
    idCardVersion?: string;
};

const TeacherIdCardTemplate = React.forwardRef<HTMLDivElement, { teacher: Teacher, info: IdCardInfo }>(({ teacher, info }, ref) => {
    return (
        <div ref={ref} className="bg-white text-black p-2 rounded-lg" style={{ width: '204px', height: '324px', fontFamily: 'sans-serif' }}>
            <div className="h-full border-2 border-red-800 rounded-lg flex flex-col items-center p-2 text-center text-[10px] leading-tight">
                <Image src={info.logoUrl || "https://picsum.photos/seed/school-logo/40/40"} alt="Logo" width={32} height={32} />
                <p className="font-bold text-sm mt-1">{info.schoolName || 'ইকরা নূরানী একাডেমী'}</p>
                <p className="text-[8px]">{info.address || 'চান্দাইকোনা, রায়গঞ্জ, সিরাজগঞ্জ'}</p>

                <div className="w-24 h-24 mt-2 border-2 border-red-800 rounded-md overflow-hidden">
                    <Image src={teacher.avatar} alt={teacher.name} width={96} height={96} className="object-cover" />
                </div>
                <p className="mt-2 font-bold text-base bg-red-800 text-white w-full rounded-md py-1">{teacher.name}</p>
                <p className="mt-1 font-semibold">{teacher.designation || 'শিক্ষক'}</p>
                
                <div className="text-left mt-2 w-full space-y-0.5">
                    <p><strong>বিষয়:</strong> {teacher.subject}</p>
                    <p><strong>ফোন:</strong> {teacher.phone}</p>
                    <p><strong>রক্তের গ্রুপ:</strong> {teacher.bloodGroup}</p>
                </div>

                <div className="mt-auto text-center">
                    <p className="font-bold">অধ্যক্ষ</p>
                    <p className="text-[8px] mt-1">কার্ডটি {info.validity || '২০২৫'} পর্যন্ত বৈধ</p>
                </div>
            </div>
        </div>
    );
});
TeacherIdCardTemplate.displayName = "TeacherIdCardTemplate";


export default function TeacherIdCardPage() {
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [selectedTeachers, setSelectedTeachers] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [cardInfo, setCardInfo] = React.useState<IdCardInfo>({});

  const db = getFirestore(app);
  const { toast } = useToast();
  const printRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const teacherQuery = query(collection(db, "teachers"), orderBy("name"));
        const teachersSnapshot = await getDocs(teacherQuery);
        setTeachers(teachersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Teacher)));
        
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
        toast({ variant: "destructive", title: "ত্রুটি", description: "তথ্য আনতে সমস্যা হয়েছে।" });
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [db, toast]);
  
  const handleSelectAll = (checked: boolean | string) => {
    if (checked) {
      setSelectedTeachers(teachers.map(t => t.id));
    } else {
      setSelectedTeachers([]);
    }
  }
  
  const handleSelectTeacher = (id: string, checked: boolean | string) => {
    if (checked) {
      setSelectedTeachers(prev => [...prev, id]);
    } else {
      setSelectedTeachers(prev => prev.filter(tId => tId !== id));
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
  
  const teachersToPrint = teachers.filter(t => selectedTeachers.includes(t.id));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>শিক্ষকের আইডি কার্ড</CardTitle>
          <CardDescription>আইডি কার্ড তৈরি এবং প্রিন্ট করার জন্য শিক্ষক নির্বাচন করুন।</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : teachers.length > 0 ? (
                <>
                    <div className="flex items-center justify-between border-b pb-4 mb-4">
                        <div className="flex items-center gap-4">
                            <Checkbox id="select-all" 
                                onCheckedChange={handleSelectAll}
                                checked={teachers.length > 0 && selectedTeachers.length === teachers.length}
                                indeterminate={selectedTeachers.length > 0 && selectedTeachers.length < teachers.length}
                            />
                            <Label htmlFor="select-all">সবাইকে নির্বাচন করুন ({teachers.length} জন)</Label>
                        </div>
                        <Button onClick={handlePrint} disabled={selectedTeachers.length === 0}><Printer className="mr-2 h-4 w-4" /> প্রিন্ট করুন</Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {teachers.map(teacher => (
                            <div key={teacher.id} className="flex items-center space-x-2 border rounded-md p-2">
                                <Checkbox 
                                    id={`teacher-${teacher.id}`} 
                                    checked={selectedTeachers.includes(teacher.id)}
                                    onCheckedChange={(checked) => handleSelectTeacher(teacher.id, checked)}
                                />
                                <Label htmlFor={`teacher-${teacher.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer">
                                    {teacher.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <p className="text-center text-muted-foreground py-8">কোনো শিক্ষক পাওয়া যায়নি।</p>
            )}
        </CardContent>
      </Card>

      {teachersToPrint.length > 0 && (
         <div className="bg-gray-200 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-4 text-center">প্রিভিউ</h3>
             <div ref={printRef} className="card-container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {teachersToPrint.map(teacher => (
                    <div key={teacher.id} className="card-item mx-auto">
                        <TeacherIdCardTemplate teacher={teacher} info={cardInfo} />
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}
