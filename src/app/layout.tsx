import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-ignore: CSS module declarations are handled by the build setup
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ConsoleWarning from "./ConsoleWarning";
import InstallPrompt from "@/components/InstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ujianpintar.vercel.app"),
  title: "SSC - Ujian Online",
  description:
    "Platform evaluasi cerdas untuk guru dan siswa. Kelola ujian, pantau hasil, dan sampaikan masukan dengan mudah.",
  keywords: ["Intelligent Evaluation", "Ujian Online", "Guru", "Siswa", "SSC", "Pendidikan"],
  authors: [{ name: "SSC Team" }],
  icons: {
    icon: "/icon-192x192.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "SSC - Future Education, Today",
    description:
      "Platform evaluasi cerdas untuk guru dan siswa. Kelola ujian, pantau hasil, dan sampaikan masukan dengan mudah.",
    url: "https://ujianpintar.vercel.app",
    siteName: "SSC",
    images: [
      {
        url: "/ssc2.png",
        width: 1200,
        height: 630,
        alt: "SSC - Future Education, Today",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SSC - Future Education, Today",
    description: "Platform evaluasi cerdas untuk guru dan siswa.",
    images: ["/ssc2.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SSC",
  },
};

export const viewport: Viewport = {
  themeColor: "#b4c81e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <ConsoleWarning />
        <InstallPrompt />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW register failed:', err);
                  });
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}