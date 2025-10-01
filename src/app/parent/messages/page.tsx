
"use client";

import * as React from "react";
import {
  MessageSquare,
  Loader2,
  Inbox,
  FileSpreadsheet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getFirestore, collection, getDocs, query, orderBy, Timestamp, where, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";
import { Student } from "@/lib/data";

type UnifiedMessage = {
  id: string;
  title: string;
  from: string;
  sentAt: Timestamp;
  content: string;
  type: 'message' | 'notice';
};

export default function ParentMessagesPage() {
    const [messages, setMessages] = React.useState<UnifiedMessage[]>([]);
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

    React.useEffect(() => {
        if (!currentUser) return;
        setLoading(true);

        const fetchChildrenAndListen = async () => {
            let combinedUnsubscribes: (() => void)[] = [];

            try {
                // 1. Fetch children to get phone numbers
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
                     setMessages([]);
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
                const parentPhoneNumbers = [...new Set(childrenData.flatMap(c => [c.phone, c.fatherPhone, c.motherPhone]).filter(Boolean))];

                // 2. Listen for targeted messages
                if (parentPhoneNumbers.length > 0) {
                    const messagesQuery = query(collection(db, "messages"), where('recipient', 'in', parentPhoneNumbers), orderBy("sentAt", "desc"));
                    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
                        const messagesData = snapshot.docs.map(doc => ({ 
                            id: doc.id, 
                            ...doc.data(), 
                            type: 'message',
                            from: 'কর্তৃপক্ষ'
                        } as UnifiedMessage));
                        
                        setMessages(prev => {
                            const otherMessages = prev.filter(m => m.type !== 'message');
                            return [...messagesData, ...otherMessages].sort((a, b) => b.sentAt.toMillis() - a.sentAt.toMillis());
                        });

                    }, (error) => {
                        console.error("Error fetching messages:", error);
                        toast({ variant: "destructive", title: "ত্রুটি", description: "বার্তা আনতে সমস্যা হয়েছে।" });
                    });
                    combinedUnsubscribes.push(unsubMessages);
                }

                // 3. Listen for general notices
                const noticesQuery = query(collection(db, "notices"), orderBy("date", "desc"));
                const unsubNotices = onSnapshot(noticesQuery, (snapshot) => {
                    const noticesData = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            title: data.title,
                            content: data.details,
                            from: data.author,
                            sentAt: Timestamp.fromDate(new Date(data.date)),
                            type: 'notice',
                        } as UnifiedMessage;
                    });
                    
                    setMessages(prev => {
                        const otherMessages = prev.filter(m => m.type !== 'notice');
                        return [...noticesData, ...otherMessages].sort((a, b) => b.sentAt.toMillis() - a.sentAt.toMillis());
                    });
                     setLoading(false);

                }, (error) => {
                    console.error("Error fetching notices:", error);
                    toast({ variant: "destructive", title: "ত্রুটি", description: "নোটিশ আনতে সমস্যা হয়েছে।" });
                    setLoading(false);
                });
                combinedUnsubscribes.push(unsubNotices);

            } catch (error) {
                console.error("Error setting up listeners:", error);
                setLoading(false);
            }

            return () => combinedUnsubscribes.forEach(unsub => unsub());
        };

        const unsubscribePromise = fetchChildrenAndListen();
        
        return () => {
            unsubscribePromise.then(unsubFunc => {
                if (unsubFunc) unsubFunc();
            });
        };

    }, [currentUser, db, toast]);

    const getIcon = (type: 'message' | 'notice') => {
        switch (type) {
            case 'message': return <MessageSquare className="h-5 w-5 text-muted-foreground mt-1" />;
            case 'notice': return <FileSpreadsheet className="h-5 w-5 text-muted-foreground mt-1" />;
            default: return <Inbox className="h-5 w-5 text-muted-foreground mt-1" />;
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>প্রাপ্ত বার্তা</CardTitle>
                <CardDescription>কর্তৃপক্ষ থেকে পাঠানো বার্তা এবং নোটিশগুলো এখানে দেখুন।</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? (
                    <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
                ) : messages.length > 0 ? (
                    messages.map(message => (
                        <div key={message.id} className="p-4 border rounded-lg">
                            <div className="flex items-start gap-4">
                                {getIcon(message.type)}
                                <div className="flex-1">
                                    <h3 className="font-semibold">{message.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        থেকে: {message.from} • {formatDistanceToNow(message.sentAt.toDate(), { addSuffix: true, locale: bn })}
                                    </p>
                                    <p className="mt-2 text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>কোনো বার্তা নেই।</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
