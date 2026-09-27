"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TyreDto, TyreStatus } from "@/types/tms";
import { tyreService } from "services/tyreService";
import { toast } from "@/context/ToastContext";
import TyreModal from "@/app/components/fleet/TyreModal";
import { DataTable } from "@/app/components/ui/DataTable";
import { Plus, Search, AlertTriangle, CircleDot, Pencil, Trash2 } from "lucide-react";

const STATUS_META: Record<string, { label: string; badge: string }> = {
  InStock: { label: "In Stock", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  Fitted: { label: "Fitted", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  UnderRetread: { label: "Under Retread", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  Scrapped: { label: "Scrapped", badge: "bg-red-50 text-red-700 border-red-200" },
};

const FILTERS: { label: string; value: TyreStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "In Stock", value: TyreStatus.InStock },
  { label: "Fitted", value: TyreStatus.Fitted },
  { label: "Under Retread", value: TyreStatus.UnderRetread },
  { label: "Scrapped", value: TyreStatus.Scrapped },
];

function inr(n?: number): string {
  return `₹${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function TyresPage() {
  const [rows, setRows] = useState<TyreDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TyreStatus | "">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TyreDto | null>(null);

  const fetchRows = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await tyreService.getTyres({
        search: searchTerm || undefined,
        status: statusFilter === "" ? undefined : statusFilter,
      });
      setRows(res || []);
    } catch (err: any) {
      console.error("Error fetching tyres:", err);
      setError(err?.message || "Failed to load tyres.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const summary = useMemo(() => {
    const fitted = rows.filter((r) => r.status === TyreStatus.Fitted).length;
    const inStock = rows.filter((r) => r.status === TyreStatus.InStock).length;
    const retread = rows.filter((r) => r.status === TyreStatus.UnderRetread).length;
    const value = rows.reduce((a, b) => a + (b.purchaseCost || 0), 0);
    return { fitted, inStock, retread, value };
  }, [rows]);

  const handleDelete = async (r: TyreDto) => {
    if (!confirm(`Delete tyre ${r.serialNo}? This cannot be undone.`)) return;
    try {
      await tyreService.remove(r.id);
      toast.success(`Tyre ${r.serialNo} deleted.`);
      fetchRows();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete tyre.");
    }
  };

  const kpis = [
    { title: "Fitted", value: summary.fitted, hint: "On vehicles" },
    { title: "In Stock", value: summary.inStock, hint: "Available spares" },
    { title: "Under Retread", value: summary.retread, hint: "At workshop" },
    { title: "Fleet Tyre Value", value: inr(summary.value), hint: "Total purchase cost", mono: true },
  ];

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-[#E5EAEB] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#111827] tracking-tight">Tyre Management</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] rounded-full">Fleet Assets</span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Track each tyre from stock → fitment → retread → disposal, with cost, position and kilometres run.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> <span>Add Tyre</span>
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            placeholder="Search serial, brand, vehicle…"
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

      <DataTable<TyreDto>
        data={rows}
        loading={loading}
        loadingText="Loading tyres…"
        rowKey={(r) => r.id}
        emptyIcon={<CircleDot className="w-8 h-8" />}
        emptyTitle="No tyres recorded"
        emptyMessage="Add tyres to track their fitment, kilometres run, retreads and disposal across your fleet."
        emptyAction={
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Tyre
          </button>
        }
        columns={[
          { key: "serialNo", header: "Serial No", render: (r) => <span className="font-mono font-bold text-[#111827]">{r.serialNo}</span> },
          {
            key: "brand",
            header: "Brand / Size",
            render: (r) => (
              <div>
                <div className="font-semibold text-[#334155]">{r.brand || "—"}</div>
                {r.size && <div className="text-[10px] text-[#94A3B8]">{r.size}</div>}
              </div>
            ),
          },
          {
            key: "fitment",
            header: "Fitment",
            render: (r) => r.vehicleNo
              ? <span className="text-[#334155]"><span className="font-mono font-semibold">{r.vehicleNo}</span>{r.position ? ` · ${r.position}` : ""}</span>
              : <span className="text-[#94A3B8]">—</span>,
          },
          { key: "kmRun", header: "Km Run", align: "right", render: (r) => <span className="font-mono text-[#64748B]">{(r.kmRun || 0).toLocaleString("en-IN")}</span> },
          { key: "retreadCount", header: "Retreads", align: "center", render: (r) => <span className="font-semibold text-[#64748B]">{r.retreadCount}</span> },
          { key: "purchaseCost", header: "Cost", align: "right", render: (r) => <span className="font-mono text-[#111827]">{inr(r.purchaseCost)}</span> },
          {
            key: "status",
            header: "Status",
            render: (r) => {
              const meta = STATUS_META[r.statusName || "InStock"] || STATUS_META.InStock;
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

      <TyreModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchRows} initial={editing} />
    </div>
  );
}
