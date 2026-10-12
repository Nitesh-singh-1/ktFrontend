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
import PrintOptionsModal from "@/app/components/print/PrintOptionsModal";
import CustomSelect from "@/app/components/ui/CustomSelect";
import { useNavigation } from "@/context/NavigationContext";
import {
  Plus,
  Search,
  AlertTriangle,
  Package,
  ArrowRight,
  Printer,
  Edit,
  Trash2,
  FileText,
  Truck,
  RotateCcw,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

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
  const { hasPermission } = useNavigation();

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

  // Print Modal State
  const [printTarget, setPrintTarget] = useState<Shipment | null>(null);

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
    <div className="space-y-6 w-full pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Consignments & Waybills (GR)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage multi-tenant freight consignments, cargo items, and dispatch stages.
          </p>
        </div>

        {hasPermission("consignments.create.create") && (
          <Link
            href="/shipments/create"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#2F8E86] hover:bg-[#25776F] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Consignment</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#94A3B8]">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search by GR No, Sender, Receiver, Vehicle, or City..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-white placeholder:text-[#94A3B8] focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-[#2F8E86]/30 focus:border-[#2F8E86]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white rounded-lg text-xs font-semibold transition cursor-pointer"
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
                className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-[#E7F1F2] dark:hover:bg-slate-700 text-[#25776F] border border-[#D9E2E3] rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Clear
              </button>
            )}
          </form>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(String(val));
                setPage(1);
              }}
              icon={<Filter className="w-3.5 h-3.5" />}
              options={STATUS_OPTIONS.map((opt) => ({
                label: opt.label,
                value: opt.value.toString(),
              }))}
              className="w-full sm:w-auto min-w-[170px]"
            />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
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

      {/* Shipments / All Bilty Table (Money Receipts Matching Design) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-[#F7F8F8] dark:bg-slate-800/60 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-200">
              Consignment Records (All Bilties)
            </span>
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400">
              ({totalCount} {totalCount === 1 ? "consignment" : "consignments"})
            </span>
          </div>

          {hasPermission("consignments.create.create") && (
            <Link
              href="/shipments/create"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2F8E86] hover:bg-[#25776F] text-white font-semibold rounded-lg text-xs shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" /> Book Consignment
            </Link>
          )}
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-[#F7F8F8] dark:bg-slate-800/40 border-b border-[#E5EAEB] dark:border-slate-800 text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3 px-4">GR / Waybill No</th>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Booking Date</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Consignor (Sender)</th>
                <th className="py-3 px-4">Consignee (Receiver)</th>
                <th className="py-3 px-4 text-center">Bill Type</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAEB] dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-[#64748B] dark:text-slate-400">
                    <div className="w-6 h-6 mx-auto border-2 border-[#2F8E86] border-t-transparent rounded-full animate-spin mb-2" />
                    Loading consignments...
                  </td>
                </tr>
              ) : shipments.length > 0 ? (
                shipments.map((s) => {
                  const term = s.paymentTerm;
                  const isPaid = term === PaymentTerm.Paid;
                  const isTbb = term === PaymentTerm.TBB;
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-[#F5FAFA] dark:hover:bg-slate-800/60 transition whitespace-nowrap"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/shipments/details?id=${s.id}`}
                          className="font-mono font-bold text-[#2F8E86] dark:text-teal-400 hover:text-[#25776F] hover:underline whitespace-nowrap block"
                        >
                          {s.shipmentNo}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {s.invoiceNo || <span className="text-[#94A3B8] font-normal">—</span>}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#64748B] dark:text-slate-400 font-medium">
                        {new Date(s.shipmentDate || s.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-[#111827] dark:text-slate-200 whitespace-nowrap">
                          <span>{s.fromLocation}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#4A90E2] shrink-0" />
                          <span>{s.toLocation}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className="font-semibold text-[#111827] dark:text-white truncate max-w-[150px]"
                          title={s.consignorName}
                        >
                          {s.consignorName || <span className="text-[#94A3B8] font-normal">—</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className="font-semibold text-[#111827] dark:text-white truncate max-w-[150px]"
                          title={s.consigneeName}
                        >
                          {s.consigneeName || <span className="text-[#94A3B8] font-normal">—</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase whitespace-nowrap ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                              : isTbb
                              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                          }`}
                        >
                          {isPaid ? "PAID" : isTbb ? "TBB" : "TO PAY"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="whitespace-nowrap font-mono font-bold text-[#111827] dark:text-slate-300">
                          {s.truckNo || <span className="text-[#94A3B8] font-normal">—</span>}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <ShipmentStatusBadge status={s.status} />
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#111827] dark:text-white">
                        ₹{(s.grandTotal || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/shipments/details?id=${s.id}`}
                            className="px-2.5 py-1 bg-white hover:bg-[#E7F1F2] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#25776F] dark:text-teal-300 border border-[#D9E2E3] dark:border-slate-700 rounded-md font-semibold text-[11px] transition shadow-2xs"
                            title="View Details & Timeline"
                          >
                            View
                          </Link>
                          {(hasPermission("consignments.create.edit") || hasPermission("consignments.all.edit")) && (
                            <button
                              type="button"
                              onClick={() => setSelectedForStatus(s)}
                              className="px-2.5 py-1 bg-[#E7F1F2] hover:bg-[#D9E2E3] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#25776F] dark:text-teal-300 border border-[#D9E2E3] dark:border-slate-700 rounded-md font-semibold text-[11px] transition cursor-pointer shadow-2xs"
                              title="Update Status Stage"
                            >
                              Status
                            </button>
                          )}
                          {(hasPermission("consignments.all.print") || hasPermission("consignments.create.print")) && (
                            <button
                              type="button"
                              onClick={() => setPrintTarget(s)}
                              className="p-1.5 bg-white hover:bg-[#E7F1F2] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#64748B] dark:text-slate-300 border border-[#D9E2E3] dark:border-slate-700 rounded-md transition cursor-pointer shadow-2xs"
                              title="Print Waybill"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(hasPermission("consignments.create.edit") || hasPermission("consignments.all.edit")) && (
                            <Link
                              href={`/shipments/create?id=${s.id}`}
                              className="p-1.5 text-[#64748B] hover:text-[#111827] hover:bg-[#E7F1F2] dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 rounded-md transition"
                              title="Edit Consignment"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          {s.status !== ShipmentStatus.Cancelled &&
                            (hasPermission("consignments.all.delete") || hasPermission("consignments.create.delete")) && (
                              <button
                                type="button"
                                onClick={() => handleCancelShipment(s.id, s.shipmentNo)}
                                className="p-1.5 text-[#94A3B8] hover:text-[#D95C5C] hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition cursor-pointer"
                                title="Cancel Consignment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-[#64748B] dark:text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No Consignments Found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try adjusting your filters or create a new consignment.
                    </p>
                    {hasPermission("consignments.create.create") && (
                      <div className="mt-4 flex justify-center">
                        <Link
                          href="/shipments/create"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-semibold rounded-lg text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> Book Consignment
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer (Matching Money Receipts) */}
        {totalCount > 0 && (
          <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-[#E5EAEB] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B] dark:text-slate-400">
              <span>
                Showing <strong className="text-[#111827] dark:text-slate-200">{(page - 1) * pageSize + 1}</strong> to{" "}
                <strong className="text-[#111827] dark:text-slate-200">{Math.min(page * pageSize, totalCount)}</strong> of{" "}
                <strong className="text-[#111827] dark:text-slate-200">{totalCount}</strong> consignments
              </span>

              <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                <CustomSelect
                  value={pageSize}
                  onChange={(val) => {
                    setPageSize(Number(val));
                    setPage(1);
                  }}
                  options={[
                    { label: "10 / page", value: 10 },
                    { label: "25 / page", value: 25 },
                    { label: "50 / page", value: 50 },
                    { label: "100 / page", value: 100 },
                  ]}
                  size="sm"
                  direction="up"
                  className="w-28"
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                title="First Page"
                aria-label="First page"
                className="p-1.5 rounded-lg border border-[#D9E2E3] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                title="Previous Page"
                aria-label="Previous page"
                className="p-1.5 rounded-lg border border-[#D9E2E3] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-2">
                <span className="text-xs font-semibold text-[#111827] dark:text-slate-200">
                  Page {page} of {totalPages}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                title="Next Page"
                aria-label="Next page"
                className="p-1.5 rounded-lg border border-[#D9E2E3] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                title="Last Page"
                aria-label="Last page"
                className="p-1.5 rounded-lg border border-[#D9E2E3] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronsRight className="w-4 h-4" />
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

      {/* Print Options Modal */}
      <PrintOptionsModal
        isOpen={!!printTarget}
        onClose={() => setPrintTarget(null)}
        onPrint={(opts) => {
          if (printTarget) printShipment(printTarget, opts);
        }}
        title={printTarget ? `Print Bilty ${printTarget.shipmentNo}` : "Print Bilty"}
        subtitle="Pick which copies to print and how to arrange them."
      />
    </div>
  );
}
