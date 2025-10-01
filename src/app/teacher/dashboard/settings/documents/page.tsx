
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast"
import ImageKitUploader from "@/components/imagekit-uploader"

type DocumentSettings = {
  logoUrl?: string;
  headerContent?: string;
  footerContent?: string;
};

export default function DocumentsSettingsPage() {
    const [settings, setSettings] = React.useState<DocumentSettings>({});
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

    const db = getFirestore(app);
    const { toast } = useToast();

    React.useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, "settings", "documents");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSettings(docSnap.data() as DocumentSettings);
                }
            } catch (error) {
                toast({ variant: "destructive", title: "ত্রুটি", description: "সেটিংস আনতে সমস্যা হয়েছে।" });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [db, toast]);
    
    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "settings", "documents"), settings);
            toast({ title: "সফল", description: "ডকুমেন্ট সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে।" });
        } catch (error) {
            toast({ variant: "destructive", title: "ত্রুটি", description: "সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে।" });
        } finally {
            setSaving(false);
        }
    }
    
    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>ডকুমেন্ট সেটিংস</CardTitle>
        <CardDescription>
          আইডি কার্ড, প্রশংসাপত্র এবং অন্যান্য ডকুমেন্টের জন্য সাধারণ তথ্য সেট করুন।
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="logoUrl">প্রতিষ্ঠানের লোগো</Label>
          <ImageKitUploader 
            folder="/logos"
            onUploadSuccess={(urls) => setSettings(s => ({...s, logoUrl: urls[0]}))}
            initialImageUrl={settings.logoUrl}
          />
          <p className="text-sm text-muted-foreground">ডকুমেন্টের হেডারে প্রদর্শিত হবে।</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="headerContent">হেডার কন্টেন্ট</Label>
          <Input 
            id="headerContent" 
            placeholder="প্রতিষ্ঠানের নাম"
            value={settings.headerContent || ""}
            onChange={(e) => setSettings(s => ({...s, headerContent: e.target.value}))}
          />
           <p className="text-sm text-muted-foreground">সাধারণত প্রতিষ্ঠানের নাম, যা ডকুমেন্টের শীর্ষে প্রদর্শিত হয়।</p>
        </div>
         <div className="space-y-2">
          <Label htmlFor="footerContent">ফুটার কন্টেন্ট</Label>
          <Input 
            id="footerContent" 
            placeholder="কর্তৃপক্ষের স্বাক্ষর"
            value={settings.footerContent || ""}
            onChange={(e) => setSettings(s => ({...s, footerContent: e.target.value}))}
          />
           <p className="text-sm text-muted-foreground">ডকুমেন্টের নিচে প্রদর্শিত হবে, যেমন "অধ্যক্ষের স্বাক্ষর"।</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving} className="ml-auto">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            <Save className="mr-2 h-4 w-4" />
            সংরক্ষণ করুন
        </Button>
      </CardFooter>
    </Card>
  )
}
