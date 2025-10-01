
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Settings, FileText, LayoutTemplate, CreditCard, CheckCircle, Smartphone } from "lucide-react";
import Link from "next/link";

const settingsOptions = [
  {
    href: "/super-admin/settings/general",
    icon: Settings,
    title: "সাধারণ সেটিংস",
    description: "প্রতিষ্ঠানের সাধারণ তথ্য এবং কনফিগারেশন।",
  },
  {
    href: "/super-admin/settings/documents",
    icon: FileText,
    title: "ডকুমেন্ট সেটিংস",
    description: "আইডি কার্ড, প্রশংসাপত্র ইত্যাদির জন্য টেমপ্লেট।",
  },
    {
    href: "/super-admin/settings/landing-page",
    icon: LayoutTemplate,
    title: "ল্যান্ডিং পেজ",
    description: "ওয়েবসাইটের প্রথম পাতার কনটেন্ট পরিচালনা করুন।",
  },
  {
    href: "/super-admin/settings/online-payment",
    icon: CreditCard,
    title: "অনলাইন পেমেন্ট",
    description: "অনলাইন পেমেন্ট গেটওয়ে এবং ফি সংক্রান্ত সেটিংস।",
  },
  {
    href: "/super-admin/settings/session",
    icon: CheckCircle,
    title: "সেশন",
    description: "সেশন এবং অন্যান্য একাডেমিক তথ্য পরিচালনা করুন।",
  },
  {
    href: "/super-admin/settings/online",
    icon: Smartphone,
    title: "অনলাইন অনুমোদন",
    description: "শিক্ষক এবং অভিভাবকদের আবেদন অনুমোদন করুন।",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">সেটিংস</h1>
        <p className="text-muted-foreground">
          আপনার প্রতিষ্ঠানের বিভিন্ন দিক পরিচালনা এবং কাস্টমাইজ করুন।
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {settingsOptions.map((option, index) => (
          <Link key={index} href={option.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 gap-4 text-center h-full">
                <div className="p-4 rounded-full bg-green-100 text-green-600">
                  <option.icon className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{option.title}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
