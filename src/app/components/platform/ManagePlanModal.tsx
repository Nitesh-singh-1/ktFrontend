"use client";

import React, { useEffect, useState } from "react";
import { X, TrendingUp, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import {
  tenantService,
  TenantAdminListItem,
  TenantUsageDto,
  ResourceUsageDto,
} from "../../../../services/tenantService";

interface ManagePlanModalProps {
  isOpen: boolean;
  client: TenantAdminListItem | null;
  onClose: () => void;
  onSaved: () => void;
}

type PlanTier = "Starter" | "Professional" | "Enterprise";
const PLAN_TIERS: PlanTier[] = ["Starter", "Professional", "Enterprise"];

const PLAN_META: Record<PlanTier, { blurb: string; monthly: string }> = {
  Starter: { blurb: "Single branch · up to 10 vehicles", monthly: "₹999" },
  Professional: { blurb: "Regional fleet · up to 50 vehicles", monthly: "₹2,999" },
  Enterprise: { blurb: "National scale · 500+ vehicles", monthly: "₹9,999" },
};

/**
 * Platform-operator modal for reviewing a tenant's usage vs. plan and changing their
 * subscription tier. Read of usage is `GET /api/tenant/{id}/usage` (platform-admin only,
 * TASK-009); the write is `PUT /api/tenant/{id}/plan` which already existed.
 */
export default function ManagePlanModal({ isOpen, client, onClose, onSaved }: ManagePlanModalProps) {
  const [usage, setUsage] = useState<TenantUsageDto | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PlanTier>("Starter");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (!isOpen || !client) return;

    setError("");
    setSavedMsg("");
    setUsage(null);
    setLoadingUsage(true);

    tenantService
      .getUsageFor(client.id)
      .then((snapshot) => {
        setUsage(snapshot);
        // Seed the selector from the tenant's current tier so a no-op Save doesn't happen by mistake.
        const current = (snapshot.planTier as PlanTier) || (client.subscriptionPlanTier as PlanTier) || "Starter";
        setSelectedTier(PLAN_TIERS.includes(current) ? current : "Starter");
      })
      .catch((err: any) => setError(err?.message || "Could not load usage for this tenant."))
      .finally(() => setLoadingUsage(false));
  }, [isOpen, client]);

  if (!isOpen || !client) return null;

  const currentTier = usage?.planTier || client.subscriptionPlanTier;
  const isDirty = selectedTier !== currentTier;

  const handleSave = async () => {
    if (!isDirty) {
      onClose();
      return;
    }
    try {
      setSaving(true);
      setError("");
      const res = await tenantService.updatePlan(client.id, selectedTier);
      if (res.success) {
        setSavedMsg(res.message || `Plan updated to ${selectedTier}.`);
        onSaved();
        // Refresh usage so the new limits show through immediately.
        try {
          const refreshed = await tenantService.getUsageFor(client.id);
          setUsage(refreshed);
        } catch { /* refresh failure is non-fatal — the save already succeeded */ }
      } else {
        setError(res.message || "Failed to update plan.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update plan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-[#D9E2E3] dark:border-slate-800 w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="p-1.5 bg-[#E7F1F2] text-[#2F8E86] rounded-lg">
                <TrendingUp className="w-4 h-4 text-[#2F8E86]" />
              </span>
              <span>Manage Plan &middot; {client.name}</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              {client.code} &middot; usage vs. current plan limits, and change the subscription tier.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#111827] dark:hover:text-white p-1.5 rounded-lg hover:bg-[#F7F8F8] dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D95C5C] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {savedMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2F9E8F] shrink-0" />
              <span>{savedMsg}</span>
            </div>
          )}

          {/* Current usage */}
          <section>
            <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mb-2">
              Current usage
            </div>

            {loadingUsage ? (
              <div className="flex items-center gap-2 text-xs text-[#64748B] py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading usage…
              </div>
            ) : usage ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Plan tier</span>
                  <span className="font-bold text-[#111827] dark:text-white">
                    {usage.planTier}{" "}
                    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E7F1F2] text-[#25776F]">
                      {usage.planStatus}
                    </span>
                  </span>
                </div>
                {usage.expiresAt && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#64748B]">Expires</span>
                    <span className="font-mono text-[#111827] dark:text-slate-200">
                      {new Date(usage.expiresAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                )}

                <UsageBar label="Vehicles" data={usage.vehicles} />
                <UsageBar label="Users" data={usage.users} />
                <UsageBar label="Monthly shipments" data={usage.monthlyShipments} />

                {usage.warnings.length > 0 && (
                  <div className="mt-2 p-2.5 rounded-lg border border-[#F4A261]/40 bg-[#FFF7ED] text-[10px] text-[#7C2D12] font-medium">
                    {usage.warnings.map((w, i) => <div key={i}>&middot; {w}</div>)}
                  </div>
                )}
              </div>
            ) : null}
          </section>

          {/* Plan selector */}
          <section>
            <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mb-2">
              Change plan tier
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PLAN_TIERS.map((tier) => {
                const isSelected = tier === selectedTier;
                const isCurrent = tier === currentTier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedTier(tier)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? "bg-[#E7F1F2] border-[#2F8E86] text-[#25776F]"
                        : "bg-white dark:bg-slate-800 border-[#D9E2E3] dark:border-slate-700 text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{tier}</span>
                      {isCurrent && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#25776F] bg-white px-1.5 py-0.5 rounded border border-[#2F8E86]/30">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-[#111827] mt-1">
                      {PLAN_META[tier].monthly}<span className="text-[10px] font-normal text-[#64748B]"> / month</span>
                    </div>
                    <div className="text-[10px] text-[#64748B] mt-0.5">{PLAN_META[tier].blurb}</div>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5EAEB] dark:border-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary">
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : isDirty ? `Save (${selectedTier})` : "No change"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageBar({ label, data }: { label: string; data: ResourceUsageDto }) {
  const pct = Math.min(100, Math.max(0, data.percent));
  const barColor = data.isCritical ? "bg-[#D95C5C]" : pct >= 60 ? "bg-[#F4A261]" : "bg-[#2F9E8F]";
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
        <span className="text-[#64748B]">{label}</span>
        <span className={`font-mono ${data.isCritical ? "text-[#D95C5C]" : "text-[#111827] dark:text-slate-200"}`}>
          {data.current} / {data.max} <span className="text-[#94A3B8]">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
        <div className={`h-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
