import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from '@/components/ui/sidebar';
import SuperAdminAppShell from '@/app/super-admin/super-admin-app-shell';

export default function SuperAdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
        <SuperAdminAppShell>
          {children}
        </SuperAdminAppShell>
      <Toaster />
    </SidebarProvider>
  );
}
