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
import { DataTable } from "@/app/components/ui/DataTable";
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
  RotateCcw
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

        <Link
          href="/shipments/create"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#2F8E86] hover:bg-[#25776F] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Consignment</span>
        </Link>
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
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-semibold text-[#111827] dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2F8E86]/30 focus:border-[#2F8E86]"
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
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5EAEB] dark:border-slate-800">
          <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 mr-1">Tax Regime:</span>
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
                    ? "bg-[#2F8E86] text-white border-[#2F8E86] shadow-xs"
                    : "bg-[#F7F8F8] dark:bg-slate-800 hover:bg-[#E7F1F2] dark:hover:bg-slate-700 text-[#64748B] dark:text-slate-300 border-[#D9E2E3] dark:border-slate-700"
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

      {/* Shipments Table */}
      <DataTable<Shipment>
        title={`Consignment Records (${totalCount})`}
        headerRight={`Page ${page} of ${totalPages}`}
        data={shipments}
        loading={loading}
        loadingText="Loading consignments…"
        rowKey={(s) => s.id}
        emptyIcon={<Package className="w-8 h-8" />}
        emptyTitle="No consignments found"
        emptyMessage="Try adjusting your filters or create a new consignment."
        emptyAction={
          <Link href="/shipments/create" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-semibold rounded-lg text-xs">
            <Plus className="w-3.5 h-3.5" /> Book Consignment
          </Link>
        }
        footer={
          totalPages > 1 ? (
            <div className="px-5 py-3 bg-[#F7F8F8] dark:bg-slate-800/60 flex items-center justify-between">
              <div className="text-xs text-[#64748B] dark:text-slate-400">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
              </div>
              <div className="flex items-center gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-md text-xs font-semibold text-[#25776F] hover:bg-[#E7F1F2] dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer">Previous</button>
                <span className="text-xs font-semibold px-2 text-[#111827] dark:text-slate-300">{page} / {totalPages}</span>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-md text-xs font-semibold text-[#25776F] hover:bg-[#E7F1F2] dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer">Next</button>
              </div>
            </div>
          ) : undefined
        }
        columns={[
          {
            key: "shipmentNo",
            header: "GR / Waybill No",
            render: (s) => (
              <div className="whitespace-nowrap">
                <Link href={`/shipments/details?id=${s.id}`} className="font-mono font-bold text-[#2F8E86] dark:text-teal-400 hover:text-[#25776F] hover:underline block">{s.shipmentNo}</Link>
                {s.invoiceNo && <span className="text-[10px] text-[#94A3B8] block mt-0.5">Inv: {s.invoiceNo}</span>}
              </div>
            ),
          },
          {
            key: "date",
            header: "Booking Date",
            render: (s) => <span className="whitespace-nowrap text-[#64748B] dark:text-slate-400 font-medium">{new Date(s.shipmentDate || s.createdAt).toLocaleDateString('en-IN')}</span>,
          },
          {
            key: "route",
            header: "Route",
            render: (s) => (
              <div className="flex items-center gap-1.5 font-bold text-[#111827] dark:text-slate-200 whitespace-nowrap">
                <span>{s.fromLocation}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#4A90E2] shrink-0" />
                <span>{s.toLocation}</span>
              </div>
            ),
          },
          {
            key: "parties",
            header: "Consignor & Receiver",
            render: (s) => (
              <div>
                <div className="font-semibold text-[#111827] dark:text-white">{s.consignorName}</div>
                <div className="text-[#64748B] dark:text-slate-400 text-[11px] mt-0.5">To: {s.consigneeName}</div>
              </div>
            ),
          },
          {
            key: "vehicle",
            header: "Vehicle",
            render: (s) => <span className="whitespace-nowrap font-mono font-bold text-[#111827] dark:text-slate-300">{s.truckNo || <span className="text-[#94A3B8] font-normal">—</span>}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (s) => <ShipmentStatusBadge status={s.status} />,
          },
          {
            key: "grandTotal",
            header: "Grand Total (₹)",
            align: "right",
            render: (s) => (
              <div className="whitespace-nowrap font-mono font-bold text-[#111827] dark:text-white">
                <div>₹{(s.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className={`text-[10px] font-semibold ${s.paymentTerm === PaymentTerm.Paid ? "text-[#2F9E8F]" : "text-[#F4A261]"}`}>
                  {s.paymentTerm === PaymentTerm.Paid ? "PAID" : s.paymentTerm === PaymentTerm.TBB ? "TBB" : "TO PAY"}
                </div>
              </div>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            align: "center",
            render: (s) => (
              <div className="flex items-center justify-center gap-1.5">
                <Link href={`/shipments/details?id=${s.id}`} className="px-2.5 py-1 bg-white hover:bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] rounded-md font-semibold text-[11px] transition" title="View Details & Timeline">View</Link>
                <button type="button" onClick={() => setSelectedForStatus(s)} className="px-2.5 py-1 bg-[#E7F1F2] hover:bg-[#D9E2E3] text-[#25776F] border border-[#D9E2E3] rounded-md font-semibold text-[11px] transition cursor-pointer" title="Update Status Stage">Status</button>
                <button type="button" onClick={() => printShipment(s)} className="p-1.5 bg-white hover:bg-[#E7F1F2] text-[#64748B] border border-[#D9E2E3] rounded-md transition cursor-pointer" title="Print Waybill"><Printer className="w-3.5 h-3.5" /></button>
                <Link href={`/shipments/create?id=${s.id}`} className="p-1.5 text-[#64748B] hover:text-[#111827] hover:bg-[#E7F1F2] rounded-md transition" title="Edit Consignment"><Edit className="w-3.5 h-3.5" /></Link>
                {s.status !== ShipmentStatus.Cancelled && (
                  <button type="button" onClick={() => handleCancelShipment(s.id, s.shipmentNo)} className="p-1.5 text-[#94A3B8] hover:text-[#D95C5C] hover:bg-red-50 rounded-md transition cursor-pointer" title="Cancel Consignment"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
            ),
          },
        ]}
      />

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
