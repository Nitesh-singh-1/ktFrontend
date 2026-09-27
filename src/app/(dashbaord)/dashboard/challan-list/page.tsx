"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import { apiService } from "../../../../../services/apiservice";
import { printChallan } from "@/utils/print";
import {
  Truck,
  Plus,
  Edit2,
  Printer,
  Trash2,
  AlertTriangle,
  ArrowRight
} from "lucide-react";

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
      const response: any = await apiService.getAllChallans(page, pageSize);
      
      if (response.success && response.data) {
        setChallans(response.data);
        setTotalCount(response.totalCount || 0);
      } else {
        setError(response.message || "Failed to fetch challans");
      }
    } catch (err: any) {
      console.error("Error fetching challans:", err);
      setError(err.message || "Failed to fetch challans");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/dashboard/challan-entry?id=${id}`);
  };

  const handleDelete = async (id: number, challanNo: string) => {
    if (!confirm(`Are you sure you want to delete challan "${challanNo}"?`)) {
      return;
    }

    try {
      const response: any = await apiService.deleteChallan(id);
      if (response.success) {
        alert("Challan deleted successfully");
        fetchChallans();
      } else {
        alert(response.message || "Failed to delete challan");
      }
    } catch (err: any) {
      console.error("Error deleting challan:", err);
      alert(err.message || "Failed to delete challan");
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
      <div className="p-6 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2F8E86] mx-auto mb-4"></div>
            <p className="text-[#64748B] font-medium text-xs">Loading challans...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-center bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xs border border-[#E5EAEB] dark:border-slate-800 max-w-md">
            <AlertTriangle className="w-12 h-12 text-[#D95C5C] mx-auto mb-4" />
            <p className="text-[#D95C5C] mb-4 font-medium text-sm">{error}</p>
            <Button onClick={fetchChallans}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[#E5EAEB] dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#111827] dark:text-white tracking-tight">
              Challan Registry & Dispatch Manifests
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] rounded-full dark:bg-slate-800 dark:text-[#2F8E86] dark:border-slate-700">
              Trip Loading Sheets
            </span>
          </div>
          <p className="text-[#64748B] dark:text-slate-400 text-xs mt-1">Manage and track all your vehicle dispatch challans</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/challan-entry")}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>New Challan</span>
        </button>
      </div>

      {/* CHALLANS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs overflow-hidden border border-[#E5EAEB] dark:border-slate-800">
        <div className="bg-[#F7F8F8] dark:bg-slate-800/60 px-6 py-3 border-b border-[#E5EAEB] dark:border-slate-700">
          <h2 className="text-[#111827] dark:text-slate-200 font-semibold text-xs uppercase tracking-wider">
            Total Challans: <span className="font-mono font-bold text-[#2F8E86]">{totalCount}</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7F8F8] dark:bg-slate-800/60 border-b border-[#E5EAEB] dark:border-slate-700 text-[11px] font-bold text-[#64748B] dark:text-slate-300 uppercase tracking-wider">
                <th className="px-6 py-3">Challan No</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Lorry No</th>
                <th className="px-6 py-3">Driver</th>
                <th className="px-6 py-3">Route</th>
                <th className="px-6 py-3 text-center">Bills</th>
                <th className="px-6 py-3 text-center">Total Qty</th>
                <th className="px-6 py-3 text-right">Total Freight</th>
                <th className="px-6 py-3">Created By</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAEB] dark:divide-slate-800">
              {challans.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex justify-center mb-3">
                      <Truck className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">No challans found</p>
                    <p className="text-slate-400 text-xs mt-1">Click &ldquo;New Challan&rdquo; to create your first dispatch manifest.</p>
                  </td>
                </tr>
              ) : (
                challans.map((challan) => {
                  const totals = calculateTotals(challan.challanDetails);
                  return (
                    <tr
                      key={challan.id}
                      className="hover:bg-[#F5FAFA] dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-6 py-3.5 whitespace-nowrap font-mono font-bold text-[#2F8E86]">
                        {challan.challanNo}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-[#64748B] dark:text-slate-300">
                        {new Date(challan.challanDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-[#111827] dark:text-slate-200 font-mono font-semibold">
                        {challan.lorryNo}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-[#111827] dark:text-slate-200">
                        {challan.driverName}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-[#111827] dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>{challan.fromLocation}</span>
                          <ArrowRight className="w-3 h-3 text-[#2F8E86] inline" />
                          <span>{challan.toLocation}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-center">
                        <span className="bg-[#E7F1F2] text-[#25776F] dark:bg-slate-800 dark:text-[#2F8E86] px-2 py-0.5 rounded-full text-xs font-semibold border border-[#D9E2E3] dark:border-slate-700">
                          {challan.challanDetails.length}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-center text-[#111827] dark:text-white font-semibold">
                        {totals.totalQuantity}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-right text-[#111827] dark:text-white font-bold font-mono">
                        ₹{totals.totalFreight.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-[#64748B]">
                        {challan.createdByName}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-center">
                        <div className="flex gap-1.5 justify-center">
                          <button
                            onClick={() => handleEdit(challan.id)}
                            className="bg-[#E7F1F2] hover:bg-[#D9E2E3] text-[#25776F] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-[#2F8E86] px-2.5 py-1 rounded-lg font-medium transition text-xs flex items-center gap-1 cursor-pointer"
                            title="Edit Challan"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handlePrint(challan.id)}
                            className="bg-blue-50 hover:bg-blue-100 text-[#4A90E2] dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg font-medium transition text-xs flex items-center gap-1 cursor-pointer"
                            title="Print Challan"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Print</span>
                          </button>
                          <button
                            onClick={() => handleDelete(challan.id, challan.challanNo)}
                            className="bg-red-50 hover:bg-red-100 text-[#D95C5C] dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg font-medium transition text-xs flex items-center gap-1 cursor-pointer"
                            title="Delete Challan"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
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
          <div className="bg-[#F7F8F8] dark:bg-slate-800/60 px-6 py-3 flex items-center justify-between border-t border-[#E5EAEB] dark:border-slate-700 text-xs">
            <div className="text-[#64748B] dark:text-slate-400">
              Showing <span className="font-semibold text-[#111827] dark:text-white">{(page - 1) * pageSize + 1}</span> to{" "}
              <span className="font-semibold text-[#111827] dark:text-white">{Math.min(page * pageSize, totalCount)}</span> of{" "}
              <span className="font-semibold text-[#111827] dark:text-white">{totalCount}</span> results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#64748B] dark:text-slate-200 hover:bg-[#F5FAFA] dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * pageSize >= totalCount}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#64748B] dark:text-slate-200 hover:bg-[#F5FAFA] dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
