"use client";

import { useState, useEffect } from "react";
import { apiService } from "../../../../services/apiservice";
import { useRouter } from "next/navigation";

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

      if (statsData.success) {
        setStats(statsData.data);
      }
      if (revenueData.success) {
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
      <div className="p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white shadow-lg">
        <h1 className="text-4xl font-bold mb-2">Welcome to K-Transport</h1>
        <p className="text-indigo-100 text-lg">Manage your logistics and transportation seamlessly</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total GR Entries</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats?.totalGrEntries || 0}</h3>
              <p className="text-xs text-gray-400 mt-1">This month: {stats?.thisMonthEntries || 0}</p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Pending Deliveries</p>
              <h3 className="text-3xl font-bold text-amber-600 mt-2">{stats?.pendingDeliveries || 0}</h3>
              <p className="text-xs text-gray-400 mt-1">Awaiting delivery</p>
            </div>
            <div className="text-4xl">🚚</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Completed</p>
              <h3 className="text-3xl font-bold text-emerald-600 mt-2">{stats?.completedDeliveries || 0}</h3>
              <p className="text-xs text-gray-400 mt-1">Delivered</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
              <h3 className="text-3xl font-bold text-indigo-600 mt-2">
                ₹{stats?.totalRevenue?.toLocaleString('en-IN') || 0}
              </h3>
              <p className="text-xs text-gray-400 mt-1">All time</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Paid Amount</p>
              <span className="text-emerald-500 text-xl">💵</span>
            </div>
            <h3 className="text-2xl font-bold text-emerald-600">
              ₹{revenue.paidAmount?.toLocaleString('en-IN')}
            </h3>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">To Pay Amount</p>
              <span className="text-amber-500 text-xl">💳</span>
            </div>
            <h3 className="text-2xl font-bold text-amber-600">
              ₹{revenue.toPayAmount?.toLocaleString('en-IN')}
            </h3>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">TBB Amount</p>
              <span className="text-blue-500 text-xl">📊</span>
            </div>
            <h3 className="text-2xl font-bold text-blue-600">
              ₹{revenue.tbbAmount?.toLocaleString('en-IN')}
            </h3>
          </div>
        </div>
      )}

      {/* Recent Bills */}
      {stats && stats.recentBills && stats.recentBills.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <h2 className="text-white font-semibold text-lg">Recent Bills</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">GR No</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Consignee</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentBills.slice(0, 5).map((bill) => (
                  <tr 
                    key={bill.id} 
                    className="hover:bg-indigo-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/gr-entry?id=${bill.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-indigo-600">{bill.grNo}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {bill.consigneeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center gap-1">
                        <span>{bill.fromLocation}</span>
                        <span className="text-indigo-500">→</span>
                        <span>{bill.toLocation}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          bill.deliveryStatus === "Pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {bill.deliveryStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      ₹{bill.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/dashboard/gr-entry"
            className="flex items-center gap-4 p-4 rounded-lg border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-200"
          >
            <span className="text-3xl">➕</span>
            <div>
              <h3 className="font-bold text-indigo-700">New GR Entry</h3>
              <p className="text-sm text-indigo-600">Create a new goods receipt</p>
            </div>
          </a>

          <a
            href="/dashboard/gr-list"
            className="flex items-center gap-4 p-4 rounded-lg border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-300 transition-all duration-200"
          >
            <span className="text-3xl">📋</span>
            <div>
              <h3 className="font-bold text-purple-700">View All GR</h3>
              <p className="text-sm text-purple-600">Browse all entries</p>
            </div>
          </a>

          <a
            href="/dashboard/reports"
            className="flex items-center gap-4 p-4 rounded-lg border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-200"
          >
            <span className="text-3xl">📊</span>
            <div>
              <h3 className="font-bold text-emerald-700">Reports</h3>
              <p className="text-sm text-emerald-600">View analytics and reports</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}