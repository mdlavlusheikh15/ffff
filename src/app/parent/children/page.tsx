
"use client";

import * as React from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, limit } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Student } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Loader2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import StudentProfileView from "@/components/student-profile-view";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function MyChildrenPage() {
  const [children, setChildren] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [isViewOpen, setIsViewOpen] = React.useState(false);

  const auth = getAuth(app);
  const db = getFirestore(app);
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        fetchChildren(user.email);
      } else if (!user) {
        router.push('/');
      } else {
        setLoading(false);
      }
    });

    const fetchChildren = async (parentEmail: string) => {
      setLoading(true);
      try {
        const studentQueries = [
          query(collection(db, 'students'), where('email', '==', parentEmail)),
          query(collection(db, 'students'), where('fatherEmail', '==', parentEmail)),
          query(collection(db, 'students'), where('motherEmail', '==', parentEmail))
        ];

        const childrenData: Student[] = [];
        const studentIds = new Set<string>();

        for (const q of studentQueries) {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                if (!studentIds.has(doc.id)) {
                    childrenData.push({ id: doc.id, ...doc.data() } as Student);
                    studentIds.add(doc.id);
                }
            });
        }
        setChildren(childrenData);
      } catch (error) {
        console.error("Error fetching children:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch children's data.",
        });
      } finally {
        setLoading(false);
      }
    };

    return () => unsubscribe();
  }, [auth, db, router, toast]);

  const handleViewClick = (student: Student) => {
    setSelectedStudent(student);
    setIsViewOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>আমার সন্তান</CardTitle>
          <CardDescription>আপনার সকল সন্তানের তালিকা নিচে দেওয়া হলো।</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : children.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map(child => (
                <Card key={child.id}>
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={child.avatar} alt={child.name} />
                      <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-lg">{child.name}</p>
                    <p className="text-sm text-muted-foreground">{child.class} - রোল: {child.roll}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => handleViewClick(child)}>
                      <Eye className="mr-2 h-4 w-4" />
                      প্রোফাইল দেখুন
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p>এই অ্যাকাউন্টের জন্য কোনো সন্তান পাওয়া যায়নি।</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>শিক্ষার্থীর প্রোফাইল</DialogTitle>
            </DialogHeader>
            {selectedStudent && <StudentProfileView student={selectedStudent} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
