"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Zap, Eye, EyeOff, User, Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { tenantService } from "services/tenantService";
import { authService } from "services/authService";
import { TenantOnboardingRequest } from "@/types/shipment";
import BrandLogo from "@/app/components/ui/BrandLogo";

export default function OnboardPage() {
  const router = useRouter();

  // Public self-signup is for logged-out prospects only. A signed-in user already belongs to an org
  // and must not create another one here; platform operators onboard clients from the in-app console.
  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

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
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F7F8F8] text-[#111827] font-sans">
      {/* Left Column: Enterprise Value Proposition (desktop only) */}
      <div className="md:w-5/12 lg:w-1/2 bg-[#111827] text-white relative hidden md:flex flex-col justify-between p-8 md:p-12 lg:p-16 overflow-hidden">
        {/* Top: Brand Header */}
        <div className="relative z-10">
          <BrandLogo size="lg" variant="light" name="FleetPulse" tagline="Multi-Tenant TMS Platform" />
        </div>

        {/* Middle: Onboarding Highlights */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#2F8E86]"></span>
            Tenant Provisioning Engine
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
            Onboard Your Transport &{" "}
            <span className="text-[#2F8E86]">
              Logistics Fleet
            </span>
          </h1>

          <p className="mt-4 text-sm md:text-base text-slate-400 max-w-lg leading-relaxed">
            Create an isolated cloud workspace for your branch or freight organization with automated waybill series, customized GST compliance, and dynamic rate calculation.
          </p>

          {/* Value points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8 max-w-lg">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#2F8E86]" />
                <span>Isolated Workspace</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">Dedicated tenant scope & secure data segregation</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#F4A261]" />
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
      <div className="md:w-7/12 lg:w-1/2 flex items-center justify-center p-6 md:p-10 lg:p-14 bg-white overflow-y-auto">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight">
              Register Organization
            </h2>
            <p className="text-sm text-[#64748B] mt-1.5">
              Set up your fleet company account and provision your master administrator credentials.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organization Info Box */}
            <div className="p-4 bg-[#F7F8F8] rounded-xl border border-[#E5EAEB] space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#2F8E86]" />
                Organization Details
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="organizationName"
                    placeholder="e.g. Acme Express Cargo"
                    value={formData.organizationName}
                    onChange={handleOrgNameChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D9E2E3] rounded-lg text-sm text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">
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
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D9E2E3] rounded-lg text-sm text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86] font-mono font-bold tracking-wider"
                  />
                </div>
              </div>
            </div>

            {/* Admin Info Box */}
            <div className="p-4 bg-[#F7F8F8] rounded-xl border border-[#E5EAEB] space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#2F8E86]" />
                Primary Administrator
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="adminFullName"
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.adminFullName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D9E2E3] rounded-lg text-sm text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="adminMobile"
                    placeholder="9876543210"
                    maxLength={10}
                    value={formData.adminMobile || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D9E2E3] rounded-lg text-sm text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    name="adminUsername"
                    placeholder="admin_acme"
                    value={formData.adminUsername}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D9E2E3] rounded-lg text-sm text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">
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
                      className="w-full px-3.5 py-2.5 pr-10 bg-white border border-[#D9E2E3] rounded-lg text-sm text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86] font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-[#64748B] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#D95C5C] text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#D95C5C] mt-0.5 shrink-0" />
                <div className="leading-snug">{error}</div>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-[#E7F1F2] border border-[#2F9E8F]/40 text-[#2F9E8F] text-xs font-semibold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2F9E8F] shrink-0" />
                <div>{successMsg}</div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
          <div className="mt-6 pt-5 border-t border-[#E5EAEB] text-center">
            <p className="text-xs text-[#64748B]">
              Already have an organization workspace?{" "}
              <Link href="/login" className="font-bold text-[#2F8E86] hover:text-[#25776F] hover:underline">
                Sign in to existing account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
