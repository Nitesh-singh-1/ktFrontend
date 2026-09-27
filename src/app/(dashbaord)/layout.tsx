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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ThemeProvider>
      <TenantConfigProvider>
        <NavigationProvider>
          <div className="flex min-h-screen bg-[#F7F8F8] dark:bg-slate-950 text-[#111827] dark:text-slate-100 font-sans antialiased">
            {/* Sidebar (fixed rail on desktop, slide-in drawer on mobile) */}
            <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

            {/* Mobile drawer backdrop */}
            {mobileOpen && (
              <div
                className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-xs md:hidden"
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
              />
            )}

            {/* Main Content Area — no left offset on mobile; follows the rail on desktop */}
            <div
              className={`flex-1 flex flex-col min-h-screen bg-[#F7F8F8] dark:bg-slate-950 transition-all duration-300 ease-in-out min-w-0
              ml-0 ${isOpen ? "md:ml-64" : "md:ml-20"}`}
            >
              <Navbar onMenuClick={() => setMobileOpen(true)} />

              <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#F7F8F8] dark:bg-slate-950 overflow-x-hidden">{children}</main>
            </div>
          </div>
        </NavigationProvider>
      </TenantConfigProvider>
    </ThemeProvider>
  );
}