
import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from '@/components/ui/sidebar';
import TeacherAppShell from '@/app/teacher/teacher-app-shell';

export default function TeacherDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
        <TeacherAppShell>
          {children}
        </TeacherAppShell>
      <Toaster />
    </SidebarProvider>
  );
}
