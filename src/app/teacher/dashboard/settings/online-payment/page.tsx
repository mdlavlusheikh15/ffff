
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
import { Switch } from "@/components/ui/switch"

type PaymentGatewaySettings = {
    enabled?: boolean;
    apiKey?: string;
    apiSecret?: string;
};

type OnlinePaymentSettings = {
  bkash?: PaymentGatewaySettings;
  nagad?: PaymentGatewaySettings;
  rocket?: PaymentGatewaySettings;
};

export default function OnlinePaymentSettingsPage() {
  const [settings, setSettings] = React.useState<OnlinePaymentSettings>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const db = getFirestore(app);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "settings", "payment");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as OnlinePaymentSettings);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "পেমেন্ট সেটিংস আনতে সমস্যা হয়েছে।" });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [db, toast]);

  const handleGatewayChange = (gateway: keyof OnlinePaymentSettings, field: keyof PaymentGatewaySettings, value: string | boolean) => {
    setSettings(prev => ({
        ...prev,
        [gateway]: {
            ...prev[gateway],
            [field]: value
        }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "payment"), settings, { merge: true });
      toast({ title: "সফল", description: "অনলাইন পেমেন্ট সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে।" });
    } catch (error) {
      toast({ variant: "destructive", title: "ত্রুটি", description: "সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে।" });
    } finally {
      setSaving(false);
    }
  }
  
  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  const renderGatewaySettings = (gateway: keyof OnlinePaymentSettings, name: string) => (
     <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>{name}</CardTitle>
                <Switch 
                    checked={settings[gateway]?.enabled || false}
                    onCheckedChange={(checked) => handleGatewayChange(gateway, 'enabled', checked)}
                />
            </div>
        </CardHeader>
        {settings[gateway]?.enabled && (
             <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor={`${gateway}-apiKey`}>API Key</Label>
                    <Input 
                        id={`${gateway}-apiKey`}
                        value={settings[gateway]?.apiKey || ""}
                        onChange={(e) => handleGatewayChange(gateway, 'apiKey', e.target.value)}
                    />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor={`${gateway}-apiSecret`}>API Secret</Label>
                    <Input 
                        id={`${gateway}-apiSecret`}
                        type="password"
                        value={settings[gateway]?.apiSecret || ""}
                        onChange={(e) => handleGatewayChange(gateway, 'apiSecret', e.target.value)}
                    />
                 </div>
             </CardContent>
        )}
    </Card>
  );

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>অনলাইন পেমেন্ট সেটিংস</CardTitle>
        <CardDescription>
          আপনার প্রতিষ্ঠানের জন্য অনলাইন পেমেন্ট গেটওয়ে কনফিগার করুন।
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderGatewaySettings('bkash', 'বিকাশ')}
        {renderGatewaySettings('nagad', 'নগদ')}
        {renderGatewaySettings('rocket', 'রকেট')}
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
