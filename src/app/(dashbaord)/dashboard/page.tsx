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
  TrendingUp
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
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
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

      if (statsData?.success) {
        setStats(statsData.data);
      }
      if (revenueData?.success) {
        setRevenue(revenueData.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-[#f0f7ff] dark:bg-slate-950 min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">Loading logistics dispatch metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner - Solid Light Blue & Crisp White */}
      <div className="bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-1 rounded-md border border-sky-200 dark:border-sky-800">
              Operations Control
            </span>
            <span className="text-xs text-slate-400">Real-time TMS Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Logistics & Freight Dispatch Console
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor consignment bilties, truck manifests, POD acknowledgments, and revenue collections
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/shipments/create"
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Bilty (GR)</span>
          </Link>
          <Link
            href="/trips"
            className="px-4 py-2.5 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer dark:bg-slate-800 dark:text-sky-300 dark:border-slate-700"
          >
            <Truck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Truck Challans</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-100 dark:border-slate-800 shadow-xs hover:border-sky-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Bilties (GR)
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 flex items-center justify-center font-bold text-sm">
              <ClipboardList className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.totalGrEntries || 0}
            </h3>
            <p className="text-xs font-medium text-sky-700 dark:text-sky-400 mt-1">
              This Month: <strong>{stats?.thisMonthEntries || 0}</strong> booked
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-100 dark:border-slate-800 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              In-Transit / Pending
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center font-bold text-sm">
              <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {stats?.pendingDeliveries || 0}
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Active dispatches on road
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-100 dark:border-slate-800 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Delivered / POD Closed
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats?.completedDeliveries || 0}
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Acknowledged delivery slips
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-100 dark:border-slate-800 shadow-xs hover:border-sky-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Freight Billed
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 flex items-center justify-center font-bold text-sm">
              <IndianRupee className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-sky-700 dark:text-sky-400">
              ₹{stats?.totalRevenue ? stats.totalRevenue.toLocaleString('en-IN') : "0"}
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Consignment freight revenue
            </p>
          </div>
        </div>
      </div>

      {/* Revenue & Payment Mode Split */}
      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-100 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Paid / Cash Collections</span>
                <h4 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  ₹{revenue.paidAmount?.toLocaleString('en-IN') || 0}
                </h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
                <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Immediate settlement & counter collections</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-100 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">To-Pay (Destination Pay)</span>
                <h4 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                  ₹{revenue.toPayAmount?.toLocaleString('en-IN') || 0}
                </h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Payable by consignee upon delivery</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-100 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">TBB (To-Be-Billed / Credit)</span>
                <h4 className="text-xl font-extrabold text-sky-700 dark:text-sky-400 mt-1">
                  ₹{revenue.tbbAmount?.toLocaleString('en-IN') || 0}
                </h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Monthly customer corporate invoices</p>
          </div>
        </div>
      )}

      {/* Recent Bilties Registry Table */}
      {stats?.recentBills && stats.recentBills.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-sky-100 dark:border-slate-800 flex items-center justify-between bg-sky-50/50 dark:bg-slate-850">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Consignment Bilties</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live booking feed across all active branches</p>
            </div>
            <Link
              href="/shipments"
              className="text-xs font-bold text-sky-700 hover:text-sky-800 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>View Full Registry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase border-b border-slate-200/80 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3.5">GR Number</th>
                  <th className="px-6 py-3.5">Consignee</th>
                  <th className="px-6 py-3.5">Route</th>
                  <th className="px-6 py-3.5">Delivery Status</th>
                  <th className="px-6 py-3.5">Freight Total</th>
                  <th className="px-6 py-3.5">Booking Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {stats.recentBills.slice(0, 5).map((bill) => (
                  <tr
                    key={bill.id}
                    className="hover:bg-sky-50/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                    onClick={() => router.push(`/shipments/${bill.id}`)}
                  >
                    <td className="px-6 py-3.5 font-mono font-bold text-sky-700 dark:text-sky-400">
                      {bill.grNo}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-white">
                      {bill.consigneeName}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{bill.fromLocation}</span>
                        <ArrowRight className="w-3 h-3 text-sky-500" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{bill.toLocation}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          bill.deliveryStatus === "Delivered" || bill.deliveryStatus === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                        }`}
                      >
                        {bill.deliveryStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                      ₹{bill.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Launchpad */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-sky-100 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          Quick Operational Launchpad
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/shipments/create"
            className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/60 dark:bg-slate-800 dark:border-slate-700 transition flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-sky-700 dark:text-sky-300" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-sky-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-400">
                New Bilty Booking
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Issue fresh consignment GR</p>
            </div>
          </Link>

          <Link
            href="/trips"
            className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/60 dark:bg-slate-800 dark:border-slate-700 transition flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-sky-700 dark:text-sky-300" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-sky-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-400">
                Truck Challans
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Dispatch vehicle loading memo</p>
            </div>
          </Link>

          <Link
            href="/pod"
            className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/60 dark:bg-slate-800 dark:border-slate-700 transition flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5 text-sky-700 dark:text-sky-300" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-sky-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-400">
                POD Upload & Delivery
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Update proof of delivery</p>
            </div>
          </Link>

          <Link
            href="/reports"
            className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/60 dark:bg-slate-800 dark:border-slate-700 transition flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5 text-sky-700 dark:text-sky-300" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-sky-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-400">
                Reports & Ledger
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Tax, P&L, outstanding balance</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}