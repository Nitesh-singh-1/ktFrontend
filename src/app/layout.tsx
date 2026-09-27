import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import UpdateNotification from "./components/layout/UpdateNotification";
import BuildExpiryGuard from "./components/layout/BuildExpiryGuard";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FleetPulse TMS - Multi-Tenant Transport & Logistics SaaS Platform",
  description: "Enterprise multi-tenant cloud platform for logistics, freight operations, consignment tracking, automated GST billing, and fleet intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col antialiased`}>
        <ThemeProvider>
          <ToastProvider>
            <BuildExpiryGuard>
              {children}
            </BuildExpiryGuard>
            <UpdateNotification />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
