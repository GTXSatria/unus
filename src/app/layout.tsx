import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://gtxsatria.vercel.app'),
  
  title: "GTX Core - Intelligent Evaluation Platform",
  description: "Platform evaluasi cerdas untuk guru dan siswa. Kelola ujian, pantau hasil, dan sampaikan masukan dengan mudah.",
  keywords: ["Intelligent Evaluation", "Ujian Online", "Guru", "Siswa", "GTX Core", "Pendidikan"],
  authors: [{ name: "GTX Core Team" }],
  
  openGraph: {
    title: "GTX Core - Intelligent Evaluation Platform",
    description: "Platform evaluasi cerdas untuk guru dan siswa. Kelola ujian, pantau hasil, dan sampaikan masukan dengan mudah.",
    url: "https://gtxsatria.vercel.app",
    siteName: "GTX Core",
    images: [
      {
        url: '/og-image.jpg', // Pastikan ini adalah og-image baru
        width: 1200,
        height: 630,
        alt: 'GTX Core - Intelligent Evaluation Platform',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: "GTX Core - Intelligent Evaluation Platform",
    description: "Platform evaluasi cerdas untuk guru dan siswa.",
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning><body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>{children}<Toaster /></body></html>
  );
}