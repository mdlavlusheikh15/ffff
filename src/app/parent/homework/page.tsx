
"use client"

import * as React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getAuth, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { collection, getDocs, getFirestore, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { format, parseISO } from "date-fns";
import { bn } from "date-fns/locale";
import { BookText, CalendarIcon, Loader2, Search } from "lucide-react";
import { app } from "@/lib/firebase";
import { type Student } from "@/lib/data";

type Homework = {
  id: string;
  title: string;
  description: string;
  className: string;
  section: string;
  subject: string;
  submissionDate: string; // "yyyy-MM-dd"
};

type ClassItem = {
  id: string;
  name: string;
};

type Subject = {
    id: string;
    name: string;
}

export default function HomeworkPage() {
    const [allHomeworks, setAllHomeworks] = React.useState<Homework[]>([]);
    const [classes, setClasses] = React.useState<ClassItem[]>([]);
    const [subjects, setSubjects] = React.useState<Subject[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
    
    const [searchTerm, setSearchTerm] = React.useState("");
    const [classFilter, setClassFilter] = React.useState("all");
    const [subjectFilter, setSubjectFilter] = React.useState("all");
    const [dateFilter, setDateFilter] = React.useState<Date | undefined>();

    const db = getFirestore(app);
    const auth = getAuth(app);

    React.useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (!user) setLoading(false);
        });
        return () => unsubscribeAuth();
    }, [auth]);

    React.useEffect(() => {
        const fetchInitialMeta = async () => {
            try {
                const classQuery = query(collection(db, "classes"), orderBy("numericName"));
                const classSnapshot = await getDocs(classQuery);
                setClasses(classSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassItem)));

                const subjectSnapshot = await getDocs(query(collection(db, "subjects"), orderBy("name")));
                setSubjects(subjectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));
            } catch (error) {
                console.error("Error fetching initial metadata:", error);
            }
        };
        fetchInitialMeta();
    }, [db]);
    
     React.useEffect(() => {
        if (!currentUser) return;
        setLoading(true);

        let unsubscribe: (() => void) | null = null;

        const fetchChildrenAndHomework = async () => {
            try {
                const studentQueries = [];
                 if (currentUser.email) {
                    studentQueries.push(query(collection(db, 'students'), where('email', '==', currentUser.email)));
                    studentQueries.push(query(collection(db, 'students'), where('fatherEmail', '==', currentUser.email)));
                    studentQueries.push(query(collection(db, 'students'), where('motherEmail', '==', currentUser.email)));
                }
                 if (currentUser.phoneNumber) {
                    studentQueries.push(query(collection(db, 'students'), where('phone', '==', currentUser.phoneNumber)));
                    studentQueries.push(query(collection(db, 'students'), where('fatherPhone', '==', currentUser.phoneNumber)));
                    studentQueries.push(query(collection(db, 'students'), where('motherPhone', '==', currentUser.phoneNumber)));
                }

                if (studentQueries.length === 0) {
                     setAllHomeworks([]);
                     setLoading(false);
                     return;
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
                
                const childClasses = [...new Set(childrenData.map(c => c.class))];
                
                if (childClasses.length === 0) {
                    setAllHomeworks([]);
                    setLoading(false);
                    return;
                }

                const homeworkQuery = query(collection(db, "homework"), where('className', 'in', childClasses), orderBy("submissionDate", "desc"));
                
                unsubscribe = onSnapshot(homeworkQuery, (snapshot) => {
                    const homeworksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Homework));
                    setAllHomeworks(homeworksData);
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching homework:", error);
                    setLoading(false);
                });

            } catch (error) {
                console.error("Error setting up homework listener:", error);
                setLoading(false);
            }
        }
        
        fetchChildrenAndHomework();
        
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };

    }, [currentUser, db]);

    const filteredHomeworks = React.useMemo(() => {
        return allHomeworks.filter(hw => {
            const searchMatch = searchTerm === "" || hw.title.toLowerCase().includes(searchTerm.toLowerCase());
            const classMatch = classFilter === "all" || hw.className === classFilter;
            const subjectMatch = subjectFilter === "all" || hw.subject === subjectFilter;
            const dateMatch = !dateFilter || hw.submissionDate === format(dateFilter, "yyyy-MM-dd");
            return searchMatch && classMatch && subjectMatch && dateMatch;
        });
    }, [allHomeworks, searchTerm, classFilter, subjectFilter, dateFilter]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl">বাড়ির কাজ</CardTitle>
                <CardDescription>আপনার শ্রেণীর জন্য নির্ধারিত বাড়ির কাজগুলো দেখুন।</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-gray-50">
                    <div className="relative md:col-span-2 lg:col-span-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input 
                            placeholder="শিরোনাম দিয়ে খুঁজুন..." 
                            className="pl-10" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
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
                     <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="সকল বিষয়" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">সকল বিষয়</SelectItem>
                            {subjects.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal bg-white",
                            !dateFilter && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFilter ? format(dateFilter, "PPP", { locale: bn }) : <span>তারিখ নির্বাচন করুন</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={dateFilter}
                            onSelect={setDateFilter}
                            initialFocus
                            locale={bn}
                        />
                        </PopoverContent>
                    </Popover>
                </div>
                
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Accordion type="single" collapsible className="w-full">
                        {filteredHomeworks.length > 0 ? filteredHomeworks.map((hw) => (
                            <AccordionItem key={hw.id} value={hw.id}>
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center justify-between w-full pr-4">
                                        <div className="flex items-center gap-4 text-left">
                                             <div className="p-3 bg-primary/10 rounded-full">
                                                <BookText className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">{hw.title}</h4>
                                                <p className="text-sm text-muted-foreground">{hw.className} ({hw.section}) - {hw.subject}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-muted-foreground">জমাদানের তারিখ</p>
                                            <p className="font-semibold text-primary">{format(parseISO(hw.submissionDate), "PP", { locale: bn })}</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-16 pr-4 pt-2">
                                    <p className="text-base whitespace-pre-wrap">{hw.description}</p>
                                </AccordionContent>
                            </AccordionItem>
                        )) : (
                            <div className="text-center py-10 text-muted-foreground">
                                <p>কোনো বাড়ির কাজ পাওয়া যায়নি।</p>
                            </div>
                        )}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
}
