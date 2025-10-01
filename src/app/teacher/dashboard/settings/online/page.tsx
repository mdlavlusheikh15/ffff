
"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, Check, X } from "lucide-react"
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type PendingUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'teacher' | 'parent';
  avatar: string;
  collection: 'teachers' | 'parents'
};

export default function ApprovalPage() {
  const [pendingUsers, setPendingUsers] = React.useState<PendingUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const db = getFirestore(app);
  const { toast } = useToast();

  const fetchPendingUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const users: PendingUser[] = [];
      const teacherQuery = query(collection(db, "teachers"), where("status", "==", "pending"));
      const parentQuery = query(collection(db, "parents"), where("status", "==", "pending"));

      const [teacherSnapshot, parentSnapshot] = await Promise.all([
        getDocs(teacherQuery),
        getDocs(parentQuery),
      ]);

      teacherSnapshot.forEach(doc => {
        const data = doc.data();
        users.push({ id: doc.id, collection: 'teachers', role: 'teacher', ...data } as PendingUser);
      });
      parentSnapshot.forEach(doc => {
        const data = doc.data();
        users.push({ id: doc.id, collection: 'parents', role: 'parent', ...data } as PendingUser);
      });

      setPendingUsers(users);

    } catch (error) {
      toast({ variant: "destructive", title: "ত্রুটি", description: "অনুমোদনের তালিকা আনতে সমস্যা হয়েছে।" });
    } finally {
      setLoading(false);
    }
  }, [db, toast]);


  React.useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  const handleApproval = async (user: PendingUser, newStatus: 'approved' | 'rejected') => {
    setUpdatingId(user.id);
    try {
        if (newStatus === 'rejected') {
            await deleteDoc(doc(db, user.collection, user.id));
             toast({ title: "সফল", description: `${user.name}-এর আবেদনটি বাতিল করা হয়েছে।` });
        } else {
            const userDocRef = doc(db, user.collection, user.id);
            await updateDoc(userDocRef, { status: newStatus });
            toast({ title: "সফল", description: `${user.name}-কে সফলভাবে অনুমোদন করা হয়েছে।` });
        }
        setPendingUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (error) {
         toast({ variant: "destructive", title: "ত্রুটি", description: "স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।" });
    } finally {
        setUpdatingId(null);
    }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>অনলাইন অনুমোদন</CardTitle>
        <CardDescription>
          শিক্ষক এবং অভিভাবকদের থেকে আসা নতুন সাইন-আপ আবেদনগুলো অনুমোদন বা বাতিল করুন।
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>নাম</TableHead>
                <TableHead>ভূমিকা</TableHead>
                <TableHead>ইমেইল</TableHead>
                <TableHead>ফোন</TableHead>
                <TableHead className="text-right">ক্রিয়াকলাপ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : pendingUsers.length > 0 ? (
                pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium flex items-center gap-3">
                         <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {user.name}
                    </TableCell>
                    <TableCell>{user.role === 'teacher' ? 'শিক্ষক' : 'অভিভাবক'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell className="text-right">
                       {updatingId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> :
                        <div className="flex justify-end gap-2">
                             <Button size="icon" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-100" onClick={() => handleApproval(user, 'approved')}>
                                <Check className="h-4 w-4"/>
                            </Button>
                             <Button size="icon" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-100" onClick={() => handleApproval(user, 'rejected')}>
                                <X className="h-4 w-4"/>
                            </Button>
                        </div>
                       }
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                       কোনো অমীমাংসিত আবেদন নেই।
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
