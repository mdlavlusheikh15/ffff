
"use client"

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StudentsList from '@/components/students-list';
import FeeCollectionDialog from '@/components/fee-collection-dialog';
import { Student } from '@/lib/data';

export default function ExamFeePage() {
    const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
    const [isFeeModalOpen, setIsFeeModalOpen] = React.useState(false);

    const handleCollectFee = (student: Student) => {
        setSelectedStudent(student);
        setIsFeeModalOpen(true);
    };

    const handleModalClose = () => {
        setIsFeeModalOpen(false);
        setSelectedStudent(null);
    };

  return (
    <>
        <Card>
            <CardHeader>
                <CardTitle>পরীক্ষার ফি সংগ্রহ</CardTitle>
                <CardDescription>
                    তালিকা থেকে একজন শিক্ষার্থী নির্বাচন করে পরীক্ষার ফি সংগ্রহ করুন।
                </CardDescription>
            </CardHeader>
            <CardContent>
                <StudentsList
                    showImportExport={false}
                    actionColumn={{
                        header: "ফি সংগ্রহ",
                        cell: (student) => (
                            <Button variant="outline" size="sm" onClick={() => handleCollectFee(student)}>
                                সংগ্রহ করুন
                            </Button>
                        )
                    }}
                />
            </CardContent>
        </Card>
        {selectedStudent && (
            <FeeCollectionDialog
                isOpen={isFeeModalOpen}
                onClose={handleModalClose}
                student={selectedStudent}
                defaultTab="exam"
                showTabs={false}
            />
        )}
    </>
  );
}
