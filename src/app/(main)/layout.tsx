
import { Toaster } from "@/components/ui/toaster";
import AppHeader from "@/components/app-header";
import {
  ArrowUp,
  Facebook,
  Instagram,
  Mail,
  Phone,
  Twitter,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-white text-gray-800 font-sans">
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm shadow-sm z-50">
        <AppHeader />
      </header>
      <main className="pt-20">{children}</main>
      <footer className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">ইকরা নূরানী একাডেমী</h2>
              <p className="text-sm opacity-80">
                বিশ্বাস লালন, উৎকর্ষে অনুপ্রেরণা।
              </p>
              <div className="flex gap-4 mt-4">
                <Link href="#">
                  <Facebook className="h-5 w-5 hover:opacity-80 transition-opacity" />
                </Link>
                <Link href="#">
                  <Twitter className="h-5 w-5 hover:opacity-80 transition-opacity" />
                </Link>
                <Link href="#">
                  <Instagram className="h-5 w-5 hover:opacity-80 transition-opacity" />
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">দ্রুত লিঙ্ক</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="#"
                    className="opacity-80 hover:opacity-100 transition-opacity"
                  >
                    আমাদের সম্পর্কে
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="opacity-80 hover:opacity-100 transition-opacity"
                  >
                    শিক্ষকমণ্ডলী
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="opacity-80 hover:opacity-100 transition-opacity"
                  >
                    ভর্তি
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="opacity-80 hover:opacity-100 transition-opacity"
                  >
                    যোগাযোগ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">যোগাযোগ</h3>
              <address className="not-italic text-sm space-y-2">
                <p className="opacity-80">
                  ১২৩ শিক্ষা লেন, জ্ঞান নগরী, ১২৩৪৫
                </p>
                <p className="flex items-center gap-2 opacity-80">
                  <Mail className="h-4 w-4" />
                  <span>info@ikranuraniacademy.edu</span>
                </p>
                <p className="flex items-center gap-2 opacity-80">
                  <Phone className="h-4 w-4" />
                  <span>(১২৩) ৪৫০-৭৮৯০</span>
                </p>
              </address>
            </div>
          </div>
        </div>
        <div className="bg-primary/90">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-primary-foreground/80">
            © 2025 ইকরা নূরানী একাডেমী। সর্বস্বত্ব সংরক্ষিত।
          </div>
        </div>
      </footer>
      <Button size="icon" className="fixed bottom-4 right-4 rounded-full shadow-lg">
        <ArrowUp className="h-5 w-5" />
      </Button>
      <Toaster />
    </div>
  );
}

    
