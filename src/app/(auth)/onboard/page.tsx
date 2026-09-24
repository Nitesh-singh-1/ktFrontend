"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Zap, Eye, EyeOff, User, Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { tenantService } from "services/tenantService";
import { TenantOnboardingRequest } from "@/types/shipment";

export default function OnboardPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<TenantOnboardingRequest>({
    organizationName: "",
    organizationCode: "",
    adminUsername: "",
    adminPassword: "",
    adminFullName: "",
    adminMobile: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "organizationCode" ? value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") : value,
    }));
  };

  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => {
      // Auto-generate code if empty or pristine
      const autoCode = val
        .trim()
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 6)
        .toUpperCase();
      return {
        ...prev,
        organizationName: val,
        organizationCode: prev.organizationCode === "" || prev.organizationCode === autoCode.substring(0, prev.organizationCode.length)
          ? autoCode
          : prev.organizationCode,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!formData.organizationName.trim()) {
      setError("Please enter your organization or company name.");
      return;
    }
    if (!formData.organizationCode.trim()) {
      setError("Organization code is required (e.g. ACME).");
      return;
    }
    if (!formData.adminFullName.trim()) {
      setError("Please provide the primary administrator's full name.");
      return;
    }
    if (!formData.adminUsername.trim()) {
      setError("Admin username is required.");
      return;
    }
    if (!formData.adminPassword || formData.adminPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      const res = await tenantService.onboard(formData);

      if (res.success) {
        setSuccessMsg("Organization provisioned successfully! Directing to dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      } else {
        setError(res.message || "Failed to onboard organization. Please try again.");
      }
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setError(err?.message || "Failed to register organization. Please check network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      {/* Left Column: Enterprise Value Proposition */}
      <div className="md:w-5/12 lg:w-1/2 bg-slate-950 text-white relative flex flex-col justify-between p-8 md:p-12 lg:p-16 overflow-hidden">
        {/* Background Ambient Glow & Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.2),rgba(255,255,255,0))] pointer-events-none" />
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
                Multi-Tenant TMS Platform
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Onboarding Highlights */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300 mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            Tenant Provisioning Engine
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
            Onboard Your Transport &{" "}
            <span className="text-sky-400">
              Logistics Fleet
            </span>
          </h1>

          <p className="mt-4 text-sm md:text-base text-slate-400 max-w-lg leading-relaxed">
            Create an isolated cloud workspace for your branch or freight organization with automated waybill series, customized GST compliance, and dynamic rate calculation.
          </p>

          {/* Value points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8 max-w-lg">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>Isolated Workspace</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">Dedicated tenant scope & secure data segregation</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Instant Activation</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">Ready-to-use consignment and dispatch workflows</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-6 border-t border-slate-900">
          <span>Multi-Tenant Architecture v2.0</span>
          <span>Fast, Scalable, Secure</span>
        </div>
      </div>

      {/* Right Column: Onboarding Form */}
      <div className="md:w-7/12 lg:w-1/2 flex items-center justify-center p-6 md:p-10 lg:p-14 bg-white dark:bg-slate-900 overflow-y-auto">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Register Organization
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Set up your fleet company account and provision your master administrator credentials.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organization Info Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Organization Details
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="organizationName"
                    placeholder="e.g. Acme Express Cargo"
                    value={formData.organizationName}
                    onChange={handleOrgNameChange}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Org Code *
                  </label>
                  <input
                    type="text"
                    required
                    name="organizationCode"
                    maxLength={10}
                    placeholder="ACME"
                    value={formData.organizationCode}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 font-mono font-bold tracking-wider"
                  />
                </div>
              </div>
            </div>

            {/* Admin Info Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Primary Administrator
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="adminFullName"
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.adminFullName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="adminMobile"
                    placeholder="9876543210"
                    maxLength={10}
                    value={formData.adminMobile || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    name="adminUsername"
                    placeholder="admin_acme"
                    value={formData.adminUsername}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      name="adminPassword"
                      placeholder="••••••••••••"
                      value={formData.adminPassword}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 pr-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div className="leading-snug">{error}</div>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>{successMsg}</div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Provisioning Organization...</span>
                </>
              ) : (
                <>
                  <span>Create Organization & Launch</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Already have an organization workspace?{" "}
              <Link href="/login" className="font-bold text-sky-600 dark:text-sky-400 hover:underline">
                Sign in to existing account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
