
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { getFirestore, collection, getDocs, query, where, addDoc, serverTimestamp, getDoc, doc, limit } from "firebase/firestore";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { format, parseISO } from "date-fns";
import { bn } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type CollectionRecord = {
  id: string;
  studentName: string;
  className: string;
  feeType: string;
  amount: number;
  collectionDate: string; // yyyy-MM-dd
  voucherNo: number;
};

type ReceivingUser = {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function SubmitCollectionPage() {
    const [collections, setCollections] = React.useState<CollectionRecord[]>([]);
    const [receivers, setReceivers] = React.useState<ReceivingUser[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
    const [currentTeacherId, setCurrentTeacherId] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(),
    });
    const [submitTo, setSubmitTo] = React.useState<string>("");

    const db = getFirestore(app);
    const auth = getAuth(app);
    const { toast } = useToast();

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

    React.useEffect(() => {
        const fetchInitialData = async () => {
            if (!currentUser) return;
            setLoading(true);
            try {
                // Fetch current teacher ID
                const teacherQuery = query(collection(db, "teachers"), where("email", "==", currentUser.email), limit(1));
                const teacherSnapshot = await getDocs(teacherQuery);
                let teacherId = null;
                if (!teacherSnapshot.empty) {
                    teacherId = teacherSnapshot.docs[0].id;
                    setCurrentTeacherId(teacherId);
                }

                // Fetch all potential receivers
                const allReceivers: ReceivingUser[] = [];
                const adminsQuery = query(collection(db, "admins"));
                const adminsSnapshot = await getDocs(adminsQuery);
                adminsSnapshot.forEach(doc => {
                    const data = doc.data();
                    allReceivers.push({ id: doc.id, name: data.name, email: data.email, role: data.role });
                });

                const teachersQuery = query(collection(db, "teachers"));
                const teachersSnapshot = await getDocs(teachersQuery);
                teachersSnapshot.forEach(doc => {
                    const data = doc.data();
                    // Don't add the current teacher to the list of receivers
                    if (doc.id !== teacherId) {
                         allReceivers.push({ id: doc.id, name: data.name, email: data.email, role: 'teacher' });
                    }
                });

                setReceivers(allReceivers);

            } catch (error) {
                console.error("Error fetching initial data:", error);
                toast({ variant: "destructive", title: "ত্রুটি", description: "প্রাথমিক তথ্য আনতে সমস্যা হয়েছে।" });
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchInitialData();
        }
    }, [currentUser, db, toast]);
    
    React.useEffect(() => {
        const fetchCollections = async () => {
             if (!currentTeacherId || !date?.from || !date?.to) {
                setCollections([]);
                return;
             }
            setLoading(true);
            try {
                const collected: CollectionRecord[] = [];
                const studentCache = new Map();

                const fromDate = format(date.from, 'yyyy-MM-dd');
                const toDate = format(date.to, 'yyyy-MM-dd');

                const yearsToQuery = Array.from(new Set([date.from.getFullYear(), date.to.getFullYear()]));

                for (const year of yearsToQuery) {
                     const monthlyFeesRef = collection(db, `student_fees/${year}/students`);
                     const monthlyFeesSnap = await getDocs(query(monthlyFeesRef));
                     
                     for (const docSnap of monthlyFeesSnap.docs) {
                        const data = docSnap.data();
                         for (const month in data) {
                             const monthData = data[month];
                             if(monthData && typeof monthData === 'object' && monthData.collectedBy === currentTeacherId && monthData.collectionDate >= fromDate && monthData.collectionDate <= toDate) {
                                 let studentName = studentCache.get(docSnap.id);
                                 let className = 'Unknown';
                                 if (!studentName) {
                                     const studentDoc = await getDoc(doc(db, 'students', docSnap.id));
                                     if(studentDoc.exists()){
                                         studentName = studentDoc.data().name;
                                         className = studentDoc.data().class;
                                         studentCache.set(docSnap.id, { name: studentName, class: className });
                                     }
                                 } else {
                                     className = studentCache.get(docSnap.id).class;
                                 }
                                 
                                 collected.push({
                                     id: `${docSnap.id}-${month}`,
                                     studentName: studentName || 'Unknown',
                                     className: className,
                                     feeType: `মাসিক ফি - ${month}`,
                                     amount: monthData.paidAmount,
                                     collectionDate: monthData.collectionDate,
                                     voucherNo: monthData.voucherNo,
                                 });
                             }
                         }
                     };
                }
                
                const admissionFeesSnap = await getDocs(query(collection(db, `admission_fees`), where('collectedBy', '==', currentTeacherId), where('lastCollectionDate', '>=', fromDate), where('lastCollectionDate', '<=', toDate)));
                 admissionFeesSnap.forEach(doc => {
                    const data = doc.data();
                    collected.push({
                        id: doc.id,
                        studentName: data.name,
                        className: data.class,
                        feeType: "ভর্তি/সেশন ফি",
                        amount: (data.feeDeposited || 0) + (data.stockDeposited || 0),
                        collectionDate: data.lastCollectionDate,
                        voucherNo: data.voucherNo,
                    });
                });

                const examFeeCollectionsQuery = query(collection(db, `exam_fees`), where('collectedBy', '==', currentTeacherId), where('collectionDate', '>=', fromDate), where('collectionDate', '<=', toDate));
                // This would be a collection group query which is more complex, for now we will assume a simpler structure or skip exam fees in this aggregation.

                setCollections(collected.sort((a, b) => b.voucherNo - a.voucherNo));
            } catch (error) {
                 console.error("Error fetching collections:", error);
                 toast({ variant: "destructive", title: "ত্রুটি", description: "কালেকশন আনতে সমস্যা হয়েছে।" });
            } finally {
                setLoading(false);
            }
        };

        fetchCollections();
    }, [currentTeacherId, date, db, toast]);
    
    const totalCollected = React.useMemo(() => {
        return collections.reduce((sum, item) => sum + item.amount, 0);
    }, [collections]);

    const handleSubmitCollection = async () => {
        if (collections.length === 0 || !submitTo || !currentTeacherId) {
            toast({ variant: 'destructive', title: 'ত্রুটি', description: 'জমা দেওয়ার জন্য কোনো কালেকশন নেই অথবা গ্রহণকারী নির্বাচন করা হয়নি।'});
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "deposits"), {
                submittedBy: currentTeacherId,
                submittedTo: submitTo,
                amount: totalCollected,
                submissionDate: serverTimestamp(),
                collectionIds: collections.map(c => c.id),
                dateRange: { from: format(date?.from!, 'yyyy-MM-dd'), to: format(date?.to!, 'yyyy-MM-dd') },
            });

            toast({ title: 'সফল', description: 'আপনার কালেকশন সফলভাবে জমা দেওয়া হয়েছে।' });
            setCollections([]);
        } catch (error) {
            console.error("Error submitting collection: ", error);
            toast({ variant: 'destructive', title: 'ত্রুটি', description: 'জমা দিতে সমস্যা হয়েছে।'});
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>জমা দিন</CardTitle>
                <CardDescription>
                    আপনার সংগৃহীত ফি দেখুন এবং অ্যাডমিনের কাছে জমা দিন।
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-end gap-4 mb-6 p-4 border rounded-lg bg-gray-50/50">
                    <div className="space-y-2">
                        <Label>তারিখের সীমা</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn("w-[300px] justify-start text-left font-normal bg-white", !date && "text-muted-foreground")}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                date.to ? (
                                    <>
                                    {format(date.from, "LLL dd, y", { locale: bn })} -{" "}
                                    {format(date.to, "LLL dd, y", { locale: bn })}
                                    </>
                                ) : (
                                    format(date.from, "LLL dd, y", { locale: bn })
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
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                locale={bn}
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ভাউচার নং</TableHead>
                                <TableHead>শিক্ষার্থীর নাম</TableHead>
                                <TableHead>শ্রেণী</TableHead>
                                <TableHead>ফি'র প্রকার</TableHead>
                                <TableHead>তারিখ</TableHead>
                                <TableHead className="text-right">পরিমাণ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : collections.length > 0 ? (
                                collections.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.voucherNo}</TableCell>
                                        <TableCell>{item.studentName}</TableCell>
                                        <TableCell>{item.className}</TableCell>
                                        <TableCell>{item.feeType}</TableCell>
                                        <TableCell>{format(parseISO(item.collectionDate), "PP", { locale: bn })}</TableCell>
                                        <TableCell className="text-right font-medium">৳{item.amount.toLocaleString('bn-BD')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        এই তারিখের মধ্যে কোনো কালেকশন পাওয়া যায়নি।
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-end gap-4 pt-6 border-t">
                <div className="text-xl font-bold">
                    মোট সংগৃহীত: ৳{totalCollected.toLocaleString('bn-BD')}
                </div>
                <div className="flex items-center gap-4">
                    <Select value={submitTo} onValueChange={setSubmitTo}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="গ্রহণকারী নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                           {receivers.map(user => (
                             <SelectItem key={user.id} value={user.id}>{user.name} ({user.role})</SelectItem>
                           ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleSubmitCollection} disabled={isSubmitting || collections.length === 0 || !submitTo}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        জমা দিন
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
