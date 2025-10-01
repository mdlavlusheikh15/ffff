
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  AuthError,
} from "firebase/auth";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  ArrowUp,
  AlertTriangle,
  BookOpen,
  Users,
  Loader2,
  User,
  Lock,
  ArrowRight,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { getFirestore, collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { formatDistanceToNow, parseISO } from "date-fns";
import { bn } from "date-fns/locale";

type Testimonial = {
    id: string;
    quote: string;
    name: string;
    title: string;
    avatar: string;
};

type ImportantLink = {
    id: string;
    title: string;
    url: string;
    icon?: React.ElementType; // Made icon optional
};

type CarouselItemType = {
    id: string;
    src: string;
    alt?: string;
    hint: string;
    title: string;
    description: string;
}

type GalleryImageType = {
    id: string;
    src: string;
    alt?: string;
    hint: string;
}


type LandingPageSettingsType = {
    schoolName?: string;
    schoolTagline?: string;
    logoUrl?: string;
    aboutTitle?: string;
    aboutDescription?: string;
    aboutImageUrl?: string;
    admissionTitle?: string;
    admissionDescription?: string;
    admissionImageUrl?: string;
    footerAddress?: string;
    footerEmail?: string;
    footerPhone?: string;
    footerCopyright?: string;
    testimonials?: Testimonial[];
    importantLinks?: ImportantLink[];
    carouselItems?: CarouselItemType[];
    galleryImages?: GalleryImageType[];
};


const defaultCarouselItems: CarouselItemType[] = [
  {
    id: 'c1',
    src: "https://picsum.photos/seed/school-classroom/1600/900",
    alt: "Students in a classroom",
    hint: "students classroom",
    title: "স্বাগতম!",
    description: "জ্ঞানার্জনের একটি নতুন দিগন্তে আপনাকে স্বাগতম।",
  },
  {
    id: 'c2',
    src: "https://picsum.photos/seed/school-students/1600/900",
    alt: "Happy students",
    hint: "happy students",
    title: "উজ্জ্বল ভবিষ্যৎ",
    description: "আমাদের শিক্ষার্থীদের জন্য একটি উজ্জ্বল ভবিষ্যৎ গড়ি।",
  },
  {
    id: 'c3',
    src: "https://picsum.photos/seed/school-campus/1600/900",
    alt: "School campus",
    hint: "school campus",
    title: "আমাদের ক্যাম্পাস",
    description: "শিক্ষা এবং অনুপ্রেরণার জন্য একটি আদর্শ পরিবেশ।",
  },
];

const defaultGalleryImages: GalleryImageType[] = [
    { id: 'g1', src: "https://ik.imagekit.io/yqiddpa69/creative_ai_Qv0lA_2Zc.png?updatedAt=1721342502693", alt: "Creative AI", hint: "creative ai" },
    { id: 'g2', src: "https://ik.imagekit.io/yqiddpa69/creative_ai_Qv0lA_2Zc.png?updatedAt=1721342502693", alt: "Creative AI", hint: "creative ai" },
    { id: 'g3', src: "https://ik.imagekit.io/yqiddpa69/creative_ai_Qv0lA_2Zc.png?updatedAt=1721342502693", alt: "Creative AI", hint: "creative ai" },
    { id: 'g4', src: "https://ik.imagekit.io/yqiddpa69/creative_ai_Qv0lA_2Zc.png?updatedAt=1721342502693", alt: "Creative AI", hint: "creative ai" },
];


type Notice = {
    id: string;
    title: string;
    date: string; // ISO string
};

export default function PublicPage() {
  const [notices, setNotices] = React.useState<Notice[]>([]);
  const [loadingNotices, setLoadingNotices] = React.useState(true);
  const [settings, setSettings] = React.useState<LandingPageSettingsType>({});
  const [loadingSettings, setLoadingSettings] = React.useState(true);

  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  React.useEffect(() => {
    const fetchNotices = async () => {
        setLoadingNotices(true);
        try {
            const q = query(collection(db, "notices"), orderBy("date", "desc"));
            const querySnapshot = await getDocs(q);
            const noticesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
            setNotices(noticesData);
        } catch (error) {
            console.error("Error fetching notices:", error);
            toast({ variant: "destructive", title: "ত্রুটি", description: "নোটিশ আনতে সমস্যা হয়েছে।" });
        } finally {
            setLoadingNotices(false);
        }
    };
    
    const fetchSettings = async () => {
        setLoadingSettings(true);
        try {
            const docRef = doc(db, "settings", "landing_page");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setSettings(docSnap.data() as LandingPageSettingsType);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoadingSettings(false);
        }
    };
    
    fetchNotices();
    fetchSettings();
  }, [db, toast]);

  const importantLinks: ImportantLink[] = settings.importantLinks?.map(link => {
      // A simple way to map icon names to components
      const iconMap: {[key: string]: React.ElementType} = { 'BookOpen': BookOpen, 'Users': Users };
      const iconName = link.id === 'l1' ? 'BookOpen' : 'Users'; // Example mapping
      return {...link, icon: iconMap[iconName]};
  }) || [
    { id: 'l1', title: 'শিক্ষা মন্ত্রণালয়', url: '#', icon: BookOpen },
    { id: 'l2', title: 'মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা...', url: '#', icon: Users },
  ];
  
  const galleryImages = settings.galleryImages && settings.galleryImages.length > 0 ? settings.galleryImages : defaultGalleryImages;

  return (
    <>
      <section className="relative h-[60vh] w-full bg-cover bg-center" style={{backgroundImage: "url('https://ik.imagekit.io/yqiddpa69/creative_ai_Qv0lA_2Zc.png?updatedAt=1721342502693')"}}>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
            <h2 className="text-4xl md:text-7xl font-bold">আমাদের AI মাদ্রাসা</h2>
            <p className="mt-2 text-lg md:text-2xl max-w-2xl text-white/90">Creative Ai</p>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-16">
              {/* About Us */}
              <section>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    <div className="md:col-span-2">
                        <h2 className="text-2xl font-bold mb-4">{settings.aboutTitle || 'আমাদের সম্পর্কে'}</h2>
                        <p className="text-gray-600 mb-6 whitespace-pre-line leading-relaxed">
                            {settings.aboutDescription || 'ইকরা নূরানী একাডেমী ২০১৮ সালে প্রতিষ্ঠিত হয়। প্রতিষ্ঠার শুরু থেকেই আমরা দ্বীনি শিক্ষার পাশাপাশি জেনারেল শিক্ষাও সমান গুরুত্বের সাথে প্রদান করে আসছি। আমাদের লক্ষ্য হচ্ছে- শিক্ষার্থীদের নৈতিকতা, চরিত্র গঠন এবং আধুনিক জ্ঞানে দক্ষ করে গড়ে তোলা।'}
                        </p>
                        <Button asChild>
                           <Link href="/about">বিস্তারিত দেখুন</Link>
                        </Button>
                    </div>
                    <div>
                        <Image src={settings.aboutImageUrl || "https://ik.imagekit.io/yqiddpa69/creative_ai_Qv0lA_2Zc.png?updatedAt=1721342502693"} alt="About us image" width={300} height={300} className="rounded-full object-cover w-full aspect-square border-4 border-primary/20 p-1" data-ai-hint="creative ai"/>
                    </div>
                </div>
              </section>

              {/* Admission Session */}
              <section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="order-last md:order-first">
                        <h2 className="text-2xl font-bold mb-4">{settings.admissionTitle || "ভর্তি চলছে সেশন ২০২৬"}</h2>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                           {settings.admissionDescription || "আমাদের শিক্ষার্থী ও চিন্তাবিদদের সম্প্রদায়ে যোগ দিন। আমার আসন্ন শিক্ষাবর্ষের জন্য আবেদন গ্রহণ করছি। এমন একটি জায়গা আবিষ্কার করুন যেখানে বিশ্বাস এবং জ্ঞান একসাথে বৃদ্ধি পায়।"}
                        </p>
                         <Button asChild>
                            <Link href="/admission">এখনই আবেদন করুন</Link>
                        </Button>
                    </div>
                    <div>
                        <Image src={settings.admissionImageUrl || "https://ik.imagekit.io/yqiddpa69/creative_ai_Qv0lA_2Zc.png?updatedAt=1721342502693"} alt="Students learning" width={600} height={400} className="rounded-lg object-cover" data-ai-hint="creative ai"/>
                    </div>
                </div>
              </section>

             {/* Testimonials Section */}
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">বাণী</h2>
                   <div className="flex gap-2">
                      <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(settings.testimonials && settings.testimonials.length > 0) ? (
                        settings.testimonials.map(testimonial => (
                             <Card key={testimonial.id}>
                                <CardContent className="p-6">
                                    <blockquote className="text-gray-600 italic mb-4 leading-relaxed">
                                        “{testimonial.quote}”
                                    </blockquote>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={testimonial.avatar} data-ai-hint="person photo"/>
                                            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{testimonial.name}</p>
                                            <p className="text-xs text-gray-500">{testimonial.title}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <>
                         <Card>
                            <CardContent className="p-6">
                                <blockquote className="text-gray-600 italic mb-4 leading-relaxed">
                                    “শিক্ষাই জাতির মেরুদণ্ড।”
                                </blockquote>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src="https://picsum.photos/seed/lavlu/40/40" data-ai-hint="person photo"/>
                                        <AvatarFallback>মোল</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">মোঃ লাভলু দেখ</p>
                                        <p className="text-xs text-gray-500">প্রধান শিক্ষক</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <blockquote className="text-gray-600 italic mb-4 leading-relaxed">
                                    “ইকরা নূরানী একাডেমী আমার সন্তানের জন্য একটি রূপান্তর মূলক অভিজ্ঞতা। ইসলামী ও ধর্মনিরপেক্ষ শিক্ষার মিশ্রণ পুরোপুরি ভারসাম্যপূর্ণ।”
                                </blockquote>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src="https://picsum.photos/seed/parent/40/40" data-ai-hint="person photo"/>
                                        <AvatarFallback>AH</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">Amina Hussein</p>
                                        <p className="text-xs text-gray-500">Parent</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        </>
                    )}
                </div>
              </section>

              {/* Photo & Video Gallery */}
              <section>
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">ফটো ও ভিডিও গ্যালারী</h2>
                    <Button variant="link" asChild>
                        <Link href="/gallery">সব দেখুন</Link>
                    </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {galleryImages.slice(0, 4).map(image => (
                        <Image key={image.id} src={image.src} alt={image.alt || 'Gallery image'} width={200} height={200} className="rounded-lg object-cover aspect-square" data-ai-hint={image.hint}/>
                    ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-8">
              <Card>
                <CardHeader>
                    <CardTitle className="text-lg">নোটিশ বোর্ড</CardTitle>
                </CardHeader>
                <CardContent>
                     {loadingNotices ? <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin"/></div> :
                        notices.length > 0 ? (
                            <ul className="space-y-4">
                                {notices.slice(0, 5).map(notice => (
                                    <li key={notice.id} className="flex items-start gap-3 text-sm border-b pb-4 last:border-0 last:pb-0">
                                        <Badge variant="destructive" className="mt-1 flex-shrink-0 !px-2 !py-1"><AlertTriangle className="h-4 w-4"/></Badge>
                                        <div>
                                            <Link href="#" className="text-gray-800 hover:text-primary font-semibold">{notice.title}</Link>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDistanceToNow(parseISO(notice.date), { addSuffix: true, locale: bn })}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <p className="text-sm text-muted-foreground text-center">কোনো নোটিশ নেই।</p>
                        )
                     }
                     <Button variant="link" className="p-0 h-auto mt-4 text-sm">সব দেখুন</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle className="text-lg">গুরুত্বপূর্ণ লিঙ্ক</CardTitle>
                </CardHeader>
                <CardContent>
                     <ul className="space-y-3">
                        {importantLinks.map(link => (
                            <li key={link.id} className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    {link.icon && <link.icon className="h-5 w-5 text-primary"/>}
                                    <span className="font-medium">{link.title}</span>
                                </div>
                                <Button size="sm" variant="outline" asChild>
                                    <Link href={link.url}>ভিজিট করুন</Link>
                                </Button>
                            </li>
                        ))}
                    </ul>
                </CardContent>
              </Card>

               <div className="grid grid-cols-2 gap-4 text-center">
                  <Card>
                      <CardContent className="p-4">
                          <p className="text-3xl font-bold">95</p>
                          <p className="text-sm text-gray-500">Total Students Class Seven</p>
                      </CardContent>
                  </Card>
                   <Card>
                      <CardContent className="p-4">
                          <p className="text-3xl font-bold">80</p>
                          <p className="text-sm text-gray-500">Total Students Class Eight</p>
                      </CardContent>
                  </Card>
                   <Card>
                      <CardContent className="p-4">
                          <p className="text-3xl font-bold">160</p>
                          <p className="text-sm text-gray-500">Total Students Class Nine</p>
                      </CardContent>
                  </Card>
                   <Card>
                      <CardContent className="p-4">
                          <p className="text-3xl font-bold">110</p>
                          <p className="text-sm text-gray-500">Total Students Class Ten</p>
                      </CardContent>
                  </Card>
              </div>

              <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">কৃতি শিক্ষার্থী</CardTitle>
                         <Button variant="link" asChild className="p-0 h-auto text-sm">
                            <Link href="#">সব দেখুন</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src="https://picsum.photos/seed/student-female/40/40" data-ai-hint="female student"/>
                                <AvatarFallback>তাআ</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">তানিয়া আক্তার</p>
                                <p className="text-xs text-gray-500">ক্লাস টেন</p>
                            </div>
                        </li>
                         <li className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src="https://picsum.photos/seed/student-male-2/40/40" data-ai-hint="male student"/>
                                <AvatarFallback>মাই</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">মাজেদুল ইসলাম</p>
                                <p className="text-xs text-gray-500">ক্লাস নাইন</p>
                            </div>
                        </li>
                         <li className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src="https://picsum.photos/seed/student-male-3/40/40" data-ai-hint="male student"/>
                                <AvatarFallback>রহ</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">রহমান হোসেন</p>
                                <p className="text-xs text-gray-500">ক্লাস নাইন</p>
                            </div>
                        </li>
                    </ul>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
    </>
  );
}
