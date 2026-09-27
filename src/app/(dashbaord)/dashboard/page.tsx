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
      <div className="p-8 bg-[#F7F8F8] dark:bg-slate-950 min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#47868C] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#64748B] dark:text-slate-400 font-medium text-sm">Loading logistics dispatch metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner - Solid White Card with FleetPulse Accents */}
      <div className="bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3F7C82] bg-[#E7F1F2] px-2.5 py-1 rounded-md border border-[#D9E2E3]">
              Operations Control
            </span>
            <span className="text-xs text-[#94A3B8]">Real-time TMS Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white tracking-tight">
            Logistics & Freight Dispatch Console
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400">
            Monitor consignment bilties, truck manifests, POD acknowledgments, and revenue collections
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/shipments/create"
            className="px-4 py-2.5 bg-[#47868C] hover:bg-[#3F7C82] text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Bilty (GR)</span>
          </Link>
          <Link
            href="/trips"
            className="px-4 py-2.5 bg-white hover:bg-[#E7F1F2] text-[#3F7C82] border border-[#D9E2E3] text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
          >
            <Truck className="w-3.5 h-3.5 text-[#47868C]" />
            <span>Truck Challans</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards - Disciplined FleetPulse Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs hover:border-[#D9E2E3] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
              Total Bilties (GR)
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#E7F1F2] text-[#47868C] flex items-center justify-center font-bold text-sm">
              <ClipboardList className="w-4 h-4 text-[#47868C]" />
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
              In-Transit / Pending
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
              Active dispatches on road
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs hover:border-[#D9E2E3] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
              Delivered / POD Closed
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#2F9E8F]/10 text-[#2F9E8F] flex items-center justify-center font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-[#2F9E8F]" />
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

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs hover:border-[#D9E2E3] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
              Total Freight Billed
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#E7F1F2] text-[#47868C] flex items-center justify-center font-bold text-sm">
              <IndianRupee className="w-4 h-4 text-[#47868C]" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#111827] dark:text-white">
              ₹{stats?.totalRevenue ? stats.totalRevenue.toLocaleString('en-IN') : "0"}
            </h3>
            <p className="text-xs font-medium text-[#64748B] dark:text-slate-400 mt-1">
              Consignment freight revenue
            </p>
          </div>
        </div>
      </div>

      {/* Revenue & Payment Mode Split */}
      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAEB] dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase">Paid / Cash Collections</span>
                <h4 className="text-xl font-bold text-[#111827] dark:text-white mt-1">
                  ₹{revenue.paidAmount?.toLocaleString('en-IN') || 0}
                </h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#2F9E8F]/10 flex items-center justify-center">
                <Banknote className="w-5 h-5 text-[#2F9E8F]" />
              </div>
            </div>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-2">Immediate settlement & counter collections</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAEB] dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase">To-Pay (Destination Pay)</span>
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
      )}

      {/* Recent Bilties Registry Table */}
      {stats?.recentBills && stats.recentBills.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between bg-[#F7F8F8] dark:bg-slate-850">
            <div>
              <h2 className="text-base font-bold text-[#111827] dark:text-white">Recent Consignment Bilties</h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">Live booking feed across all active branches</p>
            </div>
            <Link
              href="/shipments"
              className="text-xs font-semibold text-[#47868C] hover:text-[#3F7C82] hover:underline flex items-center gap-1"
            >
              <span>View Full Registry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F8F8] dark:bg-slate-800/60 text-[#64748B] dark:text-slate-300 text-xs font-semibold uppercase border-b border-[#E5EAEB] dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3.5">GR Number</th>
                  <th className="px-6 py-3.5">Consignee</th>
                  <th className="px-6 py-3.5">Route</th>
                  <th className="px-6 py-3.5">Delivery Status</th>
                  <th className="px-6 py-3.5">Freight Total</th>
                  <th className="px-6 py-3.5">Booking Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAEB] dark:divide-slate-800 text-[#111827] dark:text-slate-300">
                {stats.recentBills.slice(0, 5).map((bill) => (
                  <tr
                    key={bill.id}
                    className="hover:bg-[#F5FAFA] dark:hover:bg-slate-800/50 transition cursor-pointer"
                    onClick={() => router.push(`/shipments/${bill.id}`)}
                  >
                    <td className="px-6 py-3.5 font-mono font-bold text-[#47868C]">
                      {bill.grNo}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-[#111827] dark:text-white">
                      {bill.consigneeName}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-medium text-[#111827] dark:text-slate-300">{bill.fromLocation}</span>
                        <ArrowRight className="w-3 h-3 text-[#4A90E2]" />
                        <span className="font-medium text-[#111827] dark:text-slate-300">{bill.toLocation}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          bill.deliveryStatus === "Delivered" || bill.deliveryStatus === "Completed"
                            ? "bg-[#E7F1F2] text-[#2F9E8F] border border-[#2F9E8F]/20"
                            : "bg-[#4A90E2]/10 text-[#4A90E2] border border-[#4A90E2]/20"
                        }`}
                      >
                        {bill.deliveryStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-[#111827] dark:text-white">
                      ₹{bill.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-[#64748B] dark:text-slate-400">
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-bold text-[#111827] dark:text-white uppercase tracking-wider mb-4 pb-2 border-b border-[#E5EAEB] dark:border-slate-800">
          Quick Operational Launchpad
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/shipments/create"
            className="p-4 rounded-xl border border-[#E5EAEB] bg-[#F7F8F8] hover:bg-[#E7F1F2] hover:border-[#D9E2E3] dark:bg-slate-800 dark:border-slate-700 transition flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-[#D9E2E3] flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-[#47868C]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#111827] group-hover:text-[#3F7C82]">
                New Bilty Booking
              </h4>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">Issue fresh consignment GR</p>
            </div>
          </Link>

          <Link
            href="/trips"
            className="p-4 rounded-xl border border-[#E5EAEB] bg-[#F7F8F8] hover:bg-[#E7F1F2] hover:border-[#D9E2E3] dark:bg-slate-800 dark:border-slate-700 transition flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-[#D9E2E3] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-[#47868C]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#111827] group-hover:text-[#3F7C82]">
                Truck Challans
              </h4>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">Dispatch vehicle loading memo</p>
            </div>
          </Link>

          <Link
            href="/pod"
            className="p-4 rounded-xl border border-[#E5EAEB] bg-[#F7F8F8] hover:bg-[#E7F1F2] hover:border-[#D9E2E3] dark:bg-slate-800 dark:border-slate-700 transition flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-[#D9E2E3] flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5 text-[#47868C]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#111827] group-hover:text-[#3F7C82]">
                POD Upload & Delivery
              </h4>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">Update proof of delivery</p>
            </div>
          </Link>

          <Link
            href="/reports"
            className="p-4 rounded-xl border border-[#E5EAEB] bg-[#F7F8F8] hover:bg-[#E7F1F2] hover:border-[#D9E2E3] dark:bg-slate-800 dark:border-slate-700 transition flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-[#D9E2E3] flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5 text-[#47868C]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#111827] group-hover:text-[#3F7C82]">
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