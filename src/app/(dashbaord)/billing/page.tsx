"use client";

import React, { useState, useEffect } from "react";
import { Invoice, InvoicePaymentStatus } from "@/types/shipment";
import { invoiceService } from "services/invoiceService";
import InvoiceModal from "@/app/components/invoice/InvoiceModal";
import PaymentRecordModal from "@/app/components/invoice/PaymentRecordModal";
import InvoiceDetailsModal from "@/app/components/invoice/InvoiceDetailsModal";
import { Plus, Search, AlertTriangle, FileText, Receipt, X, CreditCard, Eye, Ban } from "lucide-react";

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
        return { text: "PAID", class: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" };
      case InvoicePaymentStatus.PartiallyPaid:
        return { text: "PARTIALLY PAID", class: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" };
      case InvoicePaymentStatus.Cancelled:
        return { text: "CANCELLED", class: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" };
      default:
        return { text: "UNPAID", class: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Freight Invoicing & AR Ledger
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full">
              Commercial Billing
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate GST freight bills, link multiple consignments (waybills), track payment receipts, and balance outstanding receivables.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Freight Invoice</span>
        </button>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Invoiced (Billed)</p>
          <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
            ₹{totalInvoiced.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Across all registered bills</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Collected Receipts</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            ₹{totalCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-500 mt-1">Settled & deposited</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Outstanding Receivables</p>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
            ₹{totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-blue-700 dark:text-blue-500 mt-1">Due balance from parties</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Invoices</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{unpaidCount}</p>
          <p className="text-[10px] text-amber-700 dark:text-amber-500 mt-1">Awaiting full payment</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search invoice no, party name, GST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-20 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <button
            type="submit"
            className="absolute right-1.5 top-1 px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-md text-[11px] transition cursor-pointer"
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
                    ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
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
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading freight invoices & ledger...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Invoices Found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Generate your first freight invoice to bill customers, link consignments, and balance receipts.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Generate First Invoice</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Billed Customer (Party)</th>
                  <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-4 text-right">Paid (₹)</th>
                  <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => {
                  const statusBadge = getStatusBadge(inv.paymentStatus);
                  const isSettled = inv.paymentStatus === InvoicePaymentStatus.Paid || inv.balanceAmount <= 0;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      {/* Invoice No */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setSelectedForDetails(inv.id)}
                          className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer"
                        >
                          {inv.invoiceNo}
                        </button>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {inv.invoiceDate ? inv.invoiceDate.split("T")[0] : "—"}
                      </td>

                      {/* Party */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{inv.partyName || inv.party?.name || "Customer"}</div>
                        {inv.partyGstNo && (
                          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">GST: {inv.partyGstNo}</div>
                        )}
                      </td>

                      {/* Grand Total */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₹{(inv.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Paid */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{(inv.paidAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Balance */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                        ₹{(inv.balanceAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold border rounded-md ${statusBadge.class}`}>
                          {statusBadge.text}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedForDetails(inv.id)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-1"
                            title="View Invoice Breakdown"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {!isSettled && inv.paymentStatus !== InvoicePaymentStatus.Cancelled && (
                            <button
                              onClick={() => setSelectedForPayment(inv)}
                              className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-1"
                              title="Record Payment Receipt"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Receive</span>
                            </button>
                          )}

                          {inv.paymentStatus !== InvoicePaymentStatus.Cancelled && (
                            <button
                              onClick={() => handleCancelInvoice(inv)}
                              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition cursor-pointer"
                              title="Cancel / Void Invoice"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
