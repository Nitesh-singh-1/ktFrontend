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
    <div className="flex">
      {/* Sidebar */}
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300
        ${isOpen ? "ml-64" : "ml-16"}`}
      >
        <Navbar />

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}