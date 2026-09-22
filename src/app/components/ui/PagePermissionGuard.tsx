"use client";

import React from "react";
import Link from "next/link";
import { useNavigation } from "@/context/NavigationContext";

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAllowed = hasPermission(permission);

  if (!isAllowed) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center text-3xl">
          🔒
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">
            {moduleName ? `${moduleName} Access Restricted` : "Feature Not Accessible"}
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Your organization subscription or user role does not currently have permission to access this module (
            <code className="text-indigo-400 font-mono text-xs">{permission}</code>).
          </p>
        </div>

        <div className="pt-4 flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-all"
          >
            Return to Dashboard
          </Link>
          <Link
            href="/settings"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30"
          >
            Configure Entitlements
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PagePermissionGuard;
