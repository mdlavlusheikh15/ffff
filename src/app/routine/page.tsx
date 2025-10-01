
"use client"

import * as React from "react";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const routineData = {
  sunday: [
    { subject: "Bangla", teacher: "Md Lavlu Sheikh", time: "09:00 - 09:35", room: "101" },
    { subject: "আরবি", teacher: "Md Lavlu Sheikh", time: "09:35 - 10:10", room: "101" },
  ],
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
};

const daysOfWeek = [
  { key: "sunday", label: "রবিবার" },
  { key: "monday", label: "সোমবার" },
  { key: "tuesday", label: "মঙ্গলবার" },
  { key: "wednesday", label: "বুধবার" },
  { key: "thursday", label: "বৃহস্পতিবার" },
  { key: "friday", label: "শুক্রবার" },
  { key: "saturday", label: "শনিবার" },
];

export default function RoutinePage() {
  return (
    <div className="space-y-6">
       <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>শ্রেণী রুটিন</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center gap-4">
                    <Select defaultValue="nurani-play">
                        <SelectTrigger className="w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="nurani-play">Nurani Play</SelectItem>
                            <SelectItem value="nurani-narsari">Nurani Narsari</SelectItem>
                        </SelectContent>
                    </Select>
                     <Select defaultValue="a">
                        <SelectTrigger className="w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="a">A</SelectItem>
                            <SelectItem value="b">B</SelectItem>
                        </SelectContent>
                    </Select>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-green-600 hover:bg-green-700">
                                <Plus className="mr-2 h-4 w-4" />
                                রুটিন যোগ করুন
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>নতুন রুটিন যোগ করুন</DialogTitle>
                                <DialogDescription>
                                    ক্লাস রুটিন এন্ট্রির জন্য বিবরণ পূরণ করুন।
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="day">দিন**</Label>
                                    <Select>
                                        <SelectTrigger id="day">
                                            <SelectValue placeholder="দিন নির্বাচন করুন" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {daysOfWeek.map(day => (
                                                <SelectItem key={day.key} value={day.key}>{day.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">বিষয়**</Label>
                                    <Select>
                                        <SelectTrigger id="subject">
                                            <SelectValue placeholder="বিষয় নির্বাচন করুন" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bangla">Bangla</SelectItem>
                                            <SelectItem value="arbi">আরবি</SelectItem>
                                            <SelectItem value="math">Mathematics</SelectItem>
                                            <SelectItem value="english">English</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="teacher">শিক্ষক**</Label>
                                    <Select>
                                        <SelectTrigger id="teacher">
                                            <SelectValue placeholder="শিক্ষক নির্বাচন করুন" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="lavlu">Md Lavlu Sheikh</SelectItem>
                                            <SelectItem value="ahmed">আহমেদ হোসেন</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="start-time">শুরুর সময়**</Label>
                                    <div className="relative">
                                        <Input id="start-time" type="time" className="pr-8" />
                                        <Clock className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="end-time">শেষ সময়**</Label>
                                     <div className="relative">
                                        <Input id="end-time" type="time" className="pr-8" />
                                        <Clock className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="room">রুম নম্বর</Label>
                                    <Input id="room" placeholder="যেমন, ১০১" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline">বাতিল করুন</Button>
                                <Button type="submit" className="bg-green-600 hover:bg-green-700">সংরক্ষণ করুন</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
      
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 border rounded-lg overflow-hidden">
            {daysOfWeek.map(day => (
                 <div key={day.key} className="border-l">
                    <h3 className="text-center font-semibold p-2 border-b bg-muted/30">{day.label}</h3>
                    <div className="p-2 space-y-2 min-h-[100px]">
                        {(routineData[day.key as keyof typeof routineData]).length > 0 ? (
                            (routineData[day.key as keyof typeof routineData]).map((entry, index) => (
                                <Card key={index} className="bg-green-50/50 border-green-200">
                                    <CardContent className="p-3 text-xs space-y-1">
                                        <p className="font-bold text-sm">{entry.subject}</p>
                                        <p>{entry.teacher}</p>
                                        <p>{entry.time}</p>
                                        <p>রুম: {entry.room}</p>
                                        <div className="flex justify-end gap-1 pt-1">
                                            <Button variant="outline" size="icon" className="h-6 w-6">
                                                <Pencil className="h-3 w-3"/>
                                            </Button>
                                             <Button variant="destructive" size="icon" className="h-6 w-6">
                                                <Trash2 className="h-3 w-3"/>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm pt-8">
                                কোনো এন্ট্রি নেই
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
