
"use client"

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { getFirestore, collection, getDocs, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import { DateRange } from "react-day-picker";

type AttendanceRecord = {
  studentId: string;
  name: string;
  roll: number;
  status: "present" | "absent";
};

type FullAttendanceRecord = {
    id: string;
    class: string;
    section: string;
    date: string;
    records: AttendanceRecord[];
};

type ClassItem = {
  id: string;
  name: string;
  sections: string[];
};


export default function AllAttendancePage() {
    const [allRecords, setAllRecords] = React.useState<FullAttendanceRecord[]>([]);
    const [classes, setClasses] = React.useState<ClassItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    
    const [selectedClass, setSelectedClass] = React.useState("all");
    const [selectedSection, setSelectedSection] = React.useState("all");
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date(),
    });
    const [isMounted, setIsMounted] = React.useState(false);

    const db = getFirestore(app);
    const { toast } = useToast();

    React.useEffect(() => {
        setIsMounted(true);
    }, []);
    
    React.useEffect(() => {
        const fetchClasses = async () => {
            try {
                const q = query(collection(db, "classes"), orderBy("numericName"));
                const classSnapshot = await getDocs(q);
                setClasses(classSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassItem)));
            } catch (error) {
                console.error("Error fetching classes:", error);
                toast({ variant: "destructive", title: "ত্রুটি", description: "ক্লাস তালিকা আনতে সমস্যা হয়েছে।" });
            }
        };
        fetchClasses();
    }, [db, toast]);

    React.useEffect(() => {
        if (!dateRange?.from || !dateRange?.to) {
            setAllRecords([]);
            return;
        }
        
        setLoading(true);
        let q = query(
            collection(db, "attendance"),
            where("date", ">=", format(dateRange.from, "yyyy-MM-dd")),
            where("date", "<=", format(dateRange.to, "yyyy-MM-dd")),
            orderBy("date", "desc")
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const recordsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FullAttendanceRecord));
            setAllRecords(recordsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching attendance records: ", error);
            toast({ variant: "destructive", title: "ত্রুটি", description: "উপস্থিতি রেকর্ড আনতে সমস্যা হয়েছে। অনুগ্রহ করে আপনার ফায়ারস্টোর ইন্ডেক্স চেক করুন।" });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, toast, dateRange]);
    
    const filteredAndFlattenedRecords = React.useMemo(() => {
        const classFiltered = selectedClass === 'all' 
            ? allRecords 
            : allRecords.filter(rec => rec.class === selectedClass);
        
        const sectionFiltered = selectedSection === 'all'
            ? classFiltered
            : classFiltered.filter(rec => rec.section === selectedSection);

        return sectionFiltered.flatMap(doc => 
            doc.records.map(record => ({
                ...record,
                id: `${doc.id}-${record.studentId}`,
                date: doc.date,
                class: doc.class,
                section: doc.section,
            }))
        ).sort((a,b) => b.date.localeCompare(a.date) || a.roll - b.roll);
    }, [allRecords, selectedClass, selectedSection]);


    const availableSections = React.useMemo(() => {
        return classes.find(c => c.name === selectedClass)?.sections || [];
    }, [classes, selectedClass]);
    

    if (!isMounted) {
        return null;
    }
    
  return (
    <Card>
      <CardHeader>
        <CardTitle>সকল উপস্থিতি</CardTitle>
        <CardDescription>
          এখানে সকল ছাত্র-ছাত্রীর উপস্থিতির রেকর্ড দেখুন।
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="flex flex-wrap items-end gap-4 mb-6 p-4 border rounded-lg bg-gray-50/50">
            <div className="space-y-2">
                <Label>ক্লাস</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-[180px] bg-white"><SelectValue placeholder="ক্লাস নির্বাচন করুন" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">সকল ক্লাস</SelectItem>
                        {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>শাখা</Label>
                 <Select value={selectedSection} onValueChange={setSelectedSection} disabled={selectedClass === 'all'}>
                    <SelectTrigger className="w-[180px] bg-white"><SelectValue placeholder="শাখা নির্বাচন করুন" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">সকল শাখা</SelectItem>
                        {availableSections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>তারিখের সীমা</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn("w-[300px] justify-start text-left font-normal bg-white", !dateRange && "text-muted-foreground")}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                        dateRange.to ? (
                            <>
                            {format(dateRange.from, "LLL dd, y", { locale: bn })} -{" "}
                            {format(dateRange.to, "LLL dd, y", { locale: bn })}
                            </>
                        ) : (
                            format(dateRange.from, "LLL dd, y", { locale: bn })
                        )
                        ) : (
                        <span>একটি তারিখের পরিসীমা বাছুন</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        locale={bn}
                    />
                    </PopoverContent>
                </Popover>
            </div>
         </div>
         <div className="border rounded-lg overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>তারিখ</TableHead>
                        <TableHead>শিক্ষার্থীর নাম</TableHead>
                        <TableHead>রোল</TableHead>
                        <TableHead>ক্লাস</TableHead>
                        <TableHead>শাখা</TableHead>
                        <TableHead>অবস্থা</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                         <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                            </TableCell>
                        </TableRow>
                    ) : filteredAndFlattenedRecords.length > 0 ? (
                        filteredAndFlattenedRecords.map(record => (
                            <TableRow key={record.id}>
                                <TableCell>{format(new Date(record.date), "dd MMM, yyyy", { locale: bn })}</TableCell>
                                <TableCell className="font-medium">{record.name}</TableCell>
                                <TableCell>{record.roll}</TableCell>
                                <TableCell>{record.class}</TableCell>
                                <TableCell>{record.section}</TableCell>
                                <TableCell>
                                    <Badge variant={record.status === 'present' ? 'default' : 'destructive'} className={record.status === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                        {record.status === 'present' ? 'উপস্থিত' : 'অনুপস্থিত'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                         <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                নির্বাচিত ফিল্টারের জন্য কোনো রেকর্ড পাওয়া যায়নি।
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
