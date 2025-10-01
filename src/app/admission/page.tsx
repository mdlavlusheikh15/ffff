
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar as CalendarIcon, Upload, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, getDocs, getFirestore, query, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import ImageKitUploader from "@/components/imagekit-uploader";
import Link from "next/link";
import Image from "next/image";
import MainLayout from "@/app/(main)/layout";

type ClassItem = {
  id: string;
  name: string;
  numericName: string;
};

export default function AdmissionPage() {
    const [dob, setDob] = React.useState<Date>();
    const [loading, setLoading] = React.useState(false);
    const [classes, setClasses] = React.useState<ClassItem[]>([]);
    const [avatarUrl, setAvatarUrl] = React.useState('');
    const { toast } = useToast();
    const router = useRouter();
    const db = getFirestore(app);

    React.useEffect(() => {
        const fetchClasses = async () => {
            try {
                const q = query(collection(db, "classes"), orderBy("numericName"));
                const querySnapshot = await getDocs(q);
                const classesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassItem));
                setClasses(classesData);
            } catch (error) {
                console.error("Error fetching classes:", error);
            }
        };
        fetchClasses();
    }, [db]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const studentData = Object.fromEntries(formData.entries());

        try {
            const docRef = await addDoc(collection(db, "students"), {
                ...studentData,
                dob: dob ? format(dob, "yyyy-MM-dd") : '',
                avatar: avatarUrl,
                admissionNo: `ADMT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                roll: Math.floor(1 + Math.random() * 100) // Placeholder
            });
            toast({
                title: "আবেদন সফল হয়েছে",
                description: "আপনার ভর্তির আবেদন সফলভাবে জমা দেওয়া হয়েছে।",
            });
            router.push("/");
        } catch (error) {
            console.error("Error adding document: ", error);
            toast({
                variant: "destructive",
                title: "ত্রুটি",
                description: "আপনার আবেদন জমা দিতে একটি সমস্যা হয়েছে।",
            });
        } finally {
            setLoading(false);
        }
    };


  return (
    <MainLayout>
        <div className="bg-gray-50 min-h-screen">
            <main className="py-8">
                <form onSubmit={handleSave}>
                    <div className="space-y-6 max-w-5xl mx-auto">
                        <div className="text-center my-4">
                            <h2 className="text-2xl font-bold mb-4">ভর্তি ফরম</h2>
                            <div className="flex items-center justify-center space-x-8">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="nurani-dept" name="department" value="nurani" />
                                    <Label htmlFor="nurani-dept">নূরানী বিভাগ</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="hifz-dept" name="department" value="hifz" />
                                    <Label htmlFor="hifz-dept">হিফজ বিভাগ</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="residential" name="residency" value="residential" />
                                    <Label htmlFor="residential">আবাসিক</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="non-residential" name="residency" value="non-residential" />
                                    <Label htmlFor="non-residential">অনাবাসিক</Label>
                                </div>
                            </div>
                        </div>

                        <Card>
                            <CardHeader><CardTitle>শিক্ষার্থীর তথ্য</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2 md:col-span-3">
                                        <Label htmlFor="student-name">শিক্ষার্থীর পুরো নাম</Label>
                                        <Input id="student-name" name="name" placeholder="আপনার পুরো নাম লিখুন" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="dob">জন্ম তারিখ</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn("w-full justify-start text-left font-normal",!dob && "text-muted-foreground")}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {dob ? format(dob, "PPP", { locale: bn }) : <span>একটি তারিখ বাছুন</span>}
                                            </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={dob} onSelect={setDob} initialFocus locale={bn}/>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>লিঙ্গ</Label>
                                        <RadioGroup name="gender" defaultValue="male" className="flex items-center gap-4 pt-2">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="male" id="male" /><Label htmlFor="male">পুরুষ</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="female" id="female" /><Label htmlFor="female">মহিলা</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    <div className="space-y-2"></div>
                                    <div className="space-y-2">
                                        <Label htmlFor="religion">ধর্ম</Label>
                                        <Select name="religion"><SelectTrigger id="religion"><SelectValue placeholder="ধর্ম নির্বাচন করুন" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="islam">ইসলাম</SelectItem>
                                                <SelectItem value="hindu">হিন্দু</SelectItem>
                                                <SelectItem value="buddhist">বৌদ্ধ</SelectItem>
                                                <SelectItem value="christian">খ্রিস্টান</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="blood-group">রক্তের গ্রুপ</Label>
                                        <Select name="bloodGroup"><SelectTrigger id="blood-group"><SelectValue placeholder="রক্তের গ্রুপ নির্বাচন করুন" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="a+">A+</SelectItem><SelectItem value="a-">A-</SelectItem><SelectItem value="b+">B+</SelectItem><SelectItem value="b-">B-</SelectItem><SelectItem value="o+">O+</SelectItem><SelectItem value="o-">O-</SelectItem><SelectItem value="ab+">AB+</SelectItem><SelectItem value="ab-">AB-</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nationality">জাতীয়তা</Label>
                                        <Input name="nationality" id="nationality" placeholder="জাতীয়তা" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="phone">মোবাইল নম্বর</Label>
                                        <Input name="phone" id="phone" type="tel" placeholder="মোবাইল নম্বর" required/>
                                    </div>
                                    <div className="space-y-2 md:col-span-3">
                                        <Label htmlFor="email">ইমেইল</Label>
                                        <Input name="email" id="email" type="email" placeholder="ইমেইল" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>শিক্ষার্থীর ছবি</Label>
                                        <ImageKitUploader onUploadSuccess={setAvatarUrl} folder="/students" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="class">ক্লাস</Label>
                                        <Select name="class"><SelectTrigger id="class"><SelectValue placeholder="ক্লাস নির্বাচন করুন" /></SelectTrigger>
                                            <SelectContent>
                                                {classes.map((c) => (<SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="section">সেকশন</Label>
                                        <Select name="section"><SelectTrigger id="section"><SelectValue placeholder="সেকশন নির্বাচন করুন" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>অভিভাবকের তথ্য</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                <div>
                                    <h3 className="font-semibold text-lg mb-4">বাবার বিবরণ</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label htmlFor="father-name">নাম</Label><Input name="fatherName" id="father-name" placeholder="বাবার নাম" /></div>
                                        <div className="space-y-2"><Label htmlFor="father-phone">ফোন</Label><Input name="fatherPhone" id="father-phone" placeholder="ফোন নম্বর" /></div>
                                        <div className="space-y-2"><Label htmlFor="father-occupation">পেশা</Label><Input name="fatherOccupation" id="father-occupation" placeholder="পেশা" /></div>
                                        <div className="space-y-2"><Label htmlFor="father-nid">এনআইডি</Label><Input name="fatherNid" id="father-nid" placeholder="এনআইডি" /></div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-4">মায়ের বিবরণ</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label htmlFor="mother-name">নাম</Label><Input name="motherName" id="mother-name" placeholder="মায়ের নাম" /></div>
                                        <div className="space-y-2"><Label htmlFor="mother-phone">ফোন</Label><Input name="motherPhone" id="mother-phone" placeholder="ফোন নম্বর" /></div>
                                        <div className="space-y-2"><Label htmlFor="mother-occupation">পেশা</Label><Input name="motherOccupation" id="mother-occupation" placeholder="পেশা" /></div>
                                        <div className="space-y-2"><Label htmlFor="mother-nid">এনআইডি</Label><Input name="motherNid" id="mother-nid" placeholder="এনআইডি" /></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader><CardTitle>স্থায়ী ঠিকানা</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label htmlFor="perm-village">গ্রাম</Label><Input name="permanentVillage" id="perm-village" placeholder="গ্রাম" /></div>
                                    <div className="space-y-2"><Label htmlFor="perm-post">ডাকঘর</Label><Input name="permanentPost" id="perm-post" placeholder="ডাকঘর" /></div>
                                    <div className="space-y-2"><Label htmlFor="perm-upazila">উপজেলা</Label><Input name="permanentUpazila" id="perm-upazila" placeholder="উপজেলা" /></div>
                                    <div className="space-y-2"><Label htmlFor="perm-district">জেলা</Label><Input name="permanentDistrict" id="perm-district" placeholder="জেলা" /></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>বর্তমান ঠিকানা</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label htmlFor="pres-village">গ্রাম</Label><Input name="presentVillage" id="pres-village" placeholder="গ্রাম" /></div>
                                    <div className="space-y-2"><Label htmlFor="pres-post">ডাকঘর</Label><Input name="presentPost" id="pres-post" placeholder="ডাকঘর" /></div>
                                    <div className="space-y-2"><Label htmlFor="pres-upazila">উপজেলা</Label><Input name="presentUpazila" id="pres-upazila" placeholder="উপজেলা" /></div>
                                    <div className="space-y-2"><Label htmlFor="pres-district">জেলা</Label><Input name="presentDistrict" id="pres-district" placeholder="জেলা" /></div>
                                </CardContent>
                            </Card>
                        </div>
                        <Card>
                            <CardHeader><CardTitle>পূর্ববর্তী একাডেমিক তথ্য</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2"><Label htmlFor="prev-school">পূর্ববর্তী স্কুলের নাম এবং ঠিকানা</Label><Input name="previousSchool" id="prev-school" placeholder="স্কুলের নাম এবং ঠিকানা" /></div>
                                    <div className="space-y-2"><Label htmlFor="prev-class">কোন ক্লাস থেকে উত্তীর্ণ</Label><Input name="previousClass" id="prev-class" placeholder="ক্লাস" /></div>
                                    <div className="space-y-2"><Label htmlFor="prev-roll">শেষ পরীক্ষার রোল নং</Label><Input name="previousRoll" id="prev-roll" placeholder="রোল নং" /></div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="transfer-reason">প্রতিষ্ঠানের পরিবর্তনের কারন</Label>
                                    <Textarea name="transferReason" id="transfer-reason" placeholder="এখানে কারণ লিখুন" />
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end gap-2">
                                <Button variant="outline" type="reset" disabled={loading}>রিসেট</Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    আবেদন জমা দিন
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </form>
            </main>
        </div>
    </MainLayout>
  );
}

    

    
