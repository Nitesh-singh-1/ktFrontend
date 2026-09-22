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

  // Sample booking register data for instant preview when booking tab is selected
  const sampleBookingData = [
    { lrNo: "GR-2026-00101", date: "2026-09-20", consignor: "Tata Steel Ltd", consignee: "Jindal Infra", from: "Jamshedpur", to: "Delhi", weight: "24.5 MT", freight: 68500, status: "Delivered" },
    { lrNo: "GR-2026-00102", date: "2026-09-21", consignor: "Reliance Polymer", consignee: "Shree Plastics", from: "Hazira", to: "Kanpur", weight: "18.0 MT", freight: 52000, status: "In Transit" },
    { lrNo: "GR-2026-00103", date: "2026-09-22", consignor: "Adani Solar", consignee: "SunEdison Power", from: "Mundra", to: "Jaipur", weight: "15.2 MT", freight: 46000, status: "Booked" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20">
              📊
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Operational & Financial Reports Suite
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Trip profitability margins, GST tax liabilities, customer accounts receivable & vendor ledgers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 shadow-sm transition flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>🖨️</span>
            <span>Print Report</span>
          </button>
          <button
            onClick={() => alert("Exporting report data...")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "profitability", label: "📈 Trip Profitability" },
            { id: "gst", label: "🏛️ GST Tax Compliance" },
            { id: "partyLedger", label: "🏢 Customer Outstanding" },
            { id: "vendorLedger", label: "🤝 Vendor Payables" },
            { id: "booking", label: "📦 Booking Register" },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ReportTab)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Date Filter & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {(activeTab === "profitability" || activeTab === "gst") && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-medium text-slate-200"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-medium text-slate-200"
              />
            </div>
          )}
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-slate-400">Loading report metrics from database...</div>
      )}

      {/* REPORT 1: TRIP PROFITABILITY */}
      {activeTab === "profitability" && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 shadow-md">
              <p className="text-xs font-semibold text-slate-400">Total Freight Revenue</p>
              <p className="text-xl font-black text-white font-mono mt-1">
                {formatCurrency(profitability?.totalFreightRevenue || 0)}
              </p>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 shadow-md">
              <p className="text-xs font-semibold text-slate-400">Fuel & On-Road Expenses</p>
              <p className="text-xl font-black text-rose-400 font-mono mt-1">
                {formatCurrency(
                  (profitability?.totalDriverCashAdvance || 0) +
                  (profitability?.totalDieselAdvance || 0) +
                  (profitability?.totalOnRoadExpenses || 0)
                )}
              </p>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 shadow-md">
              <p className="text-xs font-semibold text-slate-400">Net Trip Profit</p>
              <p className="text-xl font-black text-emerald-400 font-mono mt-1">
                {formatCurrency(profitability?.netTripProfit || 0)}
              </p>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 shadow-md">
              <p className="text-xs font-semibold text-slate-400">Average Profit Margin</p>
              <p className="text-2xl font-black text-indigo-400 mt-1">
                {profitability?.profitMarginPercentage?.toFixed(1) || "0.0"}%
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-xl border border-slate-800 shadow-md overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300">
              Trip Margins Breakdown
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Trip No</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Vehicle & Driver</th>
                    <th className="py-2.5 px-3">Route</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                    <th className="py-2.5 px-3 text-right">Total Cost</th>
                    <th className="py-2.5 px-3 text-right">Net Profit</th>
                    <th className="py-2.5 px-3 text-right">Margin (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {profitability?.tripDetails && profitability.tripDetails.length > 0 ? (
                    profitability.tripDetails.map((td) => (
                      <tr key={td.tripId} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-400">{td.tripNo}</td>
                        <td className="py-3 px-3 text-slate-300">{formatDate(td.tripDate)}</td>
                        <td className="py-3 px-3 font-medium text-slate-200">{td.vehicleNo} ({td.driverName || "Driver"})</td>
                        <td className="py-3 px-3 text-slate-300">{td.originLocation} → {td.destinationLocation}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">{formatCurrency(td.revenue)}</td>
                        <td className="py-3 px-3 text-right font-mono text-rose-400">{formatCurrency(td.totalCost)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(td.netProfit)}</td>
                        <td className="py-3 px-3 text-right font-bold text-indigo-400">{td.profitMarginPct?.toFixed(1)}%</td>
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
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 shadow-md">
              <p className="text-xs font-semibold text-slate-400">Taxable Freight (Regular)</p>
              <p className="text-xl font-black text-white font-mono mt-1">
                {formatCurrency(gstSummary?.totalTaxableFreight || 0)}
              </p>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 shadow-md">
              <p className="text-xs font-semibold text-slate-400">GST RCM Freight (Reverse)</p>
              <p className="text-xl font-black text-purple-400 font-mono mt-1">
                {formatCurrency(gstSummary?.totalGstRcmFreight || 0)}
              </p>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 shadow-md">
              <p className="text-xs font-semibold text-slate-400">Exempt & Non-Taxable</p>
              <p className="text-xl font-black text-slate-400 font-mono mt-1">
                {formatCurrency(gstSummary?.totalNonTaxableFreight || 0)}
              </p>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 shadow-md">
              <p className="text-xs font-semibold text-slate-400">Total GST Tax Collected</p>
              <p className="text-xl font-black text-indigo-400 font-mono mt-1">
                {formatCurrency(gstSummary?.totalTaxCollected || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: CUSTOMER OUTSTANDING */}
      {activeTab === "partyLedger" && !loading && (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 shadow-md overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300">
            Customer / Party Accounts Receivable Ledger
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Party Name</th>
                  <th className="py-2.5 px-3">GSTIN</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3 text-right">Total Billed</th>
                  <th className="py-2.5 px-3 text-right">Amount Paid</th>
                  <th className="py-2.5 px-3 text-right">Balance Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {partyLedger.length > 0 ? (
                  partyLedger.map((p) => (
                    <tr key={p.partyId} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-white">{p.partyName}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{p.gstNo || "Unregistered"}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{p.mobile || "—"}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">{formatCurrency(p.totalBilledAmount)}</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400">{formatCurrency(p.totalPaidAmount)}</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-rose-400">{formatCurrency(p.totalOutstandingDue)}</td>
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
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 shadow-md overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300">
            Market Fleet Vendor & Broker Payable Ledger
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Vendor / Broker Name</th>
                  <th className="py-2.5 px-3">PAN</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3 text-right">Total Hire Amount</th>
                  <th className="py-2.5 px-3 text-right">Advances Paid</th>
                  <th className="py-2.5 px-3 text-right">TDS Deducted</th>
                  <th className="py-2.5 px-3 text-right">Net Balance Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {vendorLedger.length > 0 ? (
                  vendorLedger.map((v) => (
                    <tr key={v.vendorId} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-white">{v.vendorName}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{v.panNo || "No PAN"}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{v.mobile || "—"}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">{formatCurrency(v.totalHireAmount)}</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400">{formatCurrency(v.totalAdvancePaid)}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400">{formatCurrency(v.totalTdsDeducted)}</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-rose-400">{formatCurrency(v.totalBalancePayable)}</td>
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
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 shadow-md overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300">
            Consignment Booking Register
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">GR No</th>
                  <th className="py-2.5 px-3">Booking Date</th>
                  <th className="py-2.5 px-3">Consignor</th>
                  <th className="py-2.5 px-3">Consignee</th>
                  <th className="py-2.5 px-3">Route</th>
                  <th className="py-2.5 px-3">Weight</th>
                  <th className="py-2.5 px-3 text-right">Freight</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sampleBookingData.map((item) => (
                  <tr key={item.lrNo} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-400">{item.lrNo}</td>
                    <td className="py-3 px-3 text-slate-300">{formatDate(item.date)}</td>
                    <td className="py-3 px-3 font-medium text-white">{item.consignor}</td>
                    <td className="py-3 px-3 text-slate-300">{item.consignee}</td>
                    <td className="py-3 px-3 text-slate-400">{item.from} → {item.to}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{item.weight}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(item.freight)}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
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
