"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion, Award, Users, Notebook } from "lucide-react";
import Link from "next/link";

const createOptions = [
  {
    href: "/super-admin/generate/testimonial",
    icon: Award,
    title: "প্রশংসাপত্র",
    description: "শিক্ষার্থীর জন্য প্রশংসাপত্র তৈরি করুন।",
  },
  {
    href: "/super-admin/generate/seat-plan",
    icon: Users,
    title: "সিট প্ল্যান",
    description: "পরীক্ষার জন্য সিট প্ল্যান তৈরি করুন।",
  },
    {
    href: "/super-admin/generate/question-paper",
    icon: FileQuestion,
    title: "প্রশ্ন",
    description: "সকল পরিক্ষার প্রশ্ন",
  },
  {
    href: "/super-admin/generate/notebook",
    icon: Notebook,
    title: "পরিক্ষার খাতা",
    description: "পরিক্ষার খাতা",
  },
];

export default function GeneratePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">তৈরি করুন</h1>
        <p className="text-muted-foreground">
          প্রয়োজনীয় ডকুমেন্ট তৈরি করতে একটি অপশন নির্বাচন করুন।
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {createOptions.map((option, index) => (
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
