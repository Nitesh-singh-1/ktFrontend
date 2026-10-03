"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MoneyReceiptDto } from "@/types/moneyReceipt";
import { moneyReceiptService } from "services/moneyReceiptService";
import { numberToWords } from "@/utils/numberToWords";
import { getTenantPrintProfile } from "@/utils/print/tenantProfile";
import { DatePicker, CustomSelect } from "@/app/components/ui";
import {
  Banknote,
  Search,
  AlertTriangle,
  Receipt,
  Printer,
  FileText,
  X,
  CreditCard,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/configFormatter";
import { toast } from "@/context/ToastContext";

export default function MoneyReceiptsPage() {
  const [receipts, setReceipts] = useState<MoneyReceiptDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("ALL");
  const [payerFilter, setPayerFilter] = useState("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal / Print View
  const [selectedReceipt, setSelectedReceipt] = useState<MoneyReceiptDto | null>(null);
  const printProfile = getTenantPrintProfile();

  useEffect(() => {
    fetchReceipts();
  }, [startDate, endDate]);

  const fetchReceipts = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await moneyReceiptService.getReceipts({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchTerm || undefined,
        paymentMode: paymentModeFilter !== "ALL" ? paymentModeFilter : undefined,
      });
      setReceipts(res || []);
    } catch (err: any) {
      console.error("Fetch money receipts error:", err);
      setError(err?.message || "Failed to load money receipts.");
    } finally {
      setLoading(false);
    }
  };

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, search, paymentModeFilter, payerFilter]);

  // Unique Payers List for the Party Filter
  const uniquePayers = useMemo(() => {
    const payerMap = new Map<string, number>();
    receipts.forEach((r) => {
      const p = r.payerName?.trim();
      if (p) payerMap.set(p, (payerMap.get(p) || 0) + 1);
    });
    return Array.from(payerMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [receipts]);

  // Client-side filtering for live search, payment mode, and payer
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      // Payment mode filter
      if (paymentModeFilter !== "ALL") {
        if ((r.paymentMode || "CASH").toUpperCase() !== paymentModeFilter.toUpperCase()) {
          return false;
        }
      }
      // Payer filter
      if (payerFilter !== "ALL") {
        if ((r.payerName || "").toLowerCase() !== payerFilter.toLowerCase()) {
          return false;
        }
      }
      // Live search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const mr = (r.receiptNo || "").toLowerCase();
        const gr = (r.shipmentNo || "").toLowerCase();
        const payer = (r.payerName || "").toLowerCase();
        const from = (r.fromLocation || "").toLowerCase();
        const to = (r.toLocation || "").toLowerCase();
        return (
          mr.includes(q) ||
          gr.includes(q) ||
          payer.includes(q) ||
          from.includes(q) ||
          to.includes(q)
        );
      }
      return true;
    });
  }, [receipts, paymentModeFilter, payerFilter, search]);

  // Paginated records
  const paginatedReceipts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReceipts.slice(start, start + pageSize);
  }, [filteredReceipts, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredReceipts.length / pageSize));

  // Preset Date Handlers
  const handleSetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const todayStr = now.toISOString().slice(0, 10);
    setStartDate(firstDay);
    setEndDate(todayStr);
  };

  const handleSetLastMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  const handleSetLast30Days = () => {
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - 30);
    setStartDate(past.toISOString().slice(0, 10));
    setEndDate(now.toISOString().slice(0, 10));
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSearch("");
    setPaymentModeFilter("ALL");
    setPayerFilter("ALL");
  };

  // CSV Export for Receipts
  const handleExportCsv = () => {
    if (filteredReceipts.length === 0) {
      toast.info("No receipts found to export.");
      return;
    }
    const headers = [
      "MR No",
      "Receipt Date",
      "Bilty / GR No",
      "Payer Name",
      "Payer GSTIN",
      "Route",
      "Packages",
      "Weight (Kg)",
      "Payment Mode",
      "Basic Freight",
      "Hamali",
      "D.D. Charges",
      "Stationery",
      "Surcharges",
      "GST Amount",
      "Total Amount Paid",
    ];
    const esc = (v: string | number) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = filteredReceipts.map((r) => [
      r.receiptNo,
      r.receiptDate ? formatDate(r.receiptDate) : "-",
      r.shipmentNo,
      r.payerName,
      r.payerGstNo || "-",
      `${r.fromLocation || "Origin"} → ${r.toLocation || "-"}`,
      r.totalPackages,
      r.totalWeightKg,
      r.paymentMode || "CASH",
      r.baseFreight,
      r.hamaliCharges,
      r.doorDeliveryCharges,
      r.stationeryCharges,
      r.surcharges,
      r.gstAmount,
      r.totalAmount,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Money_Receipts_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredReceipts.length} money receipts.`);
  };

  // KPIs
  const totalAmount = filteredReceipts.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
  const totalCash = filteredReceipts
    .filter((r) => (r.paymentMode || "").toLowerCase() === "cash")
    .reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
  const totalOnline = totalAmount - totalCash;

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[#E5EAEB] dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E7F1F2] dark:bg-slate-800 flex items-center justify-center text-[#2F8E86] font-bold text-lg shadow-xs">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#111827] dark:text-white tracking-tight">
                  Money Receipts (MR) & Counter Collections
                </h1>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 bg-[#E7F1F2] dark:bg-slate-800 text-[#25776F] dark:text-teal-300 border border-[#D9E2E3] dark:border-slate-700 rounded-full">
                  Paid Bilties
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Official legal money receipts generated for Paid Bilties (including Freight, Hamali, D.D. Charge, Stationery, and GST).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredReceipts.length === 0}
            className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Total Money Receipts</p>
          <p className="text-2xl font-extrabold text-[#111827] dark:text-white mt-1">{filteredReceipts.length}</p>
          <p className="text-[10px] text-[#94A3B8] mt-1">Paid Bilty transactions</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Total Collections</p>
          <p className="text-xl font-bold text-[#2F9E8F] font-mono mt-1">
            {formatCurrency(totalAmount)}
          </p>
          <p className="text-[10px] text-[#2F9E8F] mt-1">Across filtered criteria</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Physical Counter Cash</p>
          <p className="text-xl font-bold text-[#111827] dark:text-slate-200 font-mono mt-1">
            {formatCurrency(totalCash)}
          </p>
          <p className="text-[10px] text-[#94A3B8] mt-1">Cash collections</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">UPI / Digital Payments</p>
          <p className="text-xl font-bold text-[#2F8E86] font-mono mt-1">
            {formatCurrency(totalOnline)}
          </p>
          <p className="text-[10px] text-[#2F8E86] mt-1">Bank / Digital transfers</p>
        </div>
      </div>

      {/* Modern Filter Toolbar with CustomSelect & 2 DatePickers */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 p-4 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Live Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search MR No, Bilty No, Payer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-[#F7F8F8] dark:bg-slate-800/80 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs text-[#111827] dark:text-slate-100 placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2F8E86] focus:ring-1 focus:ring-[#2F8E86] transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Payer / Customer Filter Dropdown */}
            <CustomSelect
              value={payerFilter}
              onChange={(val) => setPayerFilter(String(val))}
              icon={<Building2 className="w-3.5 h-3.5" />}
              searchable={true}
              options={[
                { label: `All Payers (${uniquePayers.length})`, value: "ALL" },
                ...uniquePayers.map((p) => ({
                  label: p.name,
                  value: p.name,
                  badge: p.count,
                })),
              ]}
              className="w-full sm:w-auto min-w-[180px]"
            />

            {/* Payment Mode Filter Dropdown */}
            <CustomSelect
              value={paymentModeFilter}
              onChange={(val) => setPaymentModeFilter(String(val))}
              icon={<CreditCard className="w-3.5 h-3.5" />}
              options={[
                { label: "All Modes", value: "ALL" },
                { label: "CASH", value: "CASH" },
                { label: "UPI", value: "UPI" },
                { label: "CHEQUE", value: "CHEQUE" },
                { label: "NEFT / RTGS", value: "NEFT" },
                { label: "BANK TRANSFER", value: "BANK_TRANSFER" },
              ]}
              className="w-full sm:w-auto min-w-[140px]"
            />
          </div>

          {/* 2 Separate DatePickers (From Date & To Date) */}
          <div className="flex flex-wrap items-center gap-2 text-xs w-full lg:w-auto justify-end">
            <div className="flex items-center gap-1.5">
              <DatePicker
                value={startDate}
                onChange={(d) => setStartDate(d)}
                placeholder="From Date"
                maxDate={endDate || todayStr}
                align="right"
              />
              <span className="text-slate-400 font-semibold text-xs">to</span>
              <DatePicker
                value={endDate}
                onChange={(d) => setEndDate(d)}
                placeholder="To Date"
                minDate={startDate}
                maxDate={todayStr}
                align="right"
              />
            </div>

            {/* Quick Presets */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={handleSetThisMonth}
                className="px-2.5 py-1.5 rounded-xl border border-[#D9E2E3] dark:border-slate-700 bg-[#F7F8F8] dark:bg-slate-800 text-[11px] font-semibold text-[#64748B] dark:text-slate-300 hover:bg-[#E7F1F2] dark:hover:bg-slate-700 hover:text-[#25776F] transition cursor-pointer"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={handleSetLastMonth}
                className="px-2.5 py-1.5 rounded-xl border border-[#D9E2E3] dark:border-slate-700 bg-[#F7F8F8] dark:bg-slate-800 text-[11px] font-semibold text-[#64748B] dark:text-slate-300 hover:bg-[#E7F1F2] dark:hover:bg-slate-700 hover:text-[#25776F] transition cursor-pointer"
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={handleSetLast30Days}
                className="px-2.5 py-1.5 rounded-xl border border-[#D9E2E3] dark:border-slate-700 bg-[#F7F8F8] dark:bg-slate-800 text-[11px] font-semibold text-[#64748B] dark:text-slate-300 hover:bg-[#E7F1F2] dark:hover:bg-slate-700 hover:text-[#25776F] transition cursor-pointer"
              >
                Last 30 Days
              </button>
            </div>

            {(startDate || endDate || search || paymentModeFilter !== "ALL" || payerFilter !== "ALL") && (
              <button
                type="button"
                onClick={handleClearFilters}
                title="Clear all filters"
                className="p-2 text-xs text-[#D95C5C] hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer flex items-center gap-1 border border-rose-200 dark:border-rose-900/50"
              >
                <X className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl text-[#D95C5C] text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#D95C5C] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Money Receipts Table (Single-Line Horizontally Scrollable) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-[#F7F8F8] dark:bg-slate-800/60 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-200">
              Money Receipts Ledger
            </span>
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400">
              ({filteredReceipts.length} receipt{filteredReceipts.length === 1 ? "" : "s"})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-[#F7F8F8] dark:bg-slate-800/40 border-b border-[#E5EAEB] dark:border-slate-800 text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3 px-4">MR No</th>
                <th className="py-3 px-4">Receipt Date</th>
                <th className="py-3 px-4">Bilty / GR No</th>
                <th className="py-3 px-4">Received From (Payer)</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4 text-center">Packages</th>
                <th className="py-3 px-4 text-center">Payment Mode</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAEB] dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#64748B] dark:text-slate-400">
                    <div className="w-6 h-6 mx-auto border-2 border-[#2F8E86] border-t-transparent rounded-full animate-spin mb-2" />
                    Loading money receipts...
                  </td>
                </tr>
              ) : paginatedReceipts.length > 0 ? (
                paginatedReceipts.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-[#F5FAFA] dark:hover:bg-slate-800/60 transition whitespace-nowrap"
                  >
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(r)}
                        className="font-mono font-bold text-[#2F8E86] hover:underline cursor-pointer"
                      >
                        {r.receiptNo}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-[#64748B] dark:text-slate-400">
                      {r.receiptDate ? formatDate(r.receiptDate) : "—"}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#4A90E2]">
                      {r.shipmentNo}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#111827] dark:text-slate-200">
                      <div>
                        <div>{r.payerName || "—"}</div>
                        {r.payerGstNo && (
                          <div className="text-[10px] text-[#94A3B8] font-mono font-normal">
                            GST: {r.payerGstNo}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#64748B] dark:text-slate-400">
                      {r.fromLocation || "Origin"} → {r.toLocation || "—"}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-[#111827] dark:text-slate-200 font-mono">
                      {r.totalPackages} PKG
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex px-2 py-0.5 text-[10px] font-bold bg-[#E7F1F2] dark:bg-slate-800 text-[#25776F] dark:text-teal-300 border border-[#D9E2E3] dark:border-slate-700 rounded-md uppercase">
                        {r.paymentMode || "CASH"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#2F9E8F]">
                      {formatCurrency(r.totalAmount || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(r)}
                        className="px-2.5 py-1 rounded-lg border border-[#D9E2E3] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#2F8E86] hover:bg-[#E7F1F2] dark:hover:bg-slate-700 transition cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print MR</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#64748B] dark:text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No Money Receipts Found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Money receipts are automatically generated when Bilties are booked with payment term "Paid".
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredReceipts.length > 0 && (
          <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-[#E5EAEB] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B] dark:text-slate-400">
              <span>
                Showing <strong className="text-[#111827] dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
                <strong className="text-[#111827] dark:text-slate-200">{Math.min(currentPage * pageSize, filteredReceipts.length)}</strong> of{" "}
                <strong className="text-[#111827] dark:text-slate-200">{filteredReceipts.length}</strong> receipts
              </span>

              <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                <CustomSelect
                  value={pageSize}
                  onChange={(val) => {
                    setPageSize(Number(val));
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: "10 per page", value: 10 },
                    { label: "25 per page", value: 25 },
                    { label: "50 per page", value: 50 },
                    { label: "100 per page", value: 100 },
                  ]}
                  className="w-32"
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="First Page"
                aria-label="First page"
                className="p-1.5 rounded-lg border border-[#D9E2E3] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title="Previous Page"
                aria-label="Previous page"
                className="p-1.5 rounded-lg border border-[#D9E2E3] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-2">
                <span className="text-xs font-semibold text-[#111827] dark:text-slate-200">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                title="Next Page"
                aria-label="Next page"
                className="p-1.5 rounded-lg border border-[#D9E2E3] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="Last Page"
                aria-label="Last page"
                className="p-1.5 rounded-lg border border-[#D9E2E3] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Printable Money Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-900 space-y-4 max-h-[92vh] overflow-y-auto print:p-0 print:m-0 print:max-w-none print:shadow-none print:rounded-none">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between border-b pb-3 print:hidden">
              <span className="font-bold text-xs text-slate-600 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Print Preview: Official Transporter Money Receipt (MR)</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Authentic Money Receipt Slip Layout */}
            <div className="bg-[#f0fdf4] border-2 border-emerald-500 p-6 rounded-xl space-y-4 font-sans text-emerald-950">
              {/* Receipt Header */}
              <div className="bg-white -mx-6 -mt-6 px-6 pt-5 pb-4 rounded-t-xl border-b-2 border-slate-800">
                <div className="flex items-start gap-3">
                  {printProfile.logoUrl && (
                    <div className="w-16 h-16 shrink-0 bg-white border border-slate-200 rounded-md p-1 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={printProfile.logoUrl}
                        alt="Company Logo"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold tracking-widest uppercase bg-slate-800 text-white px-3 py-0.5 rounded-full">
                      OFFICIAL MONEY RECEIPT (MR)
                    </span>
                    <h1 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight uppercase">
                      {printProfile.companyName}
                    </h1>
                    {printProfile.address && (
                      <p className="text-xs font-bold text-slate-600">{printProfile.address}</p>
                    )}
                    <p className="text-[11px] text-slate-500">
                      Goods Transport Agency (GTA) • Freight &amp; Handling Cash Receipt
                      {printProfile.gstin ? ` • GSTIN: ${printProfile.gstin}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Receipt Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs border-b border-emerald-300 pb-3">
                <div>
                  <span className="font-bold text-emerald-800">MR Number: </span>
                  <span className="font-mono font-black text-sm">{selectedReceipt.receiptNo}</span>
                </div>
                <div>
                  <span className="font-bold text-emerald-800">Receipt Date: </span>
                  <span className="font-bold">{selectedReceipt.receiptDate ? formatDate(selectedReceipt.receiptDate) : "-"}</span>
                </div>
                <div>
                  <span className="font-bold text-emerald-800">Against Bilty / GR No: </span>
                  <span className="font-mono font-black text-sm text-blue-800">{selectedReceipt.shipmentNo}</span>
                </div>

                <div className="sm:col-span-2">
                  <span className="font-bold text-emerald-800">Received With Thanks From M/s: </span>
                  <span className="font-bold text-sm">{selectedReceipt.payerName}</span>
                  {selectedReceipt.payerGstNo && (
                    <span className="text-[10px] text-slate-600 block">GSTIN: {selectedReceipt.payerGstNo}</span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-emerald-800">Payment Mode: </span>
                  <span className="font-bold uppercase bg-emerald-200 px-2 py-0.5 rounded">{selectedReceipt.paymentMode}</span>
                </div>

                <div className="sm:col-span-3">
                  <span className="font-bold text-emerald-800">Route & Cargo: </span>
                  <span>
                    Carriage of <strong>{selectedReceipt.totalPackages} PKGS</strong> ({selectedReceipt.totalWeightKg} Kg) from <strong>{selectedReceipt.fromLocation || "Origin"}</strong> to <strong>{selectedReceipt.toLocation || "—"}</strong>
                  </span>
                </div>
              </div>

              {/* Itemized Charges Table */}
              <div>
                <table className="w-full text-left text-xs border-collapse border border-emerald-400 bg-white">
                  <thead>
                    <tr className="bg-emerald-200 text-emerald-950 font-black">
                      <th className="py-2 px-3 border-r border-emerald-300">Particulars / Fee Line-Item</th>
                      <th className="py-2 px-3 text-right w-36">Amount Received (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-200">
                    <tr>
                      <td className="py-1.5 px-3 border-r border-emerald-200">Basic Freight Charges</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold">{formatCurrency(selectedReceipt.baseFreight || 0)}</td>
                    </tr>
                    {selectedReceipt.hamaliCharges > 0 && (
                      <tr>
                        <td className="py-1.5 px-3 border-r border-emerald-200">Hamali / Loading Charges</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold">{formatCurrency(selectedReceipt.hamaliCharges || 0)}</td>
                      </tr>
                    )}
                    {selectedReceipt.doorDeliveryCharges > 0 && (
                      <tr>
                        <td className="py-1.5 px-3 border-r border-emerald-200">Door Delivery (D.D. Charge)</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold">{formatCurrency(selectedReceipt.doorDeliveryCharges || 0)}</td>
                      </tr>
                    )}
                    {selectedReceipt.stationeryCharges > 0 && (
                      <tr>
                        <td className="py-1.5 px-3 border-r border-emerald-200">Stationery / Documentation (St. Char)</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold">{formatCurrency(selectedReceipt.stationeryCharges || 0)}</td>
                      </tr>
                    )}
                    {selectedReceipt.surcharges > 0 && (
                      <tr>
                        <td className="py-1.5 px-3 border-r border-emerald-200">Surcharge / Service Charge (S. Char)</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold">{formatCurrency(selectedReceipt.surcharges || 0)}</td>
                      </tr>
                    )}
                    {selectedReceipt.otherCharges > 0 && (
                      <tr>
                        <td className="py-1.5 px-3 border-r border-emerald-200">Other Ancillary Charges</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold">{formatCurrency(selectedReceipt.otherCharges || 0)}</td>
                      </tr>
                    )}
                    {selectedReceipt.gstAmount > 0 && (
                      <tr>
                        <td className="py-1.5 px-3 border-r border-emerald-200">GST / Tax Amount</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold">{formatCurrency(selectedReceipt.gstAmount || 0)}</td>
                      </tr>
                    )}
                    <tr className="bg-emerald-100 font-black text-sm">
                      <td className="py-2 px-3 border-r border-emerald-300 text-emerald-950">
                        GRAND TOTAL RECEIVED:
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-900 text-base">
                        {formatCurrency(selectedReceipt.totalAmount || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* In Words */}
              <div className="p-2.5 bg-white border border-emerald-300 rounded-lg text-xs">
                <span className="font-bold text-emerald-900">Rupees in Words: </span>
                <span className="italic font-semibold text-slate-800">
                  {numberToWords(selectedReceipt.totalAmount) || "Zero Rupees Only"}
                </span>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 pt-8 text-xs font-bold text-center">
                <div className="border-t border-emerald-800 mx-6 pt-1">
                  Customer / Payer Signature
                </div>
                <div className="border-t border-emerald-800 mx-6 pt-1">
                  For {printProfile.companyName} (Cashier / Incharge)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
