"use client";

import React, { useState, useEffect } from "react";
import { MoneyReceiptDto } from "@/types/moneyReceipt";
import { moneyReceiptService } from "services/moneyReceiptService";
import { numberToWords } from "@/utils/numberToWords";
import { getTenantPrintProfile } from "@/utils/print/tenantProfile";
import {
  Banknote,
  Search,
  Calendar,
  AlertTriangle,
  Receipt,
  Printer,
  FileText,
  X
} from "lucide-react";

export default function MoneyReceiptsPage() {
  const [receipts, setReceipts] = useState<MoneyReceiptDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("");

  // Modal / Print View
  const [selectedReceipt, setSelectedReceipt] = useState<MoneyReceiptDto | null>(null);
  // Tenant branding for the printed receipt (company name, logo, address).
  const printProfile = getTenantPrintProfile();

  useEffect(() => {
    fetchReceipts();
  }, [startDate, endDate, paymentModeFilter]);

  const fetchReceipts = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await moneyReceiptService.getReceipts({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchTerm || undefined,
        paymentMode: paymentModeFilter || undefined,
      });
      setReceipts(res || []);
    } catch (err: any) {
      console.error("Fetch money receipts error:", err);
      setError(err?.message || "Failed to load money receipts.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReceipts(search);
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSearch("");
    setPaymentModeFilter("");
    fetchReceipts("");
  };

  // KPIs
  const totalAmount = receipts.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
  const totalCash = receipts
    .filter((r) => r.paymentMode.toLowerCase() === "cash")
    .reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
  const totalOnline = totalAmount - totalCash;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-[#E5EAEB] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-[#E7F1F2] text-[#47868C] rounded-lg text-sm font-bold flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-[#111827] tracking-tight">
              Money Receipts (MR) & Counter Cash Collections
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#E7F1F2] text-[#2F9E8F] border border-[#2F9E8F]/30 rounded-full">
              Paid Bilties
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Official legal money receipts generated exclusively for Paid Bilties (including Freight, Hamali, D.D. Charge, Stationery, and Surcharges).
          </p>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-2xs">
          <p className="text-xs font-semibold text-[#64748B]">Total Money Receipts</p>
          <p className="text-2xl font-black text-[#111827] mt-1">{receipts.length}</p>
          <p className="text-[10px] text-[#94A3B8] mt-1">Paid Bilty transactions</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-2xs">
          <p className="text-xs font-semibold text-[#64748B]">Total Collections (₹)</p>
          <p className="text-2xl font-black text-[#2F9E8F] font-mono mt-1">
            ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-[#2F9E8F] mt-1">Across filtered date range</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-2xs">
          <p className="text-xs font-semibold text-[#64748B]">Cash Collections</p>
          <p className="text-xl font-black text-[#111827] font-mono mt-1">
            ₹{totalCash.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-[#94A3B8] mt-1">Physical counter cash</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-2xs">
          <p className="text-xs font-semibold text-[#64748B]">UPI / Bank Transfers</p>
          <p className="text-xl font-black text-[#4A90E2] font-mono mt-1">
            ₹{totalOnline.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-[#4A90E2] mt-1">Digital payments</p>
        </div>
      </div>

      {/* Date Range & Search Toolbar */}
      <div className="bg-white rounded-xl border border-[#E5EAEB] p-4 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-80">
          <input
            type="text"
            placeholder="Search MR No, Bilty No, Payer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-24 bg-white border border-[#D9E2E3] rounded-lg text-xs font-semibold text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C]"
          />
          <Search className="absolute left-3 top-3 text-[#94A3B8] w-4 h-4" />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-3 py-1 bg-[#47868C] hover:bg-[#3F7C82] text-white font-semibold rounded-md text-xs transition cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Date Range Inputs */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B]">
            <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 px-3 py-1.5 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C] cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B]">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 px-3 py-1.5 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C] cursor-pointer"
            />
          </div>

          {(startDate || endDate || search || paymentModeFilter) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn-secondary h-10 min-w-[80px] text-xs"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[#D95C5C] text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#D95C5C] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Money Receipts Table */}
      <div className="bg-white rounded-xl border border-[#E5EAEB] shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-[#64748B] text-xs">Loading money receipts...</div>
        ) : receipts.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="flex justify-center">
              <Receipt className="w-12 h-12 text-[#94A3B8]" />
            </div>
            <p className="text-sm font-bold text-[#111827]">No Money Receipts Found</p>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Money Receipts are automatically generated when Bilties are booked with payment term &ldquo;Paid&rdquo;.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F8F8] border-b border-[#E5EAEB] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">MR No</th>
                  <th className="py-3 px-4">Receipt Date</th>
                  <th className="py-3 px-4">Bilty / GR No</th>
                  <th className="py-3 px-4">Received From (Payer)</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4 text-center">Packages</th>
                  <th className="py-3 px-4 text-center">Payment Mode</th>
                  <th className="py-3 px-4 text-right">Amount Paid (₹)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAEB]">
                {receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F5FAFA] transition">
                    {/* MR No */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#47868C]">
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(r)}
                        className="hover:underline cursor-pointer font-black"
                      >
                        {r.receiptNo}
                      </button>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 font-medium text-[#111827]">
                      {r.receiptDate ? r.receiptDate.split("T")[0] : "—"}
                    </td>

                    {/* Bilty No */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#4A90E2]">
                      {r.shipmentNo}
                    </td>

                    {/* Payer Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#111827]">{r.payerName}</div>
                      {r.payerGstNo && <div className="text-[10px] text-[#94A3B8] font-mono">GST: {r.payerGstNo}</div>}
                    </td>

                    {/* Route */}
                    <td className="py-3.5 px-4 text-[#111827]">
                      {r.fromLocation || "Origin"} &rarr; {r.toLocation || "—"}
                    </td>

                    {/* Packages */}
                    <td className="py-3.5 px-4 text-center font-bold text-[#111827]">
                      {r.totalPackages} PKG
                    </td>

                    {/* Payment Mode */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex px-2 py-0.5 text-[10px] font-bold bg-[#E7F1F2] text-[#2F9E8F] border border-[#2F9E8F]/30 rounded-md">
                        {r.paymentMode || "CASH"}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#2F9E8F] text-sm">
                      ₹{r.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(r)}
                        className="px-3 py-1 bg-[#47868C] hover:bg-[#3F7C82] text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-2xs flex items-center gap-1.5 ml-auto"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print MR</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  className="btn-primary h-9 min-w-[120px] text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="btn-secondary h-9 min-w-[80px] text-xs flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Authentic Money Receipt Slip Layout */}
            <div className="bg-[#f0fdf4] border-2 border-emerald-500 p-6 rounded-xl space-y-4 font-sans text-emerald-950">
              {/* Receipt Header — neutral white band + tenant logo (in a white box) top-left, so any logo colour reads cleanly */}
              <div className="bg-white -mx-6 -mt-6 px-6 pt-5 pb-4 rounded-t-xl border-b-2 border-slate-800">
                <div className="flex items-start gap-3">
                  {printProfile.logoUrl && (
                    <div className="w-16 h-16 shrink-0 bg-white border border-slate-200 rounded-md p-1 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={printProfile.logoUrl}
                        alt="Company Logo"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
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
                  <span className="font-bold">{selectedReceipt.receiptDate}</span>
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
                    Carriage of <strong>{selectedReceipt.totalPackages} PKGS</strong> ({selectedReceipt.totalWeightKg} Kg) from <strong>{selectedReceipt.fromLocation || "Pahari"}</strong> to <strong>{selectedReceipt.toLocation || "—"}</strong>
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
                      <td className="py-1.5 px-3 text-right font-mono font-bold">₹{selectedReceipt.baseFreight.toFixed(2)}</td>
                    </tr>
                    {selectedReceipt.hamaliCharges > 0 && (
                      <tr>
                        <td className="py-1.5 px-3 border-r border-emerald-200">Hamali / Loading Charges</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold">₹{selectedReceipt.hamaliCharges.toFixed(2)}</td>
                      </tr>
                    )}
                    {selectedReceipt.doorDeliveryCharges > 0 && (
                      <tr>
                        <td className="py-1.5 px-3 border-r border-emerald-200">Door Delivery (D.D. Charge)</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold">₹{selectedReceipt.doorDeliveryCharges.toFixed(2)}</td>
                      </tr>
                    )}
                    {selectedReceipt.stationeryCharges > 0 && (
                      <tr>
                        <td className="py-1.5 px-3 border-r border-emerald-200">Stationery / Documentation (St. Char)</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold">₹{selectedReceipt.stationeryCharges.toFixed(2)}</td>
                      </tr>
                    )}
                    {selectedReceipt.surcharges > 0 && (
                      <tr>
                        <td className="py-1.5 px-3 border-r border-emerald-200">Surcharge / Service Charge (S. Char)</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold">₹{selectedReceipt.surcharges.toFixed(2)}</td>
                      </tr>
                    )}
                    {selectedReceipt.otherCharges > 0 && (
                      <tr>
                        <td className="py-1.5 px-3 border-r border-emerald-200">Other Ancillary Charges</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold">₹{selectedReceipt.otherCharges.toFixed(2)}</td>
                      </tr>
                    )}
                    {selectedReceipt.gstAmount > 0 && (
                      <tr>
                        <td className="py-1.5 px-3 border-r border-emerald-200">GST / Tax Amount</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold">₹{selectedReceipt.gstAmount.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="bg-emerald-100 font-black text-sm">
                      <td className="py-2 px-3 border-r border-emerald-300 text-emerald-950">
                        GRAND TOTAL RECEIVED:
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-900 text-base">
                        ₹{selectedReceipt.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
                  For Keshri Transport (Cashier / Incharge)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
