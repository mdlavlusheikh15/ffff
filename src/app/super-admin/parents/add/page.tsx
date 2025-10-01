
"use client"
import AddStudentPage from "@/app/super-admin/students/add/page";

export default function AddParentPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Add Parent</h1>
            <p className="mb-4 text-muted-foreground">
                To add a parent, please add a new student and fill in the parent's information in the student's form. The parent's account will be linked to the student.
            </p>
            <AddStudentPage />
        </div>
    );
}
