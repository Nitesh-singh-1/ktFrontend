"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Quotation, QuotationStatus } from "@/types/quotation";
import { quotationService } from "services/quotationService";
import { toast } from "@/context/ToastContext";
import QuotationModal from "@/app/components/quotation/QuotationModal";
import { DataTable } from "@/app/components/ui/DataTable";
import { printQuotation } from "@/utils/print/printQuotation";
import { Plus, Search, AlertTriangle, FileText, Pencil, Trash2, Send, CheckCircle2, ArrowRightCircle, Printer } from "lucide-react";

const STATUS_META: Record<string, { label: string; badge: string }> = {
  Draft: { label: "Draft", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  Sent: { label: "Sent", badge: "bg-[#EAF2FB] text-[#2F6FBF] border-[#D3E3F5]" },
  Accepted: { label: "Accepted", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Rejected: { label: "Rejected", badge: "bg-red-50 text-red-700 border-red-200" },
  Expired: { label: "Expired", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  Converted: { label: "Converted", badge: "bg-[#E7F1F2] text-[#25776F] border-[#D9E2E3]" },
};

const FILTERS: { label: string; value: QuotationStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Draft", value: QuotationStatus.Draft },
  { label: "Sent", value: QuotationStatus.Sent },
  { label: "Accepted", value: QuotationStatus.Accepted },
  { label: "Converted", value: QuotationStatus.Converted },
  { label: "Rejected", value: QuotationStatus.Rejected },
];

function inr(n: number): string {
  return `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function QuotationsPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | "">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Quotation | null>(null);

  const fetchQuotes = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await quotationService.getQuotations({
        search: searchTerm || undefined,
        status: statusFilter === "" ? undefined : statusFilter,
      });
      setQuotes(res || []);
    } catch (err: any) {
      console.error("Error fetching quotations:", err);
      setError(err?.message || "Failed to load quotations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const summary = useMemo(() => {
    const open = quotes.filter((q) => q.status === QuotationStatus.Draft || q.status === QuotationStatus.Sent).length;
    const accepted = quotes.filter((q) => q.status === QuotationStatus.Accepted).length;
    const converted = quotes.filter((q) => q.status === QuotationStatus.Converted).length;
    const pipeline = quotes
      .filter((q) => q.status !== QuotationStatus.Rejected && q.status !== QuotationStatus.Expired && q.status !== QuotationStatus.Converted)
      .reduce((a, b) => a + (b.estimatedFreight || 0), 0);
    return { open, accepted, converted, pipeline };
  }, [quotes]);

  const changeStatus = async (q: Quotation, status: QuotationStatus) => {
    try {
      await quotationService.updateStatus(q.id, status);
      toast.success(`${q.quoteNo} marked ${QuotationStatus[status]}.`);
      fetchQuotes();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status.");
    }
  };

  const convertToBooking = async (q: Quotation) => {
    try {
      await quotationService.updateStatus(q.id, QuotationStatus.Converted, `booking:${q.quoteNo}`);
      toast.success(`${q.quoteNo} converted — opening booking.`);
      const params = new URLSearchParams();
      if (q.partyName) params.set("consignor", q.partyName);
      if (q.partyMobile) params.set("mobile", q.partyMobile);
      if (q.partyGstNo) params.set("gst", q.partyGstNo);
      if (q.fromLocation) params.set("from", q.fromLocation);
      if (q.toLocation) params.set("to", q.toLocation);
      if (q.estimatedFreight) params.set("freight", String(q.estimatedFreight));
      params.set("quote", q.quoteNo);
      router.push(`/shipments/create?${params.toString()}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to convert quotation.");
    }
  };

  const handleDelete = async (q: Quotation) => {
    if (!confirm(`Delete quotation ${q.quoteNo}? This cannot be undone.`)) return;
    try {
      await quotationService.deleteQuotation(q.id);
      toast.success(`${q.quoteNo} deleted.`);
      fetchQuotes();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete quotation.");
    }
  };

  const kpis = [
    { title: "Open Enquiries", value: summary.open, hint: "Draft + Sent" },
    { title: "Accepted", value: summary.accepted, hint: "Awaiting booking" },
    { title: "Converted", value: summary.converted, hint: "Turned into bookings" },
    { title: "Pipeline Value", value: inr(summary.pipeline), hint: "Est. freight in play", mono: true },
  ];

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-[#E5EAEB] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#111827] tracking-tight">Quotations & Enquiries</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] rounded-full">Sales Funnel</span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Prepare freight rate quotes, track follow-ups, and convert accepted enquiries into bookings.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> <span>New Quotation</span>
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
        <form onSubmit={(e) => { e.preventDefault(); fetchQuotes(search); }} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search quote no, customer, route…"
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

      <DataTable<Quotation>
        data={quotes}
        loading={loading}
        loadingText="Loading quotations…"
        rowKey={(q) => q.id}
        emptyIcon={<FileText className="w-8 h-8" />}
        emptyTitle="No quotations yet"
        emptyMessage="Create your first freight quote to track a customer enquiry through to a booking."
        emptyAction={
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Quotation
          </button>
        }
        columns={[
          { key: "quoteNo", header: "Quote No", render: (q) => <span className="font-mono font-bold text-[#111827]">{q.quoteNo}</span> },
          {
            key: "party",
            header: "Customer",
            render: (q) => (
              <div>
                <div className="font-bold text-[#111827]">{q.partyName || "—"}</div>
                {q.partyMobile && <div className="text-[10px] text-[#94A3B8]">{q.partyMobile}</div>}
              </div>
            ),
          },
          {
            key: "route",
            header: "Route",
            render: (q) => <span className="text-[#334155]">{[q.fromLocation, q.toLocation].filter(Boolean).join(" → ") || "—"}</span>,
          },
          { key: "estimatedFreight", header: "Est. Freight", align: "right", render: (q) => <span className="font-mono font-bold text-[#111827]">{inr(q.estimatedFreight)}</span> },
          { key: "validUntil", header: "Valid Until", render: (q) => <span className="text-[#64748B]">{fmtDate(q.validUntil)}</span> },
          {
            key: "status",
            header: "Status",
            render: (q) => {
              const meta = STATUS_META[q.statusName] || STATUS_META.Draft;
              return <span className={`inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full border ${meta.badge}`}>{meta.label}</span>;
            },
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (q) => (
              <div className="flex items-center justify-end gap-1.5">
                {q.status === QuotationStatus.Draft && (
                  <button title="Mark as Sent" onClick={() => changeStatus(q, QuotationStatus.Sent)} className="p-1.5 rounded-lg text-[#2F6FBF] hover:bg-[#EAF2FB] transition cursor-pointer"><Send className="w-3.5 h-3.5" /></button>
                )}
                {q.status === QuotationStatus.Sent && (
                  <button title="Mark as Accepted" onClick={() => changeStatus(q, QuotationStatus.Accepted)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                )}
                {(q.status === QuotationStatus.Accepted || q.status === QuotationStatus.Sent) && (
                  <button title="Convert to Booking" onClick={() => convertToBooking(q)} className="p-1.5 rounded-lg text-[#25776F] hover:bg-[#E7F1F2] transition cursor-pointer"><ArrowRightCircle className="w-3.5 h-3.5" /></button>
                )}
                <button title="Print / PDF" onClick={() => printQuotation(q)} className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition cursor-pointer"><Printer className="w-3.5 h-3.5" /></button>
                <button title="Edit" onClick={() => { setEditing(q); setModalOpen(true); }} className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                <button title="Delete" onClick={() => handleDelete(q)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ),
          },
        ]}
      />

      <QuotationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchQuotes} initial={editing} />
    </div>
  );
}
