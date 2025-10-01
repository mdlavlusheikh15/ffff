
"use client";

import {
    Wallet,
    Pencil,
    GraduationCap,
    Mail,
    BookCopy,
    Banknote,
    Loader2
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as React from "react";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, Timestamp, orderBy, limit, onSnapshot, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Student } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, isFuture } from "date-fns";
import { bn } from "date-fns/locale";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
}) => (
  <Card className="text-white" style={{ backgroundColor: color }}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="p-3 rounded-full bg-white/20">
          <Icon className="h-6 w-6" />
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{typeof value === 'number' ? `৳${value.toLocaleString('bn-BD')}` : value}</p>
          <p className="text-sm opacity-90">{title}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

type DashboardStats = {
    dueFee: number;
    totalPaid: number;
    upcomingExams: number;
    resultsPublished: number;
};

type Message = {
    id: string;
    title: string;
    sentAt: Timestamp;
}

export default function ParentDashboard() {
  const [children, setChildren] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<DashboardStats>({
      dueFee: 0,
      totalPaid: 0,
      upcomingExams: 0,
      resultsPublished: 0,
  });
  const [messages, setMessages] = React.useState<Message[]>([]);

  const auth = getAuth(app);
  const db = getFirestore(app);
  const { toast } = useToast();
  const router = useRouter();
  
  const aggregateFees = React.useCallback(async (childDocs: Student[]) => {
    if (childDocs.length === 0) {
        setStats(prev => ({ ...prev, dueFee: 0, totalPaid: 0 }));
        return;
    }
    const currentYear = new Date().getFullYear().toString();
    const settingsRef = doc(db, 'settings', 'general');
    const settingsSnap = await getDoc(settingsRef);
    const feeSettings = settingsSnap.exists() ? settingsSnap.data().fees?.classFees || {} : {};

    let totalDue = 0;
    let totalPaid = 0;

    for (const student of childDocs) {
        // Monthly Fees
        const monthlyFeeDoc = await getDoc(doc(db, `student_fees/${currentYear}/students`, student.id));
        const monthlyFee = feeSettings[`${student.class}-${currentYear}`]?.monthlyFee || 500;
        if (monthlyFeeDoc.exists()) {
            const data = monthlyFeeDoc.data();
            totalPaid += data.totalPaid || 0;
            const paidMonths = Object.values(data).filter((v: any) => v.status === 'paid').length;
            totalDue += (12 - paidMonths) * monthlyFee - (data.totalDonation || 0);
        } else {
            totalDue += 12 * monthlyFee;
        }

        // Admission/Session Fees
        const admissionFeeDoc = await getDoc(doc(db, `admission_fees`, `${currentYear}-${student.id}`));
        if (admissionFeeDoc.exists()) {
            const data = admissionFeeDoc.data();
            totalPaid += (data.feeDeposited || 0) + (data.stockDeposited || 0);
            totalDue += (data.totalFee || 0) + (data.totalStock || 0) - (data.feeDeposited || 0) - (data.stockDeposited || 0) - (data.discount || 0);
        } else {
            const feeType: 'admissionFee' | 'sessionFee' = student.admissionNo?.startsWith('ADMT') ? 'sessionFee' : 'admissionFee';
            const classFeeSettings = feeSettings[`${student.class}-${currentYear}`] || {};
            totalDue += (classFeeSettings[feeType] || 0) + (classFeeSettings.stock || 0);
        }
        
        // Exam Fees
        const examsSnap = await getDocs(query(collection(db, 'exams')));
        for (const examDoc of examsSnap.docs) {
            const examData = examDoc.data();
            if (new Date(examData.startDate.toDate()).getFullYear().toString() === currentYear) {
                const examKey = examData.name.toLowerCase().includes('1st') ? '1st-term' : examData.name.toLowerCase().includes('2nd') ? '2nd-term' : 'final-term';
                const examFeeAmount = feeSettings[`${student.class}-${currentYear}`]?.[examKey] || 0;
                
                const examFeeDoc = await getDoc(doc(db, `exam_fees/${examDoc.id}/students`, student.id));
                if (examFeeDoc.exists()) {
                    const feeRecord = examFeeDoc.data();
                    totalPaid += feeRecord.paidAmount || 0;
                    totalDue += examFeeAmount - (feeRecord.paidAmount || 0) - (feeRecord.discount || 0);
                } else {
                    totalDue += examFeeAmount;
                }
            }
        }
    }
    setStats(prev => ({ ...prev, dueFee: totalDue < 0 ? 0 : totalDue, totalPaid }));
  }, [db]);


  const fetchChildrenData = React.useCallback(async (user: FirebaseUser) => {
    setLoading(true);
    try {
      const studentQueries = [];
      if (user.email) {
          studentQueries.push(query(collection(db, 'students'), where('email', '==', user.email)));
          studentQueries.push(query(collection(db, 'students'), where('fatherEmail', '==', user.email)));
          studentQueries.push(query(collection(db, 'students'), where('motherEmail', '==', user.email)));
      }
      if (user.phoneNumber) {
           studentQueries.push(query(collection(db, 'students'), where('phone', '==', user.phoneNumber)));
           studentQueries.push(query(collection(db, 'students'), where('fatherPhone', '==', user.phoneNumber)));
           studentQueries.push(query(collection(db, 'students'), where('motherPhone', '==', user.phoneNumber)));
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
      setChildren(childrenData);
      return childrenData;
    } catch (error) {
        console.error("Error fetching children:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch children's data." });
        return [];
    } finally {
        setLoading(false);
    }
  }, [db, toast]);

  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const fetchedChildren = await fetchChildrenData(user);
        if (fetchedChildren.length > 0) {
            aggregateFees(fetchedChildren);
        }
      } else {
        router.push('/');
      }
    });

    return () => unsubscribeAuth();
  }, [auth, router, fetchChildrenData, aggregateFees]);

  React.useEffect(() => {
    if (children.length === 0) return;

    const childClasses = [...new Set(children.map(c => c.class))];
    const parentPhoneNumbers = [...new Set(children.flatMap(c => [c.phone, c.fatherPhone, c.motherPhone]).filter(Boolean))];
    
    const unsubscribes: (()=>void)[] = [];

    const examsUnsubscribe = onSnapshot(collection(db, 'exams'), (snapshot) => {
        const exams = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setStats(prev => ({
            ...prev,
            upcomingExams: exams.filter(e => isFuture(e.startDate.toDate())).length,
            resultsPublished: exams.filter(e => e.status === 'published').length
        }));
    });
    unsubscribes.push(examsUnsubscribe);
    
    if (parentPhoneNumbers.length > 0) {
        const messagesUnsubscribe = onSnapshot(query(collection(db, "messages"), where('recipient', 'in', parentPhoneNumbers), orderBy("sentAt", "desc"), limit(5)), (snapshot) => {
            setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
        });
        unsubscribes.push(messagesUnsubscribe);
    }

    // Real-time fee updates
    const feeUnsubscribes = children.flatMap(child => {
        const currentYear = new Date().getFullYear().toString();
        return [
            onSnapshot(doc(db, `student_fees/${currentYear}/students`, child.id), () => aggregateFees(children)),
            onSnapshot(doc(db, `admission_fees`, `${currentYear}-${child.id}`), () => aggregateFees(children)),
        ];
    });
    unsubscribes.push(...feeUnsubscribes);


    return () => {
        unsubscribes.forEach(unsub => unsub());
    };
  }, [children, db, aggregateFees]);


  if (loading) {
      return (
          <div className="flex items-center justify-center h-full p-8">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <StatCard
                title="বকেয়া ফি"
                value={stats.dueFee}
                icon={Wallet}
                color="#ef4444"
            />
            <StatCard
                title="মোট প্রদত্ত"
                value={stats.totalPaid}
                icon={Banknote}
                color="#22c55e"
            />
            <StatCard
                title="আসন্ন পরীক্ষা"
                value={stats.upcomingExams.toLocaleString('bn-BD')}
                icon={Pencil}
                color="#3b82f6"
            />
            <StatCard
                title="ফলাফল প্রকাশিত"
                value={stats.resultsPublished.toLocaleString('bn-BD')}
                icon={GraduationCap}
                color="#06b6d4"
            />
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5"/> বার্তা</CardTitle>
            </CardHeader>
            <CardContent>
                {messages.length > 0 ? (
                    <ul className="space-y-2">
                        {messages.map(msg => (
                            <li key={msg.id} className="text-sm text-muted-foreground">
                                <span className="font-semibold text-foreground">{msg.title}</span> - {formatDistanceToNow(msg.sentAt.toDate(), { addSuffix: true, locale: bn })}
                            </li>
                        ))}
                    </ul>
                ) : (
                     <p className="text-muted-foreground text-center py-4">কোনো বার্তা নেই।</p>
                )}
            </CardContent>
        </Card>

    </div>
  );
}
