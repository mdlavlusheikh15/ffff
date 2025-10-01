
"use client"

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/lib/data";

export default function ParentComplaintsPage() {
    const [title, setTitle] = React.useState('');
    const [content, setContent] = React.useState('');
    const [isSending, setIsSending] = React.useState(false);
    const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
    const [children, setChildren] = React.useState<Student[]>([]);
    
    const auth = getAuth(app);
    const db = getFirestore(app);
    const { toast } = useToast();
    
    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
            }
        });
        return () => unsubscribe();
    }, [auth]);

     React.useEffect(() => {
        if (!currentUser) return;
        
        const fetchChildren = async () => {
             const studentQueries = [];
            if (currentUser.email) {
                studentQueries.push(query(collection(db, 'students'), where('fatherEmail', '==', currentUser.email)));
            }
             if (currentUser.phoneNumber) {
                studentQueries.push(query(collection(db, 'students'), where('fatherPhone', '==', currentUser.phoneNumber)));
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
        };

        fetchChildren();
    }, [currentUser, db]);

    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) {
            toast({
                variant: "destructive",
                title: "ত্রুটি",
                description: "অনুগ্রহ করে সকল ঘর পূরণ করুন।",
            });
            return;
        }

        setIsSending(true);
        const parentName = children.length > 0 ? children[0].fatherName : currentUser?.displayName;
        const studentIdentifier = children.length > 0 ? `${children[0].name} (Class: ${children[0].class})` : 'Unknown Student';
        
        const fromIdentifier = `${parentName || 'অভিভাবক'} (${studentIdentifier} এর অভিভাবক)`;
        
        try {
            await addDoc(collection(db, "complaints"), {
                title: title,
                content: content,
                from: fromIdentifier,
                sentAt: serverTimestamp(),
            });

            toast({
                title: "সফল",
                description: "আপনার অভিযোগ সফলভাবে জমা দেওয়া হয়েছে।",
            });
            
            setTitle('');
            setContent('');
            
        } catch (error) {
             console.error("Error sending complaint:", error);
             toast({
                variant: "destructive",
                title: "ত্রুটি",
                description: "অভিযোগ পাঠাতে একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>অভিযোগ দাখিল করুন</CardTitle>
                <CardDescription>আপনার যেকোনো সমস্যা, প্রশ্ন বা অভিযোগ এখানে দাখিল করুন।</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">বিষয়</Label>
                        <Input id="title" placeholder="আপনার বার্তার বিষয়" value={title} onChange={e => setTitle(e.target.value)} required/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">বার্তা</Label>
                        <Textarea id="message" placeholder="আপনার বার্তা এখানে লিখুন..." rows={6} value={content} onChange={e => setContent(e.target.value)} required/>
                    </div>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSending}>
                        {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        অভিযোগ দাখিল করুন
                    </Button>
                </CardContent>
            </form>
        </Card>
    );
}
