
"use client"

import * as React from "react";
import Link from "next/link";
import { 
  PlusCircle, 
  RefreshCcw, 
  Upload, 
  Download,
  Search,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  FileCheck2,
  FileText
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { type Student } from "@/lib/data";
import { collection, getDocs, getFirestore, deleteDoc, doc, query, orderBy, getDoc, writeBatch, onSnapshot } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import StudentProfileView from "@/components/student-profile-view";
import { useRouter, usePathname } from "next/navigation";
import { Label } from "@/components/ui/label";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { importStudentsFromCSV } from "@/app/super-admin/students/actions";
import { AlignmentType, Document, Packer, Paragraph, Table as DocxTable, TableCell as DocxTableCell, TableRow as DocxTableRow, WidthType, TextRun } from "docx";
import { saveAs } from 'file-saver';


const ITEMS_PER_PAGE = 18;

type ClassItem = {
  id: string;
  name: string;
};

type DocumentSettings = {
  logoUrl?: string;
  headerContent?: string;
};

const ImportDialog = ({ open, onOpenChange, onImportSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onImportSuccess: () => void }) => {
    const { toast } = useToast();
    const [file, setFile] = React.useState<File | null>(null);
    const [importing, setImporting] = React.useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };
    
    const handleImport = async () => {
        if (!file) {
            toast({ variant: 'destructive', title: 'ত্রুটি', description: 'অনুগ্রহ করে একটি CSV ফাইল নির্বাচন করুন।' });
            return;
        }

        setImporting(true);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const csvData = e.target?.result as string;
            const result = await importStudentsFromCSV(csvData);
            
            if (result.success) {
                toast({
                    title: 'সফল',
                    description: result.message
                });
                onImportSuccess();
                onOpenChange(false);
                setFile(null);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'আমদানি ব্যর্থ হয়েছে',
                    description: result.message
                });
            }
            setImporting(false);
        };
        
        reader.readAsText(file, 'UTF-8');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>শিক্ষার্থী আমদানি করুন</DialogTitle>
                    <DialogDescription>
                        একটি CSV ফাইল থেকে শিক্ষার্থীদের তালিকা আমদানি করুন। কলামগুলো অবশ্যই ডাটাবেস কাঠামোর সাথে মিলতে হবে।
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="csv-file">CSV ফাইল</Label>
                        <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
                         {file && <p className="text-sm text-muted-foreground flex items-center gap-2 pt-2"><FileCheck2 className="h-4 w-4"/> {file.name}</p>}
                    </div>
                     <p className="text-xs text-muted-foreground">
                        উদাহরণ কলাম: শিক্ষার্থীর নাম, শ্রেণী, শাখা, রোল, বাবার নাম, ফোন, ইত্যাদি।
                    </p>
                    <a href="/students-import-sample-bn.csv" download className="text-sm text-primary hover:underline">নমুনা CSV ফাইল ডাউনলোড করুন</a>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>বাতিল করুন</Button>
                    <Button onClick={handleImport} disabled={!file || importing}>
                        {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                        আমদানি করুন
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const StudentsPdfLayout = React.forwardRef<HTMLDivElement, { students: Student[], schoolInfo?: DocumentSettings, pageNumber: number, totalPages: number }>(({ students, schoolInfo, pageNumber, totalPages }, ref) => {
    
    const formatAddress = (student: Student) => {
        const parts = [student.presentVillage, student.presentUpazila, student.presentDistrict];
        return parts.filter(Boolean).join(', ');
    }
    
    const thStyle: React.CSSProperties = {
        padding: '10px 8px',
        verticalAlign: 'middle',
        fontWeight: 600,
        backgroundColor: 'transparent',
        fontSize: '14px',
        textAlign: 'center',
    };

    const tdStyle: React.CSSProperties = {
        padding: '10px 8px',
        verticalAlign: 'middle',
        borderBottom: '1px solid #E5E7EB',
        fontSize: '14px',
        textAlign: 'center',
    };

    return (
      <div ref={ref} className="p-8 bg-white text-black font-sans w-full">
           <div className="relative flex items-center justify-center text-center mb-4">
              {schoolInfo?.logoUrl && (
                  <div className="absolute left-0 top-0">
                      <Image src={schoolInfo.logoUrl} alt="School Logo" width={64} height={64} className="object-contain" />
                  </div>
              )}
              <div className="flex-1">
                  <h2 className="text-3xl font-bold">ইকরা নূরানী একাডেমী</h2>
                  <p className="text-base">চান্দাইকোনা, রায়গঞ্জ, সিরাজগঞ্জ</p>
                  <p className="text-sm"> স্থাপিত: ২০১৮</p>
              </div>
          </div>
          
          <h3 className="text-center font-semibold text-xl mb-4">সকল শিক্ষার্থীর তালিকা</h3>
          
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse', border: 'none' }}>
              <thead>
                  <tr>
                      <th style={thStyle}>রোল</th>
                      <th style={{...thStyle, textAlign: 'left'}}>শিক্ষার্থীর নাম</th>
                      <th style={thStyle}>শ্রেণী</th>
                      <th style={{...thStyle, textAlign: 'left'}}>বাবার নাম</th>
                      <th style={thStyle}>ফোন</th>
                      <th style={{...thStyle, textAlign: 'left'}}>বর্তমান ঠিকানা</th>
                  </tr>
              </thead>
              <tbody>
                  {students.map((student) => (
                      <tr key={student.id}>
                          <td style={tdStyle}>{student.roll}</td>
                          <td style={{...tdStyle, textAlign: 'left'}}>{student.name}</td>
                          <td style={tdStyle}>{student.class}</td>
                          <td style={{...tdStyle, textAlign: 'left'}}>{student.fatherName}</td>
                          <td style={tdStyle}>{student.phone}</td>
                          <td style={{...tdStyle, textAlign: 'left'}}>{formatAddress(student)}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
          <div className="text-center text-xs mt-4">
              <p>Page {pageNumber} of {totalPages}</p>
          </div>
      </div>
  )
});
StudentsPdfLayout.displayName = "StudentsPdfLayout";


export default function StudentsList({ showImportExport = true, actionColumn }: { showImportExport?: boolean, actionColumn?: { header: string, cell: (student: Student) => React.ReactNode } }) {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [phoneSearchTerm, setPhoneSearchTerm] = React.useState("");
  const [classFilter, setClassFilter] = React.useState("all");
  const [sectionFilter, setSectionFilter] = React.useState("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [classes, setClasses] = React.useState<ClassItem[]>([]);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [isViewOpen, setIsViewOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isExportingDocx, setIsExportingDocx] = React.useState(false);
  const [docSettings, setDocSettings] = React.useState<DocumentSettings>({});
  const [isClient, setIsClient] = React.useState(false);
  const [selectedStudents, setSelectedStudents] = React.useState<string[]>([]);

  const db = getFirestore(app);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const classQuery = query(collection(db, "classes"), orderBy("numericName"));
      const classesSnapshot = await getDocs(classQuery);
      setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassItem)));

      const settingsDocRef = doc(db, "settings", "documents");
      const settingsDocSnap = await getDoc(settingsDocRef);
      if (settingsDocSnap.exists()) {
        setDocSettings(settingsDocSnap.data() as DocumentSettings);
      }
      
      const studentsUnsubscribe = onSnapshot(query(collection(db, "students")), (snapshot) => {
        setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Student));
        setLoading(false);
      }, (error) => {
        console.error("Error with student listener:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to load students in real-time." });
        setLoading(false);
      });

      return () => studentsUnsubscribe();

    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch initial data." });
      setLoading(false);
    }
  }, [db, toast]);

  React.useEffect(() => {
    const unsubscribePromise = fetchData();
    return () => {
      unsubscribePromise.then(unsub => unsub && unsub());
    };
  }, [fetchData]);


  const handleDelete = async (studentId: string) => {
    try {
        await deleteDoc(doc(db, "students", studentId));
        toast({
            title: "সফল",
            description: "শিক্ষার্থী সফলভাবে মুছে ফেলা হয়েছে।",
        });
    } catch (error) {
        console.error("Error deleting student: ", error);
        toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: "শিক্ষার্থী মুছে ফেলতে একটি সমস্যা হয়েছে।",
        });
    }
  };

  const handleDeleteSelected = async () => {
    try {
        const batch = writeBatch(db);
        selectedStudents.forEach(id => {
            const docRef = doc(db, "students", id);
            batch.delete(docRef);
        });
        await batch.commit();
        toast({
            title: "সফল",
            description: `${selectedStudents.length} জন শিক্ষার্থীকে সফলভাবে মুছে ফেলা হয়েছে।`,
        });
        setSelectedStudents([]);
    } catch (error) {
         console.error("Error deleting selected students: ", error);
        toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: "নির্বাচিত শিক্ষার্থীদের মুছে ফেলতে সমস্যা হয়েছে।",
        });
    }
  };
  
    const handleDeleteAll = async () => {
        try {
            const batch = writeBatch(db);
            const snapshot = await getDocs(collection(db, "students"));
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            toast({
                title: "সফল",
                description: `সকল শিক্ষার্থী সফলভাবে মুছে ফেলা হয়েছে।`,
            });
        } catch (error) {
            console.error("Error deleting all students: ", error);
            toast({
                variant: "destructive",
                title: "ত্রুটি",
                description: "সকল শিক্ষার্থী মুছে ফেলতে সমস্যা হয়েছে।",
            });
        }
    };


  const handleViewClick = (student: Student) => {
    setSelectedStudent(student);
    setIsViewOpen(true);
  };
  
  const handleEditClick = (studentId: string) => {
    const basePath = pathname.startsWith('/super-admin') ? '/super-admin' : '/teacher';
    router.push(`${basePath}/students/edit/${studentId}`);
  };

  const filteredStudents = React.useMemo(() => {
    return students
      .filter(student => {
        const searchTermLower = searchTerm.toLowerCase();
        const nameMatch = student.name?.toLowerCase().includes(searchTermLower);
        const idMatch = student.admissionNo?.toLowerCase().includes(searchTermLower);
        const phoneMatch = student.phone?.includes(phoneSearchTerm);
        const classMatch = classFilter === "all" || student.class === classFilter;
        const sectionMatch = sectionFilter === "all" || student.section === sectionFilter;
        
        return (nameMatch || idMatch) && phoneMatch && classMatch && sectionMatch;
      });
  }, [students, searchTerm, phoneSearchTerm, classFilter, sectionFilter]);
  
  const handleExportPdf = async () => {
    const studentsToExport = filteredStudents.sort((a, b) => (a.roll || 0) - (b.roll || 0));
    if (studentsToExport.length === 0) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "রপ্তানি করার জন্য কোনো শিক্ষার্থী পাওয়া যায়নি।" });
        return;
    }

    setIsExporting(true);

    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const studentsPerPage = 18;
    const totalPages = Math.ceil(studentsToExport.length / studentsPerPage);
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);

    for (let i = 0; i < totalPages; i++) {
        const chunk = studentsToExport.slice(i * studentsPerPage, (i + 1) * studentsPerPage);
        
        const pageElement = document.createElement('div');
        tempContainer.appendChild(pageElement);

        await new Promise<void>((resolve) => {
            const root = require('react-dom/client').createRoot(pageElement);
            root.render(
                <StudentsPdfLayout 
                    students={chunk} 
                    schoolInfo={docSettings} 
                    pageNumber={i + 1}
                    totalPages={totalPages}
                />
            );
            
            setTimeout(async () => {
                const canvas = await html2canvas(pageElement, {
                    scale: 2, 
                    useCORS: true,
                });
                const imgData = canvas.toDataURL('image/png');
                
                if (i > 0) {
                    pdf.addPage();
                }

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const margin = 10;
                
                const imgProps = pdf.getImageProperties(imgData);
                const imgWidth = pdfWidth - margin * 2;
                const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

                let y = margin;
                if (imgHeight < pdfHeight) {
                    y = (pdfHeight - imgHeight) / 2;
                }
                
                pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);

                root.unmount();
                resolve();
            }, 500);
        });
    }

    document.body.removeChild(tempContainer);
    pdf.save('students-list.pdf');
    setIsExporting(false);
  };
  
const handleExportDocx = async () => {
    const studentsToExport = filteredStudents.sort((a, b) => (a.roll || 0) - (b.roll || 0));
    if (studentsToExport.length === 0) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "রপ্তানি করার জন্য কোনো শিক্ষার্থী পাওয়া যায়নি।" });
        return;
    }
    setIsExportingDocx(true);
    
    const formatAddress = (student: Student) => {
      const parts = [student.presentVillage, student.presentUpazila, student.presentDistrict];
      return parts.filter(Boolean).join(', ');
    }

    const createStyledParagraph = (text: string) => {
        return new Paragraph({
            children: [
                new TextRun({
                    text: text,
                    size: 24, // 12pt
                }),
            ],
        });
    };

     const createStyledHeaderParagraph = (text: string) => {
        return new Paragraph({
            children: [
                new TextRun({
                    text: text,
                    bold: true,
                    size: 24, // 12pt
                }),
            ],
        });
    };

    const header = new DocxTableRow({
        children: [
            new DocxTableCell({ children: [createStyledHeaderParagraph("রোল")] }),
            new DocxTableCell({ children: [createStyledHeaderParagraph("শিক্ষার্থীর নাম")] }),
            new DocxTableCell({ children: [createStyledHeaderParagraph("শ্রেণী")] }),
            new DocxTableCell({ children: [createStyledHeaderParagraph("বাবার নাম")] }),
            new DocxTableCell({ children: [createStyledHeaderParagraph("ফোন")] }),
            new DocxTableCell({ children: [createStyledHeaderParagraph("বর্তমান ঠিকানা")] }),
        ],
    });

    const rows = studentsToExport.map(student => {
        return new DocxTableRow({
            children: [
                new DocxTableCell({ children: [createStyledParagraph(String(student.roll || ''))] }),
                new DocxTableCell({ children: [createStyledParagraph(student.name || '')] }),
                new DocxTableCell({ children: [createStyledParagraph(student.class || '')] }),
                new DocxTableCell({ children: [createStyledParagraph(student.fatherName || '')] }),
                new DocxTableCell({ children: [createStyledParagraph(student.phone || '')] }),
                new DocxTableCell({ children: [createStyledParagraph(formatAddress(student) || '')] }),
            ],
        });
    });

    const table = new DocxTable({
        rows: [header, ...rows],
        width: {
            size: 100,
            type: WidthType.PERCENTAGE,
        },
    });

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 576,
                        right: 576,
                        bottom: 576,
                        left: 576,
                    },
                },
            },
            children: [
                new Paragraph({ text: "ইকরা নূরানী একাডেমী", heading: "Title", alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "চান্দাইকোনা, রায়গঞ্জ, সিরাজগঞ্জ", heading: "Heading3", alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "স্থাপিত: ২০১৮", heading: "Heading3", alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "সকল শিক্ষার্থীর তালিকা", heading: "Heading2", alignment: AlignmentType.CENTER }),
                new Paragraph({ text: " ", alignment: AlignmentType.CENTER }),
                table,
            ],
        }],
    });

    try {
        const blob = await Packer.toBlob(doc);
        saveAs(blob, "students-list.docx");
        toast({ title: 'সফল', description: 'DOCX ফাইল সফলভাবে তৈরি করা হয়েছে।' });
    } catch(e) {
        console.error(e)
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'DOCX ফাইল তৈরি করতে সমস্যা হয়েছে।' });
    } finally {
        setIsExportingDocx(false);
    }
  };


  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const uniqueSections = ["all", ...Array.from(new Set(students.map(s => s.section).filter(Boolean)))];

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  const handleSelectAll = (checked: boolean | string) => {
    if (checked) {
      setSelectedStudents(paginatedStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean | string) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, id]);
    } else {
      setSelectedStudents(prev => prev.filter(rowId => rowId !== id));
    }
  };

  const formatAddress = (student: Student) => {
    const parts = [student.presentVillage, student.presentUpazila, student.presentDistrict];
    return parts.filter(Boolean).join(', ');
  }

  const handleRefresh = () => {
      // The onSnapshot listener handles real-time updates,
      // but a manual refresh can be useful for reassuring the user.
      fetchData();
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>সকল শিক্ষার্থী</CardTitle>
          <div className="flex items-center gap-2">
            <Link href="/super-admin/students/add">
                <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> শিক্ষার্থী যোগ করুন</Button>
            </Link>
            <Button variant="outline" size="icon" onClick={handleRefresh}><RefreshCcw className="h-4 w-4" /></Button>
            {showImportExport && (
                <>
                    <Button variant="outline" size="icon" onClick={() => setIsImportOpen(true)}><Upload className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={handleExportPdf} disabled={isExporting}>
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </Button>
                     <Button variant="outline" size="icon" onClick={handleExportDocx} disabled={isExportingDocx}>
                        {isExportingDocx ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    </Button>
                </>
            )}
          </div>
        </div>
        <CardDescription>আপনার স্কুলের সমস্ত ছাত্র-ছাত্রীর তালিকা দেখুন এবং পরিচালনা করুন।</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-muted/20">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="আইডি বা নাম দিয়ে খুঁজুন" 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="ফোন দিয়ে খুঁজুন" 
              className="pl-8" 
              value={phoneSearchTerm}
              onChange={(e) => setPhoneSearchTerm(e.target.value)}
            />
          </div>
          {isClient ? (
            <>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="সকল ক্লাস" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল ক্লাস</SelectItem>
                  {classes.map(c => c && <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
               <Select value={sectionFilter} onValueChange={setSectionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="সকল সেকশন" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueSections.map(s => s && <SelectItem key={s} value={s}>{s === 'all' ? 'সকল সেকশন' : s}</SelectItem>)}
                </SelectContent>
              </Select>
            </>
          ) : (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          )}
        </div>

        {showImportExport && <div className="mb-4 flex items-center gap-4">
            {selectedStudents.length > 0 && (
                <>
                    <span className="text-sm text-muted-foreground">{selectedStudents.length} জন নির্বাচিত</span>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="mr-2 h-4 w-4" />
                                নির্বাচিতগুলো মুছুন
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    এই কাজটি ফিরিয়ে আনা যাবে না। এটি আপনার ডেটা থেকে {selectedStudents.length} জন শিক্ষার্থীকে স্থায়ীভাবে মুছে ফেলবে।
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSelected}>
                                    মুছে ফেলুন
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                     <Button variant="destructive" className="ml-auto">
                        <Trash2 className="mr-2 h-4 w-4" />
                        সকল শিক্ষার্থী মুছুন
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                        <AlertDialogDescription>
                            এই কাজটি ফিরিয়ে আনা যাবে না। এটি আপনার ডেটা থেকে সকল শিক্ষার্থীকে স্থায়ীভাবে মুছে ফেলবে।
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>বাতিল</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAll}>
                            হ্যাঁ, সব মুছে ফেলুন
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>}


        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                    <Checkbox
                        onCheckedChange={handleSelectAll}
                        checked={paginatedStudents.length > 0 && selectedStudents.length === paginatedStudents.length}
                        indeterminate={selectedStudents.length > 0 && selectedStudents.length < paginatedStudents.length}
                    />
                </TableHead>
                <TableHead className="w-[80px]">ছবি</TableHead>
                <TableHead>Admission No</TableHead>
                <TableHead>রোল</TableHead>
                <TableHead>শিক্ষার্থীর নাম</TableHead>
                <TableHead>ক্লাস</TableHead>
                <TableHead>বাবার নাম</TableHead>
                <TableHead>ফোন</TableHead>
                <TableHead>বর্তমান ঠিকানা</TableHead>
                <TableHead className="w-[120px]">
                    {actionColumn ? actionColumn.header : "ক্রিয়াকলাপ"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : paginatedStudents.length > 0 ? (
                paginatedStudents.map((student) => (
                  <TableRow key={student.id} data-state={selectedStudents.includes(student.id) && "selected"}>
                    <TableCell>
                        <Checkbox
                            onCheckedChange={(checked) => handleSelectRow(student.id, checked)}
                            checked={selectedStudents.includes(student.id)}
                         />
                    </TableCell>
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          data-ai-hint="student photo"
                          src={student.avatar}
                          alt={student.name}
                        />
                        <AvatarFallback>{student.name?.charAt(0) || 'S'}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>{student.admissionNo}</TableCell>
                    <TableCell>{student.roll}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>{student.fatherName}</TableCell>
                    <TableCell>{student.phone}</TableCell>
                    <TableCell>{formatAddress(student)}</TableCell>
                    <TableCell>
                      {actionColumn ? actionColumn.cell(student) : (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700" onClick={() => handleViewClick(student)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={() => handleEditClick(student.id)}>
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
                                  এই কাজটি ফিরিয়ে আনা যাবে না। এটি আপনার ডেটা থেকে শিক্ষার্থীকে স্থায়ীভাবে মুছে ফেলবে।
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(student.id)}>
                                  মুছে ফেলুন
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
               ) : (
                <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                        কোনো শিক্ষার্থী পাওয়া যায়নি।
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages || 1}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>

        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>শিক্ষার্থীর প্রোফাইল</DialogTitle>
                </DialogHeader>
                {selectedStudent && <StudentProfileView student={selectedStudent} />}
            </DialogContent>
        </Dialog>
        <ImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} onImportSuccess={handleRefresh} />
      </CardContent>
    </Card>
    </>
  );
}
