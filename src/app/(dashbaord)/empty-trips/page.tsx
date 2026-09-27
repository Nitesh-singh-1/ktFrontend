"use client";

import React, { useState, useEffect, useMemo } from "react";
import { EmptyTripLogDto } from "@/types/tms";
import { emptyTripService } from "services/emptyTripService";
import { toast } from "@/context/ToastContext";
import EmptyTripModal from "@/app/components/fleet/EmptyTripModal";
import { DataTable } from "@/app/components/ui/DataTable";
import { Plus, Search, AlertTriangle, Truck, Pencil, Trash2, Route } from "lucide-react";

function inr(n?: number): string {
  return `₹${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function EmptyTripsPage() {
  const [rows, setRows] = useState<EmptyTripLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmptyTripLogDto | null>(null);

  const fetchRows = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await emptyTripService.getLogs(searchTerm || undefined);
      setRows(res || []);
    } catch (err: any) {
      console.error("Error fetching empty trips:", err);
      setError(err?.message || "Failed to load empty trips.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const km = rows.reduce((a, b) => a + (b.distanceKm || 0), 0);
    const cost = rows.reduce((a, b) => a + (b.fuelCost || 0), 0);
    return { total: rows.length, km, cost };
  }, [rows]);

  const handleDelete = async (r: EmptyTripLogDto) => {
    if (!confirm(`Delete this empty trip log for ${r.vehicleNo}?`)) return;
    try {
      await emptyTripService.remove(r.id);
      toast.success("Empty trip removed.");
      fetchRows();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete empty trip.");
    }
  };

  const kpis = [
    { title: "Empty Trips", value: summary.total, hint: "Logged deadhead runs" },
    { title: "Empty Km", value: summary.km.toLocaleString("en-IN"), hint: "Total distance run empty" },
    { title: "Deadhead Cost", value: inr(summary.cost), hint: "Fuel / running cost", mono: true },
  ];

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-[#E5EAEB] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#111827] tracking-tight">Empty Trip Log</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] rounded-full">Deadhead Runs</span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Log empty / return runs and their fuel cost — the hidden expense that erodes trip profitability.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> <span>Log Empty Trip</span>
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

      {/* Search */}
      <div className="bg-white rounded-xl border border-[#E5EAEB] p-4 shadow-2xs">
        <form onSubmit={(e) => { e.preventDefault(); fetchRows(search); }} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search vehicle, driver, route…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-20 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
          <button type="submit" className="absolute right-1.5 top-1 px-3 py-1 bg-[#F7F8F8] border border-[#D9E2E3] hover:bg-[#E7F1F2] text-[#25776F] font-bold rounded-md text-[11px] transition cursor-pointer">Search</button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[#D95C5C] text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> <span>{error}</span>
        </div>
      )}

      <DataTable<EmptyTripLogDto>
        data={rows}
        loading={loading}
        loadingText="Loading empty trips…"
        rowKey={(r) => r.id}
        emptyIcon={<Truck className="w-8 h-8" />}
        emptyTitle="No empty trips logged"
        emptyMessage="Log deadhead / empty return runs to capture the fuel cost that reduces overall trip margins."
        emptyAction={
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Log Empty Trip
          </button>
        }
        columns={[
          { key: "tripDate", header: "Date", render: (r) => <span className="text-[#64748B]">{fmtDate(r.tripDate)}</span> },
          { key: "vehicleNo", header: "Vehicle", render: (r) => <span className="font-mono font-bold text-[#111827]">{r.vehicleNo || "—"}</span> },
          { key: "driverName", header: "Driver", render: (r) => <span className="text-[#334155]">{r.driverName || "—"}</span> },
          {
            key: "route",
            header: "Route",
            render: (r) => (
              <div className="flex items-center gap-2">
                <Route className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                <span className="text-[#334155]">{[r.fromLocation, r.toLocation].filter(Boolean).join(" → ") || "—"}</span>
              </div>
            ),
          },
          { key: "distanceKm", header: "Km", align: "right", render: (r) => <span className="font-mono text-[#64748B]">{(r.distanceKm || 0).toLocaleString("en-IN")}</span> },
          { key: "fuelCost", header: "Cost", align: "right", render: (r) => <span className="font-mono font-bold text-[#D95C5C]">{inr(r.fuelCost)}</span> },
          { key: "reason", header: "Reason", render: (r) => <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{r.reason || "—"}</span> },
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

      <EmptyTripModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchRows} initial={editing} />
    </div>
  );
}
