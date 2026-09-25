"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { authService } from "../../../../services/authService";
import BrandLogo from "@/app/components/ui/BrandLogo";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Wizard Step: 1 = Request OTP, 2 = Verify Code & Set Password
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // State Management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedOtpHint, setGeneratedOtpHint] = useState<string | null>(null);

  // Resend Countdown Timer (in seconds)
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Handle Step 1: Request OTP / Verification Code
  const handleRequestCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim() || !mobile.trim()) {
      setError("Please provide both your account username and registered mobile number.");
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, "");
    if (cleanMobile.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setLoading(true);
      const res = await authService.requestPasswordResetCode({
        username: username.trim(),
        mobile: cleanMobile,
      });

      if (res.success) {
        setStep(2);
        setResendCooldown(60); // 60-second cooldown
        if (res.verificationCode) {
          setGeneratedOtpHint(res.verificationCode);
        }
        setSuccess(res.message || "Verification code dispatched successfully!");
      } else {
        setError(res.message || "No matching account found with the given username and mobile.");
      }
    } catch (err: any) {
      console.error("Request reset code error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to request verification code. Please check your credentials and connection."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Verify OTP & Reset Password
  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!verificationCode.trim()) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password confirmation does not match the new password.");
      return;
    }

    try {
      setLoading(true);
      const res = await authService.verifyAndResetPassword({
        username: username.trim(),
        mobile: mobile.replace(/\D/g, ""),
        verificationCode: verificationCode.trim(),
        newPassword,
      });

      if (res.success) {
        setSuccess("Password has been reset successfully! Redirecting you to sign in...");
        setGeneratedOtpHint(null);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(res.message || "Invalid or expired verification code. Please try again.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to verify code and reset password. Please check the code."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 font-sans text-slate-900 dark:text-slate-100 transition-colors">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 sm:p-8 space-y-6">
        {/* Header with Brand Logo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <BrandLogo size="md" variant="auto" name="FleetPulse" tagline="Enterprise Cloud TMS" />
          <div className="pt-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {step === 1 ? "Reset Account Password" : "Enter Verification Code"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              {step === 1
                ? "Verify your registered username and mobile number to receive a secure reset code."
                : `We've sent a 6-digit verification code for user ${username}. Enter it below to set your new password.`}
            </p>
          </div>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="flex items-center justify-center gap-2 pt-1 pb-1">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              step === 1
                ? "bg-sky-500 text-white shadow-xs shadow-sky-500/30"
                : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Verify Identity</span>
          </div>
          <div className="w-6 h-0.5 bg-slate-200 dark:bg-slate-700" />
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              step === 2
                ? "bg-sky-500 text-white shadow-xs shadow-sky-500/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Set New Password</span>
          </div>
        </div>

        {/* Alert Notifications */}
        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span className="leading-snug">{success}</span>
          </div>
        )}

        {/* Dev / SMS Simulation OTP Hint Banner */}
        {generatedOtpHint && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-medium flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="font-bold">Security OTP: </span>
                <span className="font-mono font-bold tracking-widest text-sm bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700">
                  {generatedOtpHint}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setVerificationCode(generatedOtpHint)}
              className="text-[11px] font-bold text-amber-700 dark:text-amber-300 underline hover:text-amber-900 cursor-pointer ml-2"
            >
              Auto-fill
            </button>
          </div>
        )}

        {/* STEP 1 FORM: User Identity Verification */}
        {step === 1 && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Username / User ID *
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. admin or dispatch_lead"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Registered Mobile Number *
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  required
                  maxLength={15}
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 active:from-sky-700 text-white font-bold rounded-xl text-sm shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Verifying Records...</span>
                </>
              ) : (
                <>
                  <span>Request Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2 FORM: OTP Code Verification & New Password Creation */}
        {step === 2 && (
          <form onSubmit={handleVerifyAndReset} className="space-y-4">
            {/* OTP Code */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  6-Digit Verification Code *
                </label>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={() => handleRequestCode()}
                  className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-mono font-bold tracking-widest text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition text-center"
                />
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                New Password *
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password *
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError("");
                  setSuccess("");
                }}
                className="py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 active:from-sky-700 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Code & Reset Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-sky-600 dark:text-sky-400 font-bold hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3 inline" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
