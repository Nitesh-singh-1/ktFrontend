"use client";

import React, { useState, useEffect } from "react";
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
  Check,
  Clock,
} from "lucide-react";
import { authService } from "../../../../services/authService";
import BrandLogo from "@/app/components/ui/BrandLogo";
import LogisticsIllustration from "./components/LogisticsIllustration";

const LoginPage = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  // TASK-039: when the 401 interceptor or heartbeat kicks the user out, we land
  // here with ?reason=session_expired. Surface a soft, dismissible banner above
  // the form so the user understands why.
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reason = new URLSearchParams(window.location.search).get("reason");
    if (reason === "session_expired") setSessionExpired(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && authService.isAuthenticated()) {
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get("redirect");
      if (redirectUrl && redirectUrl.startsWith("/")) {
        window.location.href = redirectUrl.endsWith("/") ? redirectUrl : `${redirectUrl}/`;
      } else {
        window.location.href = "/dashboard/";
      }
    }
  }, []);

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
        const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const redirectUrl = params?.get("redirect");
        if (redirectUrl && redirectUrl.startsWith("/")) {
          window.location.href = redirectUrl.endsWith("/") ? redirectUrl : `${redirectUrl}/`;
        } else {
          window.location.href = "/dashboard/";
        }
      } else {
        setError(res.message || "Invalid credentials. Please check your username and password.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err?.message || "Failed to connect to the authentication server. Please check your network connection."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#FFFFFF] text-[#111827] font-sans box-border lg:overflow-hidden selection:bg-[#3a8890] selection:text-white">
      {/* =========================================================================
          LEFT SECTION: Clean Logistics Authentication Console (50% on Desktop)
          ========================================================================= */}
      <section className="w-full lg:w-1/2 h-full min-h-screen lg:min-h-full p-6 sm:p-10 lg:p-12 xl:p-16 flex flex-col justify-between overflow-y-auto box-border bg-[#FFFFFF]">
        <div className="w-full max-w-md mx-auto my-auto py-2">
          {/* Brand Logo Header */}
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <BrandLogo
              size="md"
              variant="auto"
              accent="teal"
              name="FleetPulse"
              tagline="Enterprise Cloud TMS"
            />
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-[#F7F8F8] border border-[#D9E2E3] text-[11px] font-semibold text-[#6B7280]">
              Logistics OS
            </span>
          </div>

          {/* Heading & Subtitle */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight leading-snug">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1.5 font-normal leading-relaxed">
              Sign in to manage your transportation operations.
            </p>
          </div>

          {/* TASK-039 session-expired banner — amber, soft, dismissible */}
          {sessionExpired && (
            <div
              role="status"
              className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
            >
              <Clock className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
              <div className="flex-1 text-xs sm:text-sm leading-relaxed">
                <span className="font-semibold">Your session expired.</span>{" "}
                Please sign in again to continue.
              </div>
              <button
                type="button"
                aria-label="Dismiss session expired notice"
                onClick={() => setSessionExpired(false)}
                className="text-amber-600 hover:text-amber-800 text-xs font-bold px-1 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Username / Work Email Field */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-[11px] font-bold uppercase tracking-wider text-[#111827] mb-1.5"
              >
                Username / Work Email
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  required
                  placeholder="e.g. admin or dispatch@company.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-[#FFFFFF] border border-[#D9E2E3] rounded-xl text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#3a8890]/30 focus:border-[#3a8890] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#111827]"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#3a8890] hover:text-[#32777e] hover:underline transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 sm:py-3 bg-[#FFFFFF] border border-[#D9E2E3] rounded-xl text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#3a8890]/30 focus:border-[#3a8890] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9CA3AF] hover:text-[#111827] focus:outline-none cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <div className="leading-snug">{error}</div>
              </div>
            )}

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-4 h-4 rounded border border-[#D9E2E3] bg-[#FFFFFF] peer-checked:bg-[#3a8890] peer-checked:border-[#3a8890] peer-focus:ring-2 peer-focus:ring-[#3a8890]/20 transition-all flex items-center justify-center">
                    {rememberMe && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>
                </div>
                <span className="text-xs font-medium text-[#4B5563] group-hover:text-[#111827] transition-colors">
                  Remember session on this device
                </span>
              </label>
            </div>

            {/* Primary Submit Button (Solid Flat #3a8890) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-5 bg-[#3a8890] hover:bg-[#32777e] active:bg-[#2b656b] text-white font-bold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-xs hover:shadow disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Authenticating Workspace...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Operations</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Security & Legal Links */}
        <footer className="w-full max-w-md mx-auto mt-6 pt-4 border-t border-[#D9E2E3] flex items-center justify-between text-[11px] text-[#6B7280]">
          <div className="flex items-center gap-1.5 font-medium text-[#6B7280]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3a8890] shrink-0" />
            <span>256-Bit SSL Workspace</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/terms" className="hover:text-[#111827] transition">
              Terms
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-[#111827] transition">
              Privacy
            </Link>
            <span>•</span>
            <a
              href="mailto:support@fleetpulse.io"
              className="hover:text-[#111827] transition"
            >
              Support
            </a>
          </div>
        </footer>
      </section>

      {/* =========================================================================
          RIGHT SECTION: Full-Height Solid Muted Teal (#3a8890) Visual Panel (50%)
          ========================================================================= */}
      <section className="w-full lg:w-1/2 h-full lg:min-h-full bg-[#3a8890] p-6 sm:p-10 lg:p-12 xl:p-16 relative hidden lg:flex flex-col justify-between overflow-hidden text-white box-border">
        <LogisticsIllustration />
      </section>
    </main>
  );
};

export default LoginPage;