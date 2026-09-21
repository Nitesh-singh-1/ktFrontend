"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shipment,
  ShipmentStatus,
  TaxTreatment,
  PaymentTerm,
} from "@/types/shipment";
import { shipmentService } from "services/shipmentService";
import ShipmentStatusBadge from "@/app/components/shipment/ShipmentStatusBadge";
import StatusTransitionModal from "@/app/components/shipment/StatusTransitionModal";
import { printShipment } from "@/utils/print/printShipment";

const TAX_FILTER_CHIPS = [
  { label: "All Regimes", value: "" },
  { label: "GST Regular", value: TaxTreatment.GST_Regular },
  { label: "Non-Taxable", value: TaxTreatment.NonTaxable },
  { label: "GST RCM", value: TaxTreatment.GST_RCM },
  { label: "Exempt", value: TaxTreatment.Exempt },
];

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Booked", value: ShipmentStatus.Booked },
  { label: "Manifested", value: ShipmentStatus.Manifested },
  { label: "In Transit", value: ShipmentStatus.InTransit },
  { label: "Out For Delivery", value: ShipmentStatus.OutForDelivery },
  { label: "Delivered", value: ShipmentStatus.Delivered },
  { label: "Cancelled", value: ShipmentStatus.Cancelled },
  { label: "Returned", value: ShipmentStatus.Returned },
  { label: "Draft", value: ShipmentStatus.Draft },
];

export default function ShipmentsListPage() {
  const router = useRouter();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [taxFilter, setTaxFilter] = useState<string | TaxTreatment>("");
  const [statusFilter, setStatusFilter] = useState<string | ShipmentStatus>("");

  // Status Modal State
  const [selectedForStatus, setSelectedForStatus] = useState<Shipment | null>(null);

  useEffect(() => {
    fetchShipments();
  }, [page, pageSize, taxFilter, statusFilter]);

  const fetchShipments = async (searchTerm = searchQuery) => {
    try {
      setLoading(true);
      setError(null);
      const res = await shipmentService.getShipments({
        page,
        pageSize,
        taxTreatment: taxFilter !== "" ? Number(taxFilter) : undefined,
        status: statusFilter !== "" ? Number(statusFilter) : undefined,
        search: searchTerm || undefined,
      });

      if (res.success && res.data) {
        setShipments(res.data);
        setTotalCount(res.totalCount || res.data.length);
      } else {
        setShipments(res.data || []);
        setTotalCount(res.totalCount || 0);
      }
    } catch (err: any) {
      console.error("Error fetching shipments:", err);
      setError(err?.message || "Failed to load consignments. Please check server connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchShipments(searchQuery);
  };

  const handleCancelShipment = async (id: number, no: string) => {
    if (!confirm(`Are you sure you want to cancel Consignment ${no}? This cannot be undone.`)) {
      return;
    }
    try {
      await shipmentService.cancelShipment(id);
      alert(`Consignment ${no} has been cancelled.`);
      fetchShipments();
    } catch (err: any) {
      alert(err?.message || "Failed to cancel shipment.");
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Consignments & Waybills (GR)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage multi-tenant freight consignments, cargo items, and dispatch stages.
          </p>
        </div>

        <Link
          href="/shipments/create"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
        >
          <span>+</span>
          <span>New Consignment</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search by GR No, Sender, Receiver, Vehicle, or City..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  fetchShipments("");
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Clear
              </button>
            )}
          </form>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tax Treatment Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1">Tax Regime:</span>
          {TAX_FILTER_CHIPS.map((chip) => {
            const isSelected = taxFilter === chip.value;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  setTaxFilter(chip.value);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition border cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchShipments()}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Shipments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Consignment Records ({totalCount})
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Page {page} of {totalPages}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">GR / Waybill No</th>
                <th className="px-4 py-3">Booking Date</th>
                <th className="px-4 py-3">Route (Origin ➔ Dest)</th>
                <th className="px-4 py-3">Consignor & Receiver</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Grand Total (₹)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                    <span className="text-slate-400 text-xs font-medium">Loading consignments...</span>
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="text-3xl mb-2">📦</div>
                    <div className="text-slate-700 font-bold text-sm">No consignments found</div>
                    <p className="text-slate-400 text-xs mt-1">Try adjusting your filters or create a new consignment.</p>
                    <Link
                      href="/shipments/create"
                      className="inline-block mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs"
                    >
                      + Book Consignment
                    </Link>
                  </td>
                </tr>
              ) : (
                shipments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Shipment No */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/shipments/details?id=${s.id}`}
                        className="font-mono font-bold text-blue-600 hover:text-blue-800 text-xs block"
                      >
                        {s.shipmentNo}
                      </Link>
                      {s.invoiceNo && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Inv: {s.invoiceNo}
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                      {new Date(s.shipmentDate || s.createdAt).toLocaleDateString('en-IN')}
                    </td>

                    {/* Route */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span>{s.fromLocation}</span>
                        <span className="text-blue-500">➔</span>
                        <span>{s.toLocation}</span>
                      </div>
                    </td>

                    {/* Consignor / Consignee */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{s.consignorName}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">To: {s.consigneeName}</div>
                    </td>

                    {/* Vehicle */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-slate-700">
                      {s.truckNo || <span className="text-slate-300 font-normal">—</span>}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ShipmentStatusBadge status={s.status} />
                    </td>

                    {/* Grand Total */}
                    <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-slate-900">
                      <div>₹{(s.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className={`text-[10px] font-semibold ${
                        s.paymentTerm === PaymentTerm.Paid ? "text-emerald-600" : "text-amber-600"
                      }`}>
                        {s.paymentTerm === PaymentTerm.Paid ? "PAID" : s.paymentTerm === PaymentTerm.TBB ? "TBB" : "TO PAY"}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View / Tracking */}
                        <Link
                          href={`/shipments/details?id=${s.id}`}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] transition"
                          title="View Details & Timeline"
                        >
                          View
                        </Link>

                        {/* Status Stepper Modal */}
                        <button
                          type="button"
                          onClick={() => setSelectedForStatus(s)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-semibold text-[11px] transition cursor-pointer"
                          title="Update Status Stage"
                        >
                          Status
                        </button>

                        {/* Print */}
                        <button
                          type="button"
                          onClick={() => printShipment(s)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] transition cursor-pointer"
                          title="Print Waybill"
                        >
                          🖨️
                        </button>

                        {/* Edit */}
                        <Link
                          href={`/shipments/create?id=${s.id}`}
                          className="px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
                          title="Edit Consignment"
                        >
                          ✏️
                        </Link>

                        {/* Cancel */}
                        {s.status !== ShipmentStatus.Cancelled && (
                          <button
                            type="button"
                            onClick={() => handleCancelShipment(s.id, s.shipmentNo)}
                            className="px-2 py-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                            title="Cancel Consignment"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <span className="text-xs font-bold px-2 text-slate-700">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Transition Modal */}
      {selectedForStatus && (
        <StatusTransitionModal
          shipment={selectedForStatus}
          isOpen={!!selectedForStatus}
          onClose={() => setSelectedForStatus(null)}
          onSuccess={(updated) => {
            setShipments((prev) =>
              prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
            );
            setSelectedForStatus(null);
          }}
        />
      )}
    </div>
  );
}
