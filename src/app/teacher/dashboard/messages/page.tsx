
"use client"

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { getFirestore, collection, getDocs, query, orderBy, where, addDoc, serverTimestamp } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/lib/data";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";

type ClassItem = {
  id: string;
  name: string;
  sections: string[];
};

export default function MessagesPage() {
    const [classes, setClasses] = React.useState<ClassItem[]>([]);
    const [allStudents, setAllStudents] = React.useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = React.useState<Student[]>([]);
    
    const [loadingMeta, setLoadingMeta] = React.useState(true);
    const [isSending, setIsSending] = React.useState(false);

    const [selectedClass, setSelectedClass] = React.useState("");
    const [selectedSection, setSelectedSection] = React.useState("all");
    const [selectedStudentIds, setSelectedStudentIds] = React.useState<string[]>([]);
    
    const [messageTitle, setMessageTitle] = React.useState("");
    const [messageContent, setMessageContent] = React.useState("");

    const db = getFirestore(app);
    const { toast } = useToast();

    React.useEffect(() => {
        const fetchInitialData = async () => {
            setLoadingMeta(true);
            try {
                const classQuery = query(collection(db, "classes"), orderBy("numericName"));
                const classesSnapshot = await getDocs(classQuery);
                setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassItem)));

                const studentsQuery = query(collection(db, "students"), orderBy("class"), orderBy("roll"));
                const studentsSnapshot = await getDocs(studentsQuery);
                setAllStudents(studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));

            } catch (error) {
                toast({ variant: "destructive", title: "ত্রুটি", description: "প্রাথমিক তথ্য আনতে সমস্যা হয়েছে।" });
            } finally {
                setLoadingMeta(false);
            }
        };
        fetchInitialData();
    }, [db, toast]);

    React.useEffect(() => {
        if (!selectedClass) {
            setFilteredStudents([]);
            return;
        }
        let students = allStudents.filter(s => s.class === selectedClass);
        if (selectedSection !== "all") {
            students = students.filter(s => s.section === selectedSection);
        }
        setFilteredStudents(students);
        setSelectedStudentIds([]); // Reset selection when filters change
    }, [selectedClass, selectedSection, allStudents]);

    const handleSendMessage = async () => {
        if (!messageTitle || !messageContent || selectedStudentIds.length === 0) {
            toast({ variant: "destructive", title: "ত্রুটি", description: "অনুগ্রহ করে শিরোনাম, বার্তা এবং অন্তত একজন প্রাপক নির্বাচন করুন।" });
            return;
        }
        setIsSending(true);
        try {
            const recipientStudents = allStudents.filter(s => selectedStudentIds.includes(s.id));
            const recipientPhoneNumbers = recipientStudents.flatMap(s => [s.phone, s.fatherPhone, s.motherPhone]).filter(Boolean);

            await addDoc(collection(db, "messages"), {
                title: messageTitle,
                content: messageContent,
                recipient: Array.from(new Set(recipientPhoneNumbers)), // Unique phone numbers
                sentAt: serverTimestamp(),
            });

            toast({ title: "সফল", description: `${recipientStudents.length} জন শিক্ষার্থীর অভিভাবককে বার্তা পাঠানো হয়েছে।` });
            setMessageTitle("");
            setMessageContent("");
            setSelectedStudentIds([]);

        } catch (error) {
            console.error("Error sending message:", error);
            toast({ variant: "destructive", title: "ত্রুটি", description: "বার্তা পাঠাতে সমস্যা হয়েছে।" });
        } finally {
            setIsSending(false);
        }
    };
    
    const availableSections = React.useMemo(() => {
        return classes.find(c => c.name === selectedClass)?.sections || [];
    }, [classes, selectedClass]);
    
    const studentOptions: MultiSelectOption[] = filteredStudents.map(s => ({
        value: s.id,
        label: `${s.name} (রোল: ${s.roll})`
    }));

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>বার্তা পাঠান</CardTitle>
                <CardDescription>
                    অভিভাবকদের কাছে সরাসরি বার্তা পাঠাতে নিচের ফর্মটি ব্যবহার করুন।
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                    <h3 className="font-semibold">প্রাপক নির্বাচন</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                             <Label>শ্রেণী</Label>
                             <Select value={selectedClass} onValueChange={setSelectedClass} disabled={loadingMeta}>
                                <SelectTrigger><SelectValue placeholder="শ্রেণী নির্বাচন করুন" /></SelectTrigger>
                                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                             </Select>
                        </div>
                        <div className="space-y-2">
                             <Label>শাখা</Label>
                             <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                                <SelectTrigger><SelectValue placeholder="শাখা নির্বাচন করুন" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">সকল শাখা</SelectItem>
                                    {availableSections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                             </Select>
                        </div>
                     </div>
                     {selectedClass && (
                        <div className="space-y-2">
                            <Label>শিক্ষার্থী</Label>
                             <MultiSelect
                                options={studentOptions}
                                selected={selectedStudentIds}
                                onChange={setSelectedStudentIds}
                                placeholder={`${filteredStudents.length} জন শিক্ষার্থীর মধ্যে থেকে নির্বাচন করুন...`}
                            />
                        </div>
                     )}
                </div>
                
                 <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="message-title">শিরোনাম</Label>
                        <Input id="message-title" value={messageTitle} onChange={(e) => setMessageTitle(e.target.value)} placeholder="বার্তার বিষয়"/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="message-content">বার্তা</Label>
                        <Textarea id="message-content" value={messageContent} onChange={(e) => setMessageContent(e.target.value)} placeholder="আপনার বার্তা এখানে লিখুন..." rows={6}/>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSendMessage} disabled={isSending || selectedStudentIds.length === 0} className="ml-auto">
                    {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                    বার্তা পাঠান
                </Button>
            </CardFooter>
        </Card>
    );
}
