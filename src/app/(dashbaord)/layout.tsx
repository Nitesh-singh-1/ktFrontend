"use client";

import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import { TenantConfigProvider } from "@/context/TenantConfigContext";
import { NavigationProvider } from "@/context/NavigationContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <TenantConfigProvider>
      <NavigationProvider>
        <div className="flex min-h-screen bg-slate-950 text-slate-100">
          {/* Sidebar */}
          <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

          {/* Main Content */}
          <div
            className={`flex-1 flex flex-col transition-all duration-300 min-w-0
            ${isOpen ? "ml-64" : "ml-20"}`}
          >
            <Navbar />

            <main className="p-6 flex-1 overflow-x-hidden">{children}</main>
          </div>
        </div>
      </NavigationProvider>
    </TenantConfigProvider>
  );
}