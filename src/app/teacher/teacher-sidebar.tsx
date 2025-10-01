
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent } from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  ClipboardList, 
  CalendarCheck, 
  User,
  Users,
  Book,
  FilePenLine,
  School,
  BookCopy,
  ChevronDown,
  Settings,
  Wand2,
  Calculator,
  Notebook
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import React from "react";

const menuItems = [
  { href: "/teacher/dashboard", icon: LayoutDashboard, label: "ড্যাশবোর্ড" },
  { 
    label: "শিক্ষার্থী", 
    icon: Users,
    subLinks: [
        { href: "/teacher/dashboard/students", label: "সকল শিক্ষার্থী" },
        { href: "/teacher/dashboard/students/add", label: "শিক্ষার্থী যোগ করুন" },
    ]
  },
  { 
    label: "শিক্ষক", 
    icon: User,
    subLinks: [
        { href: "/teacher/dashboard/teachers", label: "সকল শিক্ষক" },
    ]
  },
  { href: "/teacher/dashboard/routine", icon: ClipboardList, label: "ক্লাস রুটিন" },
  { href: "/teacher/dashboard/subjects", icon: Book, label: "বিষয়" },
  { href: "/teacher/dashboard/homework", icon: BookCopy, label: "বাড়ির কাজ" },
  { 
    label: "মার্ক এন্ট্রি", 
    icon: FilePenLine,
    subLinks: [
      { href: "/teacher/dashboard/mark-entry", label: "মার্ক এন্ট্রি" },
    ]
   },
  { href: "/teacher/dashboard/generate/notebook", icon: Notebook, label: "পরিক্ষার খাতা" },
  { 
    label: "হাজিরা", 
    icon: CalendarCheck,
    subLinks: [
      { href: "/teacher/dashboard/attendance/take", label: "উপস্থিতি নিন" },
      { href: "/teacher/dashboard/attendance/all", label: "সকল উপস্থিতি" },
    ]
  },
  {
    label: "হিসাব",
    icon: Calculator,
    subLinks: [
      { href: "/teacher/dashboard/accounts/monthly-fee", label: "মাসিক ফি" },
      { href: "/teacher/dashboard/accounts/admission-session-fee", label: "ভর্তি এবং সেশন ফি" },
      { href: "/teacher/dashboard/accounts/exam-fee", label: "পরীক্ষার ফি" },
      { href: "/teacher/dashboard/accounts/collection", label: "জমা দিন" },
    ]
  },
  {
    label: "সেটিংস",
    icon: Settings,
    subLinks: [
      { href: "/teacher/dashboard/settings/profile", label: "আমার প্রোফাইল" },
      { href: "/teacher/dashboard/settings/password", label: "পাসওয়ার্ড পরিবর্তন" },
    ]
  },
];

export default function TeacherSidebar() {
  const pathname = usePathname();
  const [openItem, setOpenItem] = React.useState(-1);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (isMounted) {
      const activeIndex = menuItems.findIndex(item => 
        (item.href && pathname.startsWith(item.href)) ||
        (item.subLinks && item.subLinks.some(sub => pathname.startsWith(sub.href)))
      );
      setOpenItem(activeIndex);
    }
  }, [pathname, isMounted]);

  if (!isMounted) {
    return (
       <Sidebar className="border-r" collapsible="icon">
        <SidebarHeader>
          <Link href="/teacher/dashboard" className="flex items-center gap-2">
            <School className="h-7 w-7 text-primary" />
          </Link>
        </SidebarHeader>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="border-r" collapsible="icon">
      <SidebarHeader>
        <Link href="/teacher/dashboard" className="flex items-center gap-2">
          <School className="h-7 w-7 text-primary" />
          <span className="font-bold text-lg text-primary group-data-[collapsible=icon]:hidden">শিক্ষক প্যানেল</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="flex-1 p-2 gap-0">
          {menuItems.map((item, index) => (
            item.subLinks ? (
              <Collapsible key={item.label} open={openItem === index} onOpenChange={() => setOpenItem(openItem === index ? -1 : index)}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                        tooltip={item.label}
                        className="justify-between"
                        isActive={item.subLinks.some(sub => pathname.startsWith(sub.href))}
                    >
                        <div className="flex items-center gap-2">
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                    <ul className="pl-8 pt-1 space-y-1">
                        {item.subLinks.map(subLink => (
                            <li key={subLink.href}>
                              <Link href={subLink.href}>
                                <SidebarMenuButton
                                    variant="ghost"
                                    className={cn("w-full justify-start", pathname === subLink.href && "bg-accent text-accent-foreground")}
                                >
                                  {subLink.label}
                                </SidebarMenuButton>
                              </Link>
                            </li>
                        ))}
                    </ul>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
