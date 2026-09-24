"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  TripProfitabilityReportDto,
  TaxSummaryReportDto,
  PartyOutstandingReportDto,
  VendorPayableReportDto,
} from "@/types/tms";
import { reportService } from "services/reportService";
import { useNavigation } from "@/context/NavigationContext";
import PagePermissionGuard from "@/app/components/ui/PagePermissionGuard";
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
      }
    } catch (err) {
      console.error("Fetch report error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const sampleBookingData = [
    { lrNo: "GR-2026-00101", date: "2026-09-20", consignor: "Tata Steel Ltd", consignee: "Jindal Infra", from: "Jamshedpur", to: "Delhi", weight: "24.5 MT", freight: 68500, status: "Delivered" },
    { lrNo: "GR-2026-00102", date: "2026-09-21", consignor: "Reliance Polymer", consignee: "Shree Plastics", from: "Hazira", to: "Kanpur", weight: "18.0 MT", freight: 52000, status: "In Transit" },
    { lrNo: "GR-2026-00103", date: "2026-09-22", consignor: "Adani Solar", consignee: "SunEdison Power", from: "Mundra", to: "Jaipur", weight: "15.2 MT", freight: 46000, status: "Booked" },
  ];

  const reportTabs = [
    { id: "profitability", label: "Trip Profitability", icon: TrendingUp },
    { id: "gst", label: "GST Tax Compliance", icon: Landmark },
    { id: "partyLedger", label: "Customer Outstanding", icon: Building2 },
    { id: "vendorLedger", label: "Vendor Payables", icon: Handshake },
    { id: "booking", label: "Booking Register", icon: Package },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner - Light Blue & Crisp White */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-sky-100 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Operational & Financial Reports Suite
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Trip profitability margins, GST tax liabilities, customer accounts receivable & vendor ledgers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 transition flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={() => alert("Exporting report data...")}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-100 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
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
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-sky-50 dark:bg-slate-800 dark:text-slate-400"
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
          {(activeTab === "profitability" || activeTab === "gst") && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200"
              />
            </div>
          )}
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-slate-500 font-medium">Loading report metrics from database...</div>
      )}

      {/* REPORT 1: TRIP PROFITABILITY */}
      {activeTab === "profitability" && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-100 dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Total Freight Revenue</p>
              <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {formatCurrency(profitability?.totalFreightRevenue || 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-100 dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Fuel & On-Road Expenses</p>
              <p className="text-xl font-black text-rose-600 font-mono mt-1">
                {formatCurrency(
                  (profitability?.totalDriverCashAdvance || 0) +
                  (profitability?.totalDieselAdvance || 0) +
                  (profitability?.totalOnRoadExpenses || 0)
                )}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-100 dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Net Trip Profit</p>
              <p className="text-xl font-black text-emerald-600 font-mono mt-1">
                {formatCurrency(profitability?.netTripProfit || 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-100 dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Average Profit Margin</p>
              <p className="text-2xl font-black text-sky-700 dark:text-sky-400 mt-1">
                {profitability?.profitMarginPercentage?.toFixed(1) || "0.0"}%
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-sky-50/50 dark:bg-slate-850 border-b border-sky-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Trip Margins Breakdown
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {profitability?.tripDetails && profitability.tripDetails.length > 0 ? (
                    profitability.tripDetails.map((td) => (
                      <tr key={td.tripId} className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-sky-700 dark:text-sky-400">{td.tripNo}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{formatDate(td.tripDate)}</td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{td.vehicleNo} ({td.driverName || "Driver"})</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{td.originLocation} → {td.destinationLocation}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">{formatCurrency(td.revenue)}</td>
                        <td className="py-3 px-4 text-right font-mono text-rose-600">{formatCurrency(td.totalCost)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{formatCurrency(td.netProfit)}</td>
                        <td className="py-3 px-4 text-right font-bold text-sky-700 dark:text-sky-400">{td.profitMarginPct?.toFixed(1)}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">No trip profitability records found for this period.</td>
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-100 dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Taxable Freight (Regular)</p>
              <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {formatCurrency(gstSummary?.totalTaxableFreight || 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-100 dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">GST RCM Freight (Reverse)</p>
              <p className="text-xl font-black text-sky-700 dark:text-sky-400 font-mono mt-1">
                {formatCurrency(gstSummary?.totalGstRcmFreight || 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-100 dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Exempt & Non-Taxable</p>
              <p className="text-xl font-black text-slate-500 font-mono mt-1">
                {formatCurrency(gstSummary?.totalNonTaxableFreight || 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-100 dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Total GST Tax Collected</p>
              <p className="text-xl font-black text-sky-700 dark:text-sky-400 font-mono mt-1">
                {formatCurrency(gstSummary?.totalTaxCollected || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: CUSTOMER OUTSTANDING */}
      {activeTab === "partyLedger" && !loading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-sky-50/50 dark:bg-slate-850 border-b border-sky-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Customer / Party Accounts Receivable Ledger
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Party Name</th>
                  <th className="py-3 px-4">GSTIN</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Total Billed</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-right">Balance Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {partyLedger.length > 0 ? (
                  partyLedger.map((p) => (
                    <tr key={p.partyId} className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{p.partyName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.gstNo || "Unregistered"}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.mobile || "—"}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(p.totalBilledAmount)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">{formatCurrency(p.totalPaidAmount)}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-rose-600">{formatCurrency(p.totalOutstandingDue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">No party ledger records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: VENDOR PAYABLES */}
      {activeTab === "vendorLedger" && !loading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-sky-50/50 dark:bg-slate-850 border-b border-sky-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Market Fleet Vendor & Broker Payable Ledger
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Vendor / Broker Name</th>
                  <th className="py-3 px-4">PAN</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Total Hire Amount</th>
                  <th className="py-3 px-4 text-right">Advances Paid</th>
                  <th className="py-3 px-4 text-right">TDS Deducted</th>
                  <th className="py-3 px-4 text-right">Net Balance Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {vendorLedger.length > 0 ? (
                  vendorLedger.map((v) => (
                    <tr key={v.vendorId} className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{v.vendorName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{v.panNo || "No PAN"}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{v.mobile || "—"}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(v.totalHireAmount)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">{formatCurrency(v.totalAdvancePaid)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">{formatCurrency(v.totalTdsDeducted)}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-rose-600">{formatCurrency(v.totalBalancePayable)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">No vendor ledger records available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 5: BOOKING REGISTER */}
      {activeTab === "booking" && !loading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-sky-50/50 dark:bg-slate-850 border-b border-sky-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Consignment Booking Register
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">GR No</th>
                  <th className="py-3 px-4">Booking Date</th>
                  <th className="py-3 px-4">Consignor</th>
                  <th className="py-3 px-4">Consignee</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Weight</th>
                  <th className="py-3 px-4 text-right">Freight</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sampleBookingData.map((item) => (
                  <tr key={item.lrNo} className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-sky-700 dark:text-sky-400">{item.lrNo}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{formatDate(item.date)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{item.consignor}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{item.consignee}</td>
                    <td className="py-3 px-4 text-slate-500">{item.from} → {item.to}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{item.weight}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{formatCurrency(item.freight)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
