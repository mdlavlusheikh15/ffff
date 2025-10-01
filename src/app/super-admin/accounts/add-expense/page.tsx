
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PlusCircle,
  Trash2,
  Loader2,
  Calendar as CalendarIcon,
  Search,
} from "lucide-react";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Expense = {
  id: string;
  expenseType: string;
  amount: number;
  expenseDate: string; // YYYY-MM-DD
  description?: string;
  recipient?: string;
};

const expenseTypes = [
    "শিক্ষকের বেতন",
    "কর্মচারীর বেতন",
    "বিদ্যুৎ বিল",
    "গ্যাস বিল",
    "পানি বিল",
    "ইন্টারনেট বিল",
    "মেরামত",
    "আপ্যায়ন",
    "অন্যান্য",
];

export default function AddExpensePage({ viewMode = 'add' }: { viewMode?: 'add' | 'all' }) {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Form state
  const [expenseType, setExpenseType] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [expenseDate, setExpenseDate] = React.useState<Date | undefined>(new Date());
  const [recipient, setRecipient] = React.useState("");
  const [description, setDescription] = React.useState("");

  const db = getFirestore(app);
  const { toast } = useToast();
  
  React.useEffect(() => {
    if (viewMode === 'all') {
      const q = query(collection(db, "expenses"), orderBy("expenseDate", "desc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const expensesData = querySnapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as Expense)
          );
          setExpenses(expensesData);
          setLoading(false);
      }, (error) => {
          console.error("Error fetching expenses: ", error);
          toast({ variant: "destructive", title: "ত্রুটি", description: "খরচের তালিকা আনতে সমস্যা হয়েছে।" });
          setLoading(false);
      });
      return () => unsubscribe();
    } else {
        setLoading(false);
    }
  }, [db, toast, viewMode]);

  const clearForm = () => {
    setExpenseType("");
    setAmount("");
    setExpenseDate(new Date());
    setRecipient("");
    setDescription("");
  };

  const handleAddExpense = async () => {
    if (!expenseType || !amount || !expenseDate) {
        toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: "অনুগ্রহ করে ব্যয়ের ধরন, পরিমাণ এবং তারিখ পূরণ করুন।",
        });
        return;
    }
    setIsSaving(true);
    try {
        await addDoc(collection(db, "expenses"), {
            expenseType,
            amount: Number(amount),
            expenseDate: format(expenseDate, "yyyy-MM-dd"),
            recipient,
            description,
        });
        toast({ title: "সফল", description: "ব্যয় সফলভাবে যোগ করা হয়েছে।" });
        clearForm();
        setDialogOpen(false);
    } catch (error) {
        console.error("Error adding expense: ", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: "ব্যয় যোগ করতে সমস্যা হয়েছে।" });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDeleteExpense = async (id: string) => {
     try {
        await deleteDoc(doc(db, "expenses", id));
        toast({ title: "সফল", description: "ব্যয় সফলভাবে মুছে ফেলা হয়েছে।" });
    } catch (error) {
        console.error("Error deleting expense: ", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: "ব্যয় মুছে ফেলতে সমস্যা হয়েছে।" });
    }
  }

  const filteredExpenses = expenses.filter(expense => 
      expense.expenseType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  if (viewMode === 'all') {
    return (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>সকল ব্যয়</CardTitle>
               <Button onClick={() => setDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    নতুন ব্যয় যোগ করুন
                </Button>
            </div>
            <CardDescription>
              আপনার প্রতিষ্ঠানের সকল ব্যয়ের তালিকা দেখুন।
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="খরচ খুঁজুন..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>ব্যয়ের ধরন</TableHead>
                    <TableHead>প্রাপক</TableHead>
                    <TableHead>পরিমাণ</TableHead>
                    <TableHead>তারিখ</TableHead>
                    <TableHead>বিবরণ</TableHead>
                    <TableHead className="text-right">ক্রিয়াকলাপ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                        </TableCell>
                    </TableRow>
                    ) : filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.expenseType}</TableCell>
                        <TableCell>{expense.recipient}</TableCell>
                        <TableCell>৳{expense.amount.toLocaleString('bn-BD')}</TableCell>
                        <TableCell>{format(new Date(expense.expenseDate), "PP")}</TableCell>
                        <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                        <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteExpense(expense.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                     <TableRow className="font-bold bg-muted/50">
                        <TableCell colSpan={2}>মোট</TableCell>
                        <TableCell>৳{totalExpenses.toLocaleString('bn-BD')}</TableCell>
                        <TableCell colSpan={3}></TableCell>
                    </TableRow>
                </TableBody>
                </Table>
            </div>
          </CardContent>
           <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>নতুন ব্যয় যোগ করুন</DialogTitle>
               </DialogHeader>
                 {/* Re-using the form component logic */}
                <AddExpenseForm
                    expenseType={expenseType} setExpenseType={setExpenseType}
                    amount={amount} setAmount={setAmount}
                    expenseDate={expenseDate} setExpenseDate={setExpenseDate}
                    recipient={recipient} setRecipient={setRecipient}
                    description={description} setDescription={setDescription}
                />
               <DialogFooter>
                 <DialogClose asChild><Button variant="outline">বাতিল</Button></DialogClose>
                 <Button onClick={handleAddExpense} disabled={isSaving}>
                   {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                   সংরক্ষণ করুন
                 </Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
        </Card>
    )
  }

  // Default 'add' view
  return (
    <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>নতুন ব্যয় যোগ করুন</CardTitle>
            <CardDescription>আপনার প্রতিষ্ঠানের একটি নতুন ব্যয় যোগ করতে ফর্মটি পূরণ করুন।</CardDescription>
        </CardHeader>
        <CardContent>
            <AddExpenseForm
                expenseType={expenseType} setExpenseType={setExpenseType}
                amount={amount} setAmount={setAmount}
                expenseDate={expenseDate} setExpenseDate={setExpenseDate}
                recipient={recipient} setRecipient={setRecipient}
                description={description} setDescription={setDescription}
            />
        </CardContent>
        <CardFooter className="justify-end">
             <Button onClick={handleAddExpense} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                ব্যয় যোগ করুন
            </Button>
        </CardFooter>
    </Card>
  );
}

// Reusable form component
function AddExpenseForm({
    expenseType, setExpenseType,
    amount, setAmount,
    expenseDate, setExpenseDate,
    recipient, setRecipient,
    description, setDescription
}: {
    expenseType: string, setExpenseType: (val: string) => void,
    amount: string, setAmount: (val: string) => void,
    expenseDate: Date | undefined, setExpenseDate: (val: Date | undefined) => void,
    recipient: string, setRecipient: (val: string) => void,
    description: string, setDescription: (val: string) => void,
}) {
    return (
        <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="expense-type">ব্যয়ের ধরন*</Label>
                    <Select value={expenseType} onValueChange={setExpenseType}>
                        <SelectTrigger id="expense-type">
                            <SelectValue placeholder="একটি ধরন নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                            {expenseTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amount">পরিমাণ*</Label>
                    <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"/>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="date">তারিখ*</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            id="date"
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal",!expenseDate && "text-muted-foreground")}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expenseDate ? format(expenseDate, "PPP") : <span>একটি তারিখ বাছুন</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={expenseDate} onSelect={setExpenseDate} initialFocus/>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="recipient">প্রাপক</Label>
                    <Input id="recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="প্রাপকের নাম"/>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">বিবরণ</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ব্যয়ের একটি সংক্ষিপ্ত বিবরণ লিখুন..."/>
            </div>
        </div>
    )
}

    