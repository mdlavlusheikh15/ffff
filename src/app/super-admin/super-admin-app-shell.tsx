import SuperAdminSidebar from '@/app/super-admin/super-admin-sidebar';
import AppHeader from '@/components/app-header';

export default function SuperAdminAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background/40" suppressHydrationWarning={true}>
      <SuperAdminSidebar />
      <div className="flex flex-col flex-1">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
