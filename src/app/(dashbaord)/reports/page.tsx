"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  TripProfitabilityReportDto,
  TaxSummaryReportDto,
  PartyOutstandingReportDto,
  VendorPayableReportDto,
  BookingRegisterReportDto,
} from "@/types/tms";
import { ShipmentStatus } from "@/types/shipment";
import { reportService } from "services/reportService";
import { useNavigation } from "@/context/NavigationContext";
import PagePermissionGuard from "@/app/components/ui/PagePermissionGuard";
import { renderPrintHeaderHtml, PRINT_HEADER_CSS, openPrintWindow } from "@/utils/print/printHeader";
import { toast } from "@/context/ToastContext";
import {
  BarChart3,
  Printer,
  Download,
  TrendingUp,
  Landmark,
  Building2,
  Handshake,
  Package,
  Search,
  ArrowRight
} from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/configFormatter";

type ReportTab = "profitability" | "gst" | "partyLedger" | "vendorLedger" | "booking";

function ReportsContent() {
  const searchParams = useSearchParams();
  const { menu } = useNavigation();

  const [activeTab, setActiveTab] = useState<ReportTab>("profitability");
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [profitability, setProfitability] = useState<TripProfitabilityReportDto | null>(null);
  const [gstSummary, setGstSummary] = useState<TaxSummaryReportDto | null>(null);
  const [partyLedger, setPartyLedger] = useState<PartyOutstandingReportDto[]>([]);
  const [vendorLedger, setVendorLedger] = useState<VendorPayableReportDto[]>([]);
  const [booking, setBooking] = useState<BookingRegisterReportDto | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      if (tabParam.includes("profit")) setActiveTab("profitability");
      else if (tabParam.includes("tax") || tabParam.includes("gst")) setActiveTab("gst");
      else if (tabParam.includes("party")) setActiveTab("partyLedger");
      else if (tabParam.includes("vendor")) setActiveTab("vendorLedger");
      else if (tabParam.includes("booking")) setActiveTab("booking");
    }
  }, [searchParams]);

  useEffect(() => {
    fetchReportData();
  }, [activeTab, fromDate, toDate]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      if (activeTab === "profitability") {
        const res = await reportService.getTripProfitabilityReport({ fromDate, toDate });
        setProfitability(res);
      } else if (activeTab === "gst") {
        const res = await reportService.getTaxSummaryReport({ fromDate, toDate });
        setGstSummary(res);
      } else if (activeTab === "partyLedger") {
        const res = await reportService.getPartyOutstandingReport();
        setPartyLedger(res || []);
      } else if (activeTab === "vendorLedger") {
        const res = await reportService.getVendorPayableReport();
        setVendorLedger(res || []);
      } else if (activeTab === "booking") {
        const res = await reportService.getBookingRegister({ fromDate, toDate });
        setBooking(res);
      }
    } catch (err) {
      console.error("Fetch report error:", err);
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = (s?: ShipmentStatus | number): string => {
    switch (s) {
      case ShipmentStatus.Draft: return "Draft";
      case ShipmentStatus.Booked: return "Booked";
      case ShipmentStatus.Manifested: return "Manifested";
      case ShipmentStatus.InTransit: return "In Transit";
      case ShipmentStatus.OutForDelivery: return "Out for Delivery";
      case ShipmentStatus.Delivered: return "Delivered";
      case ShipmentStatus.Returned: return "Returned";
      case ShipmentStatus.Cancelled: return "Cancelled";
      default: return "—";
    }
  };

  // Extracts the currently-active report as a flat dataset used by both CSV export and print.
  const getReportDataset = (): { title: string; headers: string[]; rows: (string | number)[][] } => {
    if (activeTab === "profitability") {
      return {
        title: "Trip Profitability Report",
        headers: ["Trip No", "Date", "Vehicle", "Driver", "Route", "Revenue", "Total Cost", "Net Profit", "Margin %"],
        rows: (profitability?.tripDetails || []).map((t) => [
          t.tripNo, formatDate(t.tripDate), t.vehicleNo || "", t.driverName || "",
          `${t.originLocation || ""} -> ${t.destinationLocation || ""}`,
          t.revenue, t.totalCost, t.netProfit, `${(t.profitMarginPct || 0).toFixed(1)}%`,
        ]),
      };
    }
    if (activeTab === "gst") {
      return {
        title: "GST Tax Summary Report",
        headers: ["Metric", "Amount"],
        rows: [
          ["Taxable Freight (Regular)", gstSummary?.totalTaxableFreight || 0],
          ["GST RCM Freight (Reverse)", gstSummary?.totalGstRcmFreight || 0],
          ["Exempt & Non-Taxable", gstSummary?.totalNonTaxableFreight || 0],
          ["Total GST Tax Collected", gstSummary?.totalTaxCollected || 0],
          ["Total Shipments", gstSummary?.totalShipmentsCount || 0],
        ],
      };
    }
    if (activeTab === "partyLedger") {
      return {
        title: "Customer Outstanding Ledger",
        headers: ["Party Name", "GSTIN", "Contact", "Total Billed", "Amount Paid", "Balance Outstanding"],
        rows: partyLedger.map((p) => [p.partyName, p.gstNo || "Unregistered", p.mobile || "", p.totalBilledAmount, p.totalPaidAmount, p.totalOutstandingDue]),
      };
    }
    if (activeTab === "vendorLedger") {
      return {
        title: "Vendor Payable Ledger",
        headers: ["Vendor / Broker", "PAN", "Contact", "Total Hire", "Advances Paid", "TDS Deducted", "Net Payable"],
        rows: vendorLedger.map((v) => [v.vendorName, v.panNo || "No PAN", v.mobile || "", v.totalHireAmount, v.totalAdvancePaid, v.totalTdsDeducted, v.totalBalancePayable]),
      };
    }
    return {
      title: "Consignment Booking Register",
      headers: ["GR No", "Booking Date", "Consignor", "Consignee", "Route", "Freight", "Grand Total", "Due", "Status"],
      rows: (booking?.records || []).map((r) => [
        r.shipmentNo || "", r.shipmentDate ? formatDate(r.shipmentDate) : "", r.consignorName || "", r.consigneeName || "",
        `${r.fromLocation || ""} -> ${r.toLocation || ""}`, r.totalFreight ?? 0, r.grandTotal ?? 0, r.dueAmount ?? 0, statusLabel(r.status),
      ]),
    };
  };

  const handleExportCsv = () => {
    const { title, headers, rows } = getReportDataset();
    if (rows.length === 0) { toast.info("No data to export for this report."); return; }
    const esc = (v: string | number) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("CSV exported.");
  };

  const handlePrint = () => {
    const { title, headers, rows } = getReportDataset();
    const escHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
    const numericCols = new Set<number>();
    headers.forEach((h, i) => { if (/revenue|cost|profit|amount|billed|paid|balance|freight|total|hire|tds|due/i.test(h)) numericCols.add(i); });
    const thead = `<tr>${headers.map((h, i) => `<th style="text-align:${numericCols.has(i) ? "right" : "left"}">${escHtml(h)}</th>`).join("")}</tr>`;
    const tbody = rows.length > 0
      ? rows.map((r) => `<tr>${r.map((c, i) => {
          const isNum = typeof c === "number";
          const val = isNum ? c.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : escHtml(String(c ?? ""));
          return `<td style="${isNum || numericCols.has(i) ? "text-align:right;font-family:monospace;" : ""}">${val}</td>`;
        }).join("")}</tr>`).join("")
      : `<tr><td colspan="${headers.length}" style="text-align:center;padding:24px;color:#6b7280;">No records for this report / period.</td></tr>`;
    const period = (fromDate || toDate) ? `<div class="rp-period">Period: ${escHtml(fromDate || "…")} to ${escHtml(toDate || "…")}</div>` : "";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escHtml(title)}</title><style>
      ${PRINT_HEADER_CSS}
      @media print { body { margin: 0; padding: 10mm; } @page { size: A4 landscape; margin: 10mm; } }
      body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; margin: 20px auto; max-width: 1100px; }
      .rp-title { text-align:center; font-size:15px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; margin:8px 0 2px; color:#1e293b; }
      .rp-period { text-align:center; font-size:11px; color:#6b7280; margin-bottom:12px; }
      table { width:100%; border-collapse:collapse; font-size:11px; }
      th { background:#f1f5f9; border:1px solid #cbd5e1; padding:6px 8px; font-weight:700; text-transform:uppercase; font-size:10px; }
      td { border:1px solid #e2e8f0; padding:5px 8px; }
    </style></head><body onload="(window.__ktPrint||window.print)()">
      ${renderPrintHeaderHtml()}
      <div class="rp-title">${escHtml(title)}</div>
      ${period}
      <table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
    </body></html>`;
    openPrintWindow(html);
  };

  const reportTabs = [
    { id: "profitability", label: "Trip Profitability", icon: TrendingUp },
    { id: "gst", label: "GST Tax Compliance", icon: Landmark },
    { id: "partyLedger", label: "Customer Outstanding", icon: Building2 },
    { id: "vendorLedger", label: "Vendor Payables", icon: Handshake },
    { id: "booking", label: "Booking Register", icon: Package },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5EAEB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E7F1F2] flex items-center justify-center text-[#2F8E86] font-bold text-lg shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#111827] tracking-tight">
                Operational & Financial Reports Suite
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Trip profitability margins, GST tax liabilities, customer accounts receivable & vendor ledgers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-white hover:bg-[#E7F1F2] text-[#25776F] font-bold rounded-xl text-xs border border-[#D9E2E3] transition flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs & Filters */}
      <div className="bg-white rounded-2xl border border-[#E5EAEB] p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {reportTabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ReportTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#2F8E86] text-white shadow-xs"
                    : "bg-[#F7F8F8] text-[#64748B] hover:bg-[#E7F1F2] hover:text-[#25776F] border border-[#E5EAEB]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Date Filter & Search */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {(activeTab === "profitability" || activeTab === "gst" || activeTab === "booking") && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#D9E2E3] rounded-xl text-xs font-medium text-[#111827] focus:border-[#2F8E86] focus:outline-none"
              />
              <span className="text-[#94A3B8]">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#D9E2E3] rounded-xl text-xs font-medium text-[#111827] focus:border-[#2F8E86] focus:outline-none"
              />
            </div>
          )}
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3.5 py-1.5 bg-white border border-[#D9E2E3] rounded-xl text-xs text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2F8E86]"
          />
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-[#64748B] font-medium">Loading report metrics from database...</div>
      )}

      {/* REPORT 1: TRIP PROFITABILITY */}
      {activeTab === "profitability" && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#E5EAEB] shadow-xs">
              <p className="text-xs font-semibold text-[#64748B]">Total Freight Revenue</p>
              <p className="text-xl font-bold text-[#111827] font-mono mt-1">
                {formatCurrency(profitability?.totalFreightRevenue || 0)}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5EAEB] shadow-xs">
              <p className="text-xs font-semibold text-[#64748B]">Fuel & On-Road Expenses</p>
              <p className="text-xl font-bold text-[#D95C5C] font-mono mt-1">
                {formatCurrency(
                  (profitability?.totalDriverCashAdvance || 0) +
                  (profitability?.totalDieselAdvance || 0) +
                  (profitability?.totalOnRoadExpenses || 0)
                )}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5EAEB] shadow-xs">
              <p className="text-xs font-semibold text-[#64748B]">Net Trip Profit</p>
              <p className="text-xl font-bold text-[#2F9E8F] font-mono mt-1">
                {formatCurrency(profitability?.netTripProfit || 0)}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5EAEB] shadow-xs">
              <p className="text-xs font-semibold text-[#64748B]">Average Profit Margin</p>
              <p className="text-2xl font-bold text-[#2F8E86] mt-1">
                {profitability?.profitMarginPercentage?.toFixed(1) || "0.0"}%
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5EAEB] shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-[#F7F8F8] border-b border-[#E5EAEB] text-xs font-bold uppercase tracking-wider text-[#111827]">
              Trip Margins Breakdown
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F8F8] border-b border-[#E5EAEB] text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                    <th className="py-3 px-4">Trip No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Vehicle & Driver</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4 text-right">Revenue</th>
                    <th className="py-3 px-4 text-right">Total Cost</th>
                    <th className="py-3 px-4 text-right">Net Profit</th>
                    <th className="py-3 px-4 text-right">Margin (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAEB]">
                  {profitability?.tripDetails && profitability.tripDetails.length > 0 ? (
                    profitability.tripDetails.map((td) => (
                      <tr key={td.tripId} className="hover:bg-[#F5FAFA]">
                        <td className="py-3 px-4 font-mono font-bold text-[#2F8E86]">{td.tripNo}</td>
                        <td className="py-3 px-4 text-[#64748B]">{formatDate(td.tripDate)}</td>
                        <td className="py-3 px-4 font-medium text-[#111827]">{td.vehicleNo} ({td.driverName || "Driver"})</td>
                        <td className="py-3 px-4 text-[#64748B]">{td.originLocation} → {td.destinationLocation}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#111827]">{formatCurrency(td.revenue)}</td>
                        <td className="py-3 px-4 text-right font-mono text-[#D95C5C]">{formatCurrency(td.totalCost)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#2F9E8F]">{formatCurrency(td.netProfit)}</td>
                        <td className="py-3 px-4 text-right font-bold text-[#2F8E86]">{td.profitMarginPct?.toFixed(1)}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#64748B]">No trip profitability records found for this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: GST SUMMARY */}
      {activeTab === "gst" && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#E5EAEB] shadow-xs">
              <p className="text-xs font-semibold text-[#64748B]">Taxable Freight (Regular)</p>
              <p className="text-xl font-bold text-[#111827] font-mono mt-1">
                {formatCurrency(gstSummary?.totalTaxableFreight || 0)}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5EAEB] shadow-xs">
              <p className="text-xs font-semibold text-[#64748B]">GST RCM Freight (Reverse)</p>
              <p className="text-xl font-bold text-[#2F8E86] font-mono mt-1">
                {formatCurrency(gstSummary?.totalGstRcmFreight || 0)}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5EAEB] shadow-xs">
              <p className="text-xs font-semibold text-[#64748B]">Exempt & Non-Taxable</p>
              <p className="text-xl font-bold text-[#94A3B8] font-mono mt-1">
                {formatCurrency(gstSummary?.totalNonTaxableFreight || 0)}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5EAEB] shadow-xs">
              <p className="text-xs font-semibold text-[#64748B]">Total GST Tax Collected</p>
              <p className="text-xl font-bold text-[#2F8E86] font-mono mt-1">
                {formatCurrency(gstSummary?.totalTaxCollected || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: CUSTOMER OUTSTANDING */}
      {activeTab === "partyLedger" && !loading && (
        <div className="bg-white rounded-2xl border border-[#E5EAEB] shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-[#F7F8F8] border-b border-[#E5EAEB] text-xs font-bold uppercase tracking-wider text-[#111827]">
            Customer / Party Accounts Receivable Ledger
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F8F8] border-b border-[#E5EAEB] text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">Party Name</th>
                  <th className="py-3 px-4">GSTIN</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Total Billed</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-right">Balance Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAEB]">
                {partyLedger.length > 0 ? (
                  partyLedger.map((p) => (
                    <tr key={p.partyId} className="hover:bg-[#F5FAFA]">
                      <td className="py-3 px-4 font-bold text-[#111827]">{p.partyName}</td>
                      <td className="py-3 px-4 font-mono text-[#64748B]">{p.gstNo || "Unregistered"}</td>
                      <td className="py-3 px-4 font-mono text-[#64748B]">{p.mobile || "—"}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#111827]">{formatCurrency(p.totalBilledAmount)}</td>
                      <td className="py-3 px-4 text-right font-mono text-[#2F9E8F]">{formatCurrency(p.totalPaidAmount)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#D95C5C]">{formatCurrency(p.totalOutstandingDue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#64748B]">No party ledger records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: VENDOR PAYABLES */}
      {activeTab === "vendorLedger" && !loading && (
        <div className="bg-white rounded-2xl border border-[#E5EAEB] shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-[#F7F8F8] border-b border-[#E5EAEB] text-xs font-bold uppercase tracking-wider text-[#111827]">
            Market Fleet Vendor & Broker Payable Ledger
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F8F8] border-b border-[#E5EAEB] text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">Vendor / Broker Name</th>
                  <th className="py-3 px-4">PAN</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Total Hire Amount</th>
                  <th className="py-3 px-4 text-right">Advances Paid</th>
                  <th className="py-3 px-4 text-right">TDS Deducted</th>
                  <th className="py-3 px-4 text-right">Net Balance Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAEB]">
                {vendorLedger.length > 0 ? (
                  vendorLedger.map((v) => (
                    <tr key={v.vendorId} className="hover:bg-[#F5FAFA]">
                      <td className="py-3 px-4 font-bold text-[#111827]">{v.vendorName}</td>
                      <td className="py-3 px-4 font-mono text-[#64748B]">{v.panNo || "No PAN"}</td>
                      <td className="py-3 px-4 font-mono text-[#64748B]">{v.mobile || "—"}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#111827]">{formatCurrency(v.totalHireAmount)}</td>
                      <td className="py-3 px-4 text-right font-mono text-[#2F9E8F]">{formatCurrency(v.totalAdvancePaid)}</td>
                      <td className="py-3 px-4 text-right font-mono text-[#64748B]">{formatCurrency(v.totalTdsDeducted)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#D95C5C]">{formatCurrency(v.totalBalancePayable)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#64748B]">No vendor ledger records available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 5: BOOKING REGISTER */}
      {activeTab === "booking" && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#E5EAEB] shadow-xs">
              <p className="text-xs font-semibold text-[#64748B]">Total Bookings</p>
              <p className="text-xl font-bold text-[#111827] mt-1">{booking?.totalBookings || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5EAEB] shadow-xs">
              <p className="text-xs font-semibold text-[#64748B]">Total Freight</p>
              <p className="text-xl font-bold text-[#111827] font-mono mt-1">{formatCurrency(booking?.totalFreightAmount || 0)}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5EAEB] shadow-xs">
              <p className="text-xs font-semibold text-[#64748B]">Grand Total (with GST)</p>
              <p className="text-xl font-bold text-[#2F8E86] font-mono mt-1">{formatCurrency(booking?.totalGrandTotal || 0)}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5EAEB] shadow-xs">
              <p className="text-xs font-semibold text-[#64748B]">Outstanding Due</p>
              <p className="text-xl font-bold text-[#D95C5C] font-mono mt-1">{formatCurrency(booking?.totalDueAmount || 0)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5EAEB] shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-[#F7F8F8] border-b border-[#E5EAEB] text-xs font-bold uppercase tracking-wider text-[#111827]">
              Consignment Booking Register
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F8F8] border-b border-[#E5EAEB] text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                    <th className="py-3 px-4">GR No</th>
                    <th className="py-3 px-4">Booking Date</th>
                    <th className="py-3 px-4">Consignor</th>
                    <th className="py-3 px-4">Consignee</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4 text-right">Freight</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-right">Due</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAEB]">
                  {booking?.records && booking.records.length > 0 ? (
                    booking.records.map((r) => (
                      <tr key={r.id ?? r.shipmentNo} className="hover:bg-[#F5FAFA]">
                        <td className="py-3 px-4 font-mono font-bold text-[#2F8E86]">{r.shipmentNo || "—"}</td>
                        <td className="py-3 px-4 text-[#64748B]">{r.shipmentDate ? formatDate(r.shipmentDate) : "—"}</td>
                        <td className="py-3 px-4 font-semibold text-[#111827]">{r.consignorName || "—"}</td>
                        <td className="py-3 px-4 text-[#64748B]">{r.consigneeName || "—"}</td>
                        <td className="py-3 px-4 text-[#64748B]">{r.fromLocation || "—"} → {r.toLocation || "—"}</td>
                        <td className="py-3 px-4 text-right font-mono text-[#111827]">{formatCurrency(r.totalFreight || 0)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#2F9E8F]">{formatCurrency(r.grandTotal || 0)}</td>
                        <td className="py-3 px-4 text-right font-mono text-[#D95C5C]">{formatCurrency(r.dueAmount || 0)}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-[#E7F1F2] text-[#25776F] border-[#D9E2E3]">
                            {statusLabel(r.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#64748B]">No consignment bookings found for this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <PagePermissionGuard permission="reports.view" moduleName="Reports & Analytics">
      <Suspense fallback={<div className="p-6 text-slate-400">Loading reports hub...</div>}>
        <ReportsContent />
      </Suspense>
    </PagePermissionGuard>
  );
}
