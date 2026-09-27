"use client";

import React, { useState, useEffect, useMemo } from "react";
import { VehicleInsuranceClaimDto, VehicleClaimStatus } from "@/types/tms";
import { vehicleClaimService } from "services/vehicleClaimService";
import { toast } from "@/context/ToastContext";
import VehicleClaimModal from "@/app/components/fleet/VehicleClaimModal";
import { DataTable } from "@/app/components/ui/DataTable";
import { Plus, Search, AlertTriangle, ShieldAlert, Pencil, Trash2 } from "lucide-react";

const STATUS_META: Record<string, { label: string; badge: string }> = {
  Filed: { label: "Filed", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  UnderReview: { label: "Under Review", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  Approved: { label: "Approved", badge: "bg-[#EAF2FB] text-[#2F6FBF] border-[#D3E3F5]" },
  Settled: { label: "Settled", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Rejected: { label: "Rejected", badge: "bg-red-50 text-red-700 border-red-200" },
};

const FILTERS: { label: string; value: VehicleClaimStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Filed", value: VehicleClaimStatus.Filed },
  { label: "Under Review", value: VehicleClaimStatus.UnderReview },
  { label: "Approved", value: VehicleClaimStatus.Approved },
  { label: "Settled", value: VehicleClaimStatus.Settled },
  { label: "Rejected", value: VehicleClaimStatus.Rejected },
];

function inr(n?: number): string {
  return `₹${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function VehicleClaimsPage() {
  const [rows, setRows] = useState<VehicleInsuranceClaimDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleClaimStatus | "">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleInsuranceClaimDto | null>(null);

  const fetchRows = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await vehicleClaimService.getClaims({
        search: searchTerm || undefined,
        status: statusFilter === "" ? undefined : statusFilter,
      });
      setRows(res || []);
    } catch (err: any) {
      console.error("Error fetching vehicle claims:", err);
      setError(err?.message || "Failed to load vehicle claims.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const summary = useMemo(() => {
    const open = rows.filter((r) => r.status === VehicleClaimStatus.Filed || r.status === VehicleClaimStatus.UnderReview).length;
    const claimed = rows.reduce((a, b) => a + (b.claimAmount || 0), 0);
    const approved = rows.reduce((a, b) => a + (b.approvedAmount || 0), 0);
    return { total: rows.length, open, claimed, approved };
  }, [rows]);

  const handleDelete = async (r: VehicleInsuranceClaimDto) => {
    if (!confirm(`Delete claim for ${r.vehicleNo}?`)) return;
    try {
      await vehicleClaimService.remove(r.id);
      toast.success("Claim removed.");
      fetchRows();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete claim.");
    }
  };

  const kpis = [
    { title: "Total Claims", value: summary.total, hint: "All filed claims" },
    { title: "Open Claims", value: summary.open, hint: "Filed + under review" },
    { title: "Claimed Amount", value: inr(summary.claimed), hint: "Total claimed", mono: true },
    { title: "Approved Amount", value: inr(summary.approved), hint: "Total approved", mono: true, good: true },
  ];

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-[#E5EAEB] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#111827] tracking-tight">Vehicle Insurance Claims</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] rounded-full">Fleet Risk</span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Register and track vehicle insurance claims — accident, own-damage, theft — from filing through to settlement.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> <span>File Claim</span>
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.title} className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-2xs">
            <p className="text-xs font-semibold text-[#64748B]">{k.title}</p>
            <p className={`text-lg font-black mt-1 ${k.mono ? "font-mono" : ""} ${k.good ? "text-[#2F9E8F]" : "text-[#111827]"}`}>{k.value}</p>
            <p className="text-[10px] text-[#94A3B8] mt-1">{k.hint}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-[#E5EAEB] p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={(e) => { e.preventDefault(); fetchRows(search); }} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search vehicle, claim no, insurer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-20 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
          <button type="submit" className="absolute right-1.5 top-1 px-3 py-1 bg-[#F7F8F8] border border-[#D9E2E3] hover:bg-[#E7F1F2] text-[#25776F] font-bold rounded-md text-[11px] transition cursor-pointer">Search</button>
        </form>
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {FILTERS.map((f) => {
            const selected = statusFilter === f.value;
            return (
              <button
                key={f.label}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selected ? "bg-[#2F8E86] text-white shadow-xs" : "bg-white text-[#64748B] hover:bg-[#E7F1F2] border border-[#E5EAEB]"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[#D95C5C] text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> <span>{error}</span>
        </div>
      )}

      <DataTable<VehicleInsuranceClaimDto>
        data={rows}
        loading={loading}
        loadingText="Loading claims…"
        rowKey={(r) => r.id}
        emptyIcon={<ShieldAlert className="w-8 h-8" />}
        emptyTitle="No insurance claims yet"
        emptyMessage="File a vehicle insurance claim to track it from filing through to settlement."
        emptyAction={
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> File Claim
          </button>
        }
        columns={[
          {
            key: "vehicleNo",
            header: "Vehicle / Claim",
            render: (r) => (
              <div>
                <div className="font-mono font-bold text-[#111827]">{r.vehicleNo || "—"}</div>
                {r.claimNo && <div className="text-[10px] text-[#94A3B8]">{r.claimNo}</div>}
              </div>
            ),
          },
          { key: "claimType", header: "Type", render: (r) => <span className="text-[#334155]">{r.claimType || "—"}</span> },
          { key: "insurerName", header: "Insurer", render: (r) => <span className="text-[#64748B]">{r.insurerName || "—"}</span> },
          { key: "claimDate", header: "Claim Date", render: (r) => <span className="text-[#64748B]">{fmtDate(r.claimDate)}</span> },
          { key: "claimAmount", header: "Claimed", align: "right", render: (r) => <span className="font-mono text-[#111827]">{inr(r.claimAmount)}</span> },
          { key: "approvedAmount", header: "Approved", align: "right", render: (r) => <span className="font-mono font-semibold text-[#2F9E8F]">{inr(r.approvedAmount)}</span> },
          {
            key: "status",
            header: "Status",
            render: (r) => {
              const meta = STATUS_META[r.statusName || "Filed"] || STATUS_META.Filed;
              return <span className={`inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full border ${meta.badge}`}>{meta.label}</span>;
            },
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (r) => (
              <div className="flex items-center justify-end gap-1.5">
                <button title="Edit" onClick={() => { setEditing(r); setModalOpen(true); }} className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                <button title="Delete" onClick={() => handleDelete(r)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ),
          },
        ]}
      />

      <VehicleClaimModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchRows} initial={editing} />
    </div>
  );
}
