import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gtxsatria.vercel.app"),
  title:
    "GTX Core - Platform Ujian Online & Evaluasi Cerdas untuk Siswa dan Guru",
  description:
    "GTX Core, platform ujian online & evaluasi cerdas untuk siswa dan guru. Kelola ujian, pantau hasil, dan berikan masukan dengan mudah.",
  keywords: [
    "Ujian Online",
    "Evaluasi Siswa",
    "Guru",
    "Siswa",
    "GTX Core",
    "Pendidikan",
  ],
  authors: [{ name: "GTX Core Team" }],
  openGraph: {
    title:
      "GTX Core - Platform Ujian Online & Evaluasi Cerdas untuk Siswa dan Guru",
    description:
      "Kelola ujian, pantau hasil, dan sampaikan masukan dengan mudah di GTX Core.",
    url: "https://gtxsatria.vercel.app",
    siteName: "GTX Core",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GTX Core - Intelligent Evaluation Platform",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "GTX Core - Platform Ujian Online & Evaluasi Cerdas untuk Siswa dan Guru",
    description:
      "Kelola ujian, pantau hasil, dan sampaikan masukan dengan mudah di GTX Core",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Console warning global
  useEffect(() => {
    setTimeout(() => {
      console.log(
        "%cHold On!",
        "font-size:30px;color:red;font-weight:bold;"
      );
      console.log(
        "Jangan paste kode dari orang lain ke console, akun dan data kamu bisa dicuri."
      );
      console.log("%c*gak usah rese lah :)*", "font-size:16px;color:blue;");
    }, 300);
  }, []);

  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
