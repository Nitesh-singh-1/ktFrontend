"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SparePartDto } from "@/types/tms";
import { sparePartService } from "services/sparePartService";
import { toast } from "@/context/ToastContext";
import SparePartModal from "@/app/components/fleet/SparePartModal";
import { DataTable } from "@/app/components/ui/DataTable";
import { Plus, Search, AlertTriangle, Cog, Pencil, Trash2, ArrowDownUp } from "lucide-react";

function inr(n?: number): string {
  return `₹${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function SparePartsPage() {
  const [rows, setRows] = useState<SparePartDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SparePartDto | null>(null);

  const fetchRows = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await sparePartService.getSpareParts({ search: searchTerm || undefined, lowStockOnly });
      setRows(res || []);
    } catch (err: any) {
      console.error("Error fetching spare parts:", err);
      setError(err?.message || "Failed to load spare parts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowStockOnly]);

  const summary = useMemo(() => {
    const low = rows.filter((r) => r.isLowStock).length;
    const value = rows.reduce((a, b) => a + (b.stockValue ?? b.stockQuantity * b.unitCost), 0);
    const categories = new Set(rows.map((r) => r.category || "Other")).size;
    return { total: rows.length, low, value, categories };
  }, [rows]);

  const handleAdjust = async (p: SparePartDto) => {
    const input = prompt(`Adjust stock for "${p.partName}" (current: ${p.stockQuantity} ${p.unit || ""}).\nEnter quantity change — positive to receive, negative to issue out:`);
    if (input == null) return;
    const delta = parseFloat(input);
    if (isNaN(delta) || delta === 0) { toast.error("Enter a non-zero number."); return; }
    const reason = prompt("Reason (optional) — e.g. 'Issued to MH12AB1234' or 'Purchase GRN':") || undefined;
    try {
      await sparePartService.adjustStock(p.id, delta, reason);
      toast.success(`Stock ${delta > 0 ? "received" : "issued"} for ${p.partName}.`);
      fetchRows();
    } catch (err: any) {
      toast.error(err?.message || "Failed to adjust stock.");
    }
  };

  const handleDelete = async (p: SparePartDto) => {
    if (!confirm(`Delete spare part "${p.partName}"?`)) return;
    try {
      await sparePartService.remove(p.id);
      toast.success(`${p.partName} removed.`);
      fetchRows();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete spare part.");
    }
  };

  const kpis = [
    { title: "Stock Items", value: summary.total, hint: "Distinct parts" },
    { title: "Low Stock", value: summary.low, hint: "At / below reorder", danger: summary.low > 0 },
    { title: "Categories", value: summary.categories, hint: "Part groups" },
    { title: "Inventory Value", value: inr(summary.value), hint: "Qty × unit cost", mono: true },
  ];

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-[#E5EAEB] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#111827] tracking-tight">Spare Parts Stock</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] rounded-full">Workshop Inventory</span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Track workshop spare-part stock levels, reorder points and value — issue parts to vehicles or receive purchases.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> <span>Add Part</span>
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.title} className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-2xs">
            <p className="text-xs font-semibold text-[#64748B]">{k.title}</p>
            <p className={`text-xl font-black mt-1 ${k.danger ? "text-[#D95C5C]" : "text-[#111827]"} ${k.mono ? "font-mono" : ""}`}>{k.value}</p>
            <p className="text-[10px] text-[#94A3B8] mt-1">{k.hint}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-[#E5EAEB] p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={(e) => { e.preventDefault(); fetchRows(search); }} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search part, part no, supplier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-20 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
          <button type="submit" className="absolute right-1.5 top-1 px-3 py-1 bg-[#F7F8F8] border border-[#D9E2E3] hover:bg-[#E7F1F2] text-[#25776F] font-bold rounded-md text-[11px] transition cursor-pointer">Search</button>
        </form>
        <button
          onClick={() => setLowStockOnly((v) => !v)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
            lowStockOnly ? "bg-[#D95C5C] text-white border-[#D95C5C]" : "bg-white text-[#64748B] hover:bg-red-50 border-[#E5EAEB]"
          }`}
        >
          {lowStockOnly ? "Showing Low Stock" : "Low Stock Only"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[#D95C5C] text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> <span>{error}</span>
        </div>
      )}

      <DataTable<SparePartDto>
        data={rows}
        loading={loading}
        loadingText="Loading spare parts…"
        rowKey={(r) => r.id}
        emptyIcon={<Cog className="w-8 h-8" />}
        emptyTitle="No spare parts yet"
        emptyMessage="Add workshop spare parts to track stock levels, reorder points and issue them to vehicles."
        emptyAction={
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Part
          </button>
        }
        columns={[
          {
            key: "partName",
            header: "Part",
            render: (r) => (
              <div>
                <div className="font-bold text-[#111827]">{r.partName}</div>
                {r.partNo && <div className="text-[10px] text-[#94A3B8] font-mono">{r.partNo}</div>}
              </div>
            ),
          },
          { key: "category", header: "Category", render: (r) => <span className="text-[#64748B]">{r.category || "—"}</span> },
          {
            key: "stockQuantity",
            header: "In Stock",
            align: "right",
            render: (r) => (
              <span className="inline-flex items-center gap-1.5 justify-end">
                <span className="font-mono font-bold text-[#111827]">{r.stockQuantity}</span>
                <span className="text-[10px] text-[#94A3B8]">{r.unit}</span>
                {r.isLowStock && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">LOW</span>}
              </span>
            ),
          },
          { key: "reorderLevel", header: "Reorder", align: "right", render: (r) => <span className="font-mono text-[#64748B]">{r.reorderLevel}</span> },
          { key: "unitCost", header: "Unit Cost", align: "right", render: (r) => <span className="font-mono text-[#64748B]">{inr(r.unitCost)}</span> },
          { key: "stockValue", header: "Value", align: "right", render: (r) => <span className="font-mono font-bold text-[#111827]">{inr(r.stockValue ?? r.stockQuantity * r.unitCost)}</span> },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (r) => (
              <div className="flex items-center justify-end gap-1.5">
                <button title="Issue / Receive stock" onClick={() => handleAdjust(r)} className="p-1.5 rounded-lg text-[#25776F] hover:bg-[#E7F1F2] transition cursor-pointer"><ArrowDownUp className="w-3.5 h-3.5" /></button>
                <button title="Edit" onClick={() => { setEditing(r); setModalOpen(true); }} className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                <button title="Delete" onClick={() => handleDelete(r)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ),
          },
        ]}
      />

      <SparePartModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchRows} initial={editing} />
    </div>
  );
}
