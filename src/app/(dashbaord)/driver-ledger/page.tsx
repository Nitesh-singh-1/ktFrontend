"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DriverLedgerEntryDto, DriverOutstandingDto } from "@/types/tms";
import { driverLedgerService } from "services/driverLedgerService";
import { toast } from "@/context/ToastContext";
import DriverLedgerModal from "@/app/components/fleet/DriverLedgerModal";
import { DataTable } from "@/app/components/ui/DataTable";
import { Plus, Search, AlertTriangle, Wallet, Pencil, Trash2, User } from "lucide-react";

function inr(n?: number): string {
  return `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

type View = "outstanding" | "transactions";

export default function DriverLedgerPage() {
  const [view, setView] = useState<View>("outstanding");
  const [entries, setEntries] = useState<DriverLedgerEntryDto[]>([]);
  const [outstanding, setOutstanding] = useState<DriverOutstandingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DriverLedgerEntryDto | null>(null);

  const fetchAll = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const [ent, out] = await Promise.all([
        driverLedgerService.getEntries({ search: searchTerm || undefined }),
        driverLedgerService.getOutstanding(),
      ]);
      setEntries(ent || []);
      setOutstanding(out || []);
    } catch (err: any) {
      console.error("Error fetching driver ledger:", err);
      setError(err?.message || "Failed to load driver ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const advance = entries.filter((e) => e.isAdvance).reduce((a, b) => a + b.amount, 0);
    const recovered = entries.filter((e) => !e.isAdvance).reduce((a, b) => a + b.amount, 0);
    return { advance, recovered, outstanding: advance - recovered, drivers: outstanding.length };
  }, [entries, outstanding]);

  const handleDelete = async (e: DriverLedgerEntryDto) => {
    if (!confirm(`Delete this ${e.isAdvance ? "advance" : "recovery"} entry for ${e.driverName}?`)) return;
    try {
      await driverLedgerService.remove(e.id);
      toast.success("Entry removed.");
      fetchAll();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete entry.");
    }
  };

  const kpis = [
    { title: "Total Advances", value: inr(summary.advance), hint: "Paid to drivers", mono: true },
    { title: "Total Recovered", value: inr(summary.recovered), hint: "Settled / recovered", mono: true, good: true },
    { title: "Net Outstanding", value: inr(summary.outstanding), hint: "Recoverable from drivers", mono: true, danger: true },
    { title: "Drivers", value: summary.drivers, hint: "With ledger activity" },
  ];

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-[#E5EAEB] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#111827] tracking-tight">Driver Ledger</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] rounded-full">Advances & Recovery</span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Track advances paid to drivers and recoveries against them — with per-driver outstanding balances.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> <span>New Entry</span>
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.title} className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-2xs">
            <p className="text-xs font-semibold text-[#64748B]">{k.title}</p>
            <p className={`text-lg font-black mt-1 ${k.mono ? "font-mono" : ""} ${k.danger ? "text-[#D95C5C]" : k.good ? "text-[#2F9E8F]" : "text-[#111827]"}`}>{k.value}</p>
            <p className="text-[10px] text-[#94A3B8] mt-1">{k.hint}</p>
          </div>
        ))}
      </div>

      {/* View toggle + search */}
      <div className="bg-white rounded-xl border border-[#E5EAEB] p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          {([["outstanding", "Outstanding by Driver"], ["transactions", "All Transactions"]] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                view === v ? "bg-[#2F8E86] text-white shadow-xs" : "bg-white text-[#64748B] hover:bg-[#E7F1F2] border border-[#E5EAEB]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {view === "transactions" && (
          <form onSubmit={(e) => { e.preventDefault(); fetchAll(search); }} className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search driver, reason…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-20 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
            />
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
            <button type="submit" className="absolute right-1.5 top-1 px-3 py-1 bg-[#F7F8F8] border border-[#D9E2E3] hover:bg-[#E7F1F2] text-[#25776F] font-bold rounded-md text-[11px] transition cursor-pointer">Search</button>
          </form>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[#D95C5C] text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> <span>{error}</span>
        </div>
      )}

      {view === "outstanding" ? (
        <DataTable<DriverOutstandingDto>
          data={outstanding}
          loading={loading}
          loadingText="Loading driver balances…"
          rowKey={(r, i) => `${r.driverName}-${i}`}
          emptyIcon={<Wallet className="w-8 h-8" />}
          emptyTitle="No driver balances yet"
          emptyMessage="Record driver advances and recoveries to see per-driver outstanding balances."
          columns={[
            {
              key: "driverName",
              header: "Driver",
              render: (r) => (
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0"><User className="w-3.5 h-3.5" /></span>
                  <span className="font-bold text-[#111827]">{r.driverName}</span>
                </div>
              ),
            },
            { key: "entryCount", header: "Entries", align: "center", render: (r) => <span className="font-semibold text-[#64748B]">{r.entryCount}</span> },
            { key: "totalAdvance", header: "Advances", align: "right", render: (r) => <span className="font-mono text-[#111827]">{inr(r.totalAdvance)}</span> },
            { key: "totalRecovered", header: "Recovered", align: "right", render: (r) => <span className="font-mono text-[#2F9E8F]">{inr(r.totalRecovered)}</span> },
            { key: "outstanding", header: "Outstanding", align: "right", render: (r) => <span className={`font-mono font-bold ${r.outstanding > 0 ? "text-[#D95C5C]" : "text-[#94A3B8]"}`}>{inr(r.outstanding)}</span> },
          ]}
        />
      ) : (
        <DataTable<DriverLedgerEntryDto>
          data={entries}
          loading={loading}
          loadingText="Loading transactions…"
          rowKey={(r) => r.id}
          emptyIcon={<Wallet className="w-8 h-8" />}
          emptyTitle="No transactions yet"
          emptyMessage="Record your first driver advance or recovery."
          emptyAction={
            <button onClick={() => { setEditing(null); setModalOpen(true); }} className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Entry
            </button>
          }
          columns={[
            { key: "entryDate", header: "Date", render: (r) => <span className="text-[#64748B]">{fmtDate(r.entryDate)}</span> },
            { key: "driverName", header: "Driver", render: (r) => <span className="font-bold text-[#111827]">{r.driverName}</span> },
            {
              key: "isAdvance",
              header: "Type",
              render: (r) => r.isAdvance
                ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FDECEC] text-[#D95C5C] border border-[#F4A6A6]">Advance</span>
                : <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Recovery</span>,
            },
            { key: "reason", header: "Reason", render: (r) => <span className="text-[#64748B]">{r.reason || "—"}</span> },
            { key: "amount", header: "Amount", align: "right", render: (r) => <span className={`font-mono font-bold ${r.isAdvance ? "text-[#D95C5C]" : "text-[#2F9E8F]"}`}>{r.isAdvance ? "" : "-"}{inr(r.amount)}</span> },
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
      )}

      <DriverLedgerModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchAll} initial={editing} />
    </div>
  );
}
