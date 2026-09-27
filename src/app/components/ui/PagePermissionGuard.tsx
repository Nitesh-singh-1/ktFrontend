"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useNavigation } from "@/context/NavigationContext";
import { authService } from "../../../../services/authService";
import { Lock, Shield } from "lucide-react";

interface PagePermissionGuardProps {
  permission: string;
  moduleName?: string;
  // When true, access is restricted to the PLATFORM operator only (e.g. client onboarding / multi-tenant
  // management), regardless of feature permissions. A tenant admin must never pass.
  platformOnly?: boolean;
  children: React.ReactNode;
}

export const PagePermissionGuard: React.FC<PagePermissionGuardProps> = ({
  permission,
  moduleName,
  platformOnly = false,
  children,
}) => {
  const { hasPermission, isLoading } = useNavigation();
  const [isSuperUser, setIsSuperUser] = useState(false);
  // null = still checking; drives the platformOnly gate authoritatively via /me.
  const [isPlatformAdmin, setIsPlatformAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        const r = (u.role || "").toUpperCase();
        setIsSuperUser(r === "SUPER_USER" || r === "ADMIN" || r === "TENANTADMIN" || r === "SUPERADMIN" || r === "TENANT_OWNER");
      }
    } catch {}

    if (platformOnly) {
      authService
        .getMyProfile()
        .then((p) => setIsPlatformAdmin(!!p.isPlatformAdmin))
        .catch(() => setIsPlatformAdmin(false));
    }
  }, [platformOnly]);

  if (isLoading || (platformOnly && isPlatformAdmin === null)) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-3 border-[#2F8E86] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAllowed = platformOnly ? isPlatformAdmin === true : hasPermission(permission);

  if (!isAllowed) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 shadow-xs text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#E7F1F2] dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 flex items-center justify-center text-[#2F8E86]">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[#B76E32] text-xs font-bold uppercase">
            <Shield className="w-3.5 h-3.5" />
            <span>Subscription or Role Protected</span>
          </div>
          <h2 className="text-xl font-bold text-[#111827] dark:text-white">
            {moduleName ? `${moduleName} Access Restricted` : "Module Access Restricted"}
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 max-w-md mx-auto">
            Your current client subscription plan tier or user dedicated page permissions do not grant access to this page (
            <code className="text-[#25776F] font-mono text-xs bg-[#E7F1F2] dark:bg-slate-800 px-1.5 py-0.5 rounded">{permission}</code>).
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="btn-secondary"
          >
            Dashboard
          </Link>
          {isSuperUser && (
            <Link
              href="/settings"
              className="btn-primary"
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
