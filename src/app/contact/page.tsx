
"use client"

import * as React from "react";
import MainLayout from "@/app/(main)/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Loader2 } from "lucide-react";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

type ContactSettings = {
    email?: string;
    phone?: string;
    address?: string;
}

export default function ContactPage() {
    const [settings, setSettings] = React.useState<ContactSettings>({});
    const [loading, setLoading] = React.useState(true);
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [subject, setSubject] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [isSending, setIsSending] = React.useState(false);

    const db = getFirestore(app);
    const { toast } = useToast();

    React.useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, "settings", "general");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().contact) {
                    setSettings(docSnap.data().contact as ContactSettings);
                }
            } catch (error) {
                console.error("Error fetching contact settings: ", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [db]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !subject || !message) {
            toast({
                variant: "destructive",
                title: "ত্রুটি",
                description: "অনুগ্রহ করে সকল ঘর পূরণ করুন।",
            });
            return;
        }

        setIsSending(true);
        try {
            await addDoc(collection(db, "complaints"), {
                title: subject,
                content: message,
                from: `${name} <${email}> ${phone}`,
                sentAt: serverTimestamp(),
            });

            toast({
                title: "সফল",
                description: "আপনার বার্তা সফলভাবে পাঠানো হয়েছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।",
            });
            
            // Clear the form
            setName('');
            setEmail('');
            setPhone('');
            setSubject('');
            setMessage('');
            
        } catch (error) {
             console.error("Error sending message:", error);
             toast({
                variant: "destructive",
                title: "ত্রুটি",
                description: "বার্তা পাঠাতে একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
            });
        } finally {
            setIsSending(false);
        }
    };


    return (
        <MainLayout>
            <div className="bg-gray-50/50">
                <div className="py-16 border rounded-lg bg-white">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">যোগাযোগ করুন</h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                            আপনার যেকোনো প্রশ্ন বা মতামতের জন্য আমাদের সাথে যোগাযোগ করুন।
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-24">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                            <Card className="text-center">
                                <CardContent className="p-8">
                                    <Phone className="h-10 w-10 text-primary mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold">ফোন</h3>
                                    <p className="text-muted-foreground mt-2">{settings.phone || '(১২৩) ৪৫০-৭৮৯০'}</p>
                                </CardContent>
                            </Card>
                            <Card className="text-center">
                                <CardContent className="p-8">
                                    <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold">ইমেইল</h3>
                                    <p className="text-muted-foreground mt-2">{settings.email || 'info@ikranuraniacademy.edu'}</p>
                                </CardContent>
                            </Card>
                            <Card className="text-center">
                                <CardContent className="p-8">
                                    <MapPin className="h-10 w-10 text-primary mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold">ঠিকানা</h3>
                                    <p className="text-muted-foreground mt-2">{settings.address || '১২৩ শিক্ষা লেন, জ্ঞান নগরী, ১২৩৪৫'}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                         <Card>
                             <CardHeader>
                                <CardTitle>আমাদের একটি বার্তা পাঠান</CardTitle>
                             </CardHeader>
                            <form onSubmit={handleSubmit}>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">নাম</Label>
                                            <Input id="name" placeholder="আপনার নাম" value={name} onChange={e => setName(e.target.value)} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">ইমেইল</Label>
                                            <Input id="email" type="email" placeholder="আপনার ইমেইল" value={email} onChange={e => setEmail(e.target.value)} required/>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">ফোন নম্বর</Label>
                                        <Input id="phone" type="tel" placeholder="আপনার ফোন নম্বর" value={phone} onChange={e => setPhone(e.target.value)} required/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">বিষয়</Label>
                                        <Input id="subject" placeholder="আপনার বার্তার বিষয়" value={subject} onChange={e => setSubject(e.target.value)} required/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message">বার্তা</Label>
                                        <Textarea id="message" placeholder="আপনার বার্তা এখানে লিখুন..." rows={6} value={message} onChange={e => setMessage(e.target.value)} required/>
                                    </div>
                                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSending}>
                                        {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        বার্তা পাঠান
                                    </Button>
                                </CardContent>
                            </form>
                        </Card>

                        <div>
                            <Card>
                                <CardContent className="p-2">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d116246.33301073831!2d89.50533!3d24.54968!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fc1737b42a1761%3A0x6b5c2f86155a3064!2sIkra%20Nurani%20Academy!5e0!3m2!1sen!2sbd"
                                        width="100%"
                                        height="450"
                                        style={{ border: 0 }}
                                        allowFullScreen={true}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        className="rounded-md"
                                    ></iframe>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}
