
"use client"

import * as React from "react";
import { Student } from "@/lib/data";
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
}

const ProfileDetail: React.FC<ProfileDetailProps> = ({ label, value }) => (
    <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value || "N/A"}</p>
    </div>
);

interface StudentProfileViewProps {
    student: Student;
}

type DocumentSettings = {
  logoUrl?: string;
  headerContent?: string;
  footerContent?: string;
};

const StudentProfileView: React.FC<StudentProfileViewProps> = ({ student }) => {
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
             // Temporarily make all text black for better PDF readability
            const originalColors = new Map();
            const allElements = element.querySelectorAll('*');
            allElements.forEach(el => {
                const htmlEl = el as HTMLElement;
                originalColors.set(htmlEl, htmlEl.style.color);
                htmlEl.style.color = 'black';
            });


            const canvas = await html2canvas(element, {
                scale: 2, // Higher scale for better quality
                backgroundColor: null, // Use transparent background
                logging: false,
                useCORS: true,
            });

            // Restore original colors
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
            let width = pdfWidth - 20; // with margin
            let height = width / ratio;

            if (height > pdfHeight - 20) {
              height = pdfHeight - 20;
              width = height * ratio;
            }
            
            const x = (pdfWidth - width) / 2;
            const y = 10;
            
            pdf.addImage(imgData, 'PNG', x, y, width, height);
            pdf.save(`student-profile-${student.name}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            // You might want to show a toast notification to the user here
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
                 <div className="mb-6 relative">
                    <div className="text-center">
                        <h2 className="text-4xl font-bold">ইকরা নূরানী একাডেমী</h2>
                        <p className="text-sm">চান্দাইকোনা, রায়গঞ্জ, সিরাজগঞ্জ</p>
                        <p className="text-xs">স্থাপিত: ২০১৮</p>
                    </div>
                    {docSettings.logoUrl && (
                        <div className="absolute left-0 top-0">
                            <Image src={docSettings.logoUrl} alt="School Logo" width={64} height={64} className="object-contain" />
                        </div>
                    )}
                    <p className="text-base font-semibold mt-4 text-center">শিক্ষার্থীর প্রোফাইল</p>
                    <div className="border-b pt-2"></div>
                </div>


                <div className="flex items-start gap-6">
                    <Avatar className="h-24 w-24 border">
                        <AvatarImage src={student.avatar} alt={student.name} data-ai-hint="student photo" />
                        <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 flex-1">
                        <ProfileDetail label="Admission No" value={student.admissionNo} />
                        <ProfileDetail label="রোল" value={student.roll} />
                        <div className="col-span-2">
                            <ProfileDetail label="পুরো নাম" value={student.name} />
                        </div>
                        <ProfileDetail label="ক্লাস" value={student.class} />
                        <ProfileDetail label="সেকশন" value={student.section} />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold border-b pb-2">ব্যক্তিগত তথ্য</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                        <ProfileDetail label="জন্ম তারিখ" value={student.dob ? format(new Date(student.dob), "PPP", { locale: bn }) : "N/A"} />
                        <ProfileDetail label="লিঙ্গ" value={student.gender} />
                        <ProfileDetail label="ধর্ম" value={student.religion} />
                        <ProfileDetail label="রক্তের গ্রুপ" value={student.bloodGroup} />
                        <ProfileDetail label="জাতীয়তা" value={student.nationality} />
                        <ProfileDetail label="ফোন" value={student.phone} />
                        <div className="col-span-2 md:col-span-4">
                            <ProfileDetail label="ইমেইল" value={student.email} />
                        </div>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <h3 className="font-semibold border-b pb-2">পিতার তথ্য</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                        <ProfileDetail label="নাম" value={student.fatherName} />
                        <ProfileDetail label="ফোন" value={student.fatherPhone} />
                        <ProfileDetail label="পেশা" value={student.fatherOccupation} />
                        <ProfileDetail label="এনআইডি" value={student.fatherNid} />
                    </div>
                </div>
                
                <div className="space-y-4">
                    <h3 className="font-semibold border-b pb-2">মাতার তথ্য</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                        <ProfileDetail label="নাম" value={student.motherName} />
                        <ProfileDetail label="ফোন" value={student.motherPhone} />
                        <ProfileDetail label="পেশা" value={student.motherOccupation} />
                        <ProfileDetail label="এনআইডি" value={student.motherNid} />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold border-b pb-2">স্থায়ী ঠিকানা</h3>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <ProfileDetail label="গ্রাম" value={student.permanentVillage} />
                        <ProfileDetail label="ডাকঘর" value={student.permanentPost} />
                        <ProfileDetail label="উপজেলা" value={student.permanentUpazila} />
                        <ProfileDetail label="জেলা" value={student.permanentDistrict} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold border-b pb-2">বর্তমান ঠিকানা</h3>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <ProfileDetail label="গ্রাম" value={student.presentVillage} />
                        <ProfileDetail label="ডাকঘর" value={student.presentPost} />
                        <ProfileDetail label="উপজেলা" value={student.presentUpazila} />
                        <ProfileDetail label="জেলা" value={student.presentDistrict} />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold border-b pb-2">পূর্ববর্তী একাডেমিক তথ্য</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                         <div className="col-span-1 md:col-span-3">
                           <ProfileDetail label="পূর্ববর্তী স্কুলের নাম এবং ঠিকানা" value={student.previousSchool} />
                        </div>
                        <ProfileDetail label="কোন ক্লাস থেকে উত্তীর্ণ" value={student.previousClass} />
                        <ProfileDetail label="শেষ পরীক্ষার রোল নং" value={student.previousRoll} />
                        <div className="col-span-1 md:col-span-3">
                           <ProfileDetail label="প্রতিষ্ঠানের পরিবর্তনের কারন" value={student.transferReason} />
                        </div>
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

export default StudentProfileView;
