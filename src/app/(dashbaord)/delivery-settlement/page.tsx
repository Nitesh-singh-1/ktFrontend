"use client";

import React, { useState, useEffect, useMemo } from "react";
import { shipmentService } from "../../../../services/shipmentService";
import { Shipment, ShipmentStatus, PaymentTerm } from "@/types/tms";
import { formatCurrency, formatDate } from "@/utils/configFormatter";
import { toast } from "@/context/ToastContext";
import { DatePicker, CustomSelect } from "@/app/components/ui";
import {
  CheckCircle2,
  Search,
  Truck,
  IndianRupee,
  Calendar,
  AlertCircle,
  Filter,
  CheckSquare,
  Square,
  X,
  CreditCard,
  FileText,
  User,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Percent,
} from "lucide-react";

export default function DeliverySettlementPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [paymentTermFilter, setPaymentTermFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("PENDING"); // PENDING or ALL
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Settlement Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeShipment, setActiveShipment] = useState<Shipment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [receivedAmount, setReceivedAmount] = useState<number | string>("");
  const [discountAmount, setDiscountAmount] = useState<number | string>("");
  const [discountReason, setDiscountReason] = useState("RoundOff");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [deliveredTo, setDeliveredTo] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await shipmentService.getShipments({ pageSize: 200 });
      const list = res?.data || [];
      setShipments(list);
    } catch (err: any) {
      console.error("Fetch shipments error:", err);
      setError(err?.message || "Failed to load consignments.");
    } finally {
      setLoading(false);
    }
  };

  // Filtered consignments
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      // Exclude cancelled & drafts
      if (
        s.status === ShipmentStatus.Cancelled ||
        s.status === ShipmentStatus.Draft
      ) {
        return false;
      }

      // Pending filter
      if (statusFilter === "PENDING") {
        const isNotDelivered = s.status !== ShipmentStatus.Delivered;
        const hasDue = (s.dueAmount ?? s.grandTotal ?? 0) > 0;
        if (!isNotDelivered && !hasDue) return false;
      }

      // Payment Term Filter
      if (paymentTermFilter !== "ALL") {
        if (s.paymentTerm?.toString() !== paymentTermFilter) return false;
      }

      // Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesNo = s.shipmentNo?.toLowerCase().includes(q);
        const matchesConsignor = s.consignorName?.toLowerCase().includes(q);
        const matchesConsignee = s.consigneeName?.toLowerCase().includes(q);
        const matchesFrom = s.fromLocation?.toLowerCase().includes(q);
        const matchesTo = s.toLocation?.toLowerCase().includes(q);
        const matchesTruck = s.truckNo?.toLowerCase().includes(q);
        if (
          !matchesNo &&
          !matchesConsignor &&
          !matchesConsignee &&
          !matchesFrom &&
          !matchesTo &&
          !matchesTruck
        ) {
          return false;
        }
      }

      return true;
    });
  }, [shipments, statusFilter, paymentTermFilter, search]);

  // Financial Metrics
  const metrics = useMemo(() => {
    const pendingList = shipments.filter(
      (s) =>
        s.status !== ShipmentStatus.Cancelled &&
        s.status !== ShipmentStatus.Draft &&
        (s.status !== ShipmentStatus.Delivered || (s.dueAmount ?? 0) > 0)
    );

    const toPayList = pendingList.filter(
      (s) => s.paymentTerm === PaymentTerm.ToPay || (s.paymentTerm as any) === 0
    );

    const totalPendingAmount = pendingList.reduce(
      (sum, s) => sum + (s.dueAmount > 0 ? s.dueAmount : s.grandTotal || 0),
      0
    );

    const totalToPayAmount = toPayList.reduce(
      (sum, s) => sum + (s.dueAmount > 0 ? s.dueAmount : s.grandTotal || 0),
      0
    );

    const deliveredCount = shipments.filter(
      (s) => s.status === ShipmentStatus.Delivered
    ).length;

    return {
      pendingCount: pendingList.length,
      totalPendingAmount,
      toPayCount: toPayList.length,
      totalToPayAmount,
      deliveredCount,
    };
  }, [shipments]);

  // Open Settlement Modal for a single bilty
  const handleOpenSingleSettle = (s: Shipment) => {
    setActiveShipment(s);
    setSelectedIds([s.id]);
    const due = s.dueAmount > 0 ? s.dueAmount : s.grandTotal || 0;
    setReceivedAmount(due);
    setDiscountAmount(0);
    setDiscountReason("RoundOff");
    setPaymentMode("CASH");
    setPaymentReference("");
    setDeliveredTo(s.consigneeName || "");
    setDeliveryDate(new Date().toISOString().split("T")[0]);
    setRemarks("");
    setIsModalOpen(true);
  };

  // Open Settlement Modal for bulk selected bilties
  const handleOpenBulkSettle = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one consignment to settle.");
      return;
    }
    setActiveShipment(null);
    const selectedShipments = shipments.filter((s) =>
      selectedIds.includes(s.id)
    );
    const totalDue = selectedShipments.reduce(
      (sum, s) => sum + (s.dueAmount > 0 ? s.dueAmount : s.grandTotal || 0),
      0
    );
    setReceivedAmount(totalDue);
    setDiscountAmount(0);
    setDiscountReason("RoundOff");
    setPaymentMode("CASH");
    setPaymentReference("");
    setDeliveredTo("");
    setDeliveryDate(new Date().toISOString().split("T")[0]);
    setRemarks(`Bulk delivery settlement for ${selectedIds.length} consignments`);
    setIsModalOpen(true);
  };

  // Select all toggle
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredShipments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredShipments.map((s) => s.id));
    }
  };

  const handleToggleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Calculate remaining balance in modal
  const targetDueAmount = activeShipment
    ? activeShipment.dueAmount > 0
      ? activeShipment.dueAmount
      : activeShipment.grandTotal || 0
    : shipments
        .filter((s) => selectedIds.includes(s.id))
        .reduce(
          (sum, s) => sum + (s.dueAmount > 0 ? s.dueAmount : s.grandTotal || 0),
          0
        );

  const numReceived = Number(receivedAmount) || 0;
  const numDiscount = Number(discountAmount) || 0;
  const remainingBalance = Math.max(0, targetDueAmount - (numReceived + numDiscount));

  // Submit Settlement
  const handleSubmitSettlement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedIds.length === 0) {
      toast.error("No consignments selected.");
      return;
    }

    if (numReceived < 0 || numDiscount < 0) {
      toast.error("Amounts cannot be negative.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await shipmentService.settleDelivery({
        shipmentIds: selectedIds,
        receivedAmount: numReceived,
        discountAmount: numDiscount > 0 ? numDiscount : undefined,
        discountReason: numDiscount > 0 ? discountReason : undefined,
        paymentMode,
        paymentReference: paymentReference.trim() || undefined,
        deliveredTo: deliveredTo.trim() || undefined,
        deliveryDate,
        remarks: remarks.trim() || undefined,
      });

      if (res?.success) {
        toast.success(
          res.message || "Consignment(s) settled and marked as Delivered!"
        );
        setIsModalOpen(false);
        setSelectedIds([]);
        fetchShipments();
      } else {
        toast.error(res?.message || "Settlement failed.");
      }
    } catch (err: any) {
      console.error("Settlement error:", err);
      toast.error(err?.message || "Failed to process delivery settlement.");
    } finally {
      setSubmitting(false);
    }
  };

  const getPaymentTermBadge = (term: PaymentTerm | number) => {
    if (term === PaymentTerm.ToPay || term === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          ToPay (Driver Collect)
        </span>
      );
    }
    if (term === PaymentTerm.Paid || term === 1) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Paid (Prepaid)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        TBB (Bill Book)
      </span>
    );
  };

  const getStatusBadge = (status: ShipmentStatus | number) => {
    if (status === ShipmentStatus.Delivered || status === 5) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" /> Delivered
        </span>
      );
    }
    if (status === ShipmentStatus.OutForDelivery || status === 4) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <Truck className="w-3 h-3" /> Out for Delivery
        </span>
      );
    }
    if (status === ShipmentStatus.InTransit || status === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Clock className="w-3 h-3" /> In Transit
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <AlertCircle className="w-3 h-3" /> Booked
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            Delivery Settlement
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Reconcile delivered consignments, record cash/digital collections, track shortage deductions, and close bilties.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleOpenBulkSettle}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Settle Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={fetchShipments}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Pending Deliveries
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {metrics.pendingCount}
            </span>
            <span className="text-xs text-gray-500">consignments</span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
            Total Due: {formatCurrency(metrics.totalPendingAmount)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              ToPay Collectibles
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(metrics.totalToPayAmount)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {metrics.toPayCount} ToPay bilties to collect at doorstep
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Delivered & Settled
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.deliveredCount}
            </span>
            <span className="text-xs text-gray-500">completed</span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            Reconciled & marked as Paid
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Quick Filter
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs font-medium bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-1.5 text-gray-800 dark:text-gray-200"
            >
              <option value="PENDING">Pending Delivery Only</option>
              <option value="ALL">All Consignments</option>
            </select>
          </div>
          <p className="text-xs text-gray-400 mt-1">Showing active filtered list</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search GR No, party, truck, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-gray-200"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={paymentTermFilter}
            onChange={(e) => setPaymentTermFilter(e.target.value)}
            className="text-xs font-medium bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200"
          >
            <option value="ALL">All Payment Terms</option>
            <option value="0">ToPay (Driver Collect)</option>
            <option value="1">Paid (Prepaid)</option>
            <option value="2">TBB (To Be Billed)</option>
          </select>
        </div>
      </div>

      {/* Consignments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
            Loading consignments for settlement...
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            <CheckCircle2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="font-medium text-base text-gray-700 dark:text-gray-300">
              No pending deliveries found
            </p>
            <p className="text-sm mt-1">
              All consignments matching your filter have been settled and marked as Delivered.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 text-xs uppercase font-semibold">
                  <th className="py-3 px-4 w-10">
                    <button
                      onClick={handleToggleSelectAll}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {selectedIds.length === filteredShipments.length &&
                      filteredShipments.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">GR / Bilty No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Consignor & Consignee</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Payment Term</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Due Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredShipments.map((s) => {
                  const isSelected = selectedIds.includes(s.id);
                  const due = s.dueAmount > 0 ? s.dueAmount : s.grandTotal || 0;
                  const isDelivered = s.status === ShipmentStatus.Delivered;

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors ${
                        isSelected ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleSelectOne(s.id)}
                          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-gray-100">
                        {s.shipmentNo}
                        {s.truckNo && (
                          <span className="block text-xs font-normal text-gray-500 font-sans">
                            🚚 {s.truckNo}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(s.shipmentDate)}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {s.consignorName || "—"}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          To: {s.consigneeName || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1 font-medium text-gray-800 dark:text-gray-200">
                          {s.fromLocation || "Origin"}
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          {s.toLocation || "Destination"}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getPaymentTermBadge(s.paymentTerm)}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-800 dark:text-gray-200">
                        {formatCurrency(s.grandTotal)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        {due > 0 ? (
                          <span className="text-red-600 dark:text-red-400">
                            {formatCurrency(due)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ₹0.00
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(s.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenSingleSettle(s)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors ${
                            isDelivered && due === 0
                              ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isDelivered && due === 0 ? "Re-Settle" : "Settle"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delivery Settlement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {activeShipment
                      ? `Settle Bilty #${activeShipment.shipmentNo}`
                      : `Bulk Settle (${selectedIds.length} Consignments)`}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Record payment collections, shortage deductions & confirm delivery.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSettlement} className="mt-4 space-y-4">
              {/* Financial Target Summary */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    Total Due to Settle
                  </span>
                  <div className="text-xl font-bold text-emerald-900 dark:text-emerald-200 font-mono">
                    {formatCurrency(targetDueAmount)}
                  </div>
                </div>
                {activeShipment && (
                  <div className="text-right text-xs text-gray-600 dark:text-gray-400">
                    <div>Payment Term:</div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">
                      {activeShipment.paymentTerm === 0
                        ? "ToPay (Cash Collection)"
                        : activeShipment.paymentTerm === 1
                        ? "Paid"
                        : "TBB"}
                    </div>
                  </div>
                )}
              </div>

              {/* Received & Discount Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Amount Received (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-gray-900 dark:text-gray-100"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Percent className="w-3 h-3 text-amber-500" />
                    Discount / Deduction (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-gray-900 dark:text-gray-100"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Deduction Reason (if discount entered) */}
              {numDiscount > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Reason for Deduction / Shortage *
                  </label>
                  <select
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
                  >
                    <option value="RoundOff">Round Off / Petty Allowance</option>
                    <option value="ShortageClaim">Goods Shortage / Weight Loss Claim</option>
                    <option value="DamageDeduction">Transit Damage Deduction</option>
                    <option value="RateDifference">Negotiated Rate Difference</option>
                    <option value="DeliveryDeduction">Late Delivery Penalty / Deduction</option>
                    <option value="Other">Other Reason</option>
                  </select>
                </div>
              )}

              {/* Payment Mode & Reference */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
                  >
                    <option value="CASH">Cash (Driver / Branch Handover)</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="NEFT">NEFT / RTGS / Bank Transfer</option>
                    <option value="CHEQUE">Cheque / Demand Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Ref / UTR / Cheque No
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. UTR83921820"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Delivered To & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Delivered To (Person / Stamp)
                  </label>
                  <input
                    type="text"
                    value={deliveredTo}
                    onChange={(e) => setDeliveredTo(e.target.value)}
                    placeholder="Recipient name / Storekeeper"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Delivery Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Settlement Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any delivery condition, shortage notes, or handover comments..."
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Summary calculation check */}
              <div className="pt-2 text-xs flex items-center justify-between text-gray-600 dark:text-gray-400">
                <span>
                  Settled: <strong>{formatCurrency(numReceived + numDiscount)}</strong>
                </span>
                <span>
                  Remaining Balance:{" "}
                  <strong
                    className={
                      remainingBalance > 0
                        ? "text-red-600 dark:text-red-400 font-bold"
                        : "text-emerald-600 dark:text-emerald-400 font-bold"
                    }
                  >
                    {formatCurrency(remainingBalance)}
                  </strong>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md transition-colors"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Settling...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm & Mark Delivered
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
