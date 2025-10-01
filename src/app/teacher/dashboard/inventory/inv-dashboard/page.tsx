
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { Loader2, Book, Edit, Trash2, Scissors, Eraser, Slate, Notebook } from "lucide-react";
import { getFirestore, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { type InventoryItem } from "@/lib/data";
import StatCard from "@/components/ui/stat-card";
import CategoryCard from "@/components/ui/category-card";

export default function InventoryDashboardPage() {
    const [items, setItems] = React.useState<InventoryItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const db = getFirestore(app);
    const { toast } = useToast();

    React.useEffect(() => {
        const q = query(collection(db, "inventory"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const itemsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
            setItems(itemsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching inventory: ", error);
            toast({ variant: "destructive", title: "ত্রুটি", description: "ইনভেন্টরি আনতে সমস্যা হয়েছে।" });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, toast]);

    const stats = React.useMemo(() => {
        const totalCopies = items.reduce((sum, item) => sum + item.quantity, 0);
        const stockValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const totalItemTypes = new Set(items.map(item => item.name)).size;
        
        const categoryCounts = {
            Books: 0,
            Slates: 0,
            Notebooks: 0,
            Chalk: 0,
            Pencils: 0,
            'Brushes/Dusters': 0,
            Erasers: 0,
            Cutters: 0,
        };

        items.forEach(item => {
            if (item.category) {
                switch(item.category.toLowerCase()) {
                    case 'বই':
                    case 'books':
                        categoryCounts.Books += item.quantity;
                        break;
                    case 'স্লেট':
                    case 'slates':
                        categoryCounts.Slates += item.quantity;
                        break;
                    case 'নোটবুক':
                    case 'notebooks':
                        categoryCounts.Notebooks += item.quantity;
                        break;
                     case 'চক':
                    case 'chalk':
                        categoryCounts.Chalk += item.quantity;
                        break;
                    case 'পেন্সিল':
                    case 'pencils':
                        categoryCounts.Pencils += item.quantity;
                        break;
                    case 'ব্রাশ/ডাস্টার':
                    case 'brushes/dusters':
                        categoryCounts['Brushes/Dusters'] += item.quantity;
                        break;
                    case 'ইরেজার':
                    case 'erasers':
                        categoryCounts.Erasers += item.quantity;
                        break;
                    case 'কাটার':
                    case 'cutters':
                        categoryCounts.Cutters += item.quantity;
                        break;
                }
            }
        });

        return { totalItemTypes, totalCopies, stockValue, categoryCounts };
    }, [items]);

    const chartData = [
        { name: 'Oct', 'যোগ করা আইটেম': 0 },
        { name: 'Nov', 'যোগ করা আইটেম': 0 },
        { name: 'Dec', 'যোগ করা আইটেম': 0 },
        { name: 'Jan', 'যোগ করা আইটেম': 0 },
        { name: 'Feb', 'যোগ করা আইটেম': 0 },
        { name: 'Mar', 'যোগ করা আইটেম': 0 },
        { name: 'Apr', 'যোগ করা আইটেম': 0 },
        { name: 'May', 'যোগ করা আইটেম': 0 },
        { name: 'Jun', 'যোগ করা আইটেম': 0 },
        { name: 'Jul', 'যোগ করা আইটেম': 65 },
        { name: 'Aug', 'যোগ করা আইটেম': 0 },
        { name: 'Sep', 'যোগ করা আইটেম': 0 },
    ];


    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="মোট আইটেম" value={stats.totalItemTypes} />
                <StatCard title="মোট কপি (স্টক)" value={stats.totalCopies} />
                <StatCard title="স্টক মূল্য (ক্ষতি)" value={`৳${stats.stockValue.toLocaleString('bn-BD')}`} />
                <StatCard title="জরিমানা সংগ্রহ (লাভ)" value="৳০" />
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>ইনভেন্টরি ভাঙ্গন</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    <CategoryCard title="বই" value={stats.categoryCounts.Books} icon={Book} />
                    <CategoryCard title="স্লেট" value={stats.categoryCounts.Slates} icon={Slate} />
                    <CategoryCard title="নোটবুক" value={stats.categoryCounts.Notebooks} icon={Notebook} />
                    <CategoryCard title="চক" value={stats.categoryCounts.Chalk} icon={Edit} />
                    <CategoryCard title="পেন্সিল" value={stats.categoryCounts.Pencils} icon={Edit} />
                    <CategoryCard title="ব্রাশ/ডাস্টার" value={stats.categoryCounts['Brushes/Dusters']} icon={Trash2} />
                    <CategoryCard title="ইরেজার" value={stats.categoryCounts.Erasers} icon={Eraser} />
                    <CategoryCard title="কাটার" value={stats.categoryCounts.Cutters} icon={Scissors} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>ইনভেন্টরি চার্ট (যোগ করা আইটেম)</CardTitle>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                                    border: "1px solid #ccc",
                                    borderRadius: "0.5rem"
                                }}
                            />
                            <Legend wrapperStyle={{fontSize: "14px"}}/>
                            <Bar dataKey="যোগ করা আইটেম" fill="#334155" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
