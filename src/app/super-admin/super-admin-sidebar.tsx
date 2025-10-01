
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent } from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Users, 
  User,
  HeartHandshake,
  Boxes,
  CalendarDays,
  Calculator,
  BookMarked,
  Book,
  ClipboardList, 
  CalendarCheck, 
  FileText,
  Truck,
  BedDouble,
  FileSpreadsheet,
  MessageSquare,
  BookCopy,
  FileWarning,
  Heart,
  Settings, 
  School,
  ChevronDown,
  Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import React from "react";

const menuItems = [
  { href: "/super-admin/dashboard", icon: LayoutDashboard, label: "ড্যাশবোর্ড" },
  { 
    label: "শিক্ষার্থী", 
    icon: Users,
    subLinks: [
        { href: "/super-admin/students", label: "সকল শিক্ষার্থী" },
        { href: "/super-admin/students/details", label: "শিক্ষার্থীর বিবরণ" },
        { href: "/super-admin/students/add", label: "শিক্ষার্থী যোগ করুন" },
        { href: "/super-admin/students/id-card", label: "আইডি কার্ড" },
    ]
  },
  { 
    label: "অভিভাবক", 
    icon: HeartHandshake,
    subLinks: [
        { href: "/super-admin/parents", label: "সকল অভিভাবক" },
        { href: "/super-admin/parents/add", label: "অভিভাবক যোগ করুন" },
    ]
  },
   { 
    label: "শিক্ষক", 
    icon: User,
    subLinks: [
        { href: "/super-admin/teachers", label: "সকল শিক্ষক" },
        { href: "/super-admin/teachers/add", label: "শিক্ষক যোগ করুন" },
        { href: "/super-admin/teachers/id-card", label: "আইডি কার্ড" },
    ]
  },
  { 
    label: "ইনভেন্টরি", 
    icon: Boxes, 
    subLinks: [
        { href: "/super-admin/inventory/inv-dashboard", label: "ইনভেন্টরি ড্যাশবোর্ড" },
        { href: "/super-admin/inventory", label: "সব মজুদ" },
        { href: "/super-admin/inventory/add", label: "নতুন মজুদ যোগ করুন" },
    ]
  },
  { 
    label: "হিসাব", 
    icon: Calculator,
    subLinks: [
      { href: "/super-admin/accounts/monthly-fee", label: "মাসিক ফি" },
      { href: "/super-admin/accounts/admission-session-fee", label: "ভর্তি এবং সেশন ফি" },
      { href: "/super-admin/accounts/exam-fee", label: "পরীক্ষার ফি" },
      { href: "/super-admin/accounts/expenses", label: "সকল ব্যয়" },
      { href: "/super-admin/accounts/add-expense", label: "ব্যয় যোগ করুন" },
      { href: "/super-admin/accounts/collection", label: "জমা গ্রহন" },
    ]
  },
  { href: "/super-admin/classes", icon: BookMarked, label: "শ্রেণী" },
  { href: "/super-admin/subjects", icon: Book, label: "বিষয়" },
  { href: "/super-admin/routine", icon: ClipboardList, label: "ক্লাস রুটিন" },
  { 
    label: "উপস্থিতি", 
    icon: CalendarCheck,
    subLinks: [
      { href: "/super-admin/attendance/take", label: "উপস্থিতি নিন" },
      { href: "/super-admin/attendance/all", label: "সকল উপস্থিতি" },
      { href: "/super-admin/insights", label: "উপস্থিতির অন্তর্দৃষ্টি" },
    ]
  },
  { 
    label: "পরীক্ষা", 
    icon: FileText, 
    subLinks: [
      { href: "/super-admin/exams/manage", label: "পরীক্ষা পরিচালনা" },
      { href: "/super-admin/exams/results", label: "ফলাফল" },
      { href: "/super-admin/exams/assign-subjects", label: "পরীক্ষার বিষয়" },
      { href: "/super-admin/exams/mark-entry", label: "মার্ক এন্ট্রি" },
      { href: "/super-admin/exams/save-marks", label: "মার্ক সংরক্ষণ করুন" },
      { href: "/super-admin/exams/promotion", label: "প্রমোশন" },
    ]
  },
  { href: "/super-admin/notice", icon: FileSpreadsheet, label: "নোটিশ" },
  { href: "/super-admin/messages", icon: MessageSquare, label: "বার্তা" },
  { href: "/super-admin/homework", icon: BookCopy, label: "বাড়ির কাজ" },
  { href: "/super-admin/complaints", icon: FileWarning, label: "অভিযোগ" },
  { href: "/super-admin/generate", icon: Wand2, label: "Generate" },
  { href: "/super-admin/donations", icon: Heart, label: "দান" },
  { href: "/super-admin/settings", icon: Settings, label: "সেটিংস" },
];

export default function SuperAdminSidebar() {
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
        item.subLinks?.some(sub => pathname.startsWith(sub.href))
      );
      setOpenItem(activeIndex);
    }
  }, [pathname, isMounted]);

  if (!isMounted) {
    return (
       <Sidebar className="border-r" collapsible="icon">
        <SidebarHeader>
          <Link href="/super-admin/dashboard" className="flex items-center gap-2">
            <School className="h-7 w-7 text-primary" />
          </Link>
        </SidebarHeader>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="border-r" collapsible="icon">
      <SidebarHeader>
        <Link href="/super-admin/dashboard" className="flex items-center gap-2">
          <School className="h-7 w-7 text-primary" />
          <span className="font-bold text-lg text-primary group-data-[collapsible=icon]:hidden">সুপার অ্যাডমিন</span>
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
                    isActive={pathname.startsWith(item.href)}
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
