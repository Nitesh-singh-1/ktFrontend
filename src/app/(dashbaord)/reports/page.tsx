"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useNavigation } from "@/context/NavigationContext";
import { useTenantConfig } from "@/context/TenantConfigContext";
import { PagePermissionGuard } from "@/app/components/ui/PagePermissionGuard";

function ReportsContent() {
  const searchParams = useSearchParams();
  const { menu, isReportEnabled } = useNavigation();
  const { formatCurrency, formatDate } = useTenantConfig();

  // Find all available report sub-menus from dynamic menu
  const reportsMenu = menu.find((m) => m.id === "reports");
  const availableReports = reportsMenu?.children || [];

  const initialTab = searchParams.get("tab") || availableReports[0]?.id?.replace("reports.", "") || "booking_register";
  const [activeReportKey, setActiveReportKey] = useState<string>(initialTab);

  // Filter states
  const [fromDate, setFromDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveReportKey(tabParam);
    } else if (availableReports.length > 0 && !availableReports.some((r) => r.id.endsWith(activeReportKey))) {
      setActiveReportKey(availableReports[0].id.replace("reports.", ""));
    }
  }, [searchParams, availableReports, activeReportKey]);

  // Sample data generators for demonstration of each modular report
  const sampleBookingData = [
    { lrNo: "GR-2026-00101", date: "2026-09-20", consignor: "Tata Steel Ltd", consignee: "Jindal Infra", from: "Jamshedpur", to: "Delhi", weight: "24.5 MT", freight: 68500, status: "Delivered" },
    { lrNo: "GR-2026-00102", date: "2026-09-21", consignor: "Reliance Polymer", consignee: "Shree Plastics", from: "Hazira", to: "Kanpur", weight: "18.0 MT", freight: 52000, status: "In Transit" },
    { lrNo: "GR-2026-00103", date: "2026-09-22", consignor: "Adani Solar", consignee: "SunEdison Power", from: "Mundra", to: "Jaipur", weight: "15.2 MT", freight: 46000, status: "Booked" },
  ];

  const sampleTaxData = [
    { month: "September 2026", invoiceCount: 142, taxableAmount: 3850000, cgst: 96250, sgst: 96250, igst: 112000, totalTax: 304500, rcmPayable: 45000 },
    { month: "August 2026", invoiceCount: 128, taxableAmount: 3420000, cgst: 85500, sgst: 85500, igst: 98000, totalTax: 269000, rcmPayable: 38000 },
  ];

  const samplePartyOutstanding = [
    { partyName: "Tata Steel Ltd", gst: "20AAACT2727Q1ZW", billed: 850000, received: 620000, outstanding: 230000, overdueDays: 14 },
    { partyName: "Reliance Polymer", gst: "24AAACR1234A1Z1", billed: 640000, received: 500000, outstanding: 140000, overdueDays: 7 },
    { partyName: "Adani Solar Infra", gst: "24AAAAP1234C1ZK", billed: 420000, received: 420000, outstanding: 0, overdueDays: 0 },
  ];

  const sampleTripProfitability = [
    { tripNo: "TRP-2026-00045", vehicleNo: "NL-01-AB-1234", driver: "Ramesh Singh", revenue: 85000, diesel: 32000, toll: 6500, driverAdvance: 8000, otherExp: 2500, netProfit: 36000, margin: "42.3%" },
    { tripNo: "TRP-2026-00046", vehicleNo: "HR-55-XY-9876", driver: "Mohan Lal", revenue: 64000, diesel: 26000, toll: 4800, driverAdvance: 6000, otherExp: 1800, netProfit: 25400, margin: "39.6%" },
  ];

  const sampleVendorPayables = [
    { vendorName: "Shree Ganesh Roadlines", vehicleCount: 4, hireCharges: 320000, paidAdvance: 180000, tdsDeducted: 6400, balanceDue: 133600 },
    { vendorName: "National Fleet Logistics", vehicleCount: 2, hireCharges: 160000, paidAdvance: 100000, tdsDeducted: 3200, balanceDue: 56800 },
  ];

  if (availableReports.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl">
          📊
        </div>
        <h2 className="text-xl font-bold text-white">No Reports Licensed</h2>
        <p className="text-sm text-slate-400">
          Your organization is currently configured without the Reporting & Analytics module or no sub-reports have been granted yet.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-xl">
            📈
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Reports & Analytics Hub</h1>
            <p className="text-sm text-slate-400">
              Access real-time operational, tax compliance, party ledger, and P&L reports configured for your organization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all font-medium cursor-pointer"
          >
            🖨️ Print Report
          </button>
          <button
            onClick={() => alert("Exporting report data to CSV...")}
            className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white rounded-xl font-medium shadow-md cursor-pointer transition-all"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Dynamic Report Selector Tabs (Only shows reports licensed to this tenant) */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-2 scrollbar-none">
        {availableReports.map((rep) => {
          const key = rep.id.replace("reports.", "");
          const isActive = activeReportKey === key;
          return (
            <button
              key={rep.id}
              onClick={() => setActiveReportKey(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <span>📄</span>
              <span>{rep.title}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Filters Bar */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>
        </div>

        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Search within report..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* REPORT 1: BOOKING REGISTER */}
      {activeReportKey === "booking_register" && (
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <h2 className="text-base font-bold text-white">Consignment Booking Register</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase">
                <tr>
                  <th className="pb-3 px-3">GR No</th>
                  <th className="pb-3 px-3">Booking Date</th>
                  <th className="pb-3 px-3">Consignor</th>
                  <th className="pb-3 px-3">Consignee</th>
                  <th className="pb-3 px-3">Route</th>
                  <th className="pb-3 px-3">Weight</th>
                  <th className="pb-3 px-3">Total Freight</th>
                  <th className="pb-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {sampleBookingData.map((item) => (
                  <tr key={item.lrNo} className="hover:bg-slate-800/20">
                    <td className="py-3 px-3 font-mono font-semibold text-indigo-400">{item.lrNo}</td>
                    <td className="py-3 px-3 text-slate-300">{formatDate(item.date)}</td>
                    <td className="py-3 px-3 font-medium text-white">{item.consignor}</td>
                    <td className="py-3 px-3 text-slate-300">{item.consignee}</td>
                    <td className="py-3 px-3 text-slate-400">{item.from} → {item.to}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{item.weight}</td>
                    <td className="py-3 px-3 font-semibold text-emerald-400">{formatCurrency(item.freight)}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
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

      {/* REPORT 2: TAX SUMMARY */}
      {activeReportKey === "tax_summary" && (
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <h2 className="text-base font-bold text-white">GST & Tax Compliance Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase">
                <tr>
                  <th className="pb-3 px-3">Tax Period</th>
                  <th className="pb-3 px-3">Invoices</th>
                  <th className="pb-3 px-3">Taxable Turnover</th>
                  <th className="pb-3 px-3">CGST</th>
                  <th className="pb-3 px-3">SGST</th>
                  <th className="pb-3 px-3">IGST</th>
                  <th className="pb-3 px-3">Total Tax Liability</th>
                  <th className="pb-3 px-3">RCM Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {sampleTaxData.map((item) => (
                  <tr key={item.month} className="hover:bg-slate-800/20">
                    <td className="py-3 px-3 font-semibold text-white">{item.month}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{item.invoiceCount}</td>
                    <td className="py-3 px-3 font-semibold text-white">{formatCurrency(item.taxableAmount)}</td>
                    <td className="py-3 px-3 text-slate-400">{formatCurrency(item.cgst)}</td>
                    <td className="py-3 px-3 text-slate-400">{formatCurrency(item.sgst)}</td>
                    <td className="py-3 px-3 text-slate-400">{formatCurrency(item.igst)}</td>
                    <td className="py-3 px-3 font-bold text-emerald-400">{formatCurrency(item.totalTax)}</td>
                    <td className="py-3 px-3 font-mono text-amber-400">{formatCurrency(item.rcmPayable)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 3: PARTY OUTSTANDING */}
      {activeReportKey === "party_outstanding" && (
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <h2 className="text-base font-bold text-white">Customer Outstanding & Aging Ledger</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase">
                <tr>
                  <th className="pb-3 px-3">Customer / Consignor</th>
                  <th className="pb-3 px-3">GSTIN</th>
                  <th className="pb-3 px-3">Total Billed</th>
                  <th className="pb-3 px-3">Amount Received</th>
                  <th className="pb-3 px-3">Outstanding Balance</th>
                  <th className="pb-3 px-3">Overdue Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {samplePartyOutstanding.map((item) => (
                  <tr key={item.partyName} className="hover:bg-slate-800/20">
                    <td className="py-3 px-3 font-semibold text-white">{item.partyName}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{item.gst}</td>
                    <td className="py-3 px-3 text-slate-300">{formatCurrency(item.billed)}</td>
                    <td className="py-3 px-3 text-slate-300">{formatCurrency(item.received)}</td>
                    <td className="py-3 px-3 font-bold text-rose-400">{formatCurrency(item.outstanding)}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.overdueDays > 0
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {item.overdueDays > 0 ? `${item.overdueDays} Days Overdue` : "All Clear"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: TRIP PROFITABILITY */}
      {activeReportKey === "trip_profitability" && (
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <h2 className="text-base font-bold text-white">Trip Profitability & Margin Analysis</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase">
                <tr>
                  <th className="pb-3 px-3">Trip Memo</th>
                  <th className="pb-3 px-3">Vehicle</th>
                  <th className="pb-3 px-3">Driver</th>
                  <th className="pb-3 px-3">Trip Revenue</th>
                  <th className="pb-3 px-3">Diesel Expense</th>
                  <th className="pb-3 px-3">Toll & Advance</th>
                  <th className="pb-3 px-3">Net Profit</th>
                  <th className="pb-3 px-3">Profit Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {sampleTripProfitability.map((item) => (
                  <tr key={item.tripNo} className="hover:bg-slate-800/20">
                    <td className="py-3 px-3 font-mono font-semibold text-indigo-400">{item.tripNo}</td>
                    <td className="py-3 px-3 text-white font-medium">{item.vehicleNo}</td>
                    <td className="py-3 px-3 text-slate-400">{item.driver}</td>
                    <td className="py-3 px-3 font-semibold text-white">{formatCurrency(item.revenue)}</td>
                    <td className="py-3 px-3 text-rose-400">{formatCurrency(item.diesel)}</td>
                    <td className="py-3 px-3 text-slate-400">{formatCurrency(item.toll + item.driverAdvance)}</td>
                    <td className="py-3 px-3 font-bold text-emerald-400">{formatCurrency(item.netProfit)}</td>
                    <td className="py-3 px-3 font-bold text-indigo-400">{item.margin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 5: VENDOR PAYABLES */}
      {activeReportKey === "vendor_payables" && (
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <h2 className="text-base font-bold text-white">Vendor & Lorry Hire Payables</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase">
                <tr>
                  <th className="pb-3 px-3">Vendor / Broker Name</th>
                  <th className="pb-3 px-3">Vehicles Hired</th>
                  <th className="pb-3 px-3">Contract Value</th>
                  <th className="pb-3 px-3">Paid Advance</th>
                  <th className="pb-3 px-3">TDS Deducted</th>
                  <th className="pb-3 px-3">Pending Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {sampleVendorPayables.map((item) => (
                  <tr key={item.vendorName} className="hover:bg-slate-800/20">
                    <td className="py-3 px-3 font-semibold text-white">{item.vendorName}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{item.vehicleCount}</td>
                    <td className="py-3 px-3 text-slate-300">{formatCurrency(item.hireCharges)}</td>
                    <td className="py-3 px-3 text-emerald-400">{formatCurrency(item.paidAdvance)}</td>
                    <td className="py-3 px-3 text-slate-400">{formatCurrency(item.tdsDeducted)}</td>
                    <td className="py-3 px-3 font-bold text-rose-400">{formatCurrency(item.balanceDue)}</td>
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
