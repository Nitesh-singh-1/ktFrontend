"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserIcon } from "@/app/components/ui/Icons";
import { authService } from "../../../../services/authService";

export default function Navbar() {
  const [user, setUser] = useState<{ fullName?: string; username?: string; role?: string } | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    setUser(authService.getUser());
    setOrgName(authService.getOrganizationName());
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 flex items-center justify-between px-6 lg:px-8 shadow-xs sticky top-0 z-30">
      {/* Left: Platform Title & Active Tenant */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">
              Transport Management System
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-md">
              Enterprise
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Freight & Logistics Dispatch Console
          </p>
        </div>

        {orgName && (
          <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
            <span className="text-sm">🏢</span>
            <span>{orgName}</span>
          </div>
        )}
      </div>

      {/* Right: Quick Action & User Profile */}
      <div className="flex items-center gap-4">
        <Link
          href="/shipments/create"
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
        >
          <span>+</span>
          <span>New Waybill</span>
        </Link>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              {user?.fullName || user?.username || "Nitesh Singh"}
            </p>
            <p className="text-[10px] text-slate-500 font-medium capitalize">
              {user?.role || "Administrator"}
            </p>
          </div>

          <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-slate-100">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "A"}
          </div>
        </div>
      </div>
    </header>
  );
}