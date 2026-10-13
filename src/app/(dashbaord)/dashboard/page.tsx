"use client";

import { useState, useEffect } from "react";
import { apiService } from "../../../../services/apiservice";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Plus, 
  Truck, 
  ClipboardList, 
  CheckCircle2, 
  IndianRupee, 
  Banknote, 
  CreditCard, 
  BarChart3, 
  Package, 
  FileCheck, 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";

interface DashboardStats {
  totalGrEntries: number;
  pendingDeliveries: number;
  completedDeliveries: number;
  totalRevenue: number;
  todayEntries: number;
  thisMonthEntries: number;
  pendingAmount: number;
  collectedAmount: number;
  recentBills: Array<{
    id: number;
    grNo: string;
    consigneeName: string;
    fromLocation: string;
    toLocation: string;
    deliveryStatus: string;
    totalAmount: number;
    createdAt: string;
  }>;
  deliveryStatusBreakdown: Array<{
    status: string;
    count: number;
  }>;
}

interface RevenueStats {
  totalRevenue: number;
  todayRevenue: number;
  thisMonthRevenue: number;
  thisYearRevenue: number;
  paidAmount: number;
  toPayAmount: number;
  tbbAmount: number;
  paymentReceived?: number;
  outstandingDue?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueStats | null>({
    totalRevenue: 0,
    todayRevenue: 0,
    thisMonthRevenue: 0,
    thisYearRevenue: 0,
    paidAmount: 0,
    toPayAmount: 0,
    tbbAmount: 0,
    paymentReceived: 0,
    outstandingDue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, revenueResponse] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getDashboardRevenue(),
      ]);

      const statsData = statsResponse as any;
      const revenueData = revenueResponse as any;

      const statsPayload = statsData?.data ?? statsData?.Data ?? (statsData?.totalGrEntries !== undefined || statsData?.TotalGrEntries !== undefined ? statsData : null);
      if (statsPayload) {
        setStats(statsPayload);
      }

      const revenuePayload = revenueData?.data ?? revenueData?.Data ?? (revenueData?.totalRevenue !== undefined || revenueData?.TotalRevenue !== undefined ? revenueData : null);
      if (revenuePayload) {
        setRevenue(revenuePayload);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = stats?.totalRevenue ?? revenue?.totalRevenue ?? 0;
  const paymentReceived = stats?.collectedAmount ?? revenue?.paymentReceived ?? 0;
  const outstandingDue = stats?.pendingAmount ?? revenue?.outstandingDue ?? 0;
  const recoveryRate = totalRevenue > 0 ? Math.round((paymentReceived / totalRevenue) * 100) : 0;
  const pendingRate = totalRevenue > 0 ? Math.round((outstandingDue / totalRevenue) * 100) : 0;

  if (loading) {
    return (
      <div className="p-8 bg-[#F7F8F8] dark:bg-slate-950 min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#2F8E86] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#64748B] dark:text-slate-400 font-medium text-sm">Loading logistics dispatch metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner - Solid White Card with FleetPulse Accents */}
      <div className="bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-[#25776F] bg-[#E7F1F2] px-2.5 py-1 rounded-md border border-[#D9E2E3] dark:text-teal-300 dark:bg-slate-800 dark:border-slate-700">
              Overview
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400">
            Bilties, deliveries and collections — at a glance.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/shipments/create"
            className="px-4 py-2.5 bg-[#2F8E86] hover:bg-[#25776F] text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Bilty</span>
          </Link>
          <Link
            href="/trips"
            className="px-4 py-2.5 bg-white hover:bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
          >
            <Truck className="w-3.5 h-3.5 text-[#2F8E86]" />
            <span>Truck Challans</span>
          </Link>
        </div>
      </div>

      {/* Executive Financial Health - Billed, Received & Outstanding Due */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Freight Billed */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs hover:border-[#D9E2E3] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
              Total Freight Billed
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#E7F1F2] text-[#2F8E86] flex items-center justify-center font-bold text-sm dark:bg-slate-800">
              <IndianRupee className="w-5 h-5 text-[#2F8E86]" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white">
              ₹{totalRevenue ? totalRevenue.toLocaleString('en-IN') : "0"}
            </h3>
            <div className="flex items-center justify-between text-xs font-medium text-[#64748B] dark:text-slate-400 mt-2">
              <span>Gross consignment booked freight</span>
              <span className="text-[#25776F] font-semibold dark:text-teal-300">100% Value</span>
            </div>
          </div>
        </div>

        {/* Payment Received */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-900/40 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Payment Received
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Collected
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              ₹{paymentReceived ? paymentReceived.toLocaleString('en-IN') : "0"}
            </h3>
            <div className="flex items-center justify-between text-xs font-medium text-[#64748B] dark:text-slate-400 mt-2">
              <Link href="/reports?tab=booking_register&paymentFilter=received" className="hover:text-emerald-700 hover:underline flex items-center gap-1 font-semibold">
                <span>MR & Delivery Settlements</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                {recoveryRate}% Recovery
              </span>
            </div>
          </div>
        </div>

        {/* Outstanding Due */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-amber-100 dark:border-amber-900/40 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Outstanding Due
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                Pending
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
              ₹{outstandingDue ? outstandingDue.toLocaleString('en-IN') : "0"}
            </h3>
            <div className="flex items-center justify-between text-xs font-medium text-[#64748B] dark:text-slate-400 mt-2">
              <Link href="/reports?tab=booking_register&paymentFilter=due" className="hover:text-amber-700 hover:underline flex items-center gap-1 font-semibold">
                <span>View due</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
              <span className="font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                {pendingRate}% pending
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Dispatch Metrics - 3 FleetPulse Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs hover:border-[#D9E2E3] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
              Total Bilties (GR)
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#E7F1F2] text-[#2F8E86] flex items-center justify-center font-bold text-sm dark:bg-slate-800">
              <ClipboardList className="w-4 h-4 text-[#2F8E86]" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#111827] dark:text-white">
              {stats?.totalGrEntries || 0}
            </h3>
            <p className="text-xs font-medium text-[#64748B] dark:text-slate-400 mt-1">
              This Month: <strong className="text-[#111827] dark:text-white">{stats?.thisMonthEntries || 0}</strong> booked
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs hover:border-[#D9E2E3] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
              In-Transit / Dispatched
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#4A90E2]/10 text-[#4A90E2] flex items-center justify-center font-bold text-sm">
              <Truck className="w-4 h-4 text-[#4A90E2]" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#111827] dark:text-white">
              {stats?.pendingDeliveries || 0}
            </h3>
            <p className="text-xs font-medium text-[#64748B] dark:text-slate-400 mt-1">
              Active consignments on road
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs hover:border-[#D9E2E3] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
              Delivered / POD Closed
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#2F9E8F]/10 text-[#2F9E8F] flex items-center justify-center font-bold text-sm">
              <FileCheck className="w-4 h-4 text-[#2F9E8F]" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#111827] dark:text-white">
              {stats?.completedDeliveries || 0}
            </h3>
            <p className="text-xs font-medium text-[#64748B] dark:text-slate-400 mt-1">
              Acknowledged delivery slips
            </p>
          </div>
        </div>
      </div>

      {/* Booking Payment Terms Split */}
      {revenue && (
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <h3 className="text-sm font-bold text-[#111827] dark:text-white uppercase tracking-wider">
                Booking Terms Breakdown
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Consignment freight classified by billing & payment agreement
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5EAEB] dark:border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase">Paid / Cash Bookings</span>
                  <h4 className="text-xl font-bold text-[#111827] dark:text-white mt-1">
                    ₹{revenue.paidAmount?.toLocaleString('en-IN') || 0}
                  </h4>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#2F9E8F]/10 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-[#2F9E8F]" />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-[#64748B] dark:text-slate-400">Paid at origin counter</span>
                <Link
                  href="/receipts"
                  className="font-semibold text-[#2F8E86] hover:text-[#25776F] hover:underline flex items-center gap-1"
                >
                  <span>View receipts</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5EAEB] dark:border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase">To-Pay (Pay on Delivery)</span>
                  <h4 className="text-xl font-bold text-[#111827] dark:text-white mt-1">
                    ₹{revenue.toPayAmount?.toLocaleString('en-IN') || 0}
                  </h4>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#F4A261]/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#F4A261]" />
                </div>
              </div>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-2">Payable by consignee upon delivery</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5EAEB] dark:border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase">TBB (To-Be-Billed / Credit)</span>
                  <h4 className="text-xl font-bold text-[#111827] dark:text-white mt-1">
                    ₹{revenue.tbbAmount?.toLocaleString('en-IN') || 0}
                  </h4>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#4A90E2]/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-[#4A90E2]" />
                </div>
              </div>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-2">Monthly customer corporate invoices</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Bilties Registry Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#E5EAEB] dark:border-slate-800 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-[#F7F8F8] dark:bg-slate-800/60">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#111827] dark:text-white">Recent Bilties</h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">Latest bookings across branches.</p>
          </div>
          <Link
            href="/shipments"
            className="text-xs font-semibold text-[#2F8E86] hover:text-[#25776F] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>See all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.recentBills && stats.recentBills.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#F7F8F8] dark:bg-slate-800/60 text-[#64748B] dark:text-slate-300 text-xs font-semibold uppercase border-b border-[#E5EAEB] dark:border-slate-700 whitespace-nowrap">
                <tr>
                  <th className="px-5 py-3.5 w-36 min-w-[130px]">GR Number</th>
                  <th className="px-5 py-3.5 min-w-[160px]">Consignee</th>
                  <th className="px-5 py-3.5 min-w-[180px]">Route</th>
                  <th className="px-5 py-3.5 min-w-[130px]">Delivery Status</th>
                  <th className="px-5 py-3.5 min-w-[120px]">Freight Total</th>
                  <th className="px-5 py-3.5 min-w-[120px]">Booking Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAEB] dark:divide-slate-800 text-[#111827] dark:text-slate-300 whitespace-nowrap">
                {stats.recentBills.slice(0, 5).map((bill) => (
                  <tr
                    key={bill.id}
                    className="hover:bg-[#F5FAFA] dark:hover:bg-slate-800/50 transition cursor-pointer"
                    onClick={() => router.push(`/shipments/details?id=${bill.id}`)}
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-[#2F8E86] whitespace-nowrap">
                      {bill.grNo}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#111827] dark:text-white whitespace-nowrap">
                      {bill.consigneeName}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                        <span className="font-medium text-[#111827] dark:text-slate-300">{bill.fromLocation}</span>
                        <ArrowRight className="w-3 h-3 text-[#4A90E2] shrink-0" />
                        <span className="font-medium text-[#111827] dark:text-slate-300">{bill.toLocation}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                          bill.deliveryStatus === "Delivered" || bill.deliveryStatus === "Completed"
                            ? "bg-[#E7F1F2] text-[#2F9E8F] border border-[#2F9E8F]/20"
                            : "bg-[#4A90E2]/10 text-[#4A90E2] border border-[#4A90E2]/20"
                        }`}
                      >
                        {bill.deliveryStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#111827] dark:text-white whitespace-nowrap font-mono">
                      ₹{bill.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#64748B] dark:text-slate-400 whitespace-nowrap font-mono">
                      {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 px-4 text-center">
            <ClipboardList className="w-10 h-10 text-[#94A3B8] mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-[#111827] dark:text-white">No Consignment Bilties Yet</p>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 mb-4">Book your first consignment bilty to start tracking live dispatches.</p>
            <Link
              href="/shipments/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white text-xs font-semibold rounded-xl transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Bilty</span>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Launchpad */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-bold text-[#111827] dark:text-white uppercase tracking-wider mb-4 pb-2 border-b border-[#E5EAEB] dark:border-slate-800">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/shipments/create"
            className="p-4 rounded-xl border border-[#E5EAEB] bg-[#F7F8F8] hover:bg-[#E7F1F2] hover:border-[#D9E2E3] dark:bg-slate-800 dark:border-slate-700 transition flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-[#D9E2E3] flex items-center justify-center shrink-0 dark:bg-slate-900 dark:border-slate-700">
              <Package className="w-5 h-5 text-[#2F8E86]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#111827] group-hover:text-[#25776F] dark:text-white">
                New Bilty Booking
              </h4>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">Issue fresh consignment GR</p>
            </div>
          </Link>

          <Link
            href="/trips"
            className="p-4 rounded-xl border border-[#E5EAEB] bg-[#F7F8F8] hover:bg-[#E7F1F2] hover:border-[#D9E2E3] dark:bg-slate-800 dark:border-slate-700 transition flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-[#D9E2E3] flex items-center justify-center shrink-0 dark:bg-slate-900 dark:border-slate-700">
              <Truck className="w-5 h-5 text-[#2F8E86]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#111827] group-hover:text-[#25776F] dark:text-white">
                Truck Challans
              </h4>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">Dispatch vehicle loading memo</p>
            </div>
          </Link>

          <Link
            href="/pod"
            className="p-4 rounded-xl border border-[#E5EAEB] bg-[#F7F8F8] hover:bg-[#E7F1F2] hover:border-[#D9E2E3] dark:bg-slate-800 dark:border-slate-700 transition flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-[#D9E2E3] flex items-center justify-center shrink-0 dark:bg-slate-900 dark:border-slate-700">
              <FileCheck className="w-5 h-5 text-[#2F8E86]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#111827] group-hover:text-[#25776F] dark:text-white">
                POD Upload & Delivery
              </h4>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">Update proof of delivery</p>
            </div>
          </Link>

          <Link
            href="/reports"
            className="p-4 rounded-xl border border-[#E5EAEB] bg-[#F7F8F8] hover:bg-[#E7F1F2] hover:border-[#D9E2E3] dark:bg-slate-800 dark:border-slate-700 transition flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-[#D9E2E3] flex items-center justify-center shrink-0 dark:bg-slate-900 dark:border-slate-700">
              <BarChart3 className="w-5 h-5 text-[#2F8E86]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#111827] group-hover:text-[#25776F] dark:text-white">
                Reports & Ledger
              </h4>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">Tax, P&L, outstanding balance</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}