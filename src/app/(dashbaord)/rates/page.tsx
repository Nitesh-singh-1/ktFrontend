"use client";

import React, { useState, useEffect, useMemo } from "react";
import { RateCardDto } from "@/types/tms";
import { rateCardService } from "services/rateCardService";
import { toast } from "@/context/ToastContext";
import RateCardModal from "@/app/components/ratecard/RateCardModal";
import { DataTable } from "@/app/components/ui/DataTable";
import { Plus, Search, AlertTriangle, IndianRupee, Pencil, Trash2, Route } from "lucide-react";

function inr(n?: number): string {
  return `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function RateContractsPage() {
  const [cards, setCards] = useState<RateCardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RateCardDto | null>(null);

  const fetchCards = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await rateCardService.getRateCards({ search: searchTerm || undefined });
      setCards(res || []);
    } catch (err: any) {
      console.error("Error fetching rate cards:", err);
      setError(err?.message || "Failed to load rate contracts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const partySpecific = cards.filter((c) => c.partyName).length;
    const standard = cards.length - partySpecific;
    const routes = new Set(cards.map((c) => `${c.fromLocation}→${c.toLocation}`)).size;
    return { total: cards.length, partySpecific, standard, routes };
  }, [cards]);

  const handleDelete = async (c: RateCardDto) => {
    if (!confirm(`Delete rate contract ${c.fromLocation} → ${c.toLocation}${c.partyName ? ` (${c.partyName})` : ""}?`)) return;
    try {
      await rateCardService.deleteRateCard(c.id);
      toast.success("Rate contract removed.");
      fetchCards();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete rate contract.");
    }
  };

  const kpis = [
    { title: "Rate Contracts", value: summary.total, hint: "Active tariffs" },
    { title: "Routes Covered", value: summary.routes, hint: "Distinct origin→dest" },
    { title: "Customer-Specific", value: summary.partySpecific, hint: "Negotiated rates" },
    { title: "Standard Tariffs", value: summary.standard, hint: "Apply to all customers" },
  ];

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-[#E5EAEB] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#111827] tracking-tight">Rate Contracts & Tariffs</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] rounded-full">Freight Pricing</span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Define route-wise freight tariffs (per kg / MT / trip) with hamali, door-delivery and minimum charges — applied automatically during booking.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> <span>New Rate Contract</span>
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <form onSubmit={(e) => { e.preventDefault(); fetchCards(search); }} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search route, party, commodity…"
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

      <DataTable<RateCardDto>
        data={cards}
        loading={loading}
        loadingText="Loading rate contracts…"
        rowKey={(c) => c.id}
        emptyIcon={<IndianRupee className="w-8 h-8" />}
        emptyTitle="No rate contracts yet"
        emptyMessage="Add your first route tariff so freight is priced automatically at booking time."
        emptyAction={
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Rate Contract
          </button>
        }
        columns={[
          {
            key: "route",
            header: "Route",
            render: (c) => (
              <div className="flex items-center gap-2">
                <Route className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                <span className="font-bold text-[#111827]">{c.fromLocation} → {c.toLocation}</span>
              </div>
            ),
          },
          {
            key: "party",
            header: "Applies To",
            render: (c) => c.partyName
              ? <span className="text-[#334155] font-semibold">{c.partyName}</span>
              : <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Standard (All)</span>,
          },
          { key: "commodityType", header: "Commodity", render: (c) => <span className="text-[#64748B]">{c.commodityType || "Any"}</span> },
          { key: "rateType", header: "Basis", render: (c) => <span className="text-[#334155] font-semibold">{c.rateTypeName || "—"}</span> },
          { key: "baseRate", header: "Base Rate", align: "right", render: (c) => <span className="font-mono font-bold text-[#111827]">{inr(c.baseRate)}</span> },
          { key: "minFreightAmount", header: "Min Freight", align: "right", render: (c) => <span className="font-mono text-[#64748B]">{inr(c.minFreightAmount)}</span> },
          { key: "hamaliRatePerKg", header: "Hamali/Kg", align: "right", render: (c) => <span className="font-mono text-[#64748B]">{inr(c.hamaliRatePerKg)}</span> },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (c) => (
              <div className="flex items-center justify-end gap-1.5">
                <button title="Edit" onClick={() => { setEditing(c); setModalOpen(true); }} className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                <button title="Delete" onClick={() => handleDelete(c)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ),
          },
        ]}
      />

      <RateCardModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchCards} initial={editing} />
    </div>
  );
}
