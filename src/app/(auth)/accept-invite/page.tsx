"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Building2, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { authService } from "services/authService";
import { useUsernameAvailability } from "@/utils/useUsernameAvailability";

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#64748B]"><Loader2 className="w-5 h-5 animate-spin" /></div>}>
      <AcceptInviteInner />
    </Suspense>
  );
}

function AcceptInviteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [checking, setChecking] = useState(true);
  const [invite, setInvite] = useState<{ valid: boolean; email?: string; organizationName?: string; role?: string; message?: string } | null>(null);

  const [form, setForm] = useState({ username: "", password: "", fullName: "", mobile: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const usernameAvailability = useUsernameAvailability(form.username);

  useEffect(() => {
    if (!token) {
      setInvite({ valid: false, message: "No invitation token provided." });
      setChecking(false);
      return;
    }
    authService
      .getInvite(token)
      .then((info) => {
        setInvite(info);
        if (info.valid && info.email) {
          // Pre-fill a sensible username from the email local-part.
          setForm((f) => ({ ...f, username: info.email!.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "") }));
        }
      })
      .catch(() => setInvite({ valid: false, message: "Could not validate this invitation. Please try again." }))
      .finally(() => setChecking(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.fullName.trim()) return setError("Please enter your full name.");
    if (!form.username.trim()) return setError("Please choose a username.");
    if (usernameAvailability.status === "taken") return setError(`Username '${form.username}' is already taken. Please choose another.`);
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");

    try {
      setSubmitting(true);
      const res = await authService.acceptInvite({
        token,
        username: form.username.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        mobile: form.mobile.trim() || undefined,
      });
      if (res.success) {
        setSuccessMsg("Account created! Taking you to your dashboard…");
        setTimeout(() => router.push("/dashboard"), 1200);
      } else {
        setError(res.message || "Could not accept the invitation.");
      }
    } catch (err: any) {
      setError(err?.message || "Could not accept the invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full px-3.5 py-2.5 bg-white border border-[#D9E2E3] rounded-lg text-sm text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86] font-medium";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F7F8F8] p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5EAEB] shadow-sm p-8">
        {checking ? (
          <div className="flex items-center justify-center py-12 text-[#64748B]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Validating your invitation…
          </div>
        ) : !invite?.valid ? (
          <div className="text-center space-y-4 py-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-[#D95C5C]">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h1 className="text-lg font-bold text-[#111827]">Invitation unavailable</h1>
            <p className="text-sm text-[#64748B]">{invite?.message || "This invitation link is invalid."}</p>
            <Link href="/login" className="inline-block text-sm font-bold text-[#2F8E86] hover:underline">Go to sign in</Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F1F2] border border-[#D9E2E3] text-[#25776F] text-xs font-bold mb-3">
                <Building2 className="w-3.5 h-3.5" />
                <span>{invite.organizationName}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">Accept your invitation</h1>
              <p className="text-sm text-[#64748B] mt-1.5">
                You've been invited to join <strong>{invite.organizationName}</strong> as{" "}
                <strong>{invite.role === "admin" ? "an Administrator" : "a Standard User"}</strong>. Set up your login below.
              </p>
              <p className="text-xs text-[#94A3B8] mt-1">Invited email: {invite.email}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">Full Name *</label>
                <input className={inputCls} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="e.g. Ramesh Kumar" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#64748B]">Username *</label>
                  {usernameAvailability.status === "checking" && <span className="text-[10px] font-semibold text-[#64748B]">Checking…</span>}
                  {usernameAvailability.status === "available" && <span className="text-[10px] font-bold text-[#2F9E8F]">Available ✓</span>}
                  {usernameAvailability.status === "taken" && <span className="text-[10px] font-bold text-[#D95C5C]">Already taken</span>}
                  {usernameAvailability.status === "invalid" && <span className="text-[10px] font-bold text-[#B76E32]">{usernameAvailability.message || "Invalid"}</span>}
                </div>
                <input
                  className={inputCls}
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="choose a login username"
                  aria-invalid={usernameAvailability.status === "taken" || usernameAvailability.status === "invalid"}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">Mobile</label>
                <input className={inputCls} value={form.mobile} maxLength={10} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })} placeholder="9876543210" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={inputCls}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 6 characters"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] cursor-pointer">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#D95C5C] text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 rounded-xl bg-[#E7F1F2] border border-[#2F9E8F]/40 text-[#2F9E8F] text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /><span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Create Account & Sign In</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
