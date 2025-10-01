
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent } from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Settings, 
  School,
  User,
  Users,
  BookCopy,
  FileText,
  FileSignature,
  Banknote,
  Calendar,
  MessageSquare,
  FileWarning,
  ChevronDown
} from "lucide-react";
import React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/parent/dashboard", icon: LayoutDashboard, label: "ড্যাশবোর্ড" },
  { href: "/parent/children", icon: Users, label: "আমার সন্তান" },
  { href: "/parent/homework", icon: BookCopy, label: "বাড়ির কাজ" },
  { href: "/parent/results", icon: FileText, label: "ফলাফল" },
  { href: "/parent/exam-papers", icon: FileSignature, label: "পরীক্ষার খাতা দেখুন" },
  { href: "/parent/admission-fees", icon: Banknote, label: "ভর্তি ফি" },
  { href: "/parent/monthly-fees", icon: Calendar, label: "মাসিক ফি" },
  { href: "/parent/messages", icon: MessageSquare, label: "বার্তা" },
  { href: "/parent/complaints", icon: FileWarning, label: "অভিযোগ" },
  { 
    label: "সেটিংস",
    icon: Settings,
    subLinks: [
      { href: "/parent/profile", label: "আমার প্রোফাইল" },
      { href: "/parent/settings/password", label: "পাসওয়ার্ড পরিবর্তন" },
    ]
  },
];

export default function ParentSidebar() {
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
          <Link href="/parent/dashboard" className="flex items-center gap-2">
            <School className="h-7 w-7 text-primary" />
          </Link>
        </SidebarHeader>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="border-r" collapsible="icon">
      <SidebarHeader>
        <Link href="/parent/dashboard" className="flex items-center gap-2">
          <School className="h-7 w-7 text-primary" />
          <span className="font-bold text-lg text-primary group-data-[collapsible=icon]:hidden">অভিভাবক প্যানেল</span>
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
