"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, User, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { authService } from "../../../../services/authService";

const LoginPage = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
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
      setError(err?.message || "Failed to connect to the server. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      {/* Left Column: Enterprise Branding & Feature Highlights */}
      <div className="md:w-1/2 lg:w-7/12 bg-slate-950 text-white relative flex flex-col justify-between p-8 md:p-14 lg:p-20 overflow-hidden">
        {/* Background Ambient Glow & Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.18),rgba(255,255,255,0))] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Top: Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-600 p-0.5 shadow-xs flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center font-black text-xl text-sky-400">
                KT
              </div>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white block">
                KESARI TRANSPORTS
              </span>
              <span className="text-xs font-semibold tracking-wider text-sky-400 uppercase">
                Fleet Management Platform
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Value Proposition */}
        <div className="relative z-10 my-auto py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300 mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Enterprise Cloud System Online
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
            Logistics & Freight,{" "}
            <span className="text-sky-400">
              Engineered for Speed.
            </span>
          </h1>

          <p className="mt-5 text-base md:text-lg text-slate-400 max-w-lg leading-relaxed">
            Manage comprehensive Goods Receipts (GR), trip challans, billing lifecycle, and real-time revenue analytics across your entire transportation fleet.
          </p>

          {/* Quick Metrics / Capabilities */}
          <div className="grid grid-cols-2 gap-4 mt-10 max-w-lg">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-2xl font-black text-white">Instant GR</div>
              <p className="text-xs text-slate-400 mt-1 font-medium">Auto GST computation & 1-click printable receipts</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-2xl font-black text-white">Live Tracking</div>
              <p className="text-xs text-slate-400 mt-1 font-medium">Integrated challan and consignment status pipeline</p>
            </div>
          </div>
        </div>

        {/* Bottom: Version & Security Notice */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-6 border-t border-slate-900">
          <span>Enterprise Edition v1.0.0</span>
          <span>End-to-End Encrypted Session</span>
        </div>
      </div>

      {/* Right Column: Modern Authentication Form */}
      <div className="md:w-1/2 lg:w-5/12 flex items-center justify-center p-6 md:p-12 lg:p-16 bg-white dark:bg-slate-900">
        <div className="w-full max-w-md">
          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Sign In to Your Account
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Enter your authorized operator credentials to access the transport console.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Username / Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="admin@kesari.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-150"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <a
                  tabIndex={-1}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer transition-colors"
                  onClick={() => alert("Please contact the administrator to reset your password.")}
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-11 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div className="leading-snug">{error}</div>
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Remember session on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 active:bg-slate-950 text-white font-bold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Register / Onboard Organization */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Need a new workspace for your transport fleet?
            </p>
            <Link
              href="/onboard"
              className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition-all duration-150 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
            >
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Register New Organization</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;