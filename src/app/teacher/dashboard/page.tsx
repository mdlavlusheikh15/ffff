

"use client"

import {
  BookCheck,
  GraduationCap,
  Users,
  Search,
  Book,
  Eye
} from "lucide-react";
import { Pie, PieChart, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as React from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getCountFromServer, getDocs, query, orderBy, limit } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Student } from "@/lib/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StudentProfileView from "@/components/student-profile-view";


type Stats = {
  totalStudents: number;
  totalExams: number;
  totalSubjects: number;
  totalTeachers: number;
};

type Notice = {
    id: string;
    title: string;
    author: string;
    date: string;
}

const toBengaliNumber = (num: number) => {
    return num.toLocaleString('bn-BD');
}


export default function TeacherDashboardPage() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [notifications, setNotifications] = React.useState<Notice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const { toast } = useToast();

  const [rollSearch, setRollSearch] = React.useState("");
  const [nameSearch, setNameSearch] = React.useState("");
  const [classSearch, setClassSearch] = React.useState("");
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [isViewOpen, setIsViewOpen] = React.useState(false);

  const handleViewClick = (student: Student) => {
    setSelectedStudent(student);
    setIsViewOpen(true);
  };
  
   React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/');
      } else {
        fetchData();
      }
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const studentsCollection = collection(db, "students");
            const teachersCollection = collection(db, "teachers");
            const subjectsCollection = collection(db, "subjects");
            const examsCollection = collection(db, "exams");
            const noticesCollection = query(collection(db, "notices"), orderBy("date", "desc"), limit(5));

            const [
                studentCountSnap,
                teacherCountSnap,
                subjectCountSnap,
                examCountSnap,
                studentsSnapshot,
                noticesSnapshot
            ] = await Promise.all([
                getCountFromServer(studentsCollection),
                getCountFromServer(teachersCollection),
                getCountFromServer(subjectsCollection),
                getCountFromServer(examsCollection),
                getDocs(studentsCollection),
                getDocs(noticesCollection)
            ]);

            setStats({
                totalStudents: studentCountSnap.data().count,
                totalTeachers: teacherCountSnap.data().count,
                totalSubjects: subjectCountSnap.data().count,
                totalExams: examCountSnap.data().count,
            });
            
            setStudents(studentsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})) as Student[]);
            setNotifications(noticesSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})) as Notice[]);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not fetch dashboard data."
            })
        } finally {
            setLoading(false);
        }
    }

    return () => unsubscribe();
  }, [auth, router, db, toast]);
  
  const studentGenderData = React.useMemo(() => {
    const male = students.filter(s => s.gender === 'male').length;
    const female = students.filter(s => s.gender === 'female').length;
    return [
        { name: 'মহিলা শিক্ষার্থী', value: female, fill: '#3b82f6' },
        { name: 'পুরুষ শিক্ষার্থী', value: male, fill: '#f97316' },
    ]
  }, [students]);

  const filteredStudents = React.useMemo(() => {
    return students.filter(student => {
        const rollMatch = rollSearch ? String(student.roll).includes(rollSearch) : true;
        const nameMatch = nameSearch ? student.name?.toLowerCase().includes(nameSearch.toLowerCase()) : true;
        const classMatch = classSearch ? student.class?.toLowerCase().includes(classSearch.toLowerCase()) : true;
        return rollMatch && nameMatch && classMatch;
    });
  }, [students, rollSearch, nameSearch, classSearch]);
  
  if (loading || !stats) {
    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 bg-gray-100/50">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
                <div>
                    <h3 className="text-3xl font-bold">{toBengaliNumber(stats.totalStudents)}</h3>
                    <p className="text-sm text-muted-foreground">মোট শিক্ষার্থী</p>
                </div>
                <div className="p-4 rounded-full bg-purple-100">
                    <Users className="h-7 w-7 text-purple-600" />
                </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
                <div>
                    <h3 className="text-3xl font-bold">{toBengaliNumber(stats.totalTeachers)}</h3>
                    <p className="text-sm text-muted-foreground">মোট শিক্ষক</p>
                </div>
                <div className="p-4 rounded-full bg-orange-100">
                    <Users className="h-7 w-7 text-orange-600" />
                </div>
            </CardContent>
          </Card>
           <Card>
            <CardContent className="flex items-center justify-between p-6">
                <div>
                    <h3 className="text-3xl font-bold">{toBengaliNumber(stats.totalSubjects)}</h3>
                    <p className="text-sm text-muted-foreground">মোট বিষয়</p>
                </div>
                <div className="p-4 rounded-full bg-yellow-100">
                    <Book className="h-7 w-7 text-yellow-600" />
                </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
                <div>
                    <h3 className="text-3xl font-bold">{toBengaliNumber(stats.totalExams)}</h3>
                    <p className="text-sm text-muted-foreground">মোট পরীক্ষা</p>
                </div>
                 <div className="p-4 rounded-full bg-blue-100">
                    <BookCheck className="h-7 w-7 text-blue-600" />
                </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>শিক্ষার্থী</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={studentGenderData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} startAngle={90} endAngle={450}>
                                {studentGenderData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-around w-full mt-4 text-sm">
                        <div className="text-center">
                            <p className="text-muted-foreground">মহিলা শিক্ষার্থী</p>
                            <p className="font-bold">{toBengaliNumber(studentGenderData.find(d => d.name === 'মহিলা শিক্ষার্থী')?.value || 0)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-muted-foreground">পুরুষ শিক্ষার্থী</p>
                            <p className="font-bold">{toBengaliNumber(studentGenderData.find(d => d.name === 'পুরুষ শিক্ষার্থী')?.value || 0)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>নোটিশ</CardTitle>
                </CardHeader>
                 <CardContent>
                    <ScrollArea className="h-72">
                        <div className="space-y-6">
                            {notifications.length > 0 ? notifications.map((notification, index) => (
                                <div key={index} className="flex items-start gap-4">
                                     <Badge className={`bg-cyan-400 text-white text-xs whitespace-nowrap`}>{format(new Date(notification.date), "dd MMM, yyyy")}</Badge>
                                    <div>
                                        <p className="text-sm font-medium">{notification.title}</p>
                                        <p className="text-xs text-muted-foreground">{notification.author} / {formatDistanceToNow(new Date(notification.date), { addSuffix: true, locale: bn })}</p>
                                    </div>
                                </div>
                            )) : <p className="text-muted-foreground text-center">কোনো নোটিশ পাওয়া যায়নি।</p>}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>আমার ছাত্রছাত্রীরা</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="flex flex-wrap gap-4 mb-4">
                      <Input placeholder="রোল দিয়ে খুঁজুন..." className="max-w-xs" value={rollSearch} onChange={e => setRollSearch(e.target.value)} />
                      <Input placeholder="নাম দিয়ে খুঁজুন..." className="max-w-xs" value={nameSearch} onChange={e => setNameSearch(e.target.value)} />
                      <Input placeholder="ক্লাস দিয়ে খুঁজুন..." className="max-w-xs" value={classSearch} onChange={e => setClassSearch(e.target.value)} />
                  </div>
                  <div className="border rounded-lg overflow-x-auto">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead><Checkbox /></TableHead>
                                  <TableHead>রোল</TableHead>
                                  <TableHead>ছবি</TableHead>
                                  <TableHead>নাম</TableHead>
                                  <TableHead>লিঙ্গ</TableHead>
                                  <TableHead>ক্লাস</TableHead>
                                  <TableHead>শাখা</TableHead>
                                  <TableHead>অভিভাবক</TableHead>
                                  <TableHead>ঠিকানা</TableHead>
                                  <TableHead>জন্ম তারিখ</TableHead>
                                  <TableHead>ফোন</TableHead>
                                  <TableHead>ই-মেইল</TableHead>
                                  <TableHead>পদক্ষেপ</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {filteredStudents.slice(0, 5).map(student => (
                                  <TableRow key={student.id}>
                                      <TableCell><Checkbox /></TableCell>
                                      <TableCell>{toBengaliNumber(student.roll)}</TableCell>
                                      <TableCell>
                                          <Avatar className="h-8 w-8">
                                              <AvatarImage src={student.avatar} alt={student.name} data-ai-hint="student photo" />
                                              <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                      </TableCell>
                                      <TableCell>{student.name}</TableCell>
                                      <TableCell>{student.gender}</TableCell>
                                      <TableCell>{student.class}</TableCell>
                                      <TableCell>{student.section}</TableCell>
                                      <TableCell>{student.fatherName}</TableCell>
                                      <TableCell>{student.presentAddress}</TableCell>
                                      <TableCell>{student.dob}</TableCell>
                                      <TableCell>{student.phone}</TableCell>
                                      <TableCell>{student.email}</TableCell>
                                      <TableCell>
                                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewClick(student)}>
                                                <Eye className="h-4 w-4" />
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </div>
              </CardContent>
          </Card>
        </div>
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>শিক্ষার্থীর প্রোফাইল</DialogTitle>
                </DialogHeader>
                {selectedStudent && <StudentProfileView student={selectedStudent} />}
            </DialogContent>
        </Dialog>
    </div>
  );
}
