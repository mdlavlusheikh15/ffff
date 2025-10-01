
"use server";

import { collection, addDoc, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase";
import Papa from "papaparse";

const db = getFirestore(app);

const generateAdmissionNo = () => {
    return `ADMS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

const generateRollNo = () => {
    return Math.floor(1 + Math.random() * 100);
}

// Maps various possible CSV header names to our consistent database fields.
const headerMappings: { [key: string]: keyof import('@/lib/data').Student } = {
    'admissionno': 'admissionNo', 'admission no': 'admissionNo', 'ভর্তি নম্বর': 'admissionNo',
    'name': 'name', 'student name': 'name', 'শিক্ষার্থীর নাম': 'name',
    'class': 'class', 'শ্রেণী': 'class',
    'section': 'section', 'শাখা': 'section',
    'roll': 'roll', 'রোল': 'roll',
    'fathername': 'fatherName', 'father\'s name': 'fatherName', 'বাবার নাম': 'fatherName',
    'phone': 'phone', 'mobile': 'phone', 'ফোন': 'phone', 'মোবাইল': 'phone',
    'avatar': 'avatar', 'photo': 'avatar', 'ছবি': 'avatar',
    'dob': 'dob', 'date of birth': 'dob', 'জন্ম তারিখ': 'dob',
    'gender': 'gender', 'লিঙ্গ': 'gender',
    'religion': 'religion', 'ধর্ম': 'religion',
    'bloodgroup': 'bloodGroup', 'blood group': 'bloodGroup', 'রক্তের গ্রুপ': 'bloodGroup',
    'nationality': 'nationality', 'জাতীয়তা': 'nationality',
    'email': 'email', 'ইমেইল': 'email',
    'fatherphone': 'fatherPhone', 'father phone': 'fatherPhone', 'বাবার ফোন': 'fatherPhone',
    'fatheroccupation': 'fatherOccupation', 'father\'s occupation': 'fatherOccupation', 'বাবার পেশা': 'fatherOccupation',
    'fathernid': 'fatherNid', 'father nid': 'fatherNid', 'বাবার এনআইডি': 'fatherNid',
    'mothername': 'motherName', 'mother\'s name': 'motherName', 'মায়ের নাম': 'motherName',
    'motherphone': 'motherPhone', 'mother phone': 'motherPhone', 'মায়ের ফোন': 'motherPhone',
    'motheroccupation': 'motherOccupation', 'mother\'s occupation': 'motherOccupation', 'মায়ের পেশা': 'motherOccupation',
    'mothernid': 'motherNid', 'mother nid': 'motherNid', 'মায়ের এনআইডি': 'motherNid',
    'permanentvillage': 'permanentVillage', 'permanent village': 'permanentVillage', 'স্থায়ী গ্রাম': 'permanentVillage',
    'permanentpost': 'permanentPost', 'permanent post': 'permanentPost', 'স্থায়ী ডাকঘর': 'permanentPost',
    'permanentupazila': 'permanentUpazila', 'permanent upazila': 'permanentUpazila', 'স্থায়ী উপজেলা': 'permanentUpazila',
    'permanentdistrict': 'permanentDistrict', 'permanent district': 'permanentDistrict', 'স্থায়ী জেলা': 'permanentDistrict',
    'presentvillage': 'presentVillage', 'present village': 'presentVillage', 'বর্তমান গ্রাম': 'presentVillage',
    'presentpost': 'presentPost', 'present post': 'presentPost', 'বর্তমান ডাকঘর': 'presentPost',
    'presentupazila': 'presentUpazila', 'present upazila': 'presentUpazila', 'বর্তমান উপজেলা': 'presentUpazila',
    'presentdistrict': 'presentDistrict', 'present district': 'presentDistrict', 'বর্তমান জেলা': 'presentDistrict',
};


export async function importStudentsFromCSV(csvData: string) {
    try {
        const results = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
        });

        if (results.errors.length > 0) {
            console.error("CSV Parsing errors:", results.errors);
            return { success: false, message: `CSV ফাইল পার্স করতে সমস্যা হয়েছে: ${results.errors[0].message}` };
        }

        const studentsCollection = collection(db, "students");
        let successfulImports = 0;
        const importErrors: string[] = [];

        for (const [index, row] of (results.data as any[]).entries()) {
            const studentData: { [key: string]: any } = {};
            
            // Normalize headers and map to studentData
            for (const rawHeader in row) {
                const normalizedHeader = rawHeader.toLowerCase().trim();
                const dbField = headerMappings[normalizedHeader];
                if (dbField) {
                    studentData[dbField] = row[rawHeader]?.trim();
                }
            }

            if (!studentData["name"]) {
                importErrors.push(`সারি ${index + 2}: শিক্ষার্থীর নাম পাওয়া যায়নি।`);
                continue;
            }

            // Ensure correct data types and generate defaults
            studentData.roll = Number(studentData.roll) || generateRollNo();
            studentData.admissionNo = studentData.admissionNo || generateAdmissionNo();
            studentData.avatar = studentData.avatar || `https://picsum.photos/seed/${encodeURIComponent(studentData.name)}/80/80`;
            
            try {
                await addDoc(studentsCollection, studentData);
                successfulImports++;
            } catch (dbError) {
                 console.error(`Error importing row ${index + 2}:`, dbError);
                 importErrors.push(`সারি ${index + 2} (${studentData.name}): ডাটাবেসে যোগ করতে সমস্যা হয়েছে।`);
            }
        }

        if (importErrors.length > 0) {
            return { success: false, message: `সফলভাবে ${successfulImports} জন শিক্ষার্থীকে আমদানি করা হয়েছে। ${importErrors.length} টি সারিতে ত্রুটি ছিল: ${importErrors.join(', ')}` };
        }

        return { success: true, message: `সফলভাবে ${successfulImports} জন শিক্ষার্থীকে আমদানি করা হয়েছে।` };

    } catch (error) {
        console.error("Error importing students from CSV:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `আমদানি করতে গিয়ে একটি ত্রুটি হয়েছে: ${errorMessage}` };
    }
}
