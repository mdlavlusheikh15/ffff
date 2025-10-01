
"use client";

import * as React from "react";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Student } from "@/lib/data";
import { Loader2, Save, User as UserIcon, Phone, Mail, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import ImageKitUploader from "@/components/imagekit-uploader";

type ParentData = {
    name: string;
    email: string;
    phone: string;
    occupation: string;
    address: string;
    avatar: string;
    children: Student[];
};

export default function ParentProfilePage() {
    const [parentData, setParentData] = React.useState<Partial<ParentData>>({});
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    
    const auth = getAuth(app);
    const db = getFirestore(app);
    const { toast } = useToast();
    const router = useRouter();

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && user.email) {
                await fetchParentData(user);
            } else if (!user) {
                router.push('/');
            } else {
                setLoading(false);
            }
        });
        
        const fetchParentData = async (user: FirebaseUser) => {
            setLoading(true);
            try {
                // Assuming parent's data is linked via one of their children's records.
                const studentQuery = query(collection(db, 'students'), where('fatherEmail', '==', user.email));
                const studentSnapshot = await getDocs(studentQuery);

                let children: Student[] = [];
                studentSnapshot.forEach(doc => {
                    children.push({ id: doc.id, ...doc.data() } as Student);
                });

                if (children.length > 0) {
                    const firstChild = children[0];
                    setParentData({
                        name: firstChild.fatherName,
                        email: user.email,
                        phone: firstChild.fatherPhone,
                        occupation: firstChild.fatherOccupation,
                        address: [firstChild.presentVillage, firstChild.presentUpazila, firstChild.presentDistrict].filter(Boolean).join(', '),
                        avatar: firstChild.avatar, // Assuming we use child's avatar for parent for now. This could be improved.
                        children: children,
                    });
                } else {
                     toast({ variant: "destructive", title: "তথ্য পাওয়া যায়নি", description: "আপনার সন্তানের তথ্য পাওয়া যায়নি।" });
                }
            } catch (error) {
                console.error("Error fetching parent data:", error);
                toast({ variant: "destructive", title: "Error", description: "Could not fetch profile data." });
            } finally {
                setLoading(false);
            }
        };

        return () => unsubscribe();
    }, [auth, db, router, toast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setParentData(prev => ({...prev, [id]: value }));
    }

    const handleSave = async () => {
        setSaving(true);
        // In a real application, you would save this data back to a 'parents' collection.
        // For now, this is a demonstration.
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: "সফল", description: "আপনার প্রোফাইল সফলভাবে আপডেট করা হয়েছে (সিমুলেটেড)।" });
        setSaving(false);
    };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>আমার প্রোফাইল</CardTitle>
            <CardDescription>আপনার ব্যক্তিগত তথ্য দেখুন এবং আপডেট করুন।</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 flex flex-col items-center gap-4">
                <ImageKitUploader 
                    folder="/avatars"
                    initialImageUrl={parentData.avatar}
                    onUploadSuccess={(url) => setParentData(prev => ({ ...prev, avatar: url }))}
                />
                <div className="text-center">
                    <h2 className="text-xl font-bold">{parentData.name}</h2>
                    <p className="text-sm text-muted-foreground">{parentData.email}</p>
                </div>
            </div>
             <div className="lg:col-span-2 space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name">পুরো নাম</Label>
                    <Input id="name" value={parentData.name || ''} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="occupation">পেশা</Label>
                    <Input id="occupation" value={parentData.occupation || ''} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="phone">মোবাইল নম্বর</Label>
                    <Input id="phone" type="tel" value={parentData.phone || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="address">ঠিকানা</Label>
                    <Input id="address" value={parentData.address || ''} onChange={handleInputChange} />
                </div>
             </div>
        </CardContent>
         <CardFooter className="justify-end">
            <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                সংরক্ষণ করুন
            </Button>
        </CardFooter>

        <CardContent className="pt-6 mt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">আমার সন্তানগণ</h3>
             {parentData.children && parentData.children.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parentData.children.map(child => (
                        <div key={child.id} className="flex items-center gap-4 p-3 border rounded-lg">
                             <Avatar className="h-12 w-12">
                                <AvatarImage src={child.avatar} alt={child.name}/>
                                <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{child.name}</p>
                                <p className="text-sm text-muted-foreground">{child.class} - রোল: {child.roll}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <p className="text-muted-foreground">কোনো সন্তানের তথ্য পাওয়া যায়নি।</p>
            )}
        </CardContent>
    </Card>
  );
}
