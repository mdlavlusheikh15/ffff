
import ParentSidebar from '@/app/parent/parent-sidebar';
import AppHeader from '@/components/app-header';
import { SidebarInset } from '@/components/ui/sidebar';

export default function ParentAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background/40" suppressHydrationWarning={true}>
      <ParentSidebar />
      <SidebarInset>
        <div className="flex flex-col flex-1">
            <AppHeader />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              {children}
            </main>
        </div>
      </SidebarInset>
    </div>
  );
}
