"use client";

import React, { useState, useEffect } from "react";
import { Invoice, InvoicePaymentStatus } from "@/types/shipment";
import { invoiceService } from "services/invoiceService";
import InvoiceModal from "@/app/components/invoice/InvoiceModal";
import PaymentRecordModal from "@/app/components/invoice/PaymentRecordModal";
import InvoiceDetailsModal from "@/app/components/invoice/InvoiceDetailsModal";
import { Plus, Search, AlertTriangle, FileText, Receipt, X, CreditCard, Eye, Ban } from "lucide-react";
import { DataTable } from "@/app/components/ui/DataTable";

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedForPayment, setSelectedForPayment] = useState<Invoice | null>(null);
  const [selectedForDetails, setSelectedForDetails] = useState<number | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await invoiceService.getInvoices({
        search: searchTerm || undefined,
        paymentStatus: statusFilter !== "" ? Number(statusFilter) : undefined,
      });
      setInvoices(res || []);
    } catch (err: any) {
      console.error("Error fetching invoices:", err);
      setError(err?.message || "Failed to load freight invoices.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices(search);
  };

  const handleCancelInvoice = async (invoice: Invoice) => {
    if (!confirm(`Are you sure you want to void / cancel Invoice ${invoice.invoiceNo}?`)) {
      return;
    }
    try {
      await invoiceService.deleteInvoice(invoice.id);
      fetchInvoices();
    } catch (err: any) {
      console.error("Cancel invoice error:", err);
      alert(err?.message || "Failed to cancel invoice.");
    }
  };

  // Financial KPIs
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (Number(inv.balanceAmount) || 0), 0);
  const unpaidCount = invoices.filter((inv) => inv.paymentStatus === InvoicePaymentStatus.Unpaid || inv.paymentStatus === InvoicePaymentStatus.PartiallyPaid).length;

  const getStatusBadge = (status: InvoicePaymentStatus) => {
    switch (status) {
      case InvoicePaymentStatus.Paid:
        return { text: "PAID", class: "bg-[#E7F1F2] text-[#2F9E8F] border-[#2F9E8F]/30" };
      case InvoicePaymentStatus.PartiallyPaid:
        return { text: "PARTIALLY PAID", class: "bg-[#F0F7FF] text-[#4A90E2] border-[#D0E2FF]" };
      case InvoicePaymentStatus.Cancelled:
        return { text: "CANCELLED", class: "bg-red-50 text-[#D95C5C] border-red-200" };
      default:
        return { text: "UNPAID", class: "bg-[#FDF3E7] text-[#B76E32] border-[#F4A261]/30" };
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-[#E5EAEB] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#111827] tracking-tight">
              Freight Invoicing & AR Ledger
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] rounded-full">
              Commercial Billing
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Generate GST freight bills, link multiple consignments (waybills), track payment receipts, and balance outstanding receivables.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Freight Invoice</span>
        </button>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-2xs">
          <p className="text-xs font-semibold text-[#64748B]">Total Invoiced (Billed)</p>
          <p className="text-xl font-black text-[#111827] font-mono mt-1">
            ₹{totalInvoiced.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-[#94A3B8] mt-1">Across all registered bills</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-2xs">
          <p className="text-xs font-semibold text-[#64748B]">Collected Receipts</p>
          <p className="text-xl font-black text-[#2F9E8F] font-mono mt-1">
            ₹{totalCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-[#2F9E8F] mt-1">Settled & deposited</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-2xs">
          <p className="text-xs font-semibold text-[#64748B]">Outstanding Receivables</p>
          <p className="text-xl font-black text-[#4A90E2] font-mono mt-1">
            ₹{totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-[#4A90E2] mt-1">Due balance from parties</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-2xs">
          <p className="text-xs font-semibold text-[#64748B]">Pending Invoices</p>
          <p className="text-xl font-black text-[#F4A261] mt-1">{unpaidCount}</p>
          <p className="text-[10px] text-[#B76E32] mt-1">Awaiting full payment</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-[#E5EAEB] p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search invoice no, party name, GST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-20 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
          <button
            type="submit"
            className="absolute right-1.5 top-1 px-3 py-1 bg-[#F7F8F8] border border-[#D9E2E3] hover:bg-[#E7F1F2] text-[#25776F] font-bold rounded-md text-[11px] transition cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { label: "All Invoices", value: "" },
            { label: "Unpaid", value: InvoicePaymentStatus.Unpaid.toString() },
            { label: "Partially Paid", value: InvoicePaymentStatus.PartiallyPaid.toString() },
            { label: "Paid", value: InvoicePaymentStatus.Paid.toString() },
            { label: "Cancelled", value: InvoicePaymentStatus.Cancelled.toString() },
          ].map((tab) => {
            const isSelected = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-[#2F8E86] text-white shadow-xs"
                    : "bg-white text-[#64748B] hover:bg-[#E7F1F2] border border-[#E5EAEB]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[#D95C5C] text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Invoices Table */}
      <DataTable<Invoice>
        data={invoices}
        loading={loading}
        loadingText="Loading freight invoices & ledger…"
        rowKey={(inv) => inv.id}
        emptyIcon={<Receipt className="w-8 h-8" />}
        emptyTitle="No Invoices Found"
        emptyMessage="Generate your first freight invoice to bill customers, link consignments, and balance receipts."
        emptyAction={
          <button onClick={() => setIsCreateOpen(true)} className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Generate First Invoice
          </button>
        }
        columns={[
          {
            key: "invoiceNo",
            header: "Invoice No",
            render: (inv) => (
              <button onClick={() => setSelectedForDetails(inv.id)} className="font-mono font-bold text-[#2F8E86] hover:underline cursor-pointer">{inv.invoiceNo}</button>
            ),
          },
          {
            key: "invoiceDate",
            header: "Invoice Date",
            render: (inv) => <span className="font-medium text-[#111827] dark:text-slate-200 whitespace-nowrap">{inv.invoiceDate ? inv.invoiceDate.split("T")[0] : "—"}</span>,
          },
          {
            key: "party",
            header: "Billed Customer (Party)",
            render: (inv) => (
              <div>
                <div className="font-bold text-[#111827] dark:text-white">{inv.partyName || inv.party?.name || "Customer"}</div>
                {inv.partyGstNo && <div className="text-[10px] font-mono text-[#94A3B8]">GST: {inv.partyGstNo}</div>}
              </div>
            ),
          },
          {
            key: "grandTotal",
            header: "Grand Total (₹)",
            align: "right",
            render: (inv) => <span className="font-mono font-bold text-[#111827] dark:text-white whitespace-nowrap">₹{(inv.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>,
          },
          {
            key: "paid",
            header: "Paid (₹)",
            align: "right",
            render: (inv) => <span className="font-mono font-bold text-[#2F9E8F] whitespace-nowrap">₹{(inv.paidAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>,
          },
          {
            key: "balance",
            header: "Balance Due (₹)",
            align: "right",
            render: (inv) => <span className="font-mono font-bold text-[#4A90E2] whitespace-nowrap">₹{(inv.balanceAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>,
          },
          {
            key: "status",
            header: "Status",
            align: "center",
            render: (inv) => {
              const badge = getStatusBadge(inv.paymentStatus);
              return <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold border rounded-md ${badge.class}`}>{badge.text}</span>;
            },
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (inv) => {
              const isSettled = inv.paymentStatus === InvoicePaymentStatus.Paid || inv.balanceAmount <= 0;
              return (
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => setSelectedForDetails(inv.id)} className="px-2.5 py-1 bg-white border border-[#D9E2E3] hover:bg-[#E7F1F2] text-[#25776F] font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-1" title="View Invoice Breakdown">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  {!isSettled && inv.paymentStatus !== InvoicePaymentStatus.Cancelled && (
                    <button onClick={() => setSelectedForPayment(inv)} className="px-2.5 py-1 bg-[#E7F1F2] hover:bg-[#2F9E8F] text-[#2F9E8F] hover:text-white border border-[#2F9E8F]/30 font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-1" title="Record Payment Receipt">
                      <CreditCard className="w-3.5 h-3.5" /> Receive
                    </button>
                  )}
                  {inv.paymentStatus !== InvoicePaymentStatus.Cancelled && (
                    <button onClick={() => handleCancelInvoice(inv)} className="p-1.5 text-[#94A3B8] hover:text-[#D95C5C] rounded-lg transition cursor-pointer" title="Cancel / Void Invoice">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            },
          },
        ]}
      />

      {/* Create Invoice Modal */}
      <InvoiceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaved={fetchInvoices}
      />

      {/* Record Payment Modal */}
      <PaymentRecordModal
        isOpen={!!selectedForPayment}
        onClose={() => setSelectedForPayment(null)}
        onSaved={fetchInvoices}
        invoice={selectedForPayment}
      />

      {/* Invoice Details & Print Modal */}
      <InvoiceDetailsModal
        isOpen={!!selectedForDetails}
        onClose={() => setSelectedForDetails(null)}
        invoiceId={selectedForDetails}
        onRecordPayment={(inv) => setSelectedForPayment(inv)}
      />
    </div>
  );
}
