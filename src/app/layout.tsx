import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/animations.css";
import { ToastProvider } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://lunalife.app'),
  title: {
    default: "Luna | Your Natural Rhythm",
    template: "%s | Luna"
  },
  description: "The elegant, private, and intelligent period tracker designed to harmonize with your body. Understand your cycle with Luna.",
  applicationName: "Luna",
  authors: [{ name: "Luna Team" }],
  keywords: ["period tracker", "free period tracker", "period tracker app", "menstrual cycle tracker", "period cycle tracker", "ovulation tracker", "fertile window tracker", "period prediction", "women's health", "cycle tracking"],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Luna",
    title: "Luna | Your Natural Rhythm",
    description: "The elegant, private, and intelligent period tracker designed to harmonize with your body.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Luna | Your Natural Rhythm",
    description: "The elegant, private, and intelligent period tracker designed to harmonize with your body.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
