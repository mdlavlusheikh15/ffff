
"use client"

import * as React from "react";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Teacher, EducationalQualification } from "@/lib/data";
import { Loader2, ArrowLeft, PlusCircle, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageKitUploader from "@/components/imagekit-uploader";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { bn } from "date-fns/locale";

export default function TeacherProfilePage() {
    const [teacher, setTeacher] = React.useState<Teacher | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [avatarUrl, setAvatarUrl] = React.useState('');
    const [dob, setDob] = React.useState<Date>();
    const [hasExperience, setHasExperience] = React.useState(false);
    const [qualifications, setQualifications] = React.useState<Partial<EducationalQualification>[]>([]);
    
    const router = useRouter();
    const auth = getAuth(app);
    const db = getFirestore(app);
    const { toast } = useToast();

    React.useEffect(() => {
        const fetchTeacherData = async (user: FirebaseUser) => {
            if (!user.email) {
                setLoading(false);
                return;
            }
            try {
                const teacherQuery = query(collection(db, "teachers"), where("email", "==", user.email));
                const querySnapshot = await getDocs(teacherQuery);
                if (!querySnapshot.empty) {
                    const teacherDoc = querySnapshot.docs[0];
                    const teacherData = { id: teacherDoc.id, ...teacherDoc.data() } as Teacher;
                    setTeacher(teacherData);
                    setAvatarUrl(teacherData.avatar || '');
                    setHasExperience(teacherData.hasExperience || false);
                    setQualifications(teacherData.qualifications || []);
                    if (teacherData.dob) {
                       setDob(parseISO(teacherData.dob));
                    }
                }
            } catch (error) {
                console.error("Error fetching teacher data:", error);
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchTeacherData(user);
            } else {
                router.push('/');
            }
        });

        return () => unsubscribe();
    }, [auth, db, router]);

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
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (teacher) {
            setTeacher({ ...teacher, [name]: value });
        }
    };
    
    const handleSelectChange = (name: string, value: string) => {
         if (teacher) {
            setTeacher({ ...teacher, [name]: value });
        }
    }
    
    const handleRadioChange = (name: string, value: string) => {
         if (teacher) {
            setTeacher({ ...teacher, [name]: value });
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teacher) return;
        setSaving(true);
        
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
            const docRef = doc(db, "teachers", teacher.id);
            await setDoc(docRef, {
                ...teacherData,
                avatar: avatarUrl,
                dob: dob ? format(dob, "yyyy-MM-dd") : '',
                hasExperience,
                qualifications,
            }, { merge: true });
            toast({ title: "সফল", description: "আপনার প্রোফাইল সফলভাবে আপডেট করা হয়েছে।" });
        } catch (error) {
             console.error("Error updating profile:", error);
             toast({ variant: "destructive", title: "ত্রুটি", description: "প্রোফাইল আপডেট করতে সমস্যা হয়েছে।" });
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!teacher) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>আমার প্রোফাইল</CardTitle>
                    <CardDescription>এখানে আপনার ব্যক্তিগত এবং একাডেমিক তথ্য প্রদর্শিত হচ্ছে।</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-10 text-muted-foreground">
                        <p>আপনার প্রোফাইলের তথ্য পাওয়া যায়নি।</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

  return (
    <form onSubmit={handleSave}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/teacher/dashboard/settings">
            <Button variant="outline" size="icon" type="button">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            </Link>
            <h1 className="text-2xl font-bold">আমার প্রোফাইল</h1>
        </div>
        
         <Card>
            <CardHeader>
                <CardTitle>শিক্ষকের তথ্য</CardTitle>
                <CardDescription>অনুগ্রহ করে আপনার তথ্য আপডেট করুন।</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="teacher-name">পুরো নাম</Label>
                        <Input id="teacher-name" name="name" placeholder="পুরো নাম লিখুন" value={teacher.name} onChange={handleInputChange} required/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="designation">পদবি</Label>
                        <Input id="designation" name="designation" placeholder="যেমন, সহকারী শিক্ষক" value={teacher.designation || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="subject">বিষয়</Label>
                        <Input id="subject" name="subject" placeholder="যেমন, বাংলা" value={teacher.subject} onChange={handleInputChange}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">মোবাইল নম্বর</Label>
                        <Input id="phone" name="phone" type="tel" placeholder="মোবাইল নম্বর" value={teacher.phone} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">ইমেইল</Label>
                        <Input id="email" name="email" type="email" placeholder="ইমেইল" value={teacher.email} onChange={handleInputChange} />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>আপনার ছবি</Label>
                        <ImageKitUploader onUploadSuccess={(urls) => setAvatarUrl(urls[0])} folder="/teachers" initialImageUrl={avatarUrl} />
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>ব্যক্তিগত তথ্য</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="father-name">বাবার নাম</Label>
                    <Input id="father-name" name="fatherName" placeholder="বাবার নাম" value={teacher.fatherName || ''} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="mother-name">মায়ের নাম</Label>
                    <Input id="mother-name" name="motherName" placeholder="মায়ের নাম" value={teacher.motherName || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="nid">এনআইডি</Label>
                    <Input id="nid" name="nid" placeholder="এনআইডি নম্বর" value={teacher.nid} onChange={handleInputChange} />
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
                    <RadioGroup name="gender" value={teacher.gender} onValueChange={(value) => handleRadioChange('gender', value)} className="flex items-center gap-4 pt-2">
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
                    <Select name="religion" value={teacher.religion} onValueChange={(value) => handleSelectChange('religion', value)}>
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
                    <Select name="bloodGroup" value={teacher.bloodGroup} onValueChange={(value) => handleSelectChange('bloodGroup', value)}>
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
                    <Select name="maritalStatus" value={teacher.maritalStatus} onValueChange={(value) => handleSelectChange('maritalStatus', value)}>
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
                            <Select name={`qualificationLevel-${index}`} value={qual.level} onValueChange={(value) => handleQualificationChange(index, 'level', value)}>
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
                                <Input id={`instituteName-${index}`} name={`instituteName-${index}`} placeholder="প্রতিষ্ঠানের নাম" value={qual.institute} onChange={(e) => handleQualificationChange(index, 'institute', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`gpa-${index}`}>জিপিএ</Label>
                                <Input id={`gpa-${index}`} name={`gpa-${index}`} placeholder="জিপিএ" value={qual.gpa} onChange={(e) => handleQualificationChange(index, 'gpa', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`passingYear-${index}`}>পাশের বছর</Label>
                                <Input id={`passingYear-${index}`} name={`passingYear-${index}`} placeholder="পাশের বছর" value={qual.passingYear} onChange={(e) => handleQualificationChange(index, 'passingYear', e.target.value)} />
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
                                <Input id="previousSchool" name="previousSchool" placeholder="স্কুলের নাম" defaultValue={teacher.previousSchool} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="previousDesignation">পদবি</Label>
                                <Input id="previousDesignation" name="previousDesignation" placeholder="পদবি" defaultValue={teacher.previousDesignation} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="previousSubject">বিষয়</Label>
                                <Input id="previousSubject" name="previousSubject" placeholder="বিষয়" defaultValue={teacher.previousSubject} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="experienceYears">বছর</Label>
                                <Input id="experienceYears" name="experienceYears" placeholder="অভিজ্ঞতার বছর" defaultValue={teacher.experienceYears} />
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
                        <Textarea name="permanentAddress" placeholder="স্থায়ী ঠিকানা" value={teacher.permanentAddress} onChange={handleInputChange} />
                </CardContent>
            </Card>
                <Card>
                <CardHeader><CardTitle>বর্তমান ঠিকানা</CardTitle></CardHeader>
                <CardContent>
                        <Textarea name="presentAddress" placeholder="বর্তমান ঠিকানা" value={teacher.presentAddress} onChange={handleInputChange} />
                </CardContent>
            </Card>
        </div>

        <CardFooter className="justify-end gap-2 px-0">
            <Button variant="outline" type="reset" disabled={saving}>বাতিল</Button>
            <Button type="submit" disabled={saving}>
                 {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                আপডেট করুন
            </Button>
        </CardFooter>
      </div>
    </form>
  );
}
