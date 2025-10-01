"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Calendar as CalendarIcon,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { bn } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import ImageKitUploader from "@/components/imagekit-uploader";
import Link from "next/link";
import { Student } from "@/lib/data";

type ClassItem = {
  id: string;
  name: string;
  numericName: string;
};

export default function EditStudentPage() {
  const [student, setStudent] = React.useState<Student | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [classes, setClasses] = React.useState<ClassItem[]>([]);
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [dob, setDob] = React.useState<Date | undefined>();
  
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  const db = getFirestore(app);

  React.useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentId) return;
      setLoading(true);
      try {
        const studentDocRef = doc(db, "students", studentId);
        const studentDocSnap = await getDoc(studentDocRef);

        if (studentDocSnap.exists()) {
          const studentData = { id: studentDocSnap.id, ...studentDocSnap.data() } as Student;
          setStudent(studentData);
          setAvatarUrl(studentData.avatar || "");
          if (studentData.dob && isValid(parseISO(studentData.dob))) {
            setDob(parseISO(studentData.dob));
          }
        } else {
          toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: "শিক্ষার্থী খুঁজে পাওয়া যায়নি।",
          });
          router.push("/super-admin/students");
        }

        const q = query(collection(db, "classes"), orderBy("numericName"));
        const querySnapshot = await getDocs(q);
        const classesData = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as ClassItem)
        );
        setClasses(classesData);

      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "ত্রুটি",
          description: "তথ্য আনতে একটি সমস্যা হয়েছে।",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId, db, toast, router]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!student) return;
    const { name, value } = e.target;
    setStudent({ ...student, [name]: value });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    if (!student) return;
    setStudent({ ...student, [name]: value });
  };

  const handleRadioChange = (name: string, value: string) => {
    if (!student) return;
    setStudent({ ...student, [name]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setSaving(true);

    try {
      const docRef = doc(db, "students", studentId);
      await setDoc(docRef, {
        ...student,
        avatar: avatarUrl,
        dob: dob && isValid(dob) ? format(dob, "yyyy-MM-dd") : "",
      }, { merge: true });

      toast({
        title: "সফল",
        description: "শিক্ষার্থীর তথ্য সফলভাবে আপডেট করা হয়েছে।",
      });
      router.push("/super-admin/students");
    } catch (error) {
      console.error("Error updating document: ", error);
      toast({
        variant: "destructive",
        title: "ত্রুটি",
        description: "তথ্য আপডেট করতে একটি সমস্যা হয়েছে।",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return null; // or a not-found component
  }

  return (
    <form onSubmit={handleSave}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/super-admin/students">
              <Button variant="outline" size="icon" type="button">
                  <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">শিক্ষার্থীর তথ্য সম্পাদনা করুন</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>শিক্ষার্থীর তথ্য</CardTitle>
            <CardDescription>
                ভর্তি নম্বর: {student.admissionNo}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="student-name">শিক্ষার্থীর পুরো নাম</Label>
                <Input
                  id="student-name"
                  name="name"
                  placeholder="আপনার পুরো নাম লিখুন"
                  required
                  value={student.name || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">জন্ম তারিখ</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dob && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dob && isValid(dob) ? (
                        format(dob, "PPP", { locale: bn })
                      ) : (
                        <span>একটি তারিখ বাছুন</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dob}
                      onSelect={setDob}
                      initialFocus
                      locale={bn}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>লিঙ্গ</Label>
                <RadioGroup
                  name="gender"
                  value={student.gender}
                  onValueChange={(value) => handleRadioChange('gender', value)}
                  className="flex items-center gap-4 pt-2"
                >
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
              <div className="space-y-2"></div>
              <div className="space-y-2">
                <Label htmlFor="religion">ধর্ম</Label>
                <Select name="religion" value={student.religion} onValueChange={(value) => handleSelectChange('religion', value)}>
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
                <Select name="bloodGroup" value={student.bloodGroup} onValueChange={(value) => handleSelectChange('bloodGroup', value)}>
                  <SelectTrigger id="blood-group">
                    <SelectValue placeholder="রক্তের গ্রুপ নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a+">A+</SelectItem>
                    <SelectItem value="a-">A-</SelectItem>
                    <SelectItem value="b+">B+</SelectItem>
                    <SelectItem value="b-">B-</SelectItem>
                    <SelectItem value="o+">O+</SelectItem>
                    <SelectItem value="o-">O-</SelectItem>
                    <SelectItem value="ab+">AB+</SelectItem>
                    <SelectItem value="ab-">AB-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">জাতীয়তা</Label>
                <Input
                  name="nationality"
                  id="nationality"
                  placeholder="জাতীয়তা"
                  value={student.nationality || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="phone">মোবাইল নম্বর</Label>
                <Input
                  name="phone"
                  id="phone"
                  type="tel"
                  placeholder="মোবাইল নম্বর"
                  required
                  value={student.phone || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="email">ইমেইল</Label>
                <Input name="email" id="email" type="email" placeholder="ইমেইল" value={student.email || ''} onChange={handleInputChange} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>শিক্ষার্থীর ছবি</Label>
                <ImageKitUploader
                  onUploadSuccess={(urls) => setAvatarUrl(urls[0])}
                  folder="/students"
                  initialImageUrl={avatarUrl}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">ক্লাস</Label>
                <Select name="class" value={student.class} onValueChange={(value) => handleSelectChange('class', value)}>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="ক্লাস নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">সেকশন</Label>
                <Select name="section" value={student.section} onValueChange={(value) => handleSelectChange('section', value)}>
                  <SelectTrigger id="section">
                    <SelectValue placeholder="সেকশন নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
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
                        <div className="space-y-2"><Label htmlFor="father-name">নাম</Label><Input name="fatherName" id="father-name" placeholder="বাবার নাম" value={student.fatherName || ''} onChange={handleInputChange}/></div>
                        <div className="space-y-2"><Label htmlFor="father-phone">ফোন</Label><Input name="fatherPhone" id="father-phone" placeholder="ফোন নম্বর" value={student.fatherPhone || ''} onChange={handleInputChange}/></div>
                        <div className="space-y-2"><Label htmlFor="father-occupation">পেশা</Label><Input name="fatherOccupation" id="father-occupation" placeholder="পেশা" value={student.fatherOccupation || ''} onChange={handleInputChange}/></div>
                        <div className="space-y-2"><Label htmlFor="father-nid">এনআইডি</Label><Input name="fatherNid" id="father-nid" placeholder="এনআইডি" value={student.fatherNid || ''} onChange={handleInputChange}/></div>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-lg mb-4">মায়ের বিবরণ</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="mother-name">নাম</Label><Input name="motherName" id="mother-name" placeholder="মায়ের নাম" value={student.motherName || ''} onChange={handleInputChange}/></div>
                        <div className="space-y-2"><Label htmlFor="mother-phone">ফোন</Label><Input name="motherPhone" id="mother-phone" placeholder="ফোন নম্বর" value={student.motherPhone || ''} onChange={handleInputChange}/></div>
                        <div className="space-y-2"><Label htmlFor="mother-occupation">পেশা</Label><Input name="motherOccupation" id="mother-occupation" placeholder="পেশা" value={student.motherOccupation || ''} onChange={handleInputChange}/></div>
                        <div className="space-y-2"><Label htmlFor="mother-nid">এনআইডি</Label><Input name="motherNid" id="mother-nid" placeholder="এনআইডি" value={student.motherNid || ''} onChange={handleInputChange}/></div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle>স্থায়ী ঠিকানা</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="perm-village">গ্রাম</Label><Input name="permanentVillage" id="perm-village" placeholder="গ্রাম" value={student.permanentVillage || ''} onChange={handleInputChange}/></div>
                    <div className="space-y-2"><Label htmlFor="perm-post">ডাকঘর</Label><Input name="permanentPost" id="perm-post" placeholder="ডাকঘর" value={student.permanentPost || ''} onChange={handleInputChange}/></div>
                    <div className="space-y-2"><Label htmlFor="perm-upazila">উপজেলা</Label><Input name="permanentUpazila" id="perm-upazila" placeholder="উপজেলা" value={student.permanentUpazila || ''} onChange={handleInputChange}/></div>
                    <div className="space-y-2"><Label htmlFor="perm-district">জেলা</Label><Input name="permanentDistrict" id="perm-district" placeholder="জেলা" value={student.permanentDistrict || ''} onChange={handleInputChange}/></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>বর্তমান ঠিকানা</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="pres-village">গ্রাম</Label><Input name="presentVillage" id="pres-village" placeholder="গ্রাম" value={student.presentVillage || ''} onChange={handleInputChange}/></div>
                    <div className="space-y-2"><Label htmlFor="pres-post">ডাকঘর</Label><Input name="presentPost" id="pres-post" placeholder="ডাকঘর" value={student.presentPost || ''} onChange={handleInputChange}/></div>
                    <div className="space-y-2"><Label htmlFor="pres-upazila">উপজেলা</Label><Input name="presentUpazila" id="pres-upazila" placeholder="উপজেলা" value={student.presentUpazila || ''} onChange={handleInputChange}/></div>
                    <div className="space-y-2"><Label htmlFor="pres-district">জেলা</Label><Input name="presentDistrict" id="pres-district" placeholder="জেলা" value={student.presentDistrict || ''} onChange={handleInputChange}/></div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader><CardTitle>পূর্ববর্তী একাডেমিক তথ্য</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label htmlFor="prev-school">পূর্ববর্তী স্কুলের নাম এবং ঠিকানা</Label><Input name="previousSchool" id="prev-school" placeholder="স্কুলের নাম এবং ঠিকানা" value={student.previousSchool || ''} onChange={handleInputChange}/></div>
                    <div className="space-y-2"><Label htmlFor="prev-class">কোন ক্লাস থেকে উত্তীর্ণ</Label><Input name="previousClass" id="prev-class" placeholder="ক্লাস" value={student.previousClass || ''} onChange={handleInputChange}/></div>
                    <div className="space-y-2"><Label htmlFor="prev-roll">শেষ পরীক্ষার রোল নং</Label><Input name="previousRoll" id="prev-roll" placeholder="রোল নং" value={student.previousRoll || ''} onChange={handleInputChange}/></div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="transfer-reason">প্রতিষ্ঠানের পরিবর্তনের কারন</Label>
                    <Textarea name="transferReason" id="transfer-reason" placeholder="এখানে কারণ লিখুন" value={student.transferReason || ''} onChange={handleInputChange}/>
                </div>
            </CardContent>
        </Card>

        <CardFooter className="justify-end gap-2 px-0">
            <Button variant="outline" type="button" onClick={() => router.push('/super-admin/students')} disabled={saving}>
                বাতিল
            </Button>
            <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                সংরক্ষণ করুন
            </Button>
        </CardFooter>
      </div>
    </form>
  );
}
