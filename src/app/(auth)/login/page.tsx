"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f8fafc] text-slate-800 font-sans">
      {/* Left Column: Enterprise Branding & Feature Highlights */}
      <div className="md:w-1/2 lg:w-7/12 bg-slate-950 text-white relative flex flex-col justify-between p-8 md:p-14 lg:p-20 overflow-hidden">
        {/* Background Ambient Glow & Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.18),rgba(255,255,255,0))] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Top: Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
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
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
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
      <div className="md:w-1/2 lg:w-5/12 flex items-center justify-center p-6 md:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-md">
          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In to Your Account
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Enter your authorized operator credentials to access the transport console.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Username / Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  required
                  placeholder="admin@kesari.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-150"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <a
                  tabIndex={-1}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors"
                  onClick={() => alert("Please contact the administrator to reset your password.")}
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5 animate-shake">
                <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="leading-snug">{error}</div>
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-slate-600">Remember session on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Register / Onboard Organization */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center gap-2">
            <p className="text-xs text-slate-500">
              Need a new workspace for your transport fleet?
            </p>
            <Link
              href="/onboard"
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all duration-150 flex items-center justify-center gap-2 border border-slate-200"
            >
              <span>🏢 Register New Organization</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;