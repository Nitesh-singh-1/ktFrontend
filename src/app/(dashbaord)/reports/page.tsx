"use client";

import React, { useState, useEffect } from "react";
import {
  TripProfitabilityReportDto,
  TaxSummaryReportDto,
  PartyOutstandingReportDto,
  VendorPayableReportDto,
} from "@/types/tms";
import { reportService } from "services/reportService";

type ReportTab = "profitability" | "gst" | "partyLedger" | "vendorLedger";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("profitability");
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [profitability, setProfitability] = useState<TripProfitabilityReportDto | null>(null);
  const [gstSummary, setGstSummary] = useState<TaxSummaryReportDto | null>(null);
  const [partyLedger, setPartyLedger] = useState<PartyOutstandingReportDto[]>([]);
  const [vendorLedger, setVendorLedger] = useState<VendorPayableReportDto[]>([]);

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Operational & Financial Reports Suite
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              Executive Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Trip profitability margins, GST tax compliance liabilities, and customer / vendor outstanding ledgers.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <span>🖨️</span>
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Report Switcher Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "profitability", label: "📈 Trip Profitability Margins" },
            { id: "gst", label: "🏛️ GST Tax Compliance" },
            { id: "partyLedger", label: "🏢 Customer Outstanding Ledger" },
            { id: "vendorLedger", label: "🤝 Vendor Payable Ledger" },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ReportTab)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isSelected ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Date Filter */}
        {(activeTab === "profitability" || activeTab === "gst") && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
            />
          </div>
        )}
      </div>

      {/* REPORT 1: TRIP PROFITABILITY */}
      {activeTab === "profitability" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Total Freight Revenue</p>
              <p className="text-xl font-black text-slate-900 font-mono mt-1">
                ₹{profitability?.totalFreightRevenue?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">On-Road & Fuel Expenses</p>
              <p className="text-xl font-black text-red-600 font-mono mt-1">
                ₹{(
                  (profitability?.totalDriverCashAdvance || 0) +
                  (profitability?.totalDieselAdvance || 0) +
                  (profitability?.totalOnRoadExpenses || 0)
                ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Net Trip Profit</p>
              <p className="text-xl font-black text-emerald-600 font-mono mt-1">
                ₹{profitability?.netTripProfit?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Average Profit Margin</p>
              <p className="text-2xl font-black text-blue-600 mt-1">
                {profitability?.profitMarginPercentage?.toFixed(1) || "0.0"}%
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700">
              Trip Margins Breakdown Table
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Trip No</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Vehicle & Driver</th>
                    <th className="py-2.5 px-3">Route</th>
                    <th className="py-2.5 px-3 text-right">Revenue (₹)</th>
                    <th className="py-2.5 px-3 text-right">Total Cost (₹)</th>
                    <th className="py-2.5 px-3 text-right">Net Profit (₹)</th>
                    <th className="py-2.5 px-3 text-right">Margin (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profitability?.tripDetails && profitability.tripDetails.length > 0 ? (
                    profitability.tripDetails.map((td) => (
                      <tr key={td.tripId} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-bold text-blue-600">{td.tripNo}</td>
                        <td className="py-3 px-3">{td.tripDate ? td.tripDate.split("T")[0] : ""}</td>
                        <td className="py-3 px-3 font-medium">{td.vehicleNo} ({td.driverName || "Driver"})</td>
                        <td className="py-3 px-3">{td.originLocation} → {td.destinationLocation}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold">₹{td.revenue}</td>
                        <td className="py-3 px-3 text-right font-mono text-red-600">₹{td.totalCost}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">₹{td.netProfit}</td>
                        <td className="py-3 px-3 text-right font-bold text-blue-700">{td.profitMarginPct?.toFixed(1)}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">No trips recorded in this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: GST SUMMARY */}
      {activeTab === "gst" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Taxable Freight (Regular)</p>
              <p className="text-xl font-black text-slate-900 font-mono mt-1">
                ₹{gstSummary?.totalTaxableFreight?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">GST RCM Freight (Reverse)</p>
              <p className="text-xl font-black text-purple-600 font-mono mt-1">
                ₹{gstSummary?.totalGstRcmFreight?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Exempt & Non-Taxable</p>
              <p className="text-xl font-black text-slate-600 font-mono mt-1">
                ₹{gstSummary?.totalNonTaxableFreight?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Total GST Tax Collected</p>
              <p className="text-xl font-black text-blue-600 font-mono mt-1">
                ₹{gstSummary?.totalTaxCollected?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: CUSTOMER OUTSTANDING */}
      {activeTab === "partyLedger" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700">
            Customer / Party Accounts Receivable Ledger
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Party Name</th>
                  <th className="py-2.5 px-3">GSTIN</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3 text-right">Total Billed (₹)</th>
                  <th className="py-2.5 px-3 text-right">Total Paid (₹)</th>
                  <th className="py-2.5 px-3 text-right">Outstanding Due (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partyLedger.length > 0 ? (
                  partyLedger.map((p) => (
                    <tr key={p.partyId} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">{p.partyName}</td>
                      <td className="py-3 px-3 font-mono">{p.gstNo || "Unregistered"}</td>
                      <td className="py-3 px-3 font-mono">{p.mobile || "—"}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">₹{p.totalBilledAmount}</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-600">₹{p.totalPaidAmount}</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-blue-600">₹{p.totalOutstandingDue}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">No party ledger records available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: VENDOR PAYABLE */}
      {activeTab === "vendorLedger" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700">
            Market Fleet Vendor & Broker Payable Ledger
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Vendor / Broker Name</th>
                  <th className="py-2.5 px-3">PAN</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3 text-right">Total Hire Amount (₹)</th>
                  <th className="py-2.5 px-3 text-right">Advances Paid (₹)</th>
                  <th className="py-2.5 px-3 text-right">TDS Deducted (₹)</th>
                  <th className="py-2.5 px-3 text-right">Net Balance Payable (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendorLedger.length > 0 ? (
                  vendorLedger.map((v) => (
                    <tr key={v.vendorId} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">{v.vendorName}</td>
                      <td className="py-3 px-3 font-mono">{v.panNo || "No PAN"}</td>
                      <td className="py-3 px-3 font-mono">{v.mobile || "—"}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">₹{v.totalHireAmount}</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-600">₹{v.totalAdvancePaid}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">₹{v.totalTdsDeducted}</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-blue-600">₹{v.totalBalancePayable}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No vendor ledger records available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
