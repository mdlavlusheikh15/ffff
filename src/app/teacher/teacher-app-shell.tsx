
import TeacherSidebar from '@/app/teacher/teacher-sidebar';
import AppHeader from '@/components/app-header';
import { Noto_Sans_Bengali } from 'next/font/google'
import { SidebarInset } from '@/components/ui/sidebar';

const noto_sans_bengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-bengali'
})


export default function TeacherAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${noto_sans_bengali.variable} font-body`}>
        <div className="flex min-h-screen w-full bg-background/40" suppressHydrationWarning={true}>
        <TeacherSidebar />
        <div className="flex flex-col flex-1">
            <AppHeader />
            <main className="flex-1 bg-gray-100/50 p-4 md:p-6 lg:p-8">
              {children}
            </main>
        </div>
        </div>
    </div>
  );
}

