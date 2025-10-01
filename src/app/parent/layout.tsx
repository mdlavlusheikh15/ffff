
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from '@/components/ui/sidebar';
import ParentAppShell from '@/app/parent/parent-app-shell';
import { Noto_Sans_Bengali } from 'next/font/google'
import "@/app/globals.css";

const noto_sans_bengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-bengali'
})

export default function ParentDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${noto_sans_bengali.variable} font-body`}>
        <SidebarProvider>
            <ParentAppShell>
              {children}
            </ParentAppShell>
          <Toaster />
        </SidebarProvider>
    </div>
  );
}
