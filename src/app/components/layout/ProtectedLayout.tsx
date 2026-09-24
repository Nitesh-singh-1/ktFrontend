"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { ShieldAlert, Lock } from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string>("SUB_USER");
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    const token = localStorage.getItem("token");

    if (!loggedIn || !token) {
      router.push("/login");
      return;
    }

    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUserRole(parsed.role || "SUB_USER");
      }
    } catch {
      setUserRole("SUB_USER");
    }

    setIsAuth(true);
  }, [router]);

  if (isAuth === null) return null;

  const isSuperUser = 
    userRole.toUpperCase() === "SUPER_USER" ||
    userRole.toUpperCase() === "ADMIN" ||
    userRole.toUpperCase() === "TENANTADMIN" ||
    userRole.toUpperCase() === "SUPERADMIN" ||
    userRole.toUpperCase() === "TENANT_OWNER";

  // Check if current route is restricted to Super User
  const isSaaSConfigRoute = 
    pathname?.startsWith("/settings") || 
    pathname?.startsWith("/clients") || 
    pathname?.startsWith("/onboard");

  const isRestrictedForSubUser = isSaaSConfigRoute && !isSuperUser;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div
        className={`flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-all duration-300 ease-in-out
        ${isOpen ? "ml-64" : "ml-20"}`}
      >
        <Navbar />

        <main className="flex-1 p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
          {isRestrictedForSubUser ? (
            <div className="max-w-2xl mx-auto my-16 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 shadow-xs text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Super User Restricted Area</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Access Denied
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  SaaS Configuration, Subscription Management, and Tenant Settings are strictly restricted to Organization Super Users / Tenant Owners.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center">
                <Link
                  href="/dashboard"
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}