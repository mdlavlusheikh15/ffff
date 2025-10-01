
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import { Loader2, ArrowLeft } from "lucide-react";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { InventoryItem } from "@/lib/data";

export default function AddInventoryItemPage() {
    const [name, setName] = React.useState("");
    const [category, setCategory] = React.useState("");
    const [quantity, setQuantity] = React.useState("");
    const [price, setPrice] = React.useState("");
    const [status, setStatus] = React.useState<InventoryItem['status']>('in-stock');
    const [isSaving, setIsSaving] = React.useState(false);
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);
    
    const router = useRouter();
    const db = getFirestore(app);
    const { toast } = useToast();

    const handleSave = async () => {
        if (!name || !category || !quantity || !price) {
            toast({
                variant: "destructive",
                title: "ত্রুটি",
                description: "অনুগ্রহ করে সমস্ত আবশ্যকীয় ঘর পূরণ করুন।",
            });
            return;
        }

        setIsSaving(true);
        try {
            await addDoc(collection(db, "inventory"), {
                name,
                category,
                quantity: Number(quantity),
                price: Number(price),
                status,
            });
            toast({
                title: "সফল",
                description: "ইনভেন্টরি আইটেম সফলভাবে যোগ করা হয়েছে।",
            });
            router.push("/teacher/dashboard/inventory");
        } catch (error) {
            console.error("Error adding inventory item: ", error);
            toast({
                variant: "destructive",
                title: "ত্রুটি",
                description: "আইটেম যোগ করতে একটি সমস্যা হয়েছে।",
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Link href="/teacher/dashboard/inventory">
                <Button variant="outline" size="icon" type="button">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                </Link>
                <h1 className="text-2xl font-bold">নতুন ইনভেন্টরি আইটেম যোগ করুন</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>আইটেমের বিবরণ</CardTitle>
                    <CardDescription>ইনভেন্টরিতে একটি নতুন আইটেম যোগ করতে নিচের ফর্মটি পূরণ করুন।</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="item-name">আইটেমের নাম*</Label>
                        <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="আইটেমের নাম লিখুন"/>
                    </div>
                    {isClient && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="category">ক্যাটাগরি*</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="বই">বই</SelectItem>
                                    <SelectItem value="স্লেট">স্লেট</SelectItem>
                                    <SelectItem value="নোটবুক">নোটবুক</SelectItem>
                                    <SelectItem value="চক">চক</SelectItem>
                                    <SelectItem value="পেন্সিল">পেন্সিল</SelectItem>
                                    <SelectItem value="ব্রাশ/ডাস্টার">ব্রাশ/ডাস্টার</SelectItem>
                                    <SelectItem value="ইরেজার">ইরেজার</SelectItem>
                                    <SelectItem value="কাটার">কাটার</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity">পরিমাণ*</Label>
                            <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">মূল্য*</Label>
                            <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">স্ট্যাটাস*</Label>
                            <Select value={status} onValueChange={(value: InventoryItem['status']) => setStatus(value)}>
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="স্ট্যাটাস নির্বাচন করুন" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="in-stock">স্টকে আছে</SelectItem>
                                    <SelectItem value="low-stock">কম স্টক</SelectItem>
                                    <SelectItem value="out-of-stock">স্টক নেই</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                    )}
                </CardContent>
                <CardFooter className="justify-end gap-2">
                    <Button variant="outline" onClick={() => router.back()}>বাতিল করুন</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        সংরক্ষণ করুন
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
