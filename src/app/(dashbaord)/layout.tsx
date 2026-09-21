"use client";

import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar */}
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen bg-slate-50 transition-all duration-300 ease-in-out
        ${isOpen ? "ml-64" : "ml-20"}`}
      >
        <Navbar />

        <main className="flex-1 p-6 lg:p-8 bg-slate-50">{children}</main>
      </div>
    </div>
  );
}