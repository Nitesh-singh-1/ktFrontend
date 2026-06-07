"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import { apiService } from "../../../../../services/apiservice";
import { printChallan } from "@/utils/print";

interface ChallanDetail {
  id: number;
  challanId: number;
  billNo: string;
  quantity: number;
  destination: string;
  freightAmount: number;
  billTypeId: number;
  billTypeName: string;
  consigneeName: string;
  remarks: string;
  isDeleted: boolean;
  createdDate: string;
}

interface ChallanEntry {
  id: number;
  challanNo: string;
  challanDate: string;
  lorryNo: string;
  driverName: string;
  voiceDriverName: string;
  fromLocation: string;
  toLocation: string;
  remarks: string;
  isDeleted: boolean;
  createdDate: string;
  createdBy: number;
  createdByName: string;
  modifiedDate: string | null;
  modifiedBy: number | null;
  modifiedByName: string | null;
  challanDetails: ChallanDetail[];
}

interface APIResponse {
  success: boolean;
  message: string;
  data: ChallanEntry[];
  totalCount: number;
}

export default function ChallanListPage() {
  const router = useRouter();
  const [challans, setChallans] = useState<ChallanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchChallans();
  }, [page]);

  const fetchChallans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAllChallans(page, pageSize) as APIResponse;
      if (response.success) {
        setChallans(response.data);
        setTotalCount(response.totalCount);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch challans");
      console.error("Error fetching challans:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/dashboard/challan-entry?id=${id}`);
  };

  const handleDelete = async (id: number, challanNo: string) => {
    if (!confirm(`Are you sure you want to delete Challan ${challanNo}?`)) {
      return;
    }

    try {
      await apiService.deleteChallan(id);
      alert("Challan deleted successfully");
      fetchChallans();
    } catch (err: any) {
      alert(err.message || "Failed to delete challan");
      console.error("Error deleting challan:", err);
    }
  };

  const handlePrint = async (id: number) => {
    await printChallan(id);
  };

  const calculateTotals = (details: ChallanDetail[]) => {
    const totalQuantity = details.reduce((sum, d) => sum + d.quantity, 0);
    const totalFreight = details.reduce((sum, d) => sum + d.freightAmount, 0);
    return { totalQuantity, totalFreight };
  };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading challans...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-center bg-white p-8 rounded-xl shadow-lg">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <p className="text-red-600 mb-4 font-medium">{error}</p>
            <Button onClick={fetchChallans}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Challan List
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage all your trip challans</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/challan-entry")}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          New Challan
        </button>
      </div>

      {/* CHALLANS TABLE */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h2 className="text-white font-semibold text-lg">
            Total Challans: {totalCount}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Challan No
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Lorry No
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Bills
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Total Qty
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Total Freight
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {challans.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="text-gray-400 text-6xl mb-4">🚚</div>
                    <p className="text-gray-500 font-medium">No challans found</p>
                    <p className="text-gray-400 text-sm mt-2">Click "New Challan" to create one.</p>
                  </td>
                </tr>
              ) : (
                challans.map((challan) => {
                  const totals = calculateTotals(challan.challanDetails);
                  return (
                    <tr
                      key={challan.id}
                      className="hover:bg-indigo-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-indigo-600">{challan.challanNo}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(challan.challanDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono font-semibold">
                        {challan.lorryNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {challan.driverName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{challan.fromLocation}</span>
                          <span className="text-indigo-500">→</span>
                          <span className="font-medium">{challan.toLocation}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                          {challan.challanDetails.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {totals.totalQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                        ₹{totals.totalFreight.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {challan.createdByName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(challan.id)}
                            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg font-medium transition-colors duration-150 text-xs"
                            title="Edit Challan"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handlePrint(challan.id)}
                            className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded-lg font-medium transition-colors duration-150 text-xs"
                            title="Print Challan"
                          >
                            🖨️ Print
                          </button>
                          <button
                            onClick={() => handleDelete(challan.id, challan.challanNo)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg font-medium transition-colors duration-150 text-xs"
                            title="Delete Challan"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalCount > pageSize && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing <span className="font-semibold">{(page - 1) * pageSize + 1}</span> to{" "}
              <span className="font-semibold">{Math.min(page * pageSize, totalCount)}</span> of{" "}
              <span className="font-semibold">{totalCount}</span> results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * pageSize >= totalCount}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
