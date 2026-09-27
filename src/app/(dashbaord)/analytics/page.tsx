"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BusinessAnalytics, TopCustomer, VehicleProfit, BranchProfit } from "@/types/analytics";
import { analyticsService } from "services/analyticsService";
import { DataTable } from "@/app/components/ui/DataTable";
import {
  AlertTriangle,
  TrendingUp,
  Wallet,
  Banknote,
  Receipt,
  PieChart,
  Users,
  IndianRupee,
  Truck,
  ArrowDownCircle,
  ArrowUpCircle,
  Scale,
  Building2,
} from "lucide-react";

const WINDOWS = [
  { label: "6 months", value: 6 },
  { label: "12 months", value: 12 },
];

const EMPTY: BusinessAnalytics = {
  months: 6,
  periodLabel: "",
  totalBilled: 0,
  totalCollected: 0,
  totalOutstanding: 0,
  invoiceCount: 0,
  cancelledCount: 0,
  collectionRatePct: 0,
  operatingExpenses: 0,
  grossMargin: 0,
  grossMarginPct: 0,
  totalInflow: 0,
  totalOutflow: 0,
  netCashFlow: 0,
  monthlyTrend: [],
  topCustomers: [],
  paymentStatusBreakdown: [],
  vehicleProfitability: [],
  branchProfitability: [],
  cashFlowByMode: [],
};

const STATUS_COLOR: Record<string, string> = {
  Paid: "bg-emerald-500",
  PartiallyPaid: "bg-amber-500",
  Unpaid: "bg-red-500",
};

function inr(n: number): string {
  return `₹${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function inr2(n: number): string {
  return `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<BusinessAnalytics>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(6);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await analyticsService.getBusinessAnalytics(months);
        if (active) setData(res || EMPTY);
      } catch (err: any) {
        console.error("Error loading analytics:", err);
        if (active) setError(err?.message || "Failed to load business analytics.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [months]);

  const maxTrend = useMemo(
    () => Math.max(1, ...data.monthlyTrend.flatMap((m) => [m.billed, m.collected])),
    [data.monthlyTrend]
  );

  const kpis = [
    { title: "Total Billed", value: inr(data.totalBilled), icon: Receipt, color: "text-[#111827]", accent: "text-[#94A3B8]", hint: `${data.invoiceCount} invoices` },
    { title: "Collected", value: inr(data.totalCollected), icon: Banknote, color: "text-emerald-600", accent: "text-emerald-600", hint: `${data.collectionRatePct}% recovery` },
    { title: "Outstanding", value: inr(data.totalOutstanding), icon: Wallet, color: "text-[#4A90E2]", accent: "text-[#4A90E2]", hint: "Receivables due" },
    { title: "Gross Margin", value: inr(data.grossMargin), icon: TrendingUp, color: data.grossMargin >= 0 ? "text-[#2F8E86]" : "text-red-600", accent: "text-[#94A3B8]", hint: `${data.grossMarginPct}% of billed · exp ${inr(data.operatingExpenses)}` },
  ];

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-[#E5EAEB] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#111827] tracking-tight">Business Analytics</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] rounded-full">
              {data.periodLabel || "KPIs"}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Sales vs recovery, gross margin, monthly revenue trend and your top customers — the numbers that drive the business.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {WINDOWS.map((w) => {
            const active = months === w.value;
            return (
              <button
                key={w.value}
                onClick={() => setMonths(w.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  active ? "bg-[#2F8E86] text-white shadow-xs" : "bg-white text-[#64748B] hover:bg-[#E7F1F2] border border-[#E5EAEB]"
                }`}
              >
                {w.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[#D95C5C] text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.title} className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#64748B]">{k.title}</p>
                <Icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <p className={`text-2xl font-black font-mono mt-1 ${k.color}`}>{loading ? "…" : k.value}</p>
              <p className={`text-[10px] mt-1 ${k.accent}`}>{k.hint}</p>
            </div>
          );
        })}
      </div>

      {/* Collection rate + payment status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Collection rate gauge */}
        <div className="bg-white rounded-2xl border border-[#E5EAEB] p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <IndianRupee className="w-4 h-4 text-[#2F8E86]" />
            <h3 className="text-sm font-bold text-[#111827]">Recovery Rate</h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-[#2F8E86]">{data.collectionRatePct}</span>
            <span className="text-lg font-bold text-[#94A3B8] mb-1">%</span>
          </div>
          <div className="mt-3 h-2.5 w-full bg-[#EEF2F2] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2F8E86] rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, data.collectionRatePct))}%` }}
            />
          </div>
          <p className="text-[11px] text-[#64748B] mt-2">
            {inr(data.totalCollected)} collected of {inr(data.totalBilled)} billed.
          </p>
        </div>

        {/* Payment status breakdown */}
        <div className="bg-white rounded-2xl border border-[#E5EAEB] p-5 shadow-2xs lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-[#2F8E86]" />
            <h3 className="text-sm font-bold text-[#111827]">Invoice Payment Status</h3>
          </div>
          {data.paymentStatusBreakdown.length === 0 ? (
            <p className="text-xs text-[#94A3B8]">No invoices in this period.</p>
          ) : (
            <div className="space-y-3">
              {data.paymentStatusBreakdown.map((s) => {
                const total = data.paymentStatusBreakdown.reduce((a, b) => a + b.amount, 0) || 1;
                const pct = (s.amount / total) * 100;
                const label = s.status === "PartiallyPaid" ? "Partially Paid" : s.status;
                return (
                  <div key={s.status}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-[#334155]">
                        {label} <span className="text-[#94A3B8] font-normal">· {s.count}</span>
                      </span>
                      <span className="font-mono font-bold text-[#111827]">{inr(s.amount)}</span>
                    </div>
                    <div className="h-2 w-full bg-[#EEF2F2] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${STATUS_COLOR[s.status] || "bg-slate-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Monthly trend: billed vs collected */}
      <div className="bg-white rounded-2xl border border-[#E5EAEB] p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#2F8E86]" />
            <h3 className="text-sm font-bold text-[#111827]">Sales vs Recovery — Monthly</h3>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#2F8E86]" /> Billed</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400" /> Collected</span>
          </div>
        </div>

        {loading ? (
          <div className="h-52 flex items-center justify-center text-xs text-[#94A3B8]">Loading trend…</div>
        ) : data.monthlyTrend.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-xs text-[#94A3B8]">No data for this period.</div>
        ) : (
          <div className="flex items-end justify-between gap-2 h-52 pt-2">
            {data.monthlyTrend.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <div className="w-full flex items-end justify-center gap-1 h-40" title={`${m.label}: billed ${inr(m.billed)}, collected ${inr(m.collected)}`}>
                  <div
                    className="w-1/2 max-w-[22px] bg-[#2F8E86] rounded-t-md transition-all hover:opacity-80"
                    style={{ height: `${Math.max(2, (m.billed / maxTrend) * 100)}%` }}
                  />
                  <div
                    className="w-1/2 max-w-[22px] bg-emerald-400 rounded-t-md transition-all hover:opacity-80"
                    style={{ height: `${Math.max(2, (m.collected / maxTrend) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-[#64748B] truncate w-full text-center">{m.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cash & bank flow */}
      <div className="bg-white rounded-2xl border border-[#E5EAEB] p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-4 h-4 text-[#2F8E86]" />
          <h3 className="text-sm font-bold text-[#111827]">Cash & Bank Flow</h3>
          <span className="text-[11px] text-[#94A3B8] font-medium">collections in · expenses out, by payment mode</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-emerald-700"><ArrowDownCircle className="w-4 h-4" /><span className="text-xs font-semibold">Inflow (Collections)</span></div>
            <p className="text-xl font-black font-mono text-emerald-700 mt-1">{inr(data.totalInflow)}</p>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-red-600"><ArrowUpCircle className="w-4 h-4" /><span className="text-xs font-semibold">Outflow (Expenses)</span></div>
            <p className="text-xl font-black font-mono text-red-600 mt-1">{inr(data.totalOutflow)}</p>
          </div>
          <div className="rounded-xl border border-[#D9E2E3] bg-[#F6FBFB] p-3.5">
            <div className="flex items-center gap-1.5 text-[#25776F]"><Scale className="w-4 h-4" /><span className="text-xs font-semibold">Net Position</span></div>
            <p className={`text-xl font-black font-mono mt-1 ${data.netCashFlow >= 0 ? "text-[#25776F]" : "text-red-600"}`}>{inr(data.netCashFlow)}</p>
          </div>
        </div>

        {data.cashFlowByMode.length === 0 ? (
          <p className="text-xs text-[#94A3B8]">No collections or expenses recorded in this period.</p>
        ) : (
          <div className="space-y-3">
            {(() => {
              const max = Math.max(1, ...data.cashFlowByMode.flatMap((m) => [m.inflow, m.outflow]));
              return data.cashFlowByMode.map((m) => (
                <div key={m.mode} className="grid grid-cols-[90px_1fr_auto] items-center gap-3">
                  <span className="text-xs font-bold text-[#334155] truncate">{m.mode}</span>
                  <div className="space-y-1">
                    <div className="h-2.5 bg-[#EEF2F2] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(m.inflow / max) * 100}%` }} title={`Inflow ${inr(m.inflow)}`} />
                    </div>
                    <div className="h-2.5 bg-[#EEF2F2] rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${(m.outflow / max) * 100}%` }} title={`Outflow ${inr(m.outflow)}`} />
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-bold text-right w-24 ${m.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>{inr(m.net)}</span>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Top customers */}
      <DataTable<TopCustomer>
        title={
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2F8E86]" /> Top Customers by Revenue
          </span>
        }
        data={data.topCustomers}
        loading={loading}
        loadingText="Ranking customers…"
        rowKey={(c, i) => `${c.name}-${i}`}
        emptyIcon={<Users className="w-8 h-8" />}
        emptyTitle="No customer revenue yet"
        emptyMessage="Once freight invoices are raised in this period, your highest-value customers appear here."
        columns={[
          {
            key: "name",
            header: "Customer",
            render: (c, i) => (
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#E7F1F2] text-[#25776F] text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="font-bold text-[#111827]">{c.name}</span>
              </div>
            ),
          },
          { key: "invoiceCount", header: "Invoices", align: "center", render: (c) => <span className="font-semibold text-[#64748B]">{c.invoiceCount}</span> },
          { key: "billed", header: "Billed", align: "right", render: (c) => <span className="font-mono font-bold text-[#111827]">{inr2(c.billed)}</span> },
          { key: "collected", header: "Collected", align: "right", render: (c) => <span className="font-mono text-emerald-600">{inr2(c.collected)}</span> },
          { key: "outstanding", header: "Outstanding", align: "right", render: (c) => <span className={`font-mono font-semibold ${c.outstanding > 0 ? "text-[#4A90E2]" : "text-[#94A3B8]"}`}>{inr2(c.outstanding)}</span> },
        ]}
      />

      {/* Vehicle profitability */}
      <DataTable<VehicleProfit>
        title={
          <span className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#2F8E86]" /> Vehicle Profitability
          </span>
        }
        headerRight="Revenue − (expenses + driver advances), from trips in this period"
        data={data.vehicleProfitability}
        loading={loading}
        loadingText="Calculating vehicle margins…"
        rowKey={(v, i) => `${v.vehicleNo}-${i}`}
        emptyIcon={<Truck className="w-8 h-8" />}
        emptyTitle="No trip data yet"
        emptyMessage="Once trips record freight revenue and expenses in this period, per-vehicle profitability appears here."
        columns={[
          {
            key: "vehicleNo",
            header: "Vehicle",
            render: (v) => (
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#E7F1F2] text-[#25776F] flex items-center justify-center shrink-0">
                  <Truck className="w-3.5 h-3.5" />
                </span>
                <span className="font-mono font-bold text-[#111827]">{v.vehicleNo}</span>
              </div>
            ),
          },
          { key: "trips", header: "Trips", align: "center", render: (v) => <span className="font-semibold text-[#64748B]">{v.trips}</span> },
          { key: "revenue", header: "Revenue", align: "right", render: (v) => <span className="font-mono text-[#111827]">{inr2(v.revenue)}</span> },
          { key: "expenses", header: "Expenses", align: "right", render: (v) => <span className="font-mono text-[#64748B]">{inr2(v.expenses)}</span> },
          { key: "profit", header: "Profit", align: "right", render: (v) => <span className={`font-mono font-bold ${v.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{inr2(v.profit)}</span> },
          {
            key: "marginPct",
            header: "Margin",
            align: "right",
            render: (v) => (
              <span className={`inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                v.marginPct >= 15 ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : v.marginPct >= 0 ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-red-50 text-red-700 border-red-200"
              }`}>{v.marginPct}%</span>
            ),
          },
        ]}
      />

      {/* Branch profitability */}
      <DataTable<BranchProfit>
        title={
          <span className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#2F8E86]" /> Branch Profitability
          </span>
        }
        headerRight="By originating branch / location, from trips in this period"
        data={data.branchProfitability}
        loading={loading}
        loadingText="Calculating branch margins…"
        rowKey={(b, i) => `${b.branch}-${i}`}
        emptyIcon={<Building2 className="w-8 h-8" />}
        emptyTitle="No branch trip data yet"
        emptyMessage="Once trips record an origin branch with revenue and expenses, per-branch profitability appears here."
        columns={[
          {
            key: "branch",
            header: "Branch / Origin",
            render: (b) => (
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#E7F1F2] text-[#25776F] flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </span>
                <span className="font-bold text-[#111827]">{b.branch}</span>
              </div>
            ),
          },
          { key: "trips", header: "Trips", align: "center", render: (b) => <span className="font-semibold text-[#64748B]">{b.trips}</span> },
          { key: "revenue", header: "Revenue", align: "right", render: (b) => <span className="font-mono text-[#111827]">{inr2(b.revenue)}</span> },
          { key: "expenses", header: "Expenses", align: "right", render: (b) => <span className="font-mono text-[#64748B]">{inr2(b.expenses)}</span> },
          { key: "profit", header: "Profit", align: "right", render: (b) => <span className={`font-mono font-bold ${b.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{inr2(b.profit)}</span> },
          {
            key: "marginPct",
            header: "Margin",
            align: "right",
            render: (b) => (
              <span className={`inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                b.marginPct >= 15 ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : b.marginPct >= 0 ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-red-50 text-red-700 border-red-200"
              }`}>{b.marginPct}%</span>
            ),
          },
        ]}
      />
    </div>
  );
}
