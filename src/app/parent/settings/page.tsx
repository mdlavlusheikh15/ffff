
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { User, KeyRound } from "lucide-react";
import Link from "next/link";

const settingsOptions = [
  {
    href: "/parent/profile",
    icon: User,
    title: "আমার প্রোফাইল",
    description: "আপনার ব্যক্তিগত এবং একাডেমিক তথ্য দেখুন।",
  },
  {
    href: "/parent/settings/password",
    icon: KeyRound,
    title: "পাসওয়ার্ড পরিবর্তন",
    description: "আপনার অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করুন।",
  },
];

export default function ParentSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">সেটিংস</h1>
        <p className="text-muted-foreground">
          আপনার প্রোফাইল এবং অ্যাকাউন্ট পছন্দগুলি পরিচালনা করুন।
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {settingsOptions.map((option, index) => (
          <Link key={index} href={option.href} className="[&:nth-child(n+3)]:hidden sm:[&:nth-child(n+3)]:block">
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
