"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useNavigation } from "@/context/NavigationContext";
import { Lock, Shield } from "lucide-react";

interface PagePermissionGuardProps {
  permission: string;
  moduleName?: string;
  children: React.ReactNode;
}

export const PagePermissionGuard: React.FC<PagePermissionGuardProps> = ({
  permission,
  moduleName,
  children,
}) => {
  const { hasPermission, isLoading } = useNavigation();
  const [isSuperUser, setIsSuperUser] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        const r = (u.role || "").toUpperCase();
        setIsSuperUser(r === "SUPER_USER" || r === "ADMIN" || r === "TENANTADMIN" || r === "SUPERADMIN" || r === "TENANT_OWNER");
      }
    } catch {}
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAllowed = hasPermission(permission);

  if (!isAllowed) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 shadow-xs text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 text-xs font-bold uppercase">
            <Shield className="w-3.5 h-3.5" />
            <span>Subscription or Role Protected</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {moduleName ? `${moduleName} Access Restricted` : "Module Access Restricted"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Your current client subscription plan tier or user dedicated page permissions do not grant access to this page (
            <code className="text-sky-700 dark:text-sky-400 font-mono text-xs bg-sky-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">{permission}</code>).
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 text-xs font-bold transition"
          >
            Dashboard
          </Link>
          {isSuperUser && (
            <Link
              href="/settings"
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs"
            >
              Manage Permissions & Plan
            </Link>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PagePermissionGuard;
