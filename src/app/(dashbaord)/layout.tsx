"use client";

import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import { TenantConfigProvider } from "@/context/TenantConfigContext";
import { NavigationProvider } from "@/context/NavigationContext";
import { ThemeProvider } from "@/context/ThemeContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <ThemeProvider>
      <TenantConfigProvider>
        <NavigationProvider>
          <div className="flex min-h-screen bg-[#f0f7ff] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
            {/* Sidebar */}
            <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

            {/* Main Content Area */}
            <div
              className={`flex-1 flex flex-col min-h-screen bg-[#f0f7ff] dark:bg-slate-950 transition-all duration-300 ease-in-out min-w-0
              ${isOpen ? "ml-64" : "ml-20"}`}
            >
              <Navbar />

              <main className="flex-1 p-6 lg:p-8 bg-[#f0f7ff] dark:bg-slate-950 overflow-x-hidden">{children}</main>
            </div>
          </div>
        </NavigationProvider>
      </TenantConfigProvider>
    </ThemeProvider>
  );
}