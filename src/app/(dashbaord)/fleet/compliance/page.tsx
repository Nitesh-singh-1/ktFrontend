"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ComplianceOverview, ComplianceAlert, ComplianceStatus } from "@/types/shipment";
import { fleetService } from "services/fleetService";
import { DataTable } from "@/app/components/ui/DataTable";
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  Truck,
  User,
  ArrowLeft,
} from "lucide-react";

const WINDOWS = [
  { label: "Next 30 days", value: 30 },
  { label: "Next 60 days", value: 60 },
  { label: "Next 90 days", value: 90 },
];

const STATUS_META: Record<ComplianceStatus, { label: string; badge: string; dot: string }> = {
  Expired: { label: "Expired", badge: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  Critical: { label: "Critical", badge: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  Warning: { label: "Warning", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  Upcoming: { label: "Upcoming", badge: "bg-[#E7F1F2] text-[#25776F] border-[#D9E2E3]", dot: "bg-[#2F8E86]" },
};

const EMPTY: ComplianceOverview = {
  expiredCount: 0,
  criticalCount: 0,
  warningCount: 0,
  upcomingCount: 0,
  trackedDocuments: 0,
  alerts: [],
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function daysLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Expires today";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

export default function FleetCompliancePage() {
  const [overview, setOverview] = useState<ComplianceOverview>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withinDays, setWithinDays] = useState(30);
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | "">("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fleetService.getComplianceAlerts(withinDays);
        if (active) setOverview(res || EMPTY);
      } catch (err: any) {
        console.error("Error loading compliance:", err);
        if (active) setError(err?.message || "Failed to load compliance alerts.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [withinDays]);

  const filtered = useMemo(
    () => (statusFilter ? overview.alerts.filter((a) => a.status === statusFilter) : overview.alerts),
    [overview.alerts, statusFilter]
  );

  const cards = [
    { key: "Expired", title: "Expired", value: overview.expiredCount, icon: ShieldX, color: "text-red-600", hint: "Operating illegally — renew now" },
    { key: "Critical", title: "Critical (≤ 7 days)", value: overview.criticalCount, icon: ShieldAlert, color: "text-orange-600", hint: "Expiring this week" },
    { key: "Warning", title: "Warning (≤ 30 days)", value: overview.warningCount, icon: Clock, color: "text-amber-600", hint: "Plan renewals" },
    { key: "Tracked", title: "Documents Tracked", value: overview.trackedDocuments, icon: ShieldCheck, color: "text-[#2F8E86]", hint: "Across active fleet & drivers" },
  ];

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-[#E5EAEB] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/fleet"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#64748B] hover:text-[#25776F] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Fleet
            </Link>
          </div>
          <div className="flex items-center gap-2.5 mt-1">
            <h1 className="text-xl font-bold text-[#111827] tracking-tight">Fleet Compliance & Document Expiry</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] rounded-full">
              Statutory Alerts
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Track insurance, fitness, permit, PUC, road-tax and driving-licence expiry across your fleet — stay ahead of RTO fines and off-road vehicles.
          </p>
        </div>

        {/* Window selector */}
        <div className="flex items-center gap-1.5 shrink-0">
          {WINDOWS.map((w) => {
            const active = withinDays === w.value;
            return (
              <button
                key={w.value}
                onClick={() => setWithinDays(w.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  active ? "bg-[#2F8E86] text-white shadow-xs" : "bg-white text-[#64748B] hover:bg-[#E7F1F2] border border-[#E5EAEB]"
                }`}
              >
                {w.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.key} className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#64748B]">{c.title}</p>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <p className={`text-2xl font-black mt-1 ${c.color}`}>{c.value}</p>
              <p className="text-[10px] text-[#94A3B8] mt-1">{c.hint}</p>
            </div>
          );
        })}
      </div>

      {/* Status filter tabs */}
      <div className="bg-white rounded-xl border border-[#E5EAEB] p-3 shadow-2xs flex items-center gap-1.5 overflow-x-auto">
        {([
          { label: "All Alerts", value: "" as const },
          { label: "Expired", value: "Expired" as const },
          { label: "Critical", value: "Critical" as const },
          { label: "Warning", value: "Warning" as const },
          { label: "Upcoming", value: "Upcoming" as const },
        ]).map((tab) => {
          const active = statusFilter === tab.value;
          return (
            <button
              key={tab.value || "all"}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                active ? "bg-[#2F8E86] text-white shadow-xs" : "bg-white text-[#64748B] hover:bg-[#E7F1F2] border border-[#E5EAEB]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[#D95C5C] text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Alerts table */}
      <DataTable<ComplianceAlert>
        data={filtered}
        loading={loading}
        loadingText="Checking document expiry…"
        rowKey={(a, i) => `${a.entityType}-${a.entityId}-${a.documentType}-${i}`}
        emptyIcon={<ShieldCheck className="w-8 h-8" />}
        emptyTitle={statusFilter ? `No ${statusFilter.toLowerCase()} documents` : "All clear — nothing expiring"}
        emptyMessage={
          overview.trackedDocuments === 0
            ? "No expiry dates have been recorded yet. Add insurance, fitness, permit, PUC and licence dates on your vehicles and drivers to activate alerts."
            : "No statutory documents fall due within the selected window."
        }
        columns={[
          {
            key: "entity",
            header: "Vehicle / Driver",
            render: (a) => (
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    a.entityType === "Vehicle" ? "bg-[#E7F1F2] text-[#25776F]" : "bg-[#EEF2FF] text-[#4F46E5]"
                  }`}
                >
                  {a.entityType === "Vehicle" ? <Truck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </span>
                <div>
                  <div className="font-bold text-[#111827]">{a.entityName}</div>
                  <div className="text-[10px] text-[#94A3B8] uppercase tracking-wide">{a.entityType}</div>
                </div>
              </div>
            ),
          },
          {
            key: "documentType",
            header: "Document",
            render: (a) => <span className="font-semibold text-[#334155]">{a.documentType}</span>,
          },
          {
            key: "expiryDate",
            header: "Expiry Date",
            render: (a) => <span className="font-mono text-[#334155]">{formatDate(a.expiryDate)}</span>,
          },
          {
            key: "daysToExpiry",
            header: "Time Remaining",
            render: (a) => {
              const meta = STATUS_META[a.status];
              return (
                <span className={`inline-flex items-center gap-1.5 font-semibold ${a.daysToExpiry < 0 ? "text-red-600" : "text-[#334155]"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {daysLabel(a.daysToExpiry)}
                </span>
              );
            },
          },
          {
            key: "status",
            header: "Status",
            align: "right",
            render: (a) => {
              const meta = STATUS_META[a.status];
              return (
                <span className={`inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full border ${meta.badge}`}>
                  {meta.label}
                </span>
              );
            },
          },
        ]}
      />
    </div>
  );
}
