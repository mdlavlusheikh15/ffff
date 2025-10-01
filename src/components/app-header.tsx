

"use client"

import { usePathname, useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search, User, Lock, Mail, Loader2, ArrowRight, Users, Settings } from "lucide-react";
import { Input } from "./ui/input";
import { getAuth, signOut, signInWithEmailAndPassword, AuthError, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, Timestamp, query, where, getDocs, limit } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { bn } from "date-fns/locale";

const LiveTime = () => {
  const [time, setTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setTime(new Date()); // Set initial time on client
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) {
    return (
       <div className="hidden md:flex items-center gap-2 text-sm font-medium bg-gray-100 px-3 py-1.5 rounded-lg">
          <div className="w-40 h-5 bg-gray-200 rounded animate-pulse" />
       </div>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-2 text-sm font-medium bg-gray-100 px-3 py-1.5 rounded-lg">
      <p className="font-mono tracking-wider">
        {time.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
      </p>
      <span className="text-gray-300">|</span>
      <p>
        {time.toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
    </div>
  )
}

type LandingPageSettingsType = {
    schoolName?: string;
    schoolTagline?: string;
    logoUrl?: string;
}

export default function AppHeader() {
  const pathname = usePathname();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);

  // Common state for auth dialog
  const [isAuthDialogOpen, setIsAuthDialogOpen] = React.useState(false);
  const [authView, setAuthView] = React.useState<'login' | 'signup'>('login');
  
  // Login state
  const [loginUsername, setLoginUsername] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [loginRole, setLoginRole] = React.useState('student');
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  
  // Signup state
  const [signupName, setSignupName] = React.useState('');
  const [signupEmail, setSignupEmail] = React.useState('');
  const [signupPhone, setSignupPhone] = React.useState('');
  const [signupPassword, setSignupPassword] = React.useState('');
  const [signupRole, setSignupRole] = React.useState('teacher');
  const [isSigningUp, setIsSigningUp] = React.useState(false);

  const [settings, setSettings] = React.useState<LandingPageSettingsType>({});
  
  const isDashboard = pathname.startsWith('/super-admin') || pathname.startsWith('/teacher') || pathname.startsWith('/parent');

  React.useEffect(() => {
    setIsClient(true);
    const fetchSettings = async () => {
        try {
            const docRef = doc(db, "settings", "landing_page");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setSettings(docSnap.data() as LandingPageSettingsType);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        }
    };
    if (!isDashboard) {
      fetchSettings();
    }
  }, [isDashboard, db]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "লগআউট সফল হয়েছে",
        description: "আপনি সফলভাবে লগআউট করেছেন।",
      });
      router.push('/');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "লগআউট ব্যর্থ হয়েছে",
        description: "লগআউট করার সময় একটি সমস্যা হয়েছে।",
      });
    }
  };
  
  const handleLogin = async () => {
    setIsLoggingIn(true);
    let emailToUse = loginUsername; 

    try {
        let userDoc;
        let finalUserRole;
        
        // Super Admin check
        const adminQuery = query(collection(db, 'admins'), where('email', '==', loginUsername), limit(1));
        const adminSnapshot = await getDocs(adminQuery);

        if (!adminSnapshot.empty) {
            userDoc = adminSnapshot.docs[0];
            finalUserRole = userDoc.data().role; // This is the source of truth ('super-admin')
        } else if (loginRole === 'teacher') {
            const q = query(collection(db, 'teachers'), where('email', '==', loginUsername), limit(1));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                userDoc = snapshot.docs[0];
                finalUserRole = 'teacher';
            }
        } else if (loginRole === 'student' || loginRole === 'parent') {
            finalUserRole = 'parent'; // Both student and parent login go to parent panel
            const isEmail = loginUsername.includes('@');
            const studentQueries = isEmail
                ? [
                    query(collection(db, 'students'), where('email', '==', loginUsername), limit(1)),
                    query(collection(db, 'students'), where('fatherEmail', '==', loginUsername), limit(1)),
                  ]
                : [
                    query(collection(db, 'students'), where('phone', '==', loginUsername), limit(1)),
                    query(collection(db, 'students'), where('fatherPhone', '==', loginUsername), limit(1))
                ];
            
            for (const q of studentQueries) {
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    userDoc = snapshot.docs[0];
                    break;
                }
            }
        }

        if (!userDoc) {
            toast({
                variant: "destructive",
                title: "লগইন ব্যর্থ হয়েছে",
                description: "আপনার আইডি/ইমেইল অথবা পাসওয়ার্ড ভুল।",
            });
            setIsLoggingIn(false);
            return;
        }
        
        const userData = userDoc.data();
        emailToUse = userData.email;

        // Bypass status check for super-admins
        if (finalUserRole !== 'super-admin' && userData.status && userData.status !== 'approved') {
            toast({
                variant: "destructive",
                title: "অ্যাকাউন্ট অনুমোদিত নয়",
                description: "আপনার অ্যাকাউন্টটি এখনো অনুমোদিত হয়নি। অনুগ্রহ করে অপেক্ষা করুন।",
            });
            setIsLoggingIn(false);
            return;
        }
        
        if (!emailToUse) {
             toast({
                variant: "destructive",
                title: "লগইন ব্যর্থ হয়েছে",
                description: "এই ব্যবহারকারীর জন্য কোনো ইমেল পাওয়া যায়নি।",
            });
            setIsLoggingIn(false);
            return;
        }

        await signInWithEmailAndPassword(auth, emailToUse, loginPassword);
        
        toast({
            title: "লগইন সফল হয়েছে",
            description: "ড্যাশবোর্ডে আপনাকে স্বাগতম।",
        });
        setIsAuthDialogOpen(false);

        if (finalUserRole === 'super-admin') {
            router.push('/super-admin/dashboard');
        } else if (finalUserRole === 'teacher') {
            router.push('/teacher/dashboard');
        } else if (finalUserRole === 'parent') {
            router.push('/parent/dashboard');
        } else {
            router.push('/super-admin/dashboard'); // Default redirect
        }
    } catch (error) {
        const authError = error as AuthError;
        let description = "একটি অজানা ত্রুটি ঘটেছে।";
        if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/wrong-password' || authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-email') {
            description = "আপনার আইডি/ইমেইল অথবা পাসওয়ার্ড ভুল।";
        }
        toast({
            variant: "destructive",
            title: "লগইন ব্যর্থ হয়েছে",
            description: description,
        });
    } finally {
        setIsLoggingIn(false);
    }
  };

  const handleSignUp = async () => {
      if (!signupName || !signupEmail || !signupPassword || !signupPhone || !signupRole) {
          toast({ variant: "destructive", title: "ত্রুটি", description: "অনুগ্রহ করে সকল ঘর পূরণ করুন।" });
          return;
      }
      setIsSigningUp(true);
      try {
          // 1. Create user in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
          const user = userCredential.user;

          // 2. Create user document in Firestore based on role
          const collectionName = 'teachers'; // Only teachers can sign up now
          
          await addDoc(collection(db, collectionName), {
              name: signupName,
              email: signupEmail,
              phone: signupPhone,
              role: signupRole,
              status: 'pending', // Requires approval
              createdAt: Timestamp.now(),
              avatar: `https://picsum.photos/seed/${user.uid}/80/80`
          });

          toast({
              title: "সফল",
              description: "আপনার অ্যাকাউন্ট তৈরি হয়েছে। অনুমোদনের জন্য অপেক্ষা করুন।",
          });
          setAuthView('login'); // Switch to login view after successful signup

      } catch (error) {
          const authError = error as AuthError;
          let description = "অ্যাকাউন্ট তৈরি করতে একটি সমস্যা হয়েছে।";
          if (authError.code === 'auth/email-already-in-use') {
              description = "এই ইমেল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা আছে।";
          } else if (authError.code === 'auth/weak-password') {
              description = "পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।";
          }
           toast({
              variant: "destructive",
              title: "সাইন আপ ব্যর্থ হয়েছে",
              description: description,
          });
      } finally {
          setIsSigningUp(false);
      }
  };


  if (isDashboard) {
    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-lg px-4 sm:px-6">
        <SidebarTrigger className="md:hidden" />
        <div className="flex items-center gap-4">
            {(pathname.startsWith('/teacher') || pathname.startsWith('/super-admin')) && <LiveTime />}
        </div>
        <div className="ml-auto flex items-center gap-4">
            <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="অনুসন্ধান..." className="pl-8 w-[200px] lg:w-[300px]" />
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Toggle notifications</span>
            </Button>
            {isClient && (
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                        <AvatarImage data-ai-hint="person photo" src="https://picsum.photos/seed/avatar-admin/40/40" alt="Admin" />
                        <AvatarFallback>অ্যাডমিন</AvatarFallback>
                    </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>আমার অ্যাকাউন্ট</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href={pathname.startsWith('/teacher') ? "/teacher/dashboard/settings" : "/super-admin/settings"}>
                          <Settings className="mr-2 h-4 w-4" />
                          সেটিংস
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>লগআউট</DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
        </header>
    )
  }

  // Public page header
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-20">
        <div className="flex items-center gap-3">
          <Image
            src={settings.logoUrl || "https://picsum.photos/seed/school-logo/40/40"}
            alt="ইকরা নূরানী একাডেমী Logo"
            width={40}
            height={40}
            data-ai-hint="school logo"
            className="rounded-md"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{settings.schoolName || 'ইকরা নূরানী একাডেমী'}</h1>
            <p className="text-xs text-gray-500">{settings.schoolTagline || 'শিক্ষার একটি প্রগতিশীল উপায়'}</p>
          </div>
        </div>
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
          <Link href="/" className="text-gray-600 hover:text-primary transition-colors">মূলপাতা</Link>
          <Link href="/admission" className="text-gray-600 hover:text-primary transition-colors">ভর্তি</Link>
          <Link href="/about" className="text-gray-600 hover:text-primary transition-colors">পরিচিতি</Link>
          <Link href="/homework" className="text-gray-600 hover:text-primary transition-colors">বাড়ির কাজ</Link>
          <Link href="/gallery" className="text-gray-600 hover:text-primary transition-colors">গ্যালারী</Link>
          <Link href="/result" className="text-gray-600 hover:text-primary transition-colors">ফলাফল</Link>
          <Link href="/questions" className="text-gray-600 hover:text-primary transition-colors">প্রশ্ন</Link>
          <Link href="/contact" className="text-gray-600 hover:text-primary transition-colors">যোগাযোগ</Link>
        </nav>
        <div className="flex items-center gap-2">
            {isClient && (
            <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">লগইন</Button>
                </DialogTrigger>
                <DialogContent
                    className="sm:max-w-md p-8"
                    onPointerDownOutside={(e) => e.preventDefault()}
                >
                    {authView === 'login' ? (
                      <>
                        <DialogHeader className="text-left">
                            <DialogTitle className="text-2xl font-bold">স্বাগতম {settings.schoolName || 'ইকরা নূরানী একাডেমী'}-তে</DialogTitle>
                            <DialogDescription>আপনার স্কুল অ্যাকাউন্টে সাইন ইন করুন</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                             <div className="space-y-2">
                                <Label htmlFor="role-login">ভূমিকা</Label>
                                <Select value={loginRole} onValueChange={setLoginRole}>
                                    <SelectTrigger id="role-login">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="super-admin">সুপার অ্যাডমিন</SelectItem>
                                        <SelectItem value="teacher">শিক্ষক</SelectItem>
                                        <SelectItem value="parent">অভিভাবক</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">ব্যবহারকারীর নাম</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="username" type="text" placeholder="ইমেল বা ফোন নম্বর" className="pl-10" required value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-login">পাসওয়ার্ড</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="password-login" type="password" placeholder="********" className="pl-10" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                                </div>
                            </div>
                            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleLogin} disabled={isLoggingIn}>
                                {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                সাইন ইন
                                <ArrowRight className="ml-2 h-4 w-4"/>
                            </Button>
                             {(loginRole === 'teacher') && (
                                <p className="text-center text-sm">
                                    অ্যাকাউন্ট নেই?{" "}
                                    <Button variant="link" className="p-0 h-auto" onClick={() => setAuthView('signup')}>
                                        সাইন আপ করুন
                                    </Button>
                                </p>
                            )}
                        </div>
                      </>
                    ) : (
                      <>
                        <DialogHeader className="text-left">
                            <DialogTitle className="text-2xl font-bold">অ্যাকাউন্ট তৈরি করুন</DialogTitle>
                            <DialogDescription>আমাদের স্কুল কমিউনিটিতে যোগ দিন।</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="signup-name">পুরো নাম</Label>
                                <Input id="signup-name" type="text" placeholder="আপনার পুরো নাম" required value={signupName} onChange={(e) => setSignupName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-email">ইমেইল</Label>
                                <Input id="signup-email" type="email" placeholder="you@example.com" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="signup-phone">ফোন</Label>
                                <Input id="signup-phone" type="tel" placeholder="আপনার ফোন নম্বর" required value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-password">পাসওয়ার্ড</Label>
                                <Input id="signup-password" type="password" placeholder="একটি পাসওয়ার্ড তৈরি করুন" required value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-role">ভূমিকা</Label>
                                <Select value={signupRole} onValueChange={setSignupRole}>
                                    <SelectTrigger id="signup-role">
                                        <SelectValue placeholder="একটি ভূমিকা নির্বাচন করুন" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="teacher">শিক্ষক</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleSignUp} disabled={isSigningUp}>
                                {isSigningUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                সাইন আপ
                            </Button>
                            <p className="text-center text-sm">
                                ইতিমধ্যে একটি অ্যাকাউন্ট আছে?{" "}
                                <Button variant="link" className="p-0 h-auto" onClick={() => setAuthView('login')}>
                                    সাইন ইন করুন
                                </Button>
                            </p>
                        </div>
                      </>
                    )}
                </DialogContent>
            </Dialog>
            )}
        </div>
      </div>
    </div>
  );
}
