"use client";

import React, { useState, useEffect, useMemo } from "react";
import { VendorRateContractDto } from "@/types/tms";
import { vendorRateService } from "services/vendorRateService";
import { toast } from "@/context/ToastContext";
import VendorRateModal from "@/app/components/ratecard/VendorRateModal";
import { DataTable } from "@/app/components/ui/DataTable";
import { Plus, Search, AlertTriangle, Truck, Pencil, Trash2, Route } from "lucide-react";

function inr(n?: number): string {
  return `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function VendorRatesPage() {
  const [rows, setRows] = useState<VendorRateContractDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VendorRateContractDto | null>(null);

  const fetchRows = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await vendorRateService.getContracts({ search: searchTerm || undefined });
      setRows(res || []);
    } catch (err: any) {
      console.error("Error fetching vendor rates:", err);
      setError(err?.message || "Failed to load vendor hire rates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const vendors = new Set(rows.map((r) => r.vendorName || "—")).size;
    const routes = new Set(rows.map((r) => `${r.fromLocation}→${r.toLocation}`)).size;
    return { total: rows.length, vendors, routes };
  }, [rows]);

  const handleDelete = async (r: VendorRateContractDto) => {
    if (!confirm(`Delete vendor hire rate ${r.fromLocation} → ${r.toLocation}${r.vendorName ? ` (${r.vendorName})` : ""}?`)) return;
    try {
      await vendorRateService.remove(r.id);
      toast.success("Vendor rate removed.");
      fetchRows();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete vendor rate.");
    }
  };

  const kpis = [
    { title: "Hire Rate Contracts", value: summary.total, hint: "Active vendor tariffs" },
    { title: "Vendors", value: summary.vendors, hint: "Distinct transporters" },
    { title: "Routes Covered", value: summary.routes, hint: "Distinct origin→dest" },
  ];

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-[#E5EAEB] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#111827] tracking-tight">Vendor Hire Rates</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] rounded-full">Market Hire Pricing</span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Negotiated lorry-hire rates you pay market vendors / transporters per route — the cost side that pairs with customer rate contracts.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> <span>New Hire Rate</span>
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div key={k.title} className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-2xs">
            <p className="text-xs font-semibold text-[#64748B]">{k.title}</p>
            <p className="text-xl font-black text-[#111827] mt-1">{k.value}</p>
            <p className="text-[10px] text-[#94A3B8] mt-1">{k.hint}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-[#E5EAEB] p-4 shadow-2xs">
        <form onSubmit={(e) => { e.preventDefault(); fetchRows(search); }} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search vendor, route…"
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

      <DataTable<VendorRateContractDto>
        data={rows}
        loading={loading}
        loadingText="Loading vendor hire rates…"
        rowKey={(r) => r.id}
        emptyIcon={<Truck className="w-8 h-8" />}
        emptyTitle="No vendor hire rates yet"
        emptyMessage="Record negotiated lorry-hire rates so market-vehicle costs are standardised across your team."
        emptyAction={
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Hire Rate
          </button>
        }
        columns={[
          { key: "vendorName", header: "Vendor", render: (r) => <span className="font-bold text-[#111827]">{r.vendorName || "—"}</span> },
          {
            key: "route",
            header: "Route",
            render: (r) => (
              <div className="flex items-center gap-2">
                <Route className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                <span className="font-semibold text-[#334155]">{r.fromLocation} → {r.toLocation}</span>
              </div>
            ),
          },
          { key: "vehicleType", header: "Vehicle", render: (r) => <span className="text-[#64748B]">{r.vehicleType || "Any"}</span> },
          { key: "rateType", header: "Basis", render: (r) => <span className="text-[#334155] font-semibold">{r.rateTypeName || "—"}</span> },
          { key: "hireRate", header: "Hire Rate", align: "right", render: (r) => <span className="font-mono font-bold text-[#111827]">{inr(r.hireRate)}</span> },
          { key: "minGuaranteeAmount", header: "Min Guarantee", align: "right", render: (r) => <span className="font-mono text-[#64748B]">{inr(r.minGuaranteeAmount)}</span> },
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

      <VendorRateModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchRows} initial={editing} />
    </div>
  );
}
