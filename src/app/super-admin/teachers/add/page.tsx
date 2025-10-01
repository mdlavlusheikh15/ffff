
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar as CalendarIcon, Loader2, ArrowLeft, PlusCircle, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase";
import ImageKitUploader from "@/components/imagekit-uploader";
import Link from "next/link";
import { EducationalQualification } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";

export default function AddTeacherPage() {
    const [loading, setLoading] = React.useState(false);
    const [avatarUrl, setAvatarUrl] = React.useState('');
    const [dob, setDob] = React.useState<Date | undefined>();
    const [qualifications, setQualifications] = React.useState<Partial<EducationalQualification>[]>([]);
    const [hasExperience, setHasExperience] = React.useState(false);

    const { toast } = useToast();
    const router = useRouter();
    const db = getFirestore(app);

    const handleAddQualification = () => {
        setQualifications([...qualifications, { level: '', institute: '', gpa: '', passingYear: '' }]);
    };
    
    const handleRemoveQualification = (index: number) => {
        const newQualifications = qualifications.filter((_, i) => i !== index);
        setQualifications(newQualifications);
    };

    const handleQualificationChange = (index: number, field: keyof EducationalQualification, value: string) => {
        const newQualifications = [...qualifications];
        newQualifications[index][field] = value;
        setQualifications(newQualifications);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const teacherData = Object.fromEntries(formData.entries());
        
        qualifications.forEach((_, index) => {
            delete teacherData[`qualificationLevel-${index}`];
            delete teacherData[`instituteName-${index}`];
            delete teacherData[`gpa-${index}`];
            delete teacherData[`passingYear-${index}`];
        });

        try {
            await addDoc(collection(db, "teachers"), {
                ...teacherData,
                avatar: avatarUrl,
                dob: dob ? format(dob, "yyyy-MM-dd") : '',
                qualifications,
                hasExperience,
            });
            toast({
                title: "সফল",
                description: "শিক্ষক সফলভাবে যোগ করা হয়েছে।",
            });
            router.push("/super-admin/teachers");
        } catch (error) {
            console.error("Error adding document: ", error);
            toast({
                variant: "destructive",
                title: "ত্রুটি",
                description: "শিক্ষক যোগ করতে একটি সমস্যা হয়েছে।",
            });
        } finally {
            setLoading(false);
        }
    };


  return (
    <form onSubmit={handleSave}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/super-admin/teachers">
              <Button variant="outline" size="icon" type="button">
                  <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">নতুন শিক্ষক যোগ করুন</h1>
        </div>
        
         <Card>
            <CardHeader>
                <CardTitle>শিক্ষকের তথ্য</CardTitle>
                <CardDescription>অনুগ্রহ করে শিক্ষকের তথ্য পূরণ করুন।</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="teacher-name">পুরো নাম</Label>
                        <Input id="teacher-name" name="name" placeholder="পুরো নাম লিখুন" required/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="designation">পদবি</Label>
                        <Input id="designation" name="designation" placeholder="যেমন, সহকারী শিক্ষক" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="subject">বিষয়</Label>
                        <Input id="subject" name="subject" placeholder="যেমন, বাংলা"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">মোবাইল নম্বর</Label>
                        <Input id="phone" name="phone" type="tel" placeholder="মোবাইল নম্বর" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">ইমেইল</Label>
                        <Input id="email" name="email" type="email" placeholder="ইমেইল" />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>শিক্ষকের ছবি</Label>
                        <ImageKitUploader onUploadSuccess={(urls) => setAvatarUrl(urls[0])} folder="/teachers" />
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>ব্যক্তিগত তথ্য</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="father-name">বাবার নাম</Label>
                    <Input id="father-name" name="fatherName" placeholder="বাবার নাম" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="mother-name">মায়ের নাম</Label>
                    <Input id="mother-name" name="motherName" placeholder="মায়ের নাম" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="nid">এনআইডি</Label>
                    <Input id="nid" name="nid" placeholder="এনআইডি নম্বর" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="dob">জন্ম তারিখ</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !dob && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dob ? format(dob, "PPP", { locale: bn }) : <span>একটি তারিখ বাছুন</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={dob} onSelect={setDob} initialFocus locale={bn} />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label>লিঙ্গ</Label>
                    <RadioGroup name="gender" defaultValue="male" className="flex items-center gap-4 pt-2">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="male" />
                            <Label htmlFor="male">পুরুষ</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="female" />
                            <Label htmlFor="female">মহিলা</Label>
                        </div>
                    </RadioGroup>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="religion">ধর্ম</Label>
                    <Select name="religion">
                        <SelectTrigger id="religion">
                            <SelectValue placeholder="ধর্ম নির্বাচন করুন" />
                        </SelectTrigger>
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
                    <Select name="bloodGroup">
                        <SelectTrigger id="blood-group">
                            <SelectValue placeholder="রক্তের গ্রুপ নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="a+">A+</SelectItem><SelectItem value="a-">A-</SelectItem><SelectItem value="b+">B+</SelectItem><SelectItem value="b-">B-</SelectItem><SelectItem value="o+">O+</SelectItem><SelectItem value="o-">O-</SelectItem><SelectItem value="ab+">AB+</SelectItem><SelectItem value="ab-">AB-</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                  <div className="space-y-2">
                    <Label htmlFor="marital-status">বৈবাহিক অবস্থা</Label>
                    <Select name="maritalStatus">
                        <SelectTrigger id="marital-status">
                            <SelectValue placeholder="বৈবাহিক অবস্থা নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Single">অবিবাহিত</SelectItem>
                            <SelectItem value="Married">বিবাহিত</SelectItem>
                            <SelectItem value="Divorced">তালাকপ্রাপ্ত</SelectItem>
                            <SelectItem value="Widowed">বিধবা</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>শিক্ষাগত যোগ্যতা</CardTitle>
                        <Button type="button" size="icon" variant="outline" onClick={handleAddQualification}><PlusCircle className="h-4 w-4"/></Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                   {qualifications.map((qual, index) => (
                     <div key={index} className="space-y-4 p-4 border rounded-md relative">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => handleRemoveQualification(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                        <div className="space-y-2">
                            <Label htmlFor={`qualificationLevel-${index}`}>যোগ্যতার স্তর</Label>
                            <Select name={`qualificationLevel-${index}`} onValueChange={(value) => handleQualificationChange(index, 'level', value)}>
                                <SelectTrigger id={`qualificationLevel-${index}`}><SelectValue placeholder="যোগ্যতা নির্বাচন করুন" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ssc">এসএসসি</SelectItem>
                                    <SelectItem value="hsc">এইচএসসি</SelectItem>
                                    <SelectItem value="honours">স্নাতক</SelectItem>
                                    <SelectItem value="masters">স্নাতকোত্তর</SelectItem>
                                    <SelectItem value="other">অন্যান্য</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                            <div className="space-y-2">
                                <Label htmlFor={`instituteName-${index}`}>প্রতিষ্ঠানের নাম</Label>
                                <Input id={`instituteName-${index}`} name={`instituteName-${index}`} placeholder="প্রতিষ্ঠানের নাম" onChange={(e) => handleQualificationChange(index, 'institute', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`gpa-${index}`}>জিপিএ</Label>
                                <Input id={`gpa-${index}`} name={`gpa-${index}`} placeholder="জিপিএ" onChange={(e) => handleQualificationChange(index, 'gpa', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`passingYear-${index}`}>পাশের বছর</Label>
                                <Input id={`passingYear-${index}`} name={`passingYear-${index}`} placeholder="পাশের বছর" onChange={(e) => handleQualificationChange(index, 'passingYear', e.target.value)} />
                            </div>
                        </div>
                    </div>
                   ))}
                   {qualifications.length === 0 && <p className="text-sm text-muted-foreground text-center">কোনো যোগ্যতা যোগ করা হয়নি।</p>}
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>অভিজ্ঞতা</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="has-experience" checked={hasExperience} onCheckedChange={(checked) => setHasExperience(checked as boolean)} />
                            <Label htmlFor="has-experience">অভিজ্ঞতা আছে</Label>
                        </div>
                    </div>
                    {hasExperience && (
                        <div className="space-y-4 pt-2 border-t mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="previousSchool">পূর্ববর্তী স্কুলের নাম</Label>
                                <Input id="previousSchool" name="previousSchool" placeholder="স্কুলের নাম" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="previousDesignation">পদবি</Label>
                                <Input id="previousDesignation" name="previousDesignation" placeholder="পদবি" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="previousSubject">বিষয়</Label>
                                <Input id="previousSubject" name="previousSubject" placeholder="বিষয়" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="experienceYears">বছর</Label>
                                <Input id="experienceYears" name="experienceYears" placeholder="অভিজ্ঞতার বছর" />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle>স্থায়ী ঠিকানা</CardTitle></CardHeader>
                <CardContent>
                        <Textarea name="permanentAddress" placeholder="স্থায়ী ঠিকানা" />
                </CardContent>
            </Card>
                <Card>
                <CardHeader><CardTitle>বর্তমান ঠিকানা</CardTitle></CardHeader>
                <CardContent>
                        <Textarea name="presentAddress" placeholder="বর্তমান ঠিকানা" />
                </CardContent>
            </Card>
        </div>

        <CardFooter className="justify-end gap-2 px-0">
            <Button variant="outline" type="reset" disabled={loading}>রিসেট</Button>
            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                শিক্ষক যোগ করুন
            </Button>
        </CardFooter>
      </div>
    </form>
  );
}
