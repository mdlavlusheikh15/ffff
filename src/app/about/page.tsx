
"use client"

import * as React from "react";
import Image from "next/image";
import { getFirestore, collection, getDocs, query, orderBy, getCountFromServer } from "firebase/firestore";
import { app } from "@/lib/firebase";
import MainLayout from "@/app/(main)/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Users, User, BookOpen } from "lucide-react";
import type { Teacher } from "@/lib/data";

type Stat = {
    label: string;
    value: number;
    icon: React.ElementType;
}

export default function AboutPage() {
    const [teachers, setTeachers] = React.useState<Teacher[]>([]);
    const [stats, setStats] = React.useState<Stat[] | null>(null);
    const [loading, setLoading] = React.useState(true);
    const db = getFirestore(app);

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Teachers
                const teacherQuery = query(collection(db, "teachers"), orderBy("name"));
                const teacherSnapshot = await getDocs(teacherQuery);
                const teachersData = teacherSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher));
                setTeachers(teachersData);

                // Fetch Stats
                const studentsCollection = collection(db, "students");
                const teachersCollection = collection(db, "teachers");
                const subjectsCollection = collection(db, "subjects");

                const [studentCountSnap, teacherCountSnap, subjectCountSnap] = await Promise.all([
                    getCountFromServer(studentsCollection),
                    getCountFromServer(teachersCollection),
                    getCountFromServer(subjectsCollection)
                ]);

                setStats([
                    { label: "ছাত্র-ছাত্রী", value: studentCountSnap.data().count, icon: Users },
                    { label: "শিক্ষকমণ্ডলী", value: teacherCountSnap.data().count, icon: User },
                    { label: "বিষয়সমূহ", value: subjectCountSnap.data().count, icon: BookOpen },
                ]);

            } catch (error) {
                console.error("Error fetching about page data: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [db]);


    return (
        <MainLayout>
            <div className="bg-gray-50/50">
                <div className="py-16 border rounded-lg">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">আমাদের সম্পর্কে</h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                            আমাদের প্রতিষ্ঠান, লক্ষ্য এবং শিক্ষকমণ্ডলী সম্পর্কে জানুন।
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
                        <div>
                             <Image
                                src="https://picsum.photos/seed/about-us-main/800/600"
                                alt="আমাদের প্রতিষ্ঠান"
                                width={800}
                                height={600}
                                className="rounded-lg shadow-lg object-cover"
                                data-ai-hint="school building"
                            />
                        </div>
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold text-gray-900">আমাদের ইতিহাস ও লক্ষ্য</h2>
                            <p className="text-gray-600 leading-relaxed">
                                ইকরা নূরানী একাডেমী ২০১৮ সালে প্রতিষ্ঠিত হয়। প্রতিষ্ঠার শুরু থেকেই আমরা দ্বীনি শিক্ষার পাশাপাশি জেনারেল শিক্ষাও সমান গুরুত্বের সাথে প্রদান করে আসছি। আমাদের লক্ষ্য হচ্ছে- শিক্ষার্থীদের নৈতিকতা, চরিত্র গঠন এবং আধুনিক জ্ঞানে দক্ষ করে গড়ে তোলা। আমরা বিশ্বাস করি, সঠিক শিক্ষা ও মূল্যবোধই একটি উন্নত জাতি গঠনের মূল ভিত্তি।
                            </p>
                             <p className="text-gray-600 leading-relaxed">
                                আমাদের প্রতিষ্ঠানে রয়েছে একদল মেধাবী এবং নিবেদিতপ্রাণ শিক্ষক, যারা শিক্ষার্থীদের সার্বক্ষণিক তত্ত্বাবধান করেন। আমরা শুধু পুঁথিগত বিদ্যায় বিশ্বাসী নই, বরং শিক্ষার্থীদের শারীরিক ও মানসিক বিকাশের জন্যও নানা ধরনের কার্যক্রম পরিচালনা করে থাকি।
                            </p>
                        </div>
                    </div>
                    
                    {loading ? (
                         <div className="flex justify-center items-center h-32">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : stats && (
                        <div className="mb-16">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                                {stats.map(stat => (
                                    <Card key={stat.label} className="py-8">
                                        <CardContent className="flex flex-col items-center justify-center gap-2">
                                            <stat.icon className="h-10 w-10 text-primary mb-2" />
                                            <p className="text-4xl font-bold">{stat.value}</p>
                                            <p className="text-lg text-muted-foreground">{stat.label}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}


                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900">আমাদের অভিজ্ঞ শিক্ষকমণ্ডলী</h2>
                        <p className="mt-2 max-w-xl mx-auto text-gray-600">
                           যাঁরা আমাদের শিক্ষার্থীদের ভবিষ্যৎ গঠনে নিরলসভাবে কাজ করে যাচ্ছেন।
                        </p>
                    </div>
                     {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {teachers.map(teacher => (
                                <Card key={teacher.id} className="text-center overflow-hidden transform transition-all hover:-translate-y-1 hover:shadow-lg">
                                    <div className="p-6">
                                         <Avatar className="h-24 w-24 mx-auto mb-4 border-2 border-primary p-1">
                                            <AvatarImage src={teacher.avatar} alt={teacher.name} data-ai-hint="teacher photo" />
                                            <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <h3 className="font-semibold text-lg">{teacher.name}</h3>
                                        <p className="text-primary">{teacher.designation || 'শিক্ষক'}</p>
                                        <p className="text-sm text-muted-foreground mt-1">{teacher.subject}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
