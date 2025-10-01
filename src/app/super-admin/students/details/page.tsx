
"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getFirestore, collection, getDocs, query, orderBy, onSnapshot } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Loader2, Search, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/lib/data";
import StudentProfileView from "@/components/student-profile-view";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ClassItem = {
  id: string;
  name: string;
};

export default function StudentDetailsPage() {
    const [allStudents, setAllStudents] = React.useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = React.useState<Student[]>([]);
    const [classes, setClasses] = React.useState<ClassItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    
    const [rollSearch, setRollSearch] = React.useState("");
    const [nameSearch, setNameSearch] = React.useState("");
    const [phoneSearch, setPhoneSearch] = React.useState("");
    const [classFilter, setClassFilter] = React.useState("all");
    const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
    const [isViewOpen, setIsViewOpen] = React.useState(false);


    const db = getFirestore(app);
    const { toast } = useToast();
    
    React.useEffect(() => {
        setLoading(true);
        const q = query(collection(db, "students"), orderBy("class"), orderBy("roll"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const studentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
            setAllStudents(studentsData);
            setFilteredStudents(studentsData); // Initially show all
            setLoading(false);
        }, (error) => {
            console.error("Error fetching students: ", error);
            toast({ variant: "destructive", title: "ত্রুটি", description: "শিক্ষার্থীদের তথ্য আনতে সমস্যা হয়েছে।" });
            setLoading(false);
        });

        const fetchClasses = async () => {
            try {
                const classQuery = query(collection(db, "classes"), orderBy("numericName"));
                const classSnapshot = await getDocs(classQuery);
                setClasses(classSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassItem)));
            } catch (error) {
                console.error("Error fetching classes: ", error);
            }
        };
        fetchClasses();
        
        return () => unsubscribe();
    }, [db, toast]);
    
     React.useEffect(() => {
        const lowerName = nameSearch.toLowerCase();
        const results = allStudents.filter(student => {
            const nameMatch = !lowerName || student.name?.toLowerCase().includes(lowerName);
            const rollMatch = !rollSearch || String(student.roll).includes(rollSearch);
            const phoneMatch = !phoneSearch || student.phone?.includes(phoneSearch) || student.fatherPhone?.includes(phoneSearch);
            const classMatch = classFilter === "all" || student.class === classFilter;
            return nameMatch && rollMatch && phoneMatch && classMatch;
        });
        setFilteredStudents(results);
    }, [rollSearch, nameSearch, phoneSearch, classFilter, allStudents]);

    const handleViewClick = (student: Student) => {
        setSelectedStudent(student);
        setIsViewOpen(true);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>শিক্ষার্থীর বিবরণ খুঁজুন</CardTitle>
                    <CardDescription>রোল, নাম, ফোন নম্বর বা শ্রেণী দিয়ে রিয়েল-টাইমে শিক্ষার্থী খুঁজুন।</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-gray-50/50">
                        <div className="relative">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="roll-search" placeholder="রোল দিয়ে খুঁজুন..." className="pl-10" value={rollSearch} onChange={(e) => setRollSearch(e.target.value)} />
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="name-search" placeholder="নাম দিয়ে খুঁজুন..." className="pl-10" value={nameSearch} onChange={(e) => setNameSearch(e.target.value)} />
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="phone-search" placeholder="ফোন দিয়ে খুঁজুন..." className="pl-10" value={phoneSearch} onChange={(e) => setPhoneSearch(e.target.value)} />
                        </div>
                        <Select value={classFilter} onValueChange={setClassFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="সকল শ্রেণী" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">সকল শ্রেণী</SelectItem>
                                {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>রোল</TableHead>
                                    <TableHead>ছবি</TableHead>
                                    <TableHead>নাম</TableHead>
                                    <TableHead>শ্রেণী</TableHead>
                                    <TableHead>ফোন</TableHead>
                                    <TableHead className="text-right">পদক্ষেপ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredStudents.length > 0 ? (
                                    filteredStudents.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell>{student.roll}</TableCell>
                                            <TableCell>
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={student.avatar} alt={student.name} />
                                                    <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="font-medium">{student.name}</TableCell>
                                            <TableCell>{student.class}</TableCell>
                                            <TableCell>{student.phone || student.fatherPhone}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleViewClick(student)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            কোনো শিক্ষার্থী পাওয়া যায়নি।
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                </CardContent>
            </Card>
            
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>শিক্ষার্থীর প্রোফাইল</DialogTitle>
                    </DialogHeader>
                    {selectedStudent && <StudentProfileView student={selectedStudent} />}
                </DialogContent>
            </Dialog>
        </>
    );
}
