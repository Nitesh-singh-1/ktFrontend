"use client";

import React, { useState, useEffect, useMemo } from "react";
import { VehicleLoanDto } from "@/types/tms";
import { vehicleLoanService } from "services/vehicleLoanService";
import { toast } from "@/context/ToastContext";
import VehicleLoanModal from "@/app/components/fleet/VehicleLoanModal";
import { DataTable } from "@/app/components/ui/DataTable";
import { Plus, Search, AlertTriangle, Landmark, Pencil, Trash2, CheckCircle2 } from "lucide-react";

function inr(n?: number): string {
  return `₹${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function VehicleLoansPage() {
  const [rows, setRows] = useState<VehicleLoanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleLoanDto | null>(null);

  const fetchRows = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await vehicleLoanService.getLoans({ search: searchTerm || undefined, activeOnly });
      setRows(res || []);
    } catch (err: any) {
      console.error("Error fetching vehicle loans:", err);
      setError(err?.message || "Failed to load vehicle loans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOnly]);

  const summary = useMemo(() => {
    const active = rows.filter((r) => !r.isClosed);
    const outstanding = active.reduce((a, b) => a + (b.outstandingApprox ?? b.emiAmount * Math.max(0, b.tenureMonths - b.emisPaid)), 0);
    const monthlyEmi = active.reduce((a, b) => a + (b.emiAmount || 0), 0);
    return { total: rows.length, active: active.length, outstanding, monthlyEmi };
  }, [rows]);

  const handlePayEmi = async (l: VehicleLoanDto) => {
    if (!confirm(`Record one EMI paid for ${l.vehicleNo || l.lender}? (${l.emisPaid + 1}/${l.tenureMonths})`)) return;
    try {
      await vehicleLoanService.payEmi(l.id);
      toast.success("EMI recorded.");
      fetchRows();
    } catch (err: any) {
      toast.error(err?.message || "Failed to record EMI.");
    }
  };

  const handleDelete = async (l: VehicleLoanDto) => {
    if (!confirm(`Delete loan for ${l.vehicleNo || l.lender}?`)) return;
    try {
      await vehicleLoanService.remove(l.id);
      toast.success("Loan removed.");
      fetchRows();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete loan.");
    }
  };

  const kpis = [
    { title: "Active Loans", value: summary.active, hint: `${summary.total} total` },
    { title: "Outstanding (approx)", value: inr(summary.outstanding), hint: "Remaining EMIs × EMI", mono: true },
    { title: "Monthly EMI Outgo", value: inr(summary.monthlyEmi), hint: "Across active loans", mono: true },
  ];

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-[#E5EAEB] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#111827] tracking-tight">Vehicle EMI / Loans</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] rounded-full">Fleet Finance</span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Track vehicle finance — EMI schedule, EMIs paid vs tenure, next due date and outstanding balance.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> <span>Add Loan</span>
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div key={k.title} className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-2xs">
            <p className="text-xs font-semibold text-[#64748B]">{k.title}</p>
            <p className={`text-xl font-black text-[#111827] mt-1 ${k.mono ? "font-mono" : ""}`}>{k.value}</p>
            <p className="text-[10px] text-[#94A3B8] mt-1">{k.hint}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-[#E5EAEB] p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={(e) => { e.preventDefault(); fetchRows(search); }} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search vehicle, lender, A/C no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-20 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
          <button type="submit" className="absolute right-1.5 top-1 px-3 py-1 bg-[#F7F8F8] border border-[#D9E2E3] hover:bg-[#E7F1F2] text-[#25776F] font-bold rounded-md text-[11px] transition cursor-pointer">Search</button>
        </form>
        <button
          onClick={() => setActiveOnly((v) => !v)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
            activeOnly ? "bg-[#2F8E86] text-white border-[#2F8E86]" : "bg-white text-[#64748B] hover:bg-[#E7F1F2] border-[#E5EAEB]"
          }`}
        >
          {activeOnly ? "Showing Active" : "Active Only"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[#D95C5C] text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> <span>{error}</span>
        </div>
      )}

      <DataTable<VehicleLoanDto>
        data={rows}
        loading={loading}
        loadingText="Loading vehicle loans…"
        rowKey={(r) => r.id}
        emptyIcon={<Landmark className="w-8 h-8" />}
        emptyTitle="No vehicle loans yet"
        emptyMessage="Add vehicle finance records to track EMIs, tenure progress and outstanding balances."
        emptyAction={
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Loan
          </button>
        }
        columns={[
          {
            key: "vehicleNo",
            header: "Vehicle / Lender",
            render: (r) => (
              <div>
                <div className="font-mono font-bold text-[#111827]">{r.vehicleNo || "—"}</div>
                <div className="text-[10px] text-[#94A3B8]">{r.lender}</div>
              </div>
            ),
          },
          { key: "emiAmount", header: "EMI", align: "right", render: (r) => <span className="font-mono font-bold text-[#111827]">{inr(r.emiAmount)}</span> },
          {
            key: "progress",
            header: "Progress",
            render: (r) => (
              <div className="min-w-[120px]">
                <div className="flex items-center justify-between text-[10px] text-[#64748B] mb-0.5">
                  <span>{r.emisPaid}/{r.tenureMonths}</span>
                  <span>{r.progressPct ?? 0}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#EEF2F2] rounded-full overflow-hidden">
                  <div className="h-full bg-[#2F8E86] rounded-full" style={{ width: `${Math.min(100, r.progressPct ?? 0)}%` }} />
                </div>
              </div>
            ),
          },
          { key: "nextDueDate", header: "Next Due", render: (r) => <span className="text-[#64748B]">{r.isClosed ? "—" : fmtDate(r.nextDueDate)}</span> },
          { key: "outstandingApprox", header: "Outstanding", align: "right", render: (r) => <span className="font-mono font-semibold text-[#4A90E2]">{inr(r.outstandingApprox ?? r.emiAmount * Math.max(0, r.tenureMonths - r.emisPaid))}</span> },
          {
            key: "status",
            header: "Status",
            render: (r) => r.isClosed
              ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Closed</span>
              : <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3]">Active</span>,
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (r) => (
              <div className="flex items-center justify-end gap-1.5">
                {!r.isClosed && (
                  <button title="Record EMI paid" onClick={() => handlePayEmi(r)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                )}
                <button title="Edit" onClick={() => { setEditing(r); setModalOpen(true); }} className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                <button title="Delete" onClick={() => handleDelete(r)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ),
          },
        ]}
      />

      <VehicleLoanModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchRows} initial={editing} />
    </div>
  );
}
