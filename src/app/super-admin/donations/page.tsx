
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
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

type Donation = {
  id: string;
  donorName: string;
  amount: number;
  donationDate: string;
  phone?: string;
  address?: string;
};

export default function DonationsPage() {
  const [donations, setDonations] = React.useState<Donation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const [donorName, setDonorName] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [donationDate, setDonationDate] = React.useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const db = getFirestore(app);
  const { toast } = useToast();

  React.useEffect(() => {
    const q = query(collection(db, "donations"), orderBy("donationDate", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const donationsData = querySnapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Donation)
        );
        setDonations(donationsData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching donations: ", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch donations." });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db, toast]);
  
  const clearForm = () => {
    setDonorName("");
    setAmount("");
    setDonationDate(format(new Date(), "yyyy-MM-dd"));
    setPhone("");
    setAddress("");
  };

  const handleAddDonation = async () => {
    if (!donorName || !amount || !donationDate) {
        toast({ variant: "destructive", title: "Error", description: "Please fill all required fields." });
        return;
    }
    setIsSaving(true);
    try {
        await addDoc(collection(db, "donations"), {
            donorName,
            amount: Number(amount),
            donationDate,
            phone,
            address,
        });
        toast({ title: "Success", description: "Donation added successfully." });
        clearForm();
        setDialogOpen(false);
    } catch (error) {
        console.error("Error adding donation: ", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to add donation." });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDeleteDonation = async (id: string) => {
     try {
        await deleteDoc(doc(db, "donations", id));
        toast({ title: "Success", description: "Donation deleted successfully." });
    } catch (error) {
        console.error("Error deleting donation: ", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to delete donation." });
    }
  }
  
  const totalDonations = React.useMemo(() => {
    return donations.reduce((sum, item) => sum + item.amount, 0);
  }, [donations]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>দান</CardTitle>
            <CardDescription>
              সকল দানের তালিকা এবং নতুন দান যোগ করুন।
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                নতুন দান যোগ করুন
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>নতুন দান যোগ করুন</DialogTitle>
                <DialogDescription>
                  অনুগ্রহ করে দাতার তথ্য পূরণ করুন।
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="donor-name" className="text-right">
                    দাতার নাম*
                  </Label>
                  <Input id="donor-name" value={donorName} onChange={(e) => setDonorName(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    পরিমাণ*
                  </Label>
                  <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    তারিখ*
                  </Label>
                  <Input id="date" type="date" value={donationDate} onChange={(e) => setDonationDate(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    ফোন
                  </Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    ঠিকানা
                  </Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">বাতিল</Button>
                </DialogClose>
                <Button onClick={handleAddDonation} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  সংরক্ষণ করুন
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>দাতার নাম</TableHead>
                <TableHead>পরিমাণ</TableHead>
                <TableHead>তারিখ</TableHead>
                <TableHead>ফোন</TableHead>
                <TableHead>ঠিকানা</TableHead>
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
              ) : donations.map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell className="font-medium">{donation.donorName}</TableCell>
                  <TableCell>৳{donation.amount.toLocaleString('bn-BD')}</TableCell>
                  <TableCell>{format(new Date(donation.donationDate), "PP")}</TableCell>
                  <TableCell>{donation.phone}</TableCell>
                  <TableCell>{donation.address}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteDonation(donation.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted/50">
                <TableCell>মোট</TableCell>
                <TableCell>৳{totalDonations.toLocaleString('bn-BD')}</TableCell>
                <TableCell colSpan={4}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
