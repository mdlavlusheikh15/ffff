

"use client"

import * as React from "react";
import { Teacher } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import { Button } from "./ui/button";
import { Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import Image from "next/image";

interface ProfileDetailProps {
    label: string;
    value?: string | number | null;
    className?: string;
}

const ProfileDetail: React.FC<ProfileDetailProps> = ({ label, value, className }) => (
    <div className={className}>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium break-words">{value || "N/A"}</p>
    </div>
);

const LabeledDetail: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
    <>
        <dt className="font-medium text-gray-600">{label}</dt>
        <dd className="text-gray-800 sm:col-span-2">: {value || 'N/A'}</dd>
    </>
);


interface TeacherProfileViewProps {
    teacher: Teacher;
}

type DocumentSettings = {
  logoUrl?: string;
  headerContent?: string;
  footerContent?: string;
};

const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({ teacher }) => {
    const profileRef = React.useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [docSettings, setDocSettings] = React.useState<DocumentSettings>({});

    const db = getFirestore(app);

     React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, "settings", "documents");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setDocSettings(docSnap.data() as DocumentSettings);
                }
            } catch (error) {
                console.error("Error fetching document settings:", error);
            }
        };
        fetchSettings();
    }, [db]);


    const handleDownloadPdf = async () => {
        const element = profileRef.current;
        if (!element) return;

        setIsDownloading(true);

        try {
            const originalColors = new Map();
            const allElements = element.querySelectorAll('*');
            allElements.forEach(el => {
                const htmlEl = el as HTMLElement;
                originalColors.set(htmlEl, htmlEl.style.color);
                htmlEl.style.color = 'black';
            });

            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: null,
                logging: false,
                useCORS: true,
            });

            allElements.forEach(el => {
                 const htmlEl = el as HTMLElement;
                htmlEl.style.color = originalColors.get(htmlEl);
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            let width = pdfWidth - 20;
            let height = width / ratio;

            if (height > pdfHeight - 20) {
              height = pdfHeight - 20;
              width = height * ratio;
            }
            
            const x = (pdfWidth - width) / 2;
            const y = 10;
            
            pdf.addImage(imgData, 'PNG', x, y, width, height);
            pdf.save(`teacher-profile-${teacher.name}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Button onClick={handleDownloadPdf} disabled={isDownloading}>
                    {isDownloading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ডাউনলোড হচ্ছে...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            PDF ডাউনলোড করুন
                        </>
                    )}
                </Button>
            </div>
            <div ref={profileRef} className="space-y-6 p-4 bg-white text-sm">
                
                <div className="flex items-start gap-6">
                    <Avatar className="h-24 w-24 border">
                        <AvatarImage src={teacher.avatar} alt={teacher.name} data-ai-hint="teacher photo" />
                        <AvatarFallback>{teacher.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 flex-1">
                        <div className="col-span-2">
                           <ProfileDetail label="নাম" value={teacher.name} />
                        </div>
                        <ProfileDetail label="পদবি" value={teacher.designation} />
                        <ProfileDetail label="বিষয়" value={teacher.subject} />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold border-b pb-2">ব্যক্তিগত তথ্য</h3>
                     <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2">
                        <LabeledDetail label="Full name" value={teacher.name} />
                        <LabeledDetail label="Father’s Name" value={teacher.fatherName} />
                        <LabeledDetail label="Mother’s Name" value={teacher.motherName} />
                        <LabeledDetail label="Date of Birth" value={teacher.dob ? format(new Date(teacher.dob), "PPP", { locale: bn }) : "N/A"} />
                        <LabeledDetail label="Marital Status" value={teacher.maritalStatus} />
                        <LabeledDetail label="National Id No" value={teacher.nid} />
                        <LabeledDetail label="Religion" value={teacher.religion} />
                    </dl>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold border-b pb-2">শিক্ষাগত যোগ্যতা</h3>
                    {teacher.qualifications && teacher.qualifications.length > 0 ? (
                        teacher.qualifications.map((qual, index) => (
                            <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 pt-2">
                                <ProfileDetail label="যোগ্যতার স্তর" value={qual.level} />
                                <ProfileDetail label="প্রতিষ্ঠানের নাম" value={qual.institute} />
                                <ProfileDetail label="জিপিএ" value={qual.gpa} />
                                <ProfileDetail label="পাশের বছর" value={qual.passingYear} />
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground">কোনো যোগ্যতা যোগ করা হয়নি।</p>
                    )}
                </div>

                 <div className="space-y-4">
                    <h3 className="font-semibold border-b pb-2">অভিজ্ঞতা</h3>
                    {teacher.hasExperience ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                            <ProfileDetail label="পূর্ববর্তী স্কুলের নাম" value={teacher.previousSchool} />
                            <ProfileDetail label="পদবি" value={teacher.previousDesignation} />
                            <ProfileDetail label="বিষয়" value={teacher.previousSubject} />
                            <ProfileDetail label="অভিজ্ঞতার বছর" value={teacher.experienceYears} />
                        </div>
                    ) : (
                         <p className="text-muted-foreground">কোনো অভিজ্ঞতা যোগ করা হয়নি।</p>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold border-b pb-2">স্থায়ী ঠিকানা</h3>
                        <p>{teacher.permanentAddress || "N/A"}</p>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold border-b pb-2">বর্তমান ঠিকানা</h3>
                         <p>{teacher.presentAddress || "N/A"}</p>
                    </div>
                </div>
                 {docSettings.footerContent && (
                    <div className="text-center pt-6 mt-6 border-t">
                        <p className="text-xs text-muted-foreground">{docSettings.footerContent}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherProfileView;

    



    
