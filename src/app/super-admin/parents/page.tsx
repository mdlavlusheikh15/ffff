

"use client"

import * as React from "react";
import { 
  RefreshCcw,
  Download,
  Search,
  Pencil,
  Loader2,
  KeyRound,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { type Student } from "@/lib/data";
import { getFirestore, collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createLoginCredentials } from "./actions";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Image from "next/image";
import { AlignmentType, Document, Packer, PageOrientation, Paragraph, Table as DocxTable, TableCell as DocxTableCell, TableRow as DocxTableRow, WidthType, TextRun, HeadingLevel } from "docx";
import { saveAs } from 'file-saver';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const ITEMS_PER_PAGE = 10;

type ClassItem = {
  id: string;
  name: string;
};

type DocumentSettings = {
  logoUrl?: string;
  headerContent?: string;
};

const ParentsPdfLayout = React.forwardRef<HTMLDivElement, { students: Student[], schoolInfo?: DocumentSettings, pageNumber: number, totalPages: number }>(({ students, schoolInfo, pageNumber, totalPages }, ref) => {
    
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
          
          <h3 className="text-center font-semibold text-xl mb-4">সকল অভিভাবকের তালিকা</h3>
          
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse', border: 'none' }}>
              <thead>
                  <tr>
                      <th style={{...thStyle, textAlign: 'left'}}>শিক্ষার্থীর নাম</th>
                      <th style={{...thStyle, textAlign: 'left'}}>বাবার নাম</th>
                      <th style={thStyle}>ইমেইল</th>
                      <th style={thStyle}>পাসওয়ার্ড</th>
                      <th style={{...thStyle, textAlign: 'left'}}>ঠিকানা</th>
                  </tr>
              </thead>
              <tbody>
                  {students.map((student) => (
                      <tr key={student.id}>
                          <td style={{...tdStyle, textAlign: 'left'}}>{student.name}</td>
                          <td style={{...tdStyle, textAlign: 'left'}}>{student.fatherName}</td>
                          <td style={tdStyle}>{student.email}</td>
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
ParentsPdfLayout.displayName = "ParentsPdfLayout";


export default function ParentsPage() {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [classes, setClasses] = React.useState<ClassItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [studentNameSearch, setStudentNameSearch] = React.useState("");
  const [fatherNameSearch, setFatherNameSearch] = React.useState("");
  const [phoneSearch, setPhoneSearch] = React.useState("");
  const [emailSearch, setEmailSearch] = React.useState("");
  const [classFilter, setClassFilter] = React.useState("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [creatingLogin, setCreatingLogin] = React.useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);
  const [isExportingDocx, setIsExportingDocx] = React.useState(false);
  const [docSettings, setDocSettings] = React.useState<DocumentSettings>({});
  
  const db = getFirestore(app);
  const { toast } = useToast();
  const router = useRouter();

  const fetchStudentsAndClasses = React.useCallback(async () => {
    setLoading(true);
    try {
        const studentsSnapshot = await getDocs(collection(db, "students"));
        const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
        setStudents(studentsData);
        
        const q = query(collection(db, "classes"), orderBy("numericName"));
        const classesSnapshot = await getDocs(q);
        const classesData = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassItem));
        setClasses(classesData);
        
        const settingsDocRef = doc(db, "settings", "documents");
        const settingsDocSnap = await getDoc(settingsDocRef);
        if (settingsDocSnap.exists()) {
            setDocSettings(settingsDocSnap.data() as DocumentSettings);
        }

    } catch (error) {
        console.error("Error fetching data:", error);
        toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: "তথ্য আনতে সমস্যা হয়েছে।",
        });
    } finally {
        setLoading(false);
    }
  }, [db, toast]);

  React.useEffect(() => {
    fetchStudentsAndClasses();
  }, [fetchStudentsAndClasses]);

  const handleEditClick = (studentId: string) => {
    // A parent record is tied to a student, so we edit the student.
    router.push(`/super-admin/students/edit/${studentId}`);
  };

  const handleCreateLogin = async (student: Student) => {
    const email = student.email;
    const phone = student.phone || student.fatherPhone || student.motherPhone;

    if (!email || !phone) {
        toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: "লগইন তৈরি করতে শিক্ষার্থীর ইমেল এবং একটি ফোন নম্বর প্রয়োজন।",
        });
        return;
    }
    setCreatingLogin(student.id);
    const result = await createLoginCredentials(email, phone);
    if (result.success) {
        toast({
            title: "সফল",
            description: result.success,
        });
    } else {
         toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: result.error,
        });
    }
    setCreatingLogin(null);
  };

  const filteredStudents = React.useMemo(() => {
    return students.filter(student => {
      const hasFatherName = !!student.fatherName;
      const studentNameMatch = student.name?.toLowerCase().includes(studentNameSearch.toLowerCase()) ?? true;
      const fatherNameMatch = student.fatherName?.toLowerCase().includes(fatherNameSearch.toLowerCase()) ?? true;
      const phoneMatch = student.phone?.includes(phoneSearch) ?? true;
      const emailMatch = student.email?.toLowerCase().includes(emailSearch.toLowerCase()) ?? true;
      const classMatch = classFilter === "all" || student.class === classFilter;
      
      return hasFatherName && studentNameMatch && fatherNameMatch && phoneMatch && emailMatch && classMatch;
    });
  }, [students, studentNameSearch, fatherNameSearch, phoneSearch, emailSearch, classFilter]);
  
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  const formatAddress = (student: Student) => {
    const parts = [student.presentVillage, student.presentUpazila, student.presentDistrict];
    return parts.filter(Boolean).join(', ');
  }
  
  const handleExportPdf = async () => {
    if (filteredStudents.length === 0) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "রপ্তানি করার জন্য কোনো অভিভাবক পাওয়া যায়নি।" });
        return;
    }

    setIsExportingPdf(true);

    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const studentsPerPage = 18;
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);

    for (let i = 0; i < totalPages; i++) {
        const chunk = filteredStudents.slice(i * studentsPerPage, (i + 1) * studentsPerPage);
        
        const pageElement = document.createElement('div');
        tempContainer.appendChild(pageElement);

        await new Promise<void>((resolve) => {
            const root = require('react-dom/client').createRoot(pageElement);
            root.render(
                <ParentsPdfLayout 
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
    pdf.save('parents-list.pdf');
    setIsExportingPdf(false);
  };

  const handleExportDocx = async () => {
    if (filteredStudents.length === 0) {
        toast({ variant: "destructive", title: "ত্রুটি", description: "রপ্তানি করার জন্য কোনো অভিভাবক পাওয়া যায়নি।" });
        return;
    }
    setIsExportingDocx(true);
    
    const createStyledParagraph = (text: string, isHeader = false) => new Paragraph({ 
        children: [new TextRun({ text, bold: isHeader, size: 20 })],
        alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
    });

    const header = new DocxTableRow({
        children: [
            new DocxTableCell({ children: [createStyledParagraph("শিক্ষার্থীর নাম", true)] }),
            new DocxTableCell({ children: [createStyledParagraph("বাবার নাম", true)] }),
            new DocxTableCell({ children: [createStyledParagraph("ইমেইল", true)] }),
            new DocxTableCell({ children: [createStyledParagraph("পাসওয়ার্ড", true)] }),
            new DocxTableCell({ children: [createStyledParagraph("ঠিকানা", true)] }),
        ],
    });

    const rows = filteredStudents.map(student => new DocxTableRow({
        children: [
            new DocxTableCell({ children: [createStyledParagraph(student.name || '')] }),
            new DocxTableCell({ children: [createStyledParagraph(student.fatherName || '')] }),
            new DocxTableCell({ children: [createStyledParagraph(student.email || '')] }),
            new DocxTableCell({ children: [createStyledParagraph(student.phone || '')] }),
            new DocxTableCell({ children: [createStyledParagraph(formatAddress(student) || '')] }),
        ],
    }));
    
    const table = new DocxTable({ rows: [header, ...rows], width: { size: 100, type: WidthType.PERCENTAGE } });
    
    const doc = new Document({
        styles: {
            paragraphStyles: [
                { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, }, paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 120 }, }, },
                { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, }, paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 240 }, }, },
                { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, }, paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 120 }, }, },
            ]
        },
        sections: [{
            properties: { 
                page: { 
                    orientation: PageOrientation.LANDSCAPE,
                    margin: { top: 720, right: 720, bottom: 720, left: 720 },
                },
            },
            children: [
                new Paragraph({ text: "ইকরা নূরানী একাডেমী", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "চান্দাইকোনা, রায়গঞ্জ, সিরাজগঞ্জ", heading: HeadingLevel.HEADING_3, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "স্থাপিত: ২০১৮", heading: HeadingLevel.HEADING_3, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "সকল অভিভাবকের তালিকা", heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER }),
                table
            ],
        }],
    });

    try {
        const blob = await Packer.toBlob(doc);
        saveAs(blob, "parents-list.docx");
    } catch (e) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'DOCX ফাইল তৈরি করতে সমস্যা হয়েছে।' });
    } finally {
        setIsExportingDocx(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>সকল শিক্ষার্থীর অভিভাবক</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchStudentsAndClasses}><RefreshCcw className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={handleExportPdf} disabled={isExportingPdf}>
                {isExportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={handleExportDocx} disabled={isExportingDocx}>
                {isExportingDocx ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 border rounded-lg bg-muted/20">
          <Input 
            placeholder="শিক্ষার্থীর নাম" 
            value={studentNameSearch}
            onChange={(e) => setStudentNameSearch(e.target.value)}
          />
          <Input 
            placeholder="বাবার নাম" 
            value={fatherNameSearch}
            onChange={(e) => setFatherNameSearch(e.target.value)}
          />
           <Input 
            placeholder="ফোন" 
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
          />
           <Input 
            placeholder="ই-মেইল" 
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
          />
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger>
              <SelectValue placeholder="সকল শ্রেণী" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">সকল শ্রেণী</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>শিক্ষার্থীর নাম</TableHead>
                <TableHead>বাবার নাম</TableHead>
                <TableHead>ইমেইল</TableHead>
                <TableHead>পাসওয়ার্ড</TableHead>
                <TableHead>ঠিকানা</TableHead>
                <TableHead className="w-[180px]">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                    </TableCell>
                </TableRow>
              ) : paginatedStudents.length > 0 ? (
                paginatedStudents.map((student) => {
                    const canCreateLogin = !!(student.email && (student.phone || student.fatherPhone || student.motherPhone));
                    return (
                        <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.fatherName}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.phone || student.fatherPhone || student.motherPhone}</TableCell>
                        <TableCell>{formatAddress(student) || 'N/A'}</TableCell>
                        <TableCell>
                            <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700" onClick={() => handleEditClick(student.id)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-yellow-600 hover:text-yellow-700" 
                                        onClick={() => handleCreateLogin(student)}
                                        disabled={creatingLogin === student.id || !canCreateLogin}
                                    >
                                        {creatingLogin === student.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </TooltipTrigger>
                                {!canCreateLogin && (
                                  <TooltipContent>
                                    <p className="text-destructive">লগইন তৈরি করতে শিক্ষার্থীর ইমেল এবং একটি ফোন নম্বর প্রয়োজন।</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                            </div>
                        </TableCell>
                        </TableRow>
                    )
                })
              ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        কোনো অভিভাবক পাওয়া যায়নি।
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
      </CardContent>
    </Card>
  );
}

