"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Truck,
  FileSpreadsheet,
  Layers,
  Search,
  Sparkles,
  Building2,
  CheckCircle2,
  Sun,
  Moon,
  LifeBuoy
} from "lucide-react";
import { authService } from "../../../../services/authService";
import BrandLogo from "@/app/components/ui/BrandLogo";
import { useTheme } from "@/context/ThemeContext";

const LoginPage = () => {
  const router = useRouter();
  const themeContext = useTheme();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await authService.login({ username: username.trim(), password });

      if (res.success) {
        localStorage.setItem("isLoggedIn", "true");
        router.push("/dashboard");
      } else {
        setError(res.message || "Invalid credentials. Please check your username and password.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message || "Failed to connect to the authentication server. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleAutofillDemo = (role: "admin" | "operator" | "accounts") => {
    if (role === "admin") {
      setUsername("admin");
      setPassword("Admin@123");
    } else if (role === "operator") {
      setUsername("dispatch_lead");
      setPassword("Dispatch@123");
    } else {
      setUsername("accounts_manager");
      setPassword("Accounts@123");
    }
    setError("");
  };

  const toggleTheme = () => {
    if (themeContext) {
      themeContext.setTheme(themeContext.isDark ? "light-blue" : "dark-blue");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Left Column: Enterprise Platform Hero Showcase */}
      <div className="lg:w-7/12 bg-slate-950 text-white relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
        {/* Ambient Gradient Glow and Geometric Dot Matrix */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415515_1px,transparent_1px),linear-gradient(to_bottom,#33415515_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Top Header: SaaS Platform Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <BrandLogo size="lg" variant="light" name="FleetPulse" tagline="Enterprise Cloud TMS" />

          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 backdrop-blur-md shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SaaS Cloud Core Online</span>
          </div>
        </div>

        {/* Middle Body: Value Proposition & Feature Capabilities */}
        <div className="relative z-10 my-auto py-10 lg:py-14 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-950/60 border border-sky-800/50 text-xs font-semibold text-sky-300 mb-6 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Multi-Tenant Logistics Operating System</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12] text-white">
            Freight & Fleet Operations,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400">
              Streamlined at Scale.
            </span>
          </h1>

          <p className="mt-4 sm:mt-5 text-sm sm:text-base text-slate-300/90 leading-relaxed font-normal max-w-xl">
            Empower your transport enterprise with end-to-end B2B consignment tracking, automated GST billing, multi-hub manifest dispatch, and real-time revenue analytics.
          </p>

          {/* 4 Feature Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8 sm:mt-10">
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-sm hover:border-sky-500/40 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-2.5 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="text-sm font-bold text-white tracking-tight">Digital Consignments (GR/LR)</div>
              <p className="text-xs text-slate-400 mt-1 font-medium leading-normal">
                Rapid waybill entry with auto party lookup, E-way bill validation, and instant multi-copy receipts.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-sm hover:border-blue-500/40 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-2.5 group-hover:scale-105 transition-transform">
                <Truck className="w-4 h-4" />
              </div>
              <div className="text-sm font-bold text-white tracking-tight">Trip & Manifest Dispatch</div>
              <p className="text-xs text-slate-400 mt-1 font-medium leading-normal">
                Intelligent vehicle capacity utilization, driver cash advances, and multi-hub route handoffs.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-sm hover:border-indigo-500/40 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2.5 group-hover:scale-105 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-sm font-bold text-white tracking-tight">Automated GST & Invoicing</div>
              <p className="text-xs text-slate-400 mt-1 font-medium leading-normal">
                Batch invoice generation, money receipt vouchers, and integrated party ledger reconciliation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-sm hover:border-emerald-500/40 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2.5 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-sm font-bold text-white tracking-tight">Enterprise Multi-Tenancy</div>
              <p className="text-xs text-slate-400 mt-1 font-medium leading-normal">
                Secure tenant isolation, role-based access control (RBAC), and custom sequence numbering.
              </p>
            </div>
          </div>

          {/* Quick Platform Metrics */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-10 pt-8 mt-8 border-t border-slate-800/90">
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">99.99%</div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">Uptime SLA</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">₹500Cr+</div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">Freight Managed</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">100%</div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">GST Compliant</div>
            </div>
          </div>
        </div>

        {/* Bottom Platform Footer */}
        <div className="relative z-10 flex flex-wrap items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-900 gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>256-Bit SSL Encrypted Enterprise Workspace</span>
          </div>
          <span className="font-mono text-[11px]">Platform Edition v2.6.4</span>
        </div>
      </div>

      {/* Right Column: Modern Authentication Console */}
      <div className="lg:w-5/12 flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-white dark:bg-slate-900 transition-colors">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between w-full mb-6">
          <Link
            href="/tracking"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Track Consignment</span>
          </Link>

          <div className="flex items-center gap-2">
            {themeContext && (
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                title={themeContext.isDark ? "Switch to light mode" : "Switch to dark mode"}
                aria-label="Toggle theme"
              >
                {themeContext.isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Center Auth Card */}
        <div className="w-full max-w-md mx-auto my-auto py-4">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Sign In to Workspace
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Enter your enterprise credentials to access your transport operations console.
            </p>
          </div>

          {/* Quick Demo Credentials Helper */}
          <div className="mb-6 p-3.5 rounded-xl bg-sky-50/70 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Quick Role Autofill
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Instant Test</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleAutofillDemo("admin")}
                className="py-1.5 px-2 bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs transition text-center cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleAutofillDemo("operator")}
                className="py-1.5 px-2 bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs transition text-center cursor-pointer"
              >
                Dispatch
              </button>
              <button
                type="button"
                onClick={() => handleAutofillDemo("accounts")}
                className="py-1.5 px-2 bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs transition text-center cursor-pointer"
              >
                Accounts
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Username or Work Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="admin or operator@company.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <div className="leading-snug">{error}</div>
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Remember session on this device
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 active:from-sky-700 active:to-blue-700 text-white font-bold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 hover:shadow-lg hover:shadow-sky-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Authenticating Workspace...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>


        </div>

        {/* Footer Support & Legal */}
        <div className="text-center pt-4 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-4">
          <Link href="/terms" className="hover:text-slate-700 dark:hover:text-slate-300 transition">
            Terms of Service
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-slate-700 dark:hover:text-slate-300 transition">
            Privacy Policy
          </Link>
          <span>•</span>
          <a
            href="mailto:support@fleetpulse.io"
            className="hover:text-slate-700 dark:hover:text-slate-300 transition inline-flex items-center gap-1"
          >
            <LifeBuoy className="w-3 h-3" />
            Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;