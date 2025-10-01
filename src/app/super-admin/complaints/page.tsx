
"use client"

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";
import { Loader2, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

type Complaint = {
  id: string;
  title: string;
  content: string;
  from: string;
  sentAt: Timestamp;
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = React.useState<Complaint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const db = getFirestore(app);
  const { toast } = useToast();

  React.useEffect(() => {
    const q = query(collection(db, "complaints"), orderBy("sentAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const complaintsData = querySnapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Complaint)
        );
        setComplaints(complaintsData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching complaints:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch complaints." });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db, toast]);

  const handleDelete = async (id: string) => {
    try {
        await deleteDoc(doc(db, "complaints", id));
        toast({ title: "Success", description: "Complaint deleted successfully." });
    } catch (error) {
        console.error("Error deleting complaint: ", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to delete complaint." });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>অভিযোগ এবং মতামত</CardTitle>
        <CardDescription>
          ব্যবহারকারীদের দ্বারা দাখিলকৃত অভিযোগ এবং মতামত দেখুন।
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>বিষয়</TableHead>
                <TableHead>প্রেরক</TableHead>
                <TableHead>সময়</TableHead>
                <TableHead>বিবরণ</TableHead>
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
              ) : complaints.length > 0 ? (
                complaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="font-medium">{complaint.title}</TableCell>
                    <TableCell>{complaint.from}</TableCell>
                    <TableCell>
                      {complaint.sentAt ? formatDistanceToNow(complaint.sentAt.toDate(), {
                        addSuffix: true,
                        locale: bn,
                      }) : 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-sm truncate">{complaint.content}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(complaint.id)}>
                            <Trash2 className="h-4 w-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                       কোনো অভিযোগ পাওয়া যায়নি।
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
