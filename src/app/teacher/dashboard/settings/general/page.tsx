
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Plus, Trash2 } from "lucide-react"
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast"

type FeeStructure = {
  monthlyFee: number;
  sessionFee: number;
  admissionFee: number;
  "1st-term": number;
  "2nd-term": number;
  final: number;
};

type GeneralSettings = {
  schoolName?: string;
  fees?: {
    classFees?: {
      [key: string]: Partial<FeeStructure>; // Key format: "ClassName-Year"
    }
  }
};

const currentYear = new Date().getFullYear().toString();

export default function GeneralSettingsPage() {
  const [settings, setSettings] = React.useState<GeneralSettings>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const db = getFirestore(app);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as GeneralSettings);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "সেটিংস আনতে সমস্যা হয়েছে।" });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [db, toast]);

  const handleFeeChange = (className: string, field: keyof FeeStructure, value: string) => {
    const key = `${className}-${currentYear}`;
    setSettings(prev => ({
      ...prev,
      fees: {
        ...prev.fees,
        classFees: {
          ...prev.fees?.classFees,
          [key]: {
            ...prev.fees?.classFees?.[key],
            [field]: Number(value)
          }
        }
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "general"), settings, { merge: true });
      toast({ title: "সফল", description: "সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে।" });
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
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>সাধারণ সেটিংস</CardTitle>
        <CardDescription>
          প্রতিষ্ঠানের নাম, ফি কাঠামো এবং অন্যান্য সাধারণ তথ্য পরিচালনা করুন।
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="schoolName">প্রতিষ্ঠানের নাম</Label>
          <Input
            id="schoolName"
            value={settings.schoolName || ""}
            onChange={(e) => setSettings(s => ({ ...s, schoolName: e.target.value }))}
          />
        </div>

        <div className="space-y-4">
            <h3 className="text-lg font-semibold">ফি কাঠামো ({currentYear})</h3>
            <div className="space-y-6">
                {Object.keys(settings.fees?.classFees || {}).filter(k => k.endsWith(currentYear)).map(key => {
                    const className = key.replace(`-${currentYear}`, '');
                    const feeStructure = settings.fees?.classFees?.[key] || {};
                    return (
                        <div key={key} className="p-4 border rounded-lg space-y-4">
                             <h4 className="font-medium">{className}</h4>
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label>মাসিক ফি</Label>
                                    <Input type="number" value={feeStructure.monthlyFee || ''} onChange={e => handleFeeChange(className, 'monthlyFee', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label>সেশন ফি</Label>
                                    <Input type="number" value={feeStructure.sessionFee || ''} onChange={e => handleFeeChange(className, 'sessionFee', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label>ভর্তি ফি</Label>
                                    <Input type="number" value={feeStructure.admissionFee || ''} onChange={e => handleFeeChange(className, 'admissionFee', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label>১ম টার্ম</Label>
                                    <Input type="number" value={feeStructure['1st-term'] || ''} onChange={e => handleFeeChange(className, '1st-term', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label>২য় টার্ম</Label>
                                    <Input type="number" value={feeStructure['2nd-term'] || ''} onChange={e => handleFeeChange(className, '2nd-term', e.target.value)} />
                                </div>
                                 <div className="space-y-1">
                                    <Label>বার্ষিক</Label>
                                    <Input type="number" value={feeStructure.final || ''} onChange={e => handleFeeChange(className, 'final', e.target.value)} />
                                </div>
                             </div>
                        </div>
                    )
                })}
            </div>
        </div>

      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving} className="ml-auto">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          সংরক্ষণ করুন
        </Button>
      </CardFooter>
    </Card>
  )
}
