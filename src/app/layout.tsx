import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import { Noto_Sans_Bengali } from 'next/font/google'
import './globals.css';

const noto_sans_bengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-bengali'
})

export const metadata: Metadata = {
  title: 'ইকরা নূরানী একাডেমী',
  description: 'একটি আধুনিক স্কুল ম্যানেজমেন্ট সিস্টেম',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={noto_sans_bengali.variable}>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
