"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import { apiService } from "../../../../../services/apiservice";
import { printGREntry } from "@/utils/print";

interface GREntry {
  id: number;
  grNo: string;
  invoiceNo: string;
  fromLocation: string;
  toLocation: string;
  grDate: string;
  invoiceDate: string;
  goodsValue: number;
  gstPaidBy: string;
  consignerName: string;
  consignerGstNo: string;
  consignerMobile: string;
  consigneeName: string;
  consigneeGstNo: string;
  consigneeMobile: string;
  consigneeAddress: string;
  truckNo: string;
  deliveryStatus: string;
  remarks: string;
  paid: number;
  tbb: number;
  toPay: number;
  totalAmount: number;
  bookingClerk: string;
  createdBy: number;
  createdByName: string;
  updatedBy: number | null;
  updatedByName: string | null;
  isActive: boolean;
  createdAt: string;
}

interface APIResponse {
  success: boolean;
  message: string;
  data: GREntry[];
  totalCount: number;
}

export default function GRListPage() {
  const router = useRouter();
  const [grEntries, setGrEntries] = useState<GREntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGREntries();
  }, []);

  const fetchGREntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAllGstBills() as APIResponse;
      if (response.success) {
        setGrEntries(response.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch GR entries");
      console.error("Error fetching GR entries:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: number) => {
    // Navigate to edit page
    router.push(`/dashboard/gr-entry?id=${id}`);
  };

  const handleDelete = async (id: number, grNo: string) => {
    if (!confirm(`Are you sure you want to delete GR ${grNo}?`)) {
      return;
    }

    try {
      await apiService.deleteGstBill(id);
      alert("GR Entry deleted successfully");
      fetchGREntries(); // Refresh the list
    } catch (err: any) {
      alert(err.message || "Failed to delete GR entry");
      console.error("Error deleting GR entry:", err);
    }
  };

  const handlePrint = async (id: number) => {
    await printGREntry(id);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading GR entries...</p>
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
            <Button onClick={fetchGREntries}>Retry</Button>
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
            GR Entries List
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage all your goods receipt entries</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/gr-entry")}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          New GR Entry
        </button>
      </div>

      {/* GR ENTRIES TABLE */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h2 className="text-white font-semibold text-lg">
            Total Entries: {grEntries.length}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  GR No
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Invoice No
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Consigner
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Consignee
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Truck No
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {grEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <p className="text-gray-500 font-medium">No GR entries found</p>
                    <p className="text-gray-400 text-sm mt-2">Click "New GR Entry" to create one.</p>
                  </td>
                </tr>
              ) : (
                grEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-indigo-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-indigo-600">{entry.grNo}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {entry.invoiceNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(entry.grDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{entry.fromLocation}</span>
                        <span className="text-indigo-500">→</span>
                        <span className="font-medium">{entry.toLocation}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {entry.consignerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {entry.consigneeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                      {entry.truckNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          entry.deliveryStatus === "Pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {entry.deliveryStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      ₹{entry.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(entry.id)}
                          className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg font-medium transition-colors duration-150 text-xs"
                          title="Edit Entry"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handlePrint(entry.id)}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded-lg font-medium transition-colors duration-150 text-xs"
                          title="Print Entry"
                        >
                          🖨️ Print
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id, entry.grNo)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg font-medium transition-colors duration-150 text-xs"
                          title="Delete Entry"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
