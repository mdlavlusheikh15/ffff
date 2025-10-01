
"use client"

import {
  Banknote,
  Calendar as CalendarIcon,
  Heart,
  Home,
  Loader2,
  TrendingDown,
  User,
  Users,
  Wallet,
  Briefcase,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
} from "@/components/ui/chart"
import { Calendar } from "@/components/ui/calendar";
import * as React from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { format, getMonth, parseISO } from "date-fns";
import { bn } from "date-fns/locale";

type Stats = {
  students: number;
  maleStudents: number;
  femaleStudents: number;
  teachers: number;
  parents: number;
  totalCollected: number;
  totalExpenses: number;
  donationsCollected: number;
  donationsProvided: number; // This remains a placeholder as there's no data source for it.
  monthlyChartData: { month: string; 'বেতন সংগ্রহ': number; 'খরচ': number }[];
};

const toBengaliNumber = (num: number) => {
    return num.toLocaleString('bn-BD');
}

export default function SuperAdminDashboardPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const { toast } = useToast();
  
  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/');
      }
    });

    const studentsCollection = collection(db, "students");
    const teachersCollection = collection(db, "teachers");
    const expensesCollection = collection(db, "expenses");
    const donationsCollection = collection(db, "donations");
    const admissionFeesCollection = collection(db, "admission_fees");
    const currentYear = new Date().getFullYear().toString();
    const monthlyFeesCollection = collection(db, `student_fees/${currentYear}/students`);
    const examsCollection = query(collection(db, 'exams'), where("status", "==", "published"));
    
    let unsubscribes: (() => void)[] = [];

    const setupListeners = () => {
      setLoading(true);

      const processData = (
          studentsDocs: any[],
          teachersDocs: any[],
          expensesDocs: any[],
          donationsDocs: any[],
          admissionFeesDocs: any[],
          monthlyFeesDocs: any[],
          examsDocs: any[]
      ) => {
          const studentsData = studentsDocs.map(doc => doc.data());
          const studentCount = studentsData.length;
          const maleStudents = studentsData.filter(s => s.gender === 'male').length;
          const femaleStudents = studentsData.filter(s => s.gender === 'female').length;
          const teacherCount = teachersDocs.length;

          // The number of parents should correspond to the number of students (family units).
          const parentCount = studentCount;

          const bengaliMonths = ["জান", "ফেব", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্ট", "অক্টো", "নভে", "ডিসে"];
          const monthlyChartData = bengaliMonths.map(month => ({ month, 'বেতন সংগ্রহ': 0, 'খরচ': 0 }));
          
          const totalExpenses = expensesDocs.reduce((sum, doc) => {
              const data = doc.data();
              try {
                  const expenseDate = parseISO(data.expenseDate);
                  if (expenseDate.getFullYear().toString() === currentYear) {
                      const monthIndex = getMonth(expenseDate);
                      monthlyChartData[monthIndex]['খরচ'] += data.amount;
                      return sum + data.amount;
                  }
              } catch (e) { console.error("Invalid expense date", data.expenseDate) }
              return sum;
          }, 0);
          
          monthlyFeesDocs.forEach(doc => {
              const data = doc.data();
              Object.keys(data).forEach(key => {
                  if (data[key] && typeof data[key] === 'object' && data[key].collectionDate) {
                      try {
                          const collectionDate = parseISO(data[key].collectionDate);
                          if (collectionDate.getFullYear().toString() === currentYear) {
                              const monthIndex = getMonth(collectionDate);
                              monthlyChartData[monthIndex]['বেতন সংগ্রহ'] += data[key].paidAmount || 0;
                          }
                      } catch (e) { console.error("Invalid collection date", data[key].collectionDate) }
                  }
              });
          });
          
          let totalCollected = monthlyFeesDocs.reduce((sum, doc) => sum + (doc.data().totalPaid || 0), 0);
          
          admissionFeesDocs.forEach(doc => {
              if (doc.id.startsWith(currentYear)) {
                  const data = doc.data();
                  totalCollected += (data.feeDeposited || 0) + (data.stockDeposited || 0);
              }
          });

          // This part is complex to make fully real-time without many listeners.
          // For now, we will keep it as a one-time fetch inside the listener, which is not ideal but better.
          // A better solution involves cloud functions to aggregate this data.
          Promise.all(
              examsDocs.map(examDoc => 
                  onSnapshot(collection(db, `exam_fees/${examDoc.id}/students`), (snapshot) => {
                      snapshot.docs.forEach(studentFeeDoc => {
                          totalCollected += studentFeeDoc.data().paidAmount || 0;
                      });
                  })
              )
          );

          const donationsCollected = donationsDocs.reduce((sum, doc) => sum + doc.data().amount, 0);

          setStats({
              students: studentCount,
              maleStudents,
              femaleStudents,
              teachers: teacherCount,
              parents: parentCount,
              totalCollected,
              totalExpenses,
              donationsCollected,
              donationsProvided: 650, // Placeholder
              monthlyChartData,
          });
          setLoading(false);
      };

      let studentDocs: any, teacherDocs: any, expenseDocs: any, donationDocs: any, admissionFeeDocs: any, monthlyFeeDocs: any, examDocs: any;
      
      const collections = [
          { coll: studentsCollection, setter: (docs: any) => studentDocs = docs },
          { coll: teachersCollection, setter: (docs: any) => teacherDocs = docs },
          { coll: expensesCollection, setter: (docs: any) => expenseDocs = docs },
          { coll: donationsCollection, setter: (docs: any) => donationDocs = docs },
          { coll: admissionFeesCollection, setter: (docs: any) => admissionFeeDocs = docs },
          { coll: monthlyFeesCollection, setter: (docs: any) => monthlyFeeDocs = docs },
          { coll: examsCollection, setter: (docs: any) => examDocs = docs },
      ];

      collections.forEach(({ coll, setter }) => {
          const unsubscribe = onSnapshot(coll, (snapshot) => {
              setter(snapshot.docs);
              if (studentDocs && teacherDocs && expenseDocs && donationDocs && admissionFeeDocs && monthlyFeeDocs && examDocs) {
                  processData(studentDocs, teacherDocs, expenseDocs, donationDocs, admissionFeeDocs, monthlyFeeDocs, examDocs);
              }
          }, (error) => {
              console.error("Error with real-time listener:", error);
              toast({ variant: "destructive", title: "Error", description: "Failed to sync data in real-time." });
          });
          unsubscribes.push(unsubscribe);
      });
    }
    
    setupListeners();
    
    return () => {
      unsubscribeAuth();
      unsubscribes.forEach(unsub => unsub());
    };
  }, [auth, router, db, toast]);
  
  if (loading || !stats) {
    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  const chartConfig = {
    'বেতন সংগ্রহ': { label: 'বেতন সংগ্রহ', color: 'hsl(var(--chart-1))' },
    'খরচ': { label: 'খরচ', color: 'hsl(var(--chart-2))' },
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="flex items-center p-4">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
                <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">শিক্ষার্থী</p>
                <p className="text-2xl font-bold">{toBengaliNumber(stats.students)}</p>
            </div>
        </Card>
        <Card className="flex items-center p-4">
             <div className="p-3 rounded-full bg-orange-100 mr-4">
                <User className="h-6 w-6 text-orange-600" />
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">শিক্ষক</p>
                <p className="text-2xl font-bold">{toBengaliNumber(stats.teachers)}</p>
            </div>
        </Card>
        <Card className="flex items-center p-4">
             <div className="p-3 rounded-full bg-green-100 mr-4">
                <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">অভিভাবক</p>
                <p className="text-2xl font-bold">{toBengaliNumber(stats.parents)}</p>
            </div>
        </Card>
        <Card className="flex items-center p-4">
             <div className="p-3 rounded-full bg-red-100 mr-4">
                <Wallet className="h-6 w-6 text-red-600" />
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">মোট সংগৃহীত</p>
                <p className="text-2xl font-bold">৳{toBengaliNumber(stats.totalCollected)}</p>
            </div>
        </Card>
        <Card className="flex items-center p-4">
            <div className="p-3 rounded-full bg-purple-100 mr-4">
                <TrendingDown className="h-6 w-6 text-purple-600" />
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">খরচ</p>
                <p className="text-2xl font-bold">৳{toBengaliNumber(stats.totalExpenses)}</p>
            </div>
        </Card>
      </div>

      <h2 className="text-xl font-semibold">শিক্ষার্থী এবং অনুদান সম্পর্কিত তথ্য</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
            <CardContent className="flex flex-col items-center justify-center p-4 gap-2">
                <div className="p-3 rounded-full bg-blue-100">
                    <User className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-xl font-bold">{toBengaliNumber(stats.maleStudents)}</p>
                <p className="text-sm text-muted-foreground">পুরুষ</p>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="flex flex-col items-center justify-center p-4 gap-2">
                 <div className="p-3 rounded-full bg-pink-100">
                    <User className="h-6 w-6 text-pink-600" />
                </div>
                <p className="text-xl font-bold">{toBengaliNumber(stats.femaleStudents)}</p>
                <p className="text-sm text-muted-foreground">মহিলা</p>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="flex flex-col items-center justify-center p-4 gap-2">
                <div className="p-3 rounded-full bg-yellow-100">
                    <Home className="h-6 w-6 text-yellow-600" />
                </div>
                <p className="text-xl font-bold">{toBengaliNumber(0)}</p>
                <p className="text-sm text-muted-foreground">এতিম</p>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="flex flex-col items-center justify-center p-4 gap-2">
                 <div className="p-3 rounded-full bg-green-100">
                    <Heart className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-xl font-bold">৳{toBengaliNumber(stats.donationsCollected)}</p>
                <p className="text-sm text-muted-foreground">অনুদান সংগৃহীত</p>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="flex flex-col items-center justify-center p-4 gap-2">
                <div className="p-3 rounded-full bg-indigo-100">
                    <Briefcase className="h-6 w-6 text-indigo-600" />
                </div>
                <p className="text-xl font-bold">৳{toBengaliNumber(stats.donationsProvided)}</p>
                <p className="text-sm text-muted-foreground">অনুদান প্রদত্ত</p>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>বেতন সংগ্রহ ও খরচ</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={stats.monthlyChartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis tickFormatter={(value) => `৳${Number(value)/1000}k`} />
                <Tooltip cursor={false} />
                <Legend />
                <Bar dataKey="বেতন সংগ্রহ" fill="var(--color-বেতন সংগ্রহ)" radius={4} />
                <Bar dataKey="খরচ" fill="var(--color-খরচ)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>ক্যালেন্ডার</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                    locale={bn}
                    classNames={{
                        caption_label: "hidden",
                        head_cell: "w-8",
                        cell: "w-8 h-8",
                        day: "w-8 h-8",
                    }}
                />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
