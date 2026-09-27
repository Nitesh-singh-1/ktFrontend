"use client";

import React, { useEffect, useState } from "react";
import { UserCircle, Save, Lock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { authService } from "../../../../services/authService";

interface ProfileState {
  id: number;
  username: string;
  fullName: string;
  role: string;
  mobile?: string;
  email?: string;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileState | null>(null);

  const [form, setForm] = useState({ fullName: "", mobile: "", email: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [pw, setPw] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await authService.getMyProfile();
        setProfile(p);
        setForm({ fullName: p.fullName || "", mobile: p.mobile || "", email: p.email || "" });
      } catch (e: any) {
        setProfileMsg({ type: "err", text: e?.message || "Could not load your profile." });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!form.fullName.trim()) {
      setProfileMsg({ type: "err", text: "Full name is required." });
      return;
    }
    try {
      setSavingProfile(true);
      const res = await authService.updateMyProfile({
        fullName: form.fullName.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
      });
      if (res.success) {
        setProfileMsg({ type: "ok", text: res.message || "Profile updated." });
        // Keep the cached user (used by the navbar) in sync.
        try {
          const cached = authService.getUser() || {};
          localStorage.setItem("user", JSON.stringify({ ...cached, fullName: form.fullName.trim(), mobile: form.mobile.trim(), email: form.email.trim() }));
        } catch {}
      } else {
        setProfileMsg({ type: "err", text: res.message || "Update failed." });
      }
    } catch (e: any) {
      setProfileMsg({ type: "err", text: e?.message || "Update failed." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pw.newPassword.length < 6) {
      setPwMsg({ type: "err", text: "New password must be at least 6 characters." });
      return;
    }
    if (pw.newPassword !== pw.confirmPassword) {
      setPwMsg({ type: "err", text: "New password and confirmation do not match." });
      return;
    }
    try {
      setSavingPw(true);
      const res = await authService.changePassword({ oldPassword: pw.oldPassword, newPassword: pw.newPassword });
      if (res.success) {
        setPwMsg({ type: "ok", text: res.message || "Password changed." });
        setPw({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPwMsg({ type: "err", text: res.message || "Could not change password." });
      }
    } catch (e: any) {
      setPwMsg({ type: "err", text: e?.message || "Could not change password." });
    } finally {
      setSavingPw(false);
    }
  };

  const inputCls =
    "w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-sm text-[#111827] dark:text-slate-100 placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86] font-medium";
  const labelCls = "block text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-1";

  const Banner = ({ msg }: { msg: { type: "ok" | "err"; text: string } | null }) =>
    msg ? (
      <div
        className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
          msg.type === "ok"
            ? "bg-[#E7F1F2] border border-[#2F9E8F]/40 text-[#2F9E8F]"
            : "bg-red-50 border border-red-200 text-[#D95C5C]"
        }`}
      >
        {msg.type === "ok" ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
        <span>{msg.text}</span>
      </div>
    ) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#64748B]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading your profile…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#2F8E86] text-white flex items-center justify-center font-bold text-lg shadow-xs">
          {(profile?.fullName || profile?.username || "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-[#111827] dark:text-white tracking-tight">My Profile</h1>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            {profile?.username} · <span className="capitalize">{profile?.role}</span>
          </p>
        </div>
      </div>

      {/* Profile details */}
      <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-bold text-[#111827] dark:text-white">
          <UserCircle className="w-4 h-4 text-[#2F8E86]" /> Personal Information
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Username</label>
            <input className={`${inputCls} opacity-60 cursor-not-allowed`} value={profile?.username || ""} disabled readOnly />
          </div>
          <div>
            <label className={labelCls}>Full Name *</label>
            <input className={inputCls} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Your name" />
          </div>
          <div>
            <label className={labelCls}>Mobile</label>
            <input className={inputCls} value={form.mobile} maxLength={10} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })} placeholder="9876543210" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>
        </div>

        <Banner msg={profileMsg} />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Changes</span>
          </button>
        </div>
      </form>

      {/* Change password */}
      <form onSubmit={handleChangePassword} className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-bold text-[#111827] dark:text-white">
          <Lock className="w-4 h-4 text-[#2F8E86]" /> Change Password
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Current Password</label>
            <input type="password" className={inputCls} value={pw.oldPassword} onChange={(e) => setPw({ ...pw, oldPassword: e.target.value })} placeholder="••••••••" />
          </div>
          <div>
            <label className={labelCls}>New Password</label>
            <input type="password" className={inputCls} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} placeholder="At least 6 characters" />
          </div>
          <div>
            <label className={labelCls}>Confirm New Password</label>
            <input type="password" className={inputCls} value={pw.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} placeholder="Re-enter new password" />
          </div>
        </div>

        <Banner msg={pwMsg} />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingPw}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#111827] hover:bg-black text-white font-bold rounded-xl text-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>Update Password</span>
          </button>
        </div>
      </form>
    </div>
  );
}
