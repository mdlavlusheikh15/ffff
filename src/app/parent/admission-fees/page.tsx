
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
import { Badge } from "@/components/ui/badge";
import { getFirestore, collection, getDocs, doc, getDoc, query, where, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/lib/data";

type AdmissionFeeData = {
  id: string; // student id
  name: string;
  admissionNo: string;
  class: string;
  section: string;
  feeType: 'Admission' | 'Session' | 'Re-admission';
  status: 'paid' | 'due' | 'partial';
  totalFee: number;
  totalStock: number;
  feeDeposited: number;
  stockDeposited: number;
  discount: number;
};

export default function ParentAdmissionFeePage() {
  const [feeData, setFeeData] = React.useState<AdmissionFeeData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
  
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

  const fetchChildrenAndFees = React.useCallback(async (user: FirebaseUser) => {
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
        
        if (childrenData.length === 0) {
            setFeeData([]);
            setLoading(false);
            return () => {};
        }

        const currentYear = new Date().getFullYear().toString();
        const settingsDocRef = doc(db, "settings", "general");
        const settingsDocSnap = await getDoc(settingsDocRef);
        const feeSettings = settingsDocSnap.exists() ? settingsDocSnap.data().fees?.classFees || {} : {};

        const unsubscribes = childrenData.map(student => {
            const feeDocRef = doc(db, "admission_fees", `${currentYear}-${student.id}`);
            return onSnapshot(feeDocRef, (feeDocSnap) => {
                 const feeType: AdmissionFeeData['feeType'] = student.admissionNo?.startsWith('ADMT') ? 'Session' : 'Admission';
                const classFeeSettings = feeSettings[`${student.class}-${currentYear}`] || {};
                const totalFee = feeType === 'Admission' ? classFeeSettings.admissionFee || 0 : classFeeSettings.sessionFee || 0;
                const totalStock = classFeeSettings.stock || 0;

                let studentFeeData: AdmissionFeeData;

                if (feeDocSnap.exists()) {
                    const feeRecord = feeDocSnap.data();
                    const totalDue = (feeRecord.totalFee + feeRecord.totalStock) - (feeRecord.feeDeposited + feeRecord.stockDeposited + feeRecord.discount);
                    const status = totalDue <= 0 ? 'paid' : (feeRecord.feeDeposited > 0 || feeRecord.stockDeposited > 0 || feeRecord.discount > 0) ? 'partial' : 'due';
                    studentFeeData = {
                        ...feeRecord,
                        id: student.id,
                        name: student.name,
                        admissionNo: student.admissionNo,
                        class: student.class,
                        section: student.section,
                        status,
                    } as AdmissionFeeData;
                } else {
                    studentFeeData = {
                        id: student.id,
                        name: student.name,
                        admissionNo: student.admissionNo,
                        class: student.class,
                        section: student.section,
                        feeType,
                        status: 'due',
                        totalFee,
                        totalStock,
                        feeDeposited: 0,
                        stockDeposited: 0,
                        discount: 0,
                    } as AdmissionFeeData;
                }

                setFeeData(prevData => {
                    const existingIndex = prevData.findIndex(d => d.id === student.id);
                    if (existingIndex > -1) {
                        const newData = [...prevData];
                        newData[existingIndex] = studentFeeData;
                        return newData;
                    } else {
                        return [...prevData, studentFeeData];
                    }
                });
            });
        });
        
        setLoading(false);

        return () => unsubscribes.forEach(unsub => unsub());

    } catch (err) {
        console.error("Error fetching fee data:", err);
        toast({ variant: "destructive", title: "ত্রুটি", description: "ফি ডেটা আনতে একটি সমস্যা হয়েছে।" });
        setLoading(false);
    }
  }, [db, toast]);

  React.useEffect(() => {
    if (!currentUser) return;
    const unsubscribePromise = fetchChildrenAndFees(currentUser);
    return () => {
        unsubscribePromise.then(unsubscribe => {
            if (unsubscribe) unsubscribe();
        });
    }
  }, [currentUser, fetchChildrenAndFees]);
  

  const getStatusBadge = (status: AdmissionFeeData['status']) => {
    switch (status) {
        case 'paid': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">পরিশোধিত</Badge>;
        case 'partial': return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">আংশিক</Badge>;
        case 'due': default: return <Badge variant="destructive">বকেয়া</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return `৳${Number(amount || 0).toLocaleString('bn-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ভর্তি এবং সেশন ফি</CardTitle>
        <CardDescription>আপনার সন্তানের ভর্তি এবং সেশন ফি-এর বিবরণ দেখুন।</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>নাম</TableHead>
                <TableHead>ফি'র প্রকার</TableHead>
                <TableHead>অবস্থা</TableHead>
                <TableHead>ফি জমা হয়েছে</TableHead>
                <TableHead>ছাড়</TableHead>
                <TableHead>ফি বকেয়া</TableHead>
                <TableHead>মজুদ জমা হয়েছে</TableHead>
                <TableHead>মজুদ বকেয়া</TableHead>
                <TableHead>মোট জমা</TableHead>
                <TableHead>মোট বকেয়া</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                    </TableCell>
                </TableRow>
              ) : feeData.map((fee) => {
                  const feeDue = fee.totalFee - fee.feeDeposited - fee.discount;
                  const stockDue = fee.totalStock - fee.stockDeposited;
                  const totalDeposited = fee.feeDeposited + fee.stockDeposited;
                  const totalDue = feeDue + stockDue;

                  return (
                    <TableRow key={fee.id}>
                      <TableCell className="font-medium whitespace-nowrap">{fee.name}</TableCell>
                      <TableCell><Badge variant="outline">{fee.feeType}</Badge></TableCell>
                      <TableCell>{getStatusBadge(fee.status)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatCurrency(fee.feeDeposited)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatCurrency(fee.discount)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatCurrency(feeDue)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatCurrency(fee.stockDeposited)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatCurrency(stockDue)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatCurrency(totalDeposited)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatCurrency(totalDue)}</TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
