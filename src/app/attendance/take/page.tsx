
"use client"

import * as React from "react";
import Image from "next/image";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import { Calendar as CalendarIcon, QrCode, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { type Student, type Teacher } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import QRCodeScanner from "@/components/qr-code-scanner";
import { collection, query, where, getDocs, getFirestore, doc, setDoc, getDoc, orderBy, serverTimestamp, onSnapshot } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


type AttendanceStatus = "present" | "absent";
type ClassItem = { id: string; name: string; sections: string[] };

function ManualEntry() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [attendance, setAttendance] = React.useState<Record<string, AttendanceStatus>>({});
  const [students, setStudents] = React.useState<Student[]>([]);
  const [classes, setClasses] = React.useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = React.useState("");
  const [selectedSection, setSelectedSection] = React.useState("");
  
  const [isScannerOpen, setScannerOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const { toast } = useToast();
  const db = getFirestore(app);
  
  const availableSections = React.useMemo(() => {
    return classes.find(c => c.name === selectedClass)?.sections || [];
  }, [classes, selectedClass]);

  React.useEffect(() => {
    const fetchClasses = async () => {
      try {
        const q = query(collection(db, "classes"), orderBy("numericName"));
        const snapshot = await getDocs(q);
        setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassItem)));
      } catch (error) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "ক্লাস তালিকা আনতে সমস্যা হয়েছে।" });
      }
    };
    fetchClasses();
  }, [db, toast]);

  React.useEffect(() => {
    if (!selectedClass || !selectedSection || !date) {
      setStudents([]);
      return;
    }
    setLoading(true);

    const q = query(collection(db, "students"), where("class", "==", selectedClass), where("section", "==", selectedSection));

    const unsubscribeStudents = onSnapshot(q, async (studentSnapshot) => {
      const studentData = studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(studentData);

      // Now fetch existing attendance for this date
      const dateString = format(date, "yyyy-MM-dd");
      const attendanceDocId = `${selectedClass}-${selectedSection}-${dateString}`;
      const attendanceDocRef = doc(db, "attendance", attendanceDocId);
      const attendanceDocSnap = await getDoc(attendanceDocRef);

      const initialAttendance: Record<string, AttendanceStatus> = {};
      if (attendanceDocSnap.exists()) {
          const existingRecords: any[] = attendanceDocSnap.data().records || [];
          studentData.forEach(student => {
              const record = existingRecords.find(r => r.studentId === student.id);
              initialAttendance[student.id] = record ? record.status : "absent";
          });
      } else {
          studentData.forEach(s => { initialAttendance[s.id] = "absent"; });
      }
      setAttendance(initialAttendance);
      setLoading(false);

    }, (error) => {
      console.error("Error fetching students: ", error);
      toast({ variant: "destructive", title: "ত্রুটি", description: "শিক্ষার্থী তালিকা আনতে সমস্যা হয়েছে।" });
      setLoading(false);
    });

    return () => unsubscribeStudents();

  }, [selectedClass, selectedSection, date, db, toast]);


  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };
  
  const handleScan = (studentIdFromQR: string | null) => {
    if (studentIdFromQR) {
        const student = students.find(s => s.id === studentIdFromQR);
        if (student) {
            handleAttendanceChange(studentIdFromQR, "present");
            toast({
            title: "হাজিরা সম্পন্ন",
            description: `${student.name} (${student.class}) কে উপস্থিত হিসেবে চিহ্নিত করা হয়েছে।`,
            });
            setScannerOpen(false);
        } else {
            toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: "এই শিক্ষার্থী বর্তমান তালিকায় নেই। ক্লাস/শাখা পরিবর্তন করে আবার চেষ্টা করুন।",
            });
        }
    } else {
       toast({
          variant: "destructive",
          title: "স্ক্যান ব্যর্থ",
          description: "QR কোড স্ক্যান করা সম্ভব হয়নি। আবার চেষ্টা করুন।",
        });
    }
  };
  
  const handleSubmit = async () => {
    if (!date || students.length === 0) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "অনুগ্রহ করে তারিখ এবং শিক্ষার্থী তালিকা নিশ্চিত করুন।" });
        return;
    }
    setSaving(true);
    const dateString = format(date, "yyyy-MM-dd");
    const docId = `${selectedClass}-${selectedSection}-${dateString}`;
    
    try {
        const attendanceRecords = students.map(student => ({
            studentId: student.id,
            name: student.name,
            roll: student.roll,
            status: attendance[student.id] || 'absent'
        }));

        await setDoc(doc(db, "attendance", docId), {
            class: selectedClass,
            section: selectedSection,
            date: dateString,
            records: attendanceRecords,
            timestamp: serverTimestamp(),
        }, { merge: true });

        toast({ title: "সফল", description: "হাজিরা সফলভাবে জমা দেওয়া হয়েছে।" });
    } catch(error) {
        console.error("Error saving attendance:", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: "হাজিরা জমা দিতে সমস্যা হয়েছে।" });
    } finally {
        setSaving(false);
    }
  };

  return (
     <Card>
      <CardHeader>
        <CardTitle>দৈনিক হাজিরা নিন</CardTitle>
        <CardDescription>ছাত্র-ছাত্রীদের উপস্থিতি এবং অনুপস্থিতি চিহ্নিত করুন।</CardDescription>
        <div className="grid grid-cols-1 md:grid-cols-4 items-end gap-4 pt-4">
            <div className="space-y-2">
              <Label>ক্লাস</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue placeholder="ক্লাস নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>শাখা</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                <SelectTrigger><SelectValue placeholder="শাখা নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>{availableSections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>তারিখ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: bn }) : <span>একটি তারিখ বাছুন</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={bn}/></PopoverContent>
              </Popover>
            </div>
             <div className="flex gap-2">
                <Dialog open={isScannerOpen} onOpenChange={setScannerOpen}>
                    <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" disabled={students.length === 0}>
                        <QrCode className="mr-2 h-4 w-4" />
                        QR স্ক্যান
                    </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>QR কোড স্ক্যান করুন</DialogTitle>
                        </DialogHeader>
                        <QRCodeScanner onScan={handleScan} active={isScannerOpen} />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
             <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin"/></div>
        ) : students.length > 0 ? (
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[80px]">ছবি</TableHead>
                <TableHead>নাম</TableHead>
                <TableHead className="w-[250px]">অবস্থা</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {students.map((student) => (
                <TableRow key={student.id}>
                    <TableCell>
                    <Avatar className="h-10 w-10">
                        <AvatarImage data-ai-hint="student photo" src={student.avatar} alt={student.name}/>
                        <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    </TableCell>
                    <TableCell>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-muted-foreground">
                        {student.class} - রোল {student.roll}
                    </div>
                    </TableCell>
                    <TableCell>
                    <RadioGroup
                        value={attendance[student.id]}
                        onValueChange={(value) => handleAttendanceChange(student.id, value as AttendanceStatus)}
                        className="flex items-center gap-4"
                    >
                        <div className="flex items-center space-x-2">
                        <RadioGroupItem value="present" id={`present-${student.id}`} />
                        <Label htmlFor={`present-${student.id}`}>উপস্থিত</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                        <RadioGroupItem value="absent" id={`absent-${student.id}`} />
                        <Label htmlFor={`absent-${student.id}`}>অনুপস্থিত</Label>
                        </div>
                    </RadioGroup>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        ) : (
            <div className="text-center py-10 text-muted-foreground">অনুগ্রহ করে ক্লাস এবং শাখা নির্বাচন করে শিক্ষার্থী খুঁজুন।</div>
        )}
      </CardContent>
       {students.length > 0 && (
        <CardFooter className="flex justify-end mt-6">
            <Button size="lg" onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                হাজিরা জমা দিন
            </Button>
        </CardFooter>
      )}
    </Card>
  )
}

function QRScannerTab({ userType, active }: { userType: 'student' | 'teacher', active: boolean }) {
    const db = getFirestore(app);
    const { toast } = useToast();

    const handleScan = async (idFromQR: string | null) => {
        if (!idFromQR) {
            toast({
                variant: "destructive",
                title: "স্ক্যান ব্যর্থ",
                description: "QR কোড স্ক্যান করা সম্ভব হয়নি। আবার চেষ্টা করুন।",
            });
            return;
        }

        const collectionName = userType === 'student' ? 'students' : 'teachers';
        const docRef = doc(db, collectionName, idFromQR);

        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const userData = docSnap.data();
                const dateString = format(new Date(), "yyyy-MM-dd");
                const attendanceCollection = userType === 'student' ? `attendance/` : `teacher_attendance`;

                let attendanceDocId: string;
                let attendanceData: any;

                if (userType === 'student') {
                    attendanceDocId = `${userData.class}-${userData.section}-${dateString}`;
                    const attendanceDocRef = doc(db, 'attendance', attendanceDocId);
                    const attendanceDocSnap = await getDoc(attendanceDocRef);
                    
                    const studentListQuery = query(collection(db, 'students'), where('class', '==', userData.class), where('section', '==', userData.section));
                    const studentListSnap = await getDocs(studentListQuery);
                    const studentList = studentListSnap.docs.map(d => ({id: d.id, ...d.data()}));

                    const existingRecords = attendanceDocSnap.exists() ? attendanceDocSnap.data().records : studentList.map(s => ({ studentId: s.id, name: s.name, roll: s.roll, status: 'absent' }));
                    
                    const recordIndex = existingRecords.findIndex((r: any) => r.studentId === idFromQR);

                    if (recordIndex !== -1) {
                        if (existingRecords[recordIndex].status === 'present') {
                           toast({
                                title: "হাজিরা সম্পন্ন",
                                description: `${userData.name} এর হাজিরা ইতিমধ্যে নেওয়া হয়েছে।`,
                           });
                           return; // Already marked as present
                        }
                        existingRecords[recordIndex].status = 'present';
                    } else {
                        // This case is less likely with the new logic but kept for robustness
                        existingRecords.push({ studentId: idFromQR, name: userData.name, roll: userData.roll, status: 'present' });
                    }

                    attendanceData = {
                        class: userData.class,
                        section: userData.section,
                        date: dateString,
                        records: existingRecords,
                        timestamp: serverTimestamp(),
                    };
                    await setDoc(attendanceDocRef, attendanceData, { merge: true });

                } else { // Teacher attendance
                    attendanceDocId = `${idFromQR}-${dateString}`;
                    const attendanceDocRef = doc(db, 'teacher_attendance', attendanceDocId);
                    attendanceData = {
                        teacherId: idFromQR,
                        name: userData.name,
                        date: dateString,
                        status: 'present',
                        timestamp: serverTimestamp(),
                    }
                    await setDoc(attendanceDocRef, attendanceData);
                }

                toast({
                    title: "হাজিরা সম্পন্ন",
                    description: `${userData.name} কে উপস্থিত হিসেবে চিহ্নিত করা হয়েছে।`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "ব্যবহারকারী পাওয়া যায়নি",
                    description: "এই আইডি দিয়ে কোনো ব্যবহারকারী খুঁজে পাওয়া যায়নি।",
                });
            }
        } catch (error) {
            console.error("Error saving attendance:", error);
            toast({ variant: "destructive", title: "ত্রুটি", description: "হাজিরা সংরক্ষণ করতে সমস্যা হয়েছে।" });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{userType === 'student' ? 'শিক্ষার্থীর হাজিরা' : 'শিক্ষকের হাজিরা'}</CardTitle>
                <CardDescription>উপস্থিতির চিহ্ন দিতে ক্যামেরাটির দিকে QR কোডটি ধরুন।</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-8">
                <QRCodeScanner onScan={handleScan} active={active} />
            </CardContent>
        </Card>
    );
}

export default function TakeAttendancePage() {
    const [activeTab, setActiveTab] = React.useState("manual-entry");
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null; // or a loading skeleton
    }

    return (
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
                <TabsTrigger value="student-qr">শিক্ষার্থী QR</TabsTrigger>
                <TabsTrigger value="teacher-qr">শিক্ষক QR</TabsTrigger>
                <TabsTrigger value="manual-entry">ম্যানুয়াল এন্ট্রি</TabsTrigger>
            </TabsList>
            <TabsContent value="student-qr">
                <QRScannerTab userType="student" active={activeTab === 'student-qr'} />
            </TabsContent>
            <TabsContent value="teacher-qr">
                <QRScannerTab userType="teacher" active={activeTab === 'teacher-qr'} />
            </TabsContent>
            <TabsContent value="manual-entry">
                <ManualEntry />
            </TabsContent>
        </Tabs>
    );
}
