"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f8fafc] text-slate-800 font-sans">
      {/* Left Column: Enterprise Value Proposition */}
      <div className="md:w-5/12 lg:w-1/2 bg-slate-950 text-white relative flex flex-col justify-between p-8 md:p-12 lg:p-16 overflow-hidden">
        {/* Background Ambient Glow & Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.2),rgba(255,255,255,0))] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Top: Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center font-black text-xl text-indigo-400">
                KT
              </div>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white block">
                KESARI TRANSPORTS
              </span>
              <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">
                Multi-Tenant TMS Platform
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Onboarding Highlights */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300 mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            Tenant Provisioning Engine
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
            Onboard Your Transport &{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
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
                <span className="text-indigo-400">🏢</span> Isolated Workspace
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">Dedicated tenant scope & secure data segregation</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-purple-400">⚡</span> Instant Activation
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
      <div className="md:w-7/12 lg:w-1/2 flex items-center justify-center p-6 md:p-10 lg:p-14 bg-white overflow-y-auto">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Register Organization
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Set up your fleet company account and provision your master administrator credentials.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organization Info Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Organization Details
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="organizationName"
                    placeholder="e.g. Acme Express Cargo"
                    value={formData.organizationName}
                    onChange={handleOrgNameChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
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
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono font-bold tracking-wider"
                  />
                </div>
              </div>
            </div>

            {/* Admin Info Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Primary Administrator
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="adminFullName"
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.adminFullName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="adminMobile"
                    placeholder="9876543210"
                    maxLength={10}
                    value={formData.adminMobile || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    name="adminUsername"
                    placeholder="admin_acme"
                    value={formData.adminUsername}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
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
                      className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5">
                <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="leading-snug">{error}</div>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
                <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>{successMsg}</div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Provisioning Organization...</span>
                </>
              ) : (
                <>
                  <span>Create Organization & Launch</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an organization workspace?{" "}
              <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-700">
                Sign in to existing account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
