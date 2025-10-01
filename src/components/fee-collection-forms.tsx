

"use client"

import * as React from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { bn } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, query, orderBy, runTransaction, where, limit } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Student, Teacher, BookInventoryItem } from "@/lib/data";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { ScrollArea } from "./ui/scroll-area";

const db = getFirestore(app);

const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

// Monthly Fee Collection Form
export const MonthlyFeeCollection = ({ student, teachers, feeSettings, onClose, defaultMonth }: { student: Student, teachers: Teacher[], feeSettings: any, onClose: () => void, defaultMonth?: string }) => {
    const [year, setYear] = React.useState(new Date().getFullYear().toString());
    const [month, setMonth] = React.useState(defaultMonth || months[new Date().getMonth()]);
    const [paidAmount, setPaidAmount] = React.useState("");
    const [donationAmount, setDonationAmount] = React.useState("0");
    const [collectedBy, setCollectedBy] = React.useState("");
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [voucherNo, setVoucherNo] = React.useState<number | null>(null);
    const [loadingDetails, setLoadingDetails] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [currentTeacher, setCurrentTeacher] = React.useState<Teacher | null>(null);
    const { toast } = useToast();
    const auth = getAuth(app);

    const monthlyFee = feeSettings?.fees?.classFees?.[`${student.class}-${year}`]?.monthlyFee || 500;
    
    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user?.email) {
                const teacherQuery = query(collection(db, "teachers"), where("email", "==", user.email), limit(1));
                const snapshot = await getDocs(teacherQuery);
                if (!snapshot.empty) {
                    const teacherDoc = snapshot.docs[0];
                    const teacherData = { id: teacherDoc.id, ...teacherDoc.data() } as Teacher;
                    setCurrentTeacher(teacherData);
                    setCollectedBy(teacherData.id); // Set the logged-in teacher as collector
                }
            }
        });
        return () => unsubscribe();
    }, [auth, db]);


    React.useEffect(() => {
        const fetchFeeDetails = async () => {
            setLoadingDetails(true);
            try {
                const feeDocRef = doc(db, `student_fees/${year}/students/${student.id}`);
                const feeDocSnap = await getDoc(feeDocRef);
                if (feeDocSnap.exists()) {
                    const feeData = feeDocSnap.data();
                    const monthData = feeData[month];
                    if (monthData?.status === 'paid') {
                        setPaidAmount(monthData.paidAmount?.toString() || '0');
                        setDonationAmount(monthData.donationAmount?.toString() || '0');
                        setDate(monthData.collectionDate ? parseISO(monthData.collectionDate) : new Date());
                        if(!currentTeacher) setCollectedBy(monthData.collectedBy || ''); // Don't override if we have current teacher
                        setVoucherNo(monthData.voucherNo || null);
                    } else {
                        setPaidAmount(monthlyFee.toString());
                        setDonationAmount("0");
                    }
                } else {
                    setPaidAmount(monthlyFee.toString());
                    setDonationAmount("0");
                }
                const counterRef = doc(db, "counters", `monthly_fees_${year}`);
                const counterDoc = await getDoc(counterRef);
                setVoucherNo((counterDoc.data()?.lastVoucher || 0) + 1);

            } catch (error) {
                console.error("Error fetching fee details: ", error);
            } finally {
                setLoadingDetails(false);
            }
        };
        fetchFeeDetails();
    }, [year, month, student.id, monthlyFee, db, currentTeacher]);
    
    React.useEffect(() => {
        const paid = parseFloat(paidAmount);
        if (!isNaN(paid) && paid < monthlyFee) {
            setDonationAmount((monthlyFee - paid).toString());
        } else {
            setDonationAmount("0");
        }
    }, [paidAmount, monthlyFee]);


    const handleSave = async () => {
         if (!month || !date || !collectedBy || voucherNo === null) {
            toast({ variant: "destructive", title: "ত্রুটি", description: "অনুগ্রহ করে সকল আবশ্যকীয় ঘর পূরণ করুন।" });
            return;
        }
        setSaving(true);
        try {
            const feeDocRef = doc(db, `student_fees/${year}/students/${student.id}`);
            const counterRef = doc(db, "counters", `monthly_fees_${year}`);

            await runTransaction(db, async (transaction) => {
                const feeDocSnap = await transaction.get(feeDocRef);
                const currentData = feeDocSnap.exists() ? feeDocSnap.data() : { totalPaid: 0, totalDonation: 0 };
                
                const oldMonthData = currentData[month] || { paidAmount: 0, donationAmount: 0 };
                const paidDiff = Number(paidAmount) - (oldMonthData.paidAmount || 0);
                const donationDiff = Number(donationAmount) - (oldMonthData.donationAmount || 0);

                const newData = {
                    ...currentData,
                    [month]: {
                        status: 'paid',
                        paidAmount: Number(paidAmount),
                        donationAmount: Number(donationAmount),
                        collectionDate: format(date, "yyyy-MM-dd"),
                        collectedBy: collectedBy,
                        voucherNo: voucherNo,
                    },
                    totalPaid: (currentData.totalPaid || 0) + paidDiff,
                    totalDonation: (currentData.totalDonation || 0) + donationDiff,
                };
                
                transaction.set(feeDocRef, newData, { merge: true });
                transaction.set(counterRef, { lastVoucher: voucherNo }, { merge: true });
            });
            
            toast({ title: "সফল", description: `ফি সফলভাবে সংগ্রহ করা হয়েছে।`});
            onClose();
        } catch (error) {
            console.error("Error saving fee:", error);
            toast({ variant: "destructive", title: "ত্রুটি", description: "ফি সংরক্ষণ করতে সমস্যা হয়েছে।" });
        } finally {
            setSaving(false);
        }
    };
    
    return (
        <div className="space-y-6 py-4">
             {loadingDetails ? <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div> :
             <>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>বছর</Label>
                        <Select value={year} onValueChange={setYear}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="2024">২০২৪</SelectItem><SelectItem value="2025">২০২৫</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-2">
                        <Label>মাস</Label>
                        <Select value={month} onValueChange={setMonth}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{months.map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                    </div>
                     <div className="space-y-2"><Label>ভাউচার নম্বর</Label><Input value={voucherNo ?? "লোড হচ্ছে..."} disabled /></div>
                    <div className="space-y-2"><Label>মাসিক ফি</Label><Input value={`৳${monthlyFee}`} disabled /></div>
                    <div className="space-y-2"><Label htmlFor="paid-amount">প্রদত্ত পরিমাণ*</Label><Input id="paid-amount" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} type="number" /></div>
                    <div className="space-y-2"><Label>অনুদান থেকে সংগ্রহ</Label><Input value={donationAmount} readOnly /></div>
                    <div className="space-y-2 col-span-2">
                        <Label>আদায়কারি*</Label>
                        {currentTeacher ? (
                            <Input value={currentTeacher.name} disabled />
                        ) : (
                            <Select value={collectedBy} onValueChange={setCollectedBy}>
                                <SelectTrigger>
                                    <SelectValue placeholder="আদায়কারি নির্বাচন করুন" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers.map(teacher => (
                                        <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="space-y-2 col-span-2"><Label htmlFor="date">তারিখ*</Label><Popover><PopoverTrigger asChild><Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal",!date && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{date ? format(date, "PPP", { locale: bn }) : <span>একটি তারিখ বাছুন</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={bn} /></PopoverContent></Popover></div>
                </div>
                <DialogFooter className="pt-4"><Button onClick={handleSave} className="bg-green-600 hover:bg-green-700" disabled={saving}>সংরক্ষণ করুন</Button></DialogFooter>
            </>
            }
        </div>
    );
};

// Admission & Session Fee Collection Form
export const AdmissionSessionFeeCollection = ({ student, teachers, inventoryItems, feeSettings, onClose }: { student: Student, teachers: Teacher[], inventoryItems: BookInventoryItem[], feeSettings: any, onClose: () => void }) => {
    const [session, setSession] = React.useState(new Date().getFullYear().toString());
    const [feeData, setFeeData] = React.useState<any>(null);
    const [loadingDetails, setLoadingDetails] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [currentTeacher, setCurrentTeacher] = React.useState<Teacher | null>(null);
    const { toast } = useToast();
    const auth = getAuth(app);
    
     React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user?.email) {
                const teacherQuery = query(collection(db, "teachers"), where("email", "==", user.email), limit(1));
                const snapshot = await getDocs(teacherQuery);
                if (!snapshot.empty) {
                    const teacherDoc = snapshot.docs[0];
                    const teacherData = { id: teacherDoc.id, ...teacherDoc.data() } as Teacher;
                    setCurrentTeacher(teacherData);
                    setFeeData((prev: any) => ({ ...prev, collectedBy: teacherData.id }));
                }
            }
        });
        return () => unsubscribe();
    }, [auth, db]);
    
    React.useEffect(() => {
        const fetchFeeData = async () => {
            setLoadingDetails(true);
            try {
                const feeDocRef = doc(db, "admission_fees", `${session}-${student.id}`);
                const feeDocSnap = await getDoc(feeDocRef);
                const feeType = student.admissionNo?.startsWith('ADMT') ? 'Session' : 'Admission';
                const classFeeSettings = feeSettings?.fees?.classFees?.[`${student.class}-${session}`] || {};
                const totalFee = feeType === 'Admission' ? classFeeSettings.admissionFee || 0 : classFeeSettings.sessionFee || 0;

                if (feeDocSnap.exists()) {
                    const existingData = feeDocSnap.data();
                    setFeeData({...existingData, collectionDate: existingData.collectionDate ? parseISO(existingData.collectionDate) : new Date() });
                } else {
                    setFeeData({ totalFee, totalStock: classFeeSettings.stock || 0, feeDeposited: 0, stockDeposited: 0, discount: 0, collectionDate: new Date() });
                }
                const counterRef = doc(db, "counters", `admission_fees_${session}`);
                const counterDoc = await getDoc(counterRef);
                setFeeData((prev: any) => ({...prev, voucherNo: (counterDoc.data()?.lastVoucher || 0) + 1 }));

            } catch (error) {
                console.error("Error fetching admission fee data:", error);
            } finally {
                setLoadingDetails(false);
            }
        };
        fetchFeeData();
    }, [session, student.id, student.class, student.admissionNo, db, feeSettings]);
    
    const totalStockCost = React.useMemo(() => {
        return feeData?.selectedStockItems?.reduce((total: number, itemId: string) => {
            const item = inventoryItems.find(i => i.docId === itemId);
            return total + (Number(item?.sellingPrice) || 0);
        }, 0) || 0;
    }, [feeData?.selectedStockItems, inventoryItems]);


    const handleSave = async () => {
         if (!feeData?.collectedBy || !feeData?.collectionDate) {
            toast({ variant: "destructive", title: "ত্রুটি", description: "অনুগ্রহ করে আদায়কারি এবং তারিখ নির্বাচন করুন।" });
            return;
        }
        setSaving(true);
        try {
            const feeDocRef = doc(db, "admission_fees", `${session}-${student.id}`);
            const counterRef = doc(db, "counters", `admission_fees_${session}`);
            
            const dataToSave = {
                ...feeData,
                collectionDate: format(feeData.collectionDate, "yyyy-MM-dd"),
                totalStock: totalStockCost,
                id: student.id,
                name: student.name,
                class: student.class,
                section: student.section,
                feeType: student.admissionNo?.startsWith('ADMT') ? 'Session' : 'Admission',
            };

            await runTransaction(db, async (transaction) => {
                transaction.set(feeDocRef, dataToSave, { merge: true });
                transaction.set(counterRef, { lastVoucher: dataToSave.voucherNo }, { merge: true });
            });
            toast({ title: "সফল", description: "ফি সফলভাবে সংগ্রহ করা হয়েছে।" });
            onClose();
        } catch (error) {
            console.error("Error collecting fee:", error);
            toast({ variant: "destructive", title: "ত্রুটি", description: "ফি সংগ্রহ করতে একটি সমস্যা হয়েছে।" });
        } finally {
            setSaving(false);
        }
    };
    
    const handleFeeDataChange = (field: string, value: any) => {
        setFeeData((prev: any) => ({ ...prev, [field]: value }));
    }
    
    const feeDue = (feeData?.totalFee || 0) - (feeData?.feeDeposited || 0) - (feeData?.discount || 0);
    const stockDue = totalStockCost - (feeData?.stockDeposited || 0);
    const totalDue = feeDue + stockDue;

    const formatCurrency = (amount: number) => `৳${Number(amount || 0).toLocaleString('bn-BD')}`;

    return (
        <ScrollArea className="h-[70vh] py-4">
             {loadingDetails ? <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div> :
            feeData && (
                <div className="space-y-6">
                    <div className="space-y-2"><Label>ভাউচার নম্বর</Label><Input value={feeData.voucherNo ?? "লোড হচ্ছে..."} disabled /></div>
                    <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold text-green-700 mb-2">ভর্তি ফি</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>ভর্তি ফি'র পরিমাণ</Label><Input value={formatCurrency(feeData.totalFee)} disabled /></div>
                            <div><Label>প্রদত্ত পরিমাণ*</Label><Input type="number" value={feeData.feeDeposited} onChange={(e) => handleFeeDataChange('feeDeposited', e.target.value)} placeholder="0" /></div>
                            <div><Label>ছাড়</Label><Input type="number" value={feeData.discount} onChange={(e) => handleFeeDataChange('discount', e.target.value)} placeholder="0" /></div>
                            <div><Label>ভর্তি ফি বকেয়া</Label><Input value={formatCurrency(feeDue)} disabled /></div>
                        </div>
                    </div>
                     <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold text-green-700 mb-2">মজুদ</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2"><Label>মজুদ আইটেম</Label><MultiSelect options={inventoryItems.map(item => ({ value: item.docId, label: `${item.name} - ${formatCurrency(item.sellingPrice)}`}))} selected={feeData.selectedStockItems || []} onChange={(val) => handleFeeDataChange('selectedStockItems', val)} /></div>
                            <div><Label>মোট মজুদ খরচ</Label><Input value={formatCurrency(totalStockCost)} disabled /></div>
                            <div><Label>প্রদত্ত মজুদ</Label><Input type="number" value={feeData.stockDeposited} onChange={(e) => handleFeeDataChange('stockDeposited', e.target.value)} placeholder="0" /></div>
                            <div className="col-span-2"><Label>মজুদ বকেয়া</Label><Input value={formatCurrency(stockDue)} disabled /></div>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                            <Label>আদায়কারি*</Label>
                            {currentTeacher ? (
                                <Input value={currentTeacher.name} disabled />
                            ) : (
                                <Select value={feeData.collectedBy || ''} onValueChange={(val) => handleFeeDataChange('collectedBy', val)}>
                                    <SelectTrigger><SelectValue placeholder="আদায়কারি নির্বাচন করুন" /></SelectTrigger>
                                    <SelectContent>
                                        {teachers.map(teacher => <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div><Label>তারিখ*</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!feeData.collectionDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{feeData.collectionDate ? format(feeData.collectionDate, "PPP", { locale: bn }) : <span>একটি তারিখ বাছুন</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={feeData.collectionDate} onSelect={(date) => handleFeeDataChange('collectionDate', date)} initialFocus locale={bn} /></PopoverContent></Popover></div>
                        <div className="col-span-2"><Label>মোট বকেয়া</Label><Input value={formatCurrency(totalDue)} disabled className="border-red-500 font-bold text-red-600" /></div>
                    </div>
                     <DialogFooter className="pt-4"><Button onClick={handleSave} className="bg-green-600 hover:bg-green-700" disabled={saving}>সংরক্ষণ করুন</Button></DialogFooter>
                </div>
            )}
        </ScrollArea>
    );
};

// Exam Fee Collection Form
export const ExamFeeCollection = ({ student, teachers, exams, feeSettings, onClose }: { student: Student, teachers: Teacher[], exams: any[], feeSettings: any, onClose: () => void }) => {
    const [selectedExam, setSelectedExam] = React.useState<string>("");
    const [feeData, setFeeData] = React.useState<any>(null);
    const [loadingDetails, setLoadingDetails] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [currentTeacher, setCurrentTeacher] = React.useState<Teacher | null>(null);
    const { toast } = useToast();
    const auth = getAuth(app);
    
    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user?.email) {
                const teacherQuery = query(collection(db, "teachers"), where("email", "==", user.email), limit(1));
                const snapshot = await getDocs(teacherQuery);
                if (!snapshot.empty) {
                    const teacherDoc = snapshot.docs[0];
                    const teacherData = { id: teacherDoc.id, ...teacherDoc.data() } as Teacher;
                    setCurrentTeacher(teacherData);
                    setFeeData((prev: any) => ({ ...prev, collectedBy: teacherData.id }));
                }
            }
        });
        return () => unsubscribe();
    }, [auth, db]);
    
    const getExamKeyFromName = (examName: string) => {
        const name = examName?.toLowerCase() || '';
        if (name.includes('1st') || name.includes('প্রথম') || name.includes('1st trem')) return '1st-term';
        if (name.includes('2nd') || name.includes('দ্বিতীয়') || name.includes('2nd trem')) return '2nd-term';
        if (name.includes('final') || name.includes('বার্ষিক')) return 'final-term';
        return null;
    };

    const currentExam = exams.find(e => e.id === selectedExam);
    const examKey = currentExam ? getExamKeyFromName(currentExam.name) : null;
    const currentYear = currentExam ? new Date(currentExam.startDate.toDate()).getFullYear() : new Date().getFullYear();
    const feeSettingsKey = `${student.class}-${currentYear}`;
    const currentClassFees = feeSettings?.fees?.classFees?.[feeSettingsKey] || {};
    const currentExamFee = examKey ? currentClassFees[examKey] || 0 : 0;
    
    React.useEffect(() => {
        const fetchFeeData = async () => {
            if (!selectedExam) return;
            setLoadingDetails(true);
            try {
                const feeDocRef = doc(db, `exam_fees/${selectedExam}/students/${student.id}`);
                const feeDocSnap = await getDoc(feeDocRef);

                if (feeDocSnap.exists()) {
                    setFeeData(feeDocSnap.data());
                } else {
                    setFeeData({ paidAmount: currentExamFee > 0 ? String(currentExamFee) : '', discount: '0', collectionDate: format(new Date(), 'yyyy-MM-dd') });
                }

                const counterRef = doc(db, "counters", `exam_fees_${selectedExam}`);
                const counterDoc = await getDoc(counterRef);
                setFeeData((prev: any) => ({...prev, voucherNo: (counterDoc.data()?.lastVoucher || 0) + 1 }));

            } catch (error) {
                console.error("Error fetching exam fee data:", error);
            } finally {
                setLoadingDetails(false);
            }
        };
        fetchFeeData();
    }, [selectedExam, student.id, db, currentExamFee]);

    const handleSave = async () => {
        if (!selectedExam || !feeData?.collectedBy || !feeData?.collectionDate || feeData.voucherNo === null) {
            toast({ variant: "destructive", title: "ত্রুটি", description: "অনুগ্রহ করে সকল আবশ্যকীয় ঘর পূরণ করুন।" });
            return;
        }
        setSaving(true);
        try {
            const feeDocRef = doc(db, `exam_fees/${selectedExam}/students/${student.id}`);
            const counterRef = doc(db, "counters", `exam_fees_${selectedExam}`);
            
            await runTransaction(db, async (transaction) => {
                transaction.set(feeDocRef, feeData, { merge: true });
                transaction.set(counterRef, { lastVoucher: feeData.voucherNo }, { merge: true });
            });
            toast({ title: "সফল", description: "ফি সফলভাবে সংগ্রহ করা হয়েছে।" });
            onClose();
        } catch (error) {
            console.error("Error collecting fee:", error);
            toast({ variant: "destructive", title: "ত্রুটি", description: "ফি সংগ্রহ করতে একটি সমস্যা হয়েছে।" });
        } finally {
            setSaving(false);
        }
    };
    
     const handleFeeDataChange = (field: string, value: any) => {
        setFeeData((prev: any) => ({ ...prev, [field]: value }));
    }
    
    const parsedPaidAmount = parseFloat(feeData?.paidAmount) || 0;
    const parsedDiscount = parseFloat(feeData?.discount) || 0;
    const dueAmount = currentExamFee - parsedPaidAmount - parsedDiscount;
    const formatCurrency = (amount: number) => `৳${Number(amount || 0).toLocaleString('bn-BD')}`;

    return (
        <div className="space-y-4 py-4">
             <div className="space-y-2"><Label>পরীক্ষা</Label><Select value={selectedExam} onValueChange={setSelectedExam}><SelectTrigger><SelectValue placeholder="পরীক্ষা নির্বাচন করুন"/></SelectTrigger><SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
             {selectedExam && (loadingDetails ? <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div> :
                feeData && (
                    <>
                        <div className="space-y-2"><Label>ভাউচার নম্বর</Label><Input value={feeData.voucherNo ?? "লোড হচ্ছে..."} disabled /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>মোট ফি</Label><Input value={formatCurrency(currentExamFee)} disabled /></div>
                            <div><Label>প্রদত্ত পরিমাণ*</Label><Input type="number" value={feeData.paidAmount} onChange={(e) => handleFeeDataChange('paidAmount', e.target.value)} placeholder="0" /></div>
                            <div><Label>ছাড়</Label><Input type="number" value={feeData.discount} onChange={(e) => handleFeeDataChange('discount', e.target.value)} placeholder="0" /></div>
                            <div><Label>বকেয়া</Label><Input value={formatCurrency(dueAmount)} disabled className={dueAmount > 0 ? "border-red-500 text-red-600 font-bold" : ""} /></div>
                        </div>
                        <div className="space-y-2">
                            <Label>আদায়কারি*</Label>
                             {currentTeacher ? (
                                <Input value={currentTeacher.name} disabled />
                            ) : (
                                <Select value={feeData.collectedBy || ''} onValueChange={(val) => handleFeeDataChange('collectedBy', val)}>
                                    <SelectTrigger><SelectValue placeholder="আদায়কারি নির্বাচন করুন" /></SelectTrigger>
                                    <SelectContent>
                                        {teachers.map(teacher => <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="space-y-2"><Label>তারিখ*</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!feeData.collectionDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{feeData.collectionDate ? format(parseISO(feeData.collectionDate), "PPP", { locale: bn }) : <span>একটি তারিখ বাছুন</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={feeData.collectionDate ? parseISO(feeData.collectionDate) : undefined} onSelect={(date) => handleFeeDataChange('collectionDate', date ? format(date, "yyyy-MM-dd") : '')} initialFocus locale={bn} /></PopoverContent></Popover></div>
                        <DialogFooter className="pt-4"><Button onClick={handleSave} className="bg-green-600 hover:bg-green-700" disabled={saving}>সংরক্ষণ করুন</Button></DialogFooter>
                    </>
                )
             )}
        </div>
    );
};
