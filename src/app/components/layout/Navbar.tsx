// src/components/layout/Navbar.tsx
"use client";

import { UserIcon } from "@/app/components/ui/Icons";

export default function Navbar() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
      <div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-xs text-gray-500 font-medium">Welcome back to K-Transport</p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800">Kundan Kumar</p>
          <p className="text-xs text-gray-500">Administrator</p>
        </div>
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-md ring-2 ring-indigo-100">
          <UserIcon className="w-5 h-5" />
        </div>
      </div>
    </header>
  );
}