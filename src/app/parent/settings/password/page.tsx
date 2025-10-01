"use client"

import * as React from "react";
import { getAuth, onAuthStateChanged, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2, KeyRound, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ParentChangePasswordPage() {
    const [savingPassword, setSavingPassword] = React.useState(false);
    const [currentPassword, setCurrentPassword] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
    const [showNewPassword, setShowNewPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    
    const router = useRouter();
    const auth = getAuth(app);
    const { toast } = useToast();

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push('/');
            }
        });
        return () => unsubscribe();
    }, [auth, router]);
    
    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast({ variant: "destructive", title: "ত্রুটি", description: "নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।" });
            return;
        }
        if (newPassword.length < 6) {
            toast({ variant: "destructive", title: "ত্রুটি", description: "পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।" });
            return;
        }

        setSavingPassword(true);
        const user = auth.currentUser;
        if (user && user.email) {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            try {
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPassword);
                toast({ title: "সফল", description: "আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।" });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } catch (error) {
                toast({ variant: "destructive", title: "ত্রুটি", description: "পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে। অনুগ্রহ করে আপনার বর্তমান পাসওয়ার্ডটি সঠিক কিনা তা পরীক্ষা করুন।" });
                console.error(error);
            } finally {
                setSavingPassword(false);
            }
        }
    };

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/parent/settings">
                <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>
            <h1 className="text-2xl font-bold">পাসওয়ার্ড পরিবর্তন</h1>
        </div>
        <div className="flex justify-center">
            <Card className="max-w-2xl w-full">
                <CardHeader>
                    <CardTitle>পাসওয়ার্ড পরিবর্তন করুন</CardTitle>
                    <CardDescription>একটি শক্তিশালী পাসওয়ার্ড ব্যবহার করুন।</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                        <div className="space-y-2">
                        <Label htmlFor="current-password">বর্তমান পাসওয়ার্ড</Label>
                        <div className="relative">
                            <Input id="current-password" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                             <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCurrentPassword(p => !p)}>
                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                        <div className="space-y-2">
                        <Label htmlFor="new-password">নতুন পাসওয়ার্ড</Label>
                         <div className="relative">
                            <Input id="new-password" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                             <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNewPassword(p => !p)}>
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                        <div className="space-y-2">
                        <Label htmlFor="confirm-password">নতুন পাসওয়ার্ড নিশ্চিত করুন</Label>
                         <div className="relative">
                            <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground" onClick={() => setShowConfirmPassword(p => !p)}>
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </CardContent>
                    <CardFooter>
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleChangePassword} disabled={savingPassword}>
                        {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <KeyRound className="mr-2 h-4 w-4" />
                        পাসওয়ার্ড আপডেট করুন
                    </Button>
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}