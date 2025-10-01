
"use client";

import * as React from "react";
import Link from "next/link";
import { 
  PlusCircle, 
  RefreshCcw, 
  Search,
  Pencil,
  Trash2,
  Loader2,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { type InventoryItem } from "@/lib/data";
import { collection, getFirestore, deleteDoc, doc, query, orderBy, onSnapshot } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function InventoryPage() {
  const [items, setItems] = React.useState<InventoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");

  const db = getFirestore(app);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  
  const basePath = pathname.startsWith('/super-admin') ? '/super-admin' : '/teacher/dashboard';


  const fetchItems = React.useCallback(() => {
    setLoading(true);
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
    return unsubscribe;
  }, [db, toast]);

  React.useEffect(() => {
    const unsubscribe = fetchItems();
    return () => unsubscribe();
  }, [fetchItems]);

  const handleDelete = async (itemId: string) => {
    try {
        await deleteDoc(doc(db, "inventory", itemId));
        toast({
            title: "সফল",
            description: "আইটেম সফলভাবে মুছে ফেলা হয়েছে।",
        });
    } catch (error) {
        console.error("Error deleting item: ", error);
        toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: "আইটেমটি মুছে ফেলতে একটি সমস্যা হয়েছে।",
        });
    }
  };

  const handleEditClick = (itemId: string) => {
    router.push(`${basePath}/inventory/edit/${itemId}`);
  };

  const filteredItems = React.useMemo(() => {
    return items.filter(item => 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const getStatusBadge = (status: 'in-stock' | 'out-of-stock' | 'low-stock') => {
    switch (status) {
      case 'in-stock':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">স্টকে আছে</Badge>;
      case 'low-stock':
        return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">কম স্টক</Badge>;
      case 'out-of-stock':
        return <Badge variant="destructive">স্টক নেই</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>সব মজুদ</CardTitle>
          <div className="flex items-center gap-2">
            <Link href={`${basePath}/inventory/add`}>
                <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> নতুন যোগ করুন</Button>
            </Link>
            <Button variant="outline" size="icon" onClick={fetchItems}><RefreshCcw className="h-4 w-4" /></Button>
          </div>
        </div>
        <CardDescription>আপনার প্রতিষ্ঠানের সমস্ত ইনভেন্টরি আইটেম দেখুন এবং পরিচালনা করুন।</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6 p-4 border rounded-lg bg-muted/20">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="আইটেমের নাম দিয়ে খুঁজুন" 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
           <Link href={`${basePath}/inventory/inv-dashboard`} className="ml-auto">
                <Button variant="outline"><BookOpen className="mr-2 h-4 w-4" /> ড্যাশবোর্ড দেখুন</Button>
            </Link>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>আইটেমের নাম</TableHead>
                <TableHead>পরিমাণ</TableHead>
                <TableHead>মূল্য</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
                <TableHead className="w-[120px]">ক্রিয়াকলাপ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>৳{(item.price || 0).toLocaleString('bn-BD')}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={() => handleEditClick(item.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                              <AlertDialogDescription>
                                এই কাজটি ফিরিয়ে আনা যাবে না। এটি আপনার ডেটা থেকে আইটেমটি স্থায়ীভাবে মুছে ফেলবে।
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>বাতিল</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.id)}>
                                মুছে ফেলুন
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
               ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        কোনো আইটেম পাওয়া যায়নি।
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
