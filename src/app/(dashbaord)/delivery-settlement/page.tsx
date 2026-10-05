"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { shipmentService } from "../../../../services/shipmentService";
import { Shipment, ShipmentStatus, PaymentTerm, DeliverySettlementSummary } from "@/types/shipment";
import { formatCurrency, formatDate } from "@/utils/configFormatter";
import { toast } from "@/context/ToastContext";
import { DatePicker } from "@/app/components/ui/DatePicker";
import { DataTable } from "@/app/components/ui/DataTable";
import CustomSelect from "@/app/components/ui/CustomSelect";
import {
  CheckCircle2,
  Search,
  Truck,
  IndianRupee,
  AlertCircle,
  Filter,
  CheckSquare,
  Square,
  X,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Percent,
  Package,
  RotateCcw,
  Building2,
  FileCheck2,
} from "lucide-react";

const STATUS_FILTER_OPTIONS = [
  { label: "Pending Delivery", value: "PENDING" },
  { label: "All Statuses", value: "" },
  { label: "Partially Settled", value: "PARTIAL" },
  { label: "Booked", value: ShipmentStatus.Booked.toString() },
  { label: "Manifested", value: ShipmentStatus.Manifested.toString() },
  { label: "In Transit", value: ShipmentStatus.InTransit.toString() },
  { label: "Out For Delivery", value: ShipmentStatus.OutForDelivery.toString() },
  { label: "Delivered", value: ShipmentStatus.Delivered.toString() },
];

const PAYMENT_TERM_OPTIONS = [
  { label: "All Payment Terms", value: "ALL" },
  { label: "ToPay (Collect)", value: PaymentTerm.ToPay.toString() },
  { label: "Paid (Prepaid)", value: PaymentTerm.Paid.toString() },
  { label: "TBB (Bill Book)", value: PaymentTerm.TBB.toString() },
];

const PAYMENT_MODE_OPTIONS = [
  { label: "Cash", value: "CASH" },
  { label: "UPI / QR Code", value: "UPI" },
  { label: "NEFT / RTGS", value: "NEFT" },
  { label: "Cheque / DD", value: "CHEQUE" },
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
  { label: "Partial Payment (Outstanding Balance)", value: "PARTIAL" },
];

const DEDUCTION_REASON_OPTIONS = [
  { label: "Goods Shortage / Weight Loss Claim", value: "ShortageClaim" },
  { label: "Round Off / Petty Allowance", value: "RoundOff" },
  { label: "Transit Damage Deduction", value: "DamageDeduction" },
  { label: "Negotiated Rate Difference", value: "RateDifference" },
  { label: "Late Delivery Penalty / Deduction", value: "DeliveryDeduction" },
  { label: "Other Reason (Specify in Remarks)", value: "Other" },
];

export default function DeliverySettlementPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live Metric Summary from API
  const [summary, setSummary] = useState<DeliverySettlementSummary | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentTermFilter, setPaymentTermFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [partyFilter, setPartyFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Settlement Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeShipment, setActiveShipment] = useState<Shipment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields (using strings for inputs to prevent number-wheel scroll issues)
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<string>("0");
  const [discountReason, setDiscountReason] = useState("ShortageClaim");
  const [discountRemarks, setDiscountRemarks] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const [deliveredTo, setDeliveredTo] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [remarks, setRemarks] = useState("");

  // Fetch live global summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await shipmentService.getDeliverySettlementSummary();
      if (res?.success && res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error("Fetch summary error:", err);
    }
  }, []);

  const fetchShipments = useCallback(async (searchTerm = searchQuery) => {
    try {
      setLoading(true);
      setError(null);

      // Map filter states to API params
      let statusParam: number | undefined = undefined;
      if (statusFilter !== "" && statusFilter !== "PENDING" && statusFilter !== "PARTIAL") {
        statusParam = parseInt(statusFilter, 10);
      }

      let paymentTermParam: number | undefined = undefined;
      if (paymentTermFilter !== "ALL" && paymentTermFilter !== "") {
        paymentTermParam = parseInt(paymentTermFilter, 10);
      }

      const res = await shipmentService.getShipments({
        page,
        pageSize,
        status: statusParam,
        paymentTerm: paymentTermParam,
        search: searchTerm.trim() || undefined,
      });

      if (res?.success && res.data) {
        let list = res.data.filter(
          (s) =>
            s.status !== ShipmentStatus.Cancelled &&
            s.status !== ShipmentStatus.Draft
        );

        // Filter by status on client if PENDING or PARTIAL
        if (statusFilter === "PENDING") {
          list = list.filter((s) => {
            const isNotDelivered = s.status !== ShipmentStatus.Delivered;
            const hasDue = (s.dueAmount ?? s.grandTotal ?? 0) > 0;
            return isNotDelivered || hasDue || s.isPartialPayment;
          });
        } else if (statusFilter === "PARTIAL") {
          list = list.filter((s) => s.isPartialPayment || (s.dueAmount > 0 && (s.paidAmount > 0 || (s.settledReceivedAmount ?? 0) > 0)));
        }

        // Filter by party on client if selected
        if (partyFilter !== "ALL") {
          const p = partyFilter.toLowerCase();
          list = list.filter(
            (s) =>
              (s.consignorName || "").toLowerCase() === p ||
              (s.consigneeName || "").toLowerCase() === p
          );
        }

        setShipments(list);
        setTotalCount(res.totalCount || list.length);
      } else {
        setShipments([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      console.error("Fetch shipments error:", err);
      setError(err?.message || "Failed to load consignments.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, paymentTermFilter, partyFilter, searchQuery]);

  useEffect(() => {
    fetchShipments();
    fetchSummary();
  }, [fetchShipments, fetchSummary]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchShipments(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setPage(1);
    fetchShipments("");
  };

  // Extract unique parties for Party dropdown
  const uniqueParties = useMemo(() => {
    const partyMap = new Map<string, number>();
    shipments.forEach((s) => {
      const consignor = s.consignorName?.trim();
      if (consignor) partyMap.set(consignor, (partyMap.get(consignor) || 0) + 1);
      const consignee = s.consigneeName?.trim();
      if (consignee && consignee !== consignor) {
        partyMap.set(consignee, (partyMap.get(consignee) || 0) + 1);
      }
    });
    return Array.from(partyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [shipments]);

  // Target due amount for active modal session
  const targetDueAmount = useMemo(() => {
    if (activeShipment) {
      return activeShipment.dueAmount > 0
        ? activeShipment.dueAmount
        : activeShipment.isSettled
        ? 0
        : activeShipment.grandTotal || 0;
    }
    const selectedShipments = shipments.filter((s) => selectedIds.includes(s.id));
    return selectedShipments.reduce(
      (sum, s) => sum + (s.dueAmount > 0 ? s.dueAmount : s.isSettled ? 0 : s.grandTotal || 0),
      0
    );
  }, [activeShipment, selectedIds, shipments]);

  // Open Settlement Modal for a single bilty with pre-filled previously saved values
  const handleOpenSingleSettle = (s: Shipment) => {
    setActiveShipment(s);
    setSelectedIds([s.id]);

    const hasPriorSettlement = s.isSettled || s.settledReceivedAmount != null || s.isPartialPayment;

    if (hasPriorSettlement) {
      // Pre-fill previously recorded values so the user can review exactly what was stored
      setReceivedAmount((s.settledReceivedAmount ?? (s.dueAmount > 0 ? s.dueAmount : s.grandTotal)).toString());
      setDiscountAmount((s.settledDiscountAmount ?? 0).toString());
      setDiscountReason(s.discountReason || "ShortageClaim");
      setDiscountRemarks(s.discountRemarks || "");
      setPaymentMode(s.settledPaymentMode || (s.isPartialPayment ? "PARTIAL" : "CASH"));
      setIsPartialPayment(s.isPartialPayment || false);
      setPaymentReference(s.settlementReferenceNo || "");
      setDeliveredTo(s.deliveredTo || s.consigneeName || "");
      setDeliveryDate(s.deliveryDate || new Date().toISOString().split("T")[0]);
      setRemarks(s.remarks || "");
    } else {
      const due = s.dueAmount > 0 ? s.dueAmount : s.grandTotal || 0;
      setReceivedAmount(due.toString());
      setDiscountAmount("0");
      setDiscountReason("ShortageClaim");
      setDiscountRemarks("");
      setPaymentMode("CASH");
      setIsPartialPayment(false);
      setPaymentReference("");
      setDeliveredTo(s.consigneeName || "");
      setDeliveryDate(new Date().toISOString().split("T")[0]);
      setRemarks("");
    }

    setIsModalOpen(true);
  };

  // Open Settlement Modal for bulk selected bilties
  const handleOpenBulkSettle = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one consignment to settle.");
      return;
    }
    setActiveShipment(null);
    const selectedShipments = shipments.filter((s) => selectedIds.includes(s.id));
    const totalDue = selectedShipments.reduce(
      (sum, s) => sum + (s.dueAmount > 0 ? s.dueAmount : s.isSettled ? 0 : s.grandTotal || 0),
      0
    );
    setReceivedAmount(totalDue.toString());
    setDiscountAmount("0");
    setDiscountReason("ShortageClaim");
    setDiscountRemarks("");
    setPaymentMode("CASH");
    setIsPartialPayment(false);
    setPaymentReference("");
    setDeliveredTo("");
    setDeliveryDate(new Date().toISOString().split("T")[0]);
    setRemarks(`Bulk delivery settlement for ${selectedIds.length} consignments`);
    setIsModalOpen(true);
  };

  // Select all toggle
  const handleToggleSelectAll = () => {
    if (selectedIds.length === shipments.length && shipments.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(shipments.map((s) => s.id));
    }
  };

  const handleToggleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Difference auto-balance: When Amount Received is updated, difference automatically sets to Discount/Deduction
  const handleReceivedAmountChange = (val: string) => {
    if (val !== "" && !/^\d*\.?\d*$/.test(val)) return;

    setReceivedAmount(val);
    const numRecv = parseFloat(val);
    if (!isNaN(numRecv)) {
      const diff = targetDueAmount - numRecv;
      if (diff > 0) {
        const roundedDiff = Math.round(diff * 100) / 100;
        setDiscountAmount(roundedDiff.toString());
      } else {
        setDiscountAmount("0");
      }
    } else if (val === "") {
      setDiscountAmount(targetDueAmount.toString());
    }
  };

  const handleDiscountAmountChange = (val: string) => {
    if (val !== "" && !/^\d*\.?\d*$/.test(val)) return;
    setDiscountAmount(val);
  };

  const handlePaymentModeChange = (modeVal: string) => {
    setPaymentMode(modeVal);
    if (modeVal === "PARTIAL") {
      setIsPartialPayment(true);
    } else {
      setIsPartialPayment(false);
    }
  };

  const numReceived = parseFloat(receivedAmount) || 0;
  const numDiscount = parseFloat(discountAmount) || 0;
  const totalSettled = numReceived + numDiscount;
  const remainingBalance = Math.max(0, targetDueAmount - totalSettled);

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

    if (numDiscount > 0 && discountReason === "Other" && !discountRemarks.trim() && !remarks.trim()) {
      toast.error("Please specify a reason in Remarks when 'Other' deduction is chosen.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await shipmentService.settleDelivery({
        shipmentIds: selectedIds,
        receivedAmount: numReceived,
        discountAmount: numDiscount > 0 ? numDiscount : undefined,
        discountReason: numDiscount > 0 ? discountReason : undefined,
        discountRemarks: numDiscount > 0 && discountReason === "Other" ? discountRemarks.trim() || undefined : undefined,
        paymentMode,
        isPartialPayment: isPartialPayment || paymentMode === "PARTIAL" || remainingBalance > 0,
        paymentReference: paymentReference.trim() || undefined,
        deliveredTo: deliveredTo.trim() || undefined,
        deliveryDate,
        remarks: remarks.trim() || undefined,
      });

      if (res?.success) {
        toast.success(
          res.message || "Consignment(s) settled successfully!"
        );
        setIsModalOpen(false);
        setSelectedIds([]);
        fetchShipments();
        fetchSummary();
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

  // Clean Enterprise Dot Indicator for Payment Term (No loud capsules)
  const renderPaymentTerm = (term: PaymentTerm | number) => {
    if (term === PaymentTerm.ToPay || term === 0) {
      return (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-slate-200"
          title="Payment Term: ToPay (Collect at delivery)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>ToPay</span>
        </span>
      );
    }
    if (term === PaymentTerm.Paid || term === 1) {
      return (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-slate-200"
          title="Payment Term: Paid (Prepaid)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F8E86] shrink-0" />
          <span>Paid</span>
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-slate-200"
        title="Payment Term: TBB (To Be Billed)"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
        <span>TBB</span>
      </span>
    );
  };

  // Clean Enterprise Dot Indicator for Status (No cartoonish colored pill boxes)
  const renderStatus = (s: Shipment) => {
    if (s.isPartialPayment || (s.dueAmount > 0 && (s.paidAmount > 0 || (s.settledReceivedAmount ?? 0) > 0))) {
      return (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400"
          title="Status: Partially Settled (Remaining balance due)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>Partially Settled</span>
        </span>
      );
    }
    if (s.status === ShipmentStatus.Delivered || (s as any).status === 5) {
      return (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#25776F] dark:text-teal-400"
          title="Status: Delivered (Settled & closed)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F8E86] shrink-0" />
          <span>Delivered</span>
        </span>
      );
    }
    if (s.status === ShipmentStatus.OutForDelivery || (s as any).status === 4) {
      return (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-400"
          title="Status: Out for Delivery"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
          <span>Out for Delivery</span>
        </span>
      );
    }
    if (s.status === ShipmentStatus.InTransit || (s as any).status === 3) {
      return (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400"
          title="Status: In Transit"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          <span>In Transit</span>
        </span>
      );
    }
    if (s.status === ShipmentStatus.Manifested || (s as any).status === 2) {
      return (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-400"
          title="Status: Manifested"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
          <span>Manifested</span>
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400"
        title="Status: Booked"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
        <span>Booked</span>
      </span>
    );
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Delivery Settlement
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Reconcile delivered consignments, record cash/digital collections, track shortage deductions, and close bilties.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleOpenBulkSettle}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2F8E86] hover:bg-[#25776F] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Settle Selected ({selectedIds.length})</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              fetchShipments();
              fetchSummary();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-[#E7F1F2] dark:hover:bg-slate-700 text-[#25776F] border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Clean Metric Cards (Includes Total Consignment Card and live accurate Delivered & Settled) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Consignments */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Consignments
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <FileCheck2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {summary?.totalConsignments ?? totalCount}
            </span>
            <span className="text-xs text-slate-500">active bilties</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
            Total Freight: {formatCurrency(summary?.totalConsignmentsAmount ?? 0)}
          </p>
        </div>

        {/* Card 2: Pending Deliveries */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Deliveries
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Truck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {summary?.pendingDeliveriesCount ?? 0}
            </span>
            <span className="text-xs text-slate-500">awaiting settlement</span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
            Total Due: {formatCurrency(summary?.pendingDeliveriesAmount ?? 0)}
          </p>
        </div>

        {/* Card 3: ToPay Collectibles */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              ToPay Collectibles
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <IndianRupee className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
              {formatCurrency(summary?.toPayCollectiblesAmount ?? 0)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            {summary?.toPayCollectiblesCount ?? 0} ToPay bilties to collect at doorstep
          </p>
        </div>

        {/* Card 4: Delivered & Settled */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Delivered & Settled
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#2F8E86]/10 text-[#2F8E86] flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#2F8E86] dark:text-teal-400 font-mono">
              {summary?.deliveredAndSettledCount ?? 0}
            </span>
            <span className="text-xs text-slate-500">completed</span>
          </div>
          <p className="text-xs text-[#25776F] dark:text-teal-400 mt-1.5 font-medium">
            Collected: {formatCurrency(summary?.deliveredAndSettledAmount ?? 0)}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar with CustomSelect */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
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
                className="w-full pl-8 pr-3 py-2 bg-[#F7F8F8] dark:bg-slate-800/80 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs font-medium text-[#111827] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2F8E86]/30 focus:border-[#2F8E86]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-[#E7F1F2] dark:hover:bg-slate-700 text-[#25776F] border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Clear
              </button>
            )}
          </form>

          {/* CustomSelect Dropdowns matching /reports/?tab=booking_register */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Dropdown */}
            <CustomSelect
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(String(val));
                setPage(1);
              }}
              icon={<Filter className="w-3.5 h-3.5" />}
              options={STATUS_FILTER_OPTIONS}
              className="w-full sm:w-auto min-w-[160px]"
            />

            {/* Payment Term Dropdown */}
            <CustomSelect
              value={paymentTermFilter}
              onChange={(val) => {
                setPaymentTermFilter(String(val));
                setPage(1);
              }}
              icon={<CreditCard className="w-3.5 h-3.5" />}
              options={PAYMENT_TERM_OPTIONS}
              className="w-full sm:w-auto min-w-[160px]"
            />

            {/* Party Filter Dropdown */}
            <CustomSelect
              value={partyFilter}
              onChange={(val) => {
                setPartyFilter(String(val));
                setPage(1);
              }}
              icon={<Building2 className="w-3.5 h-3.5" />}
              searchable={true}
              options={[
                { label: `All Parties (${uniqueParties.length})`, value: "ALL" },
                ...uniqueParties.map((p) => ({
                  label: p.name,
                  value: p.name,
                  badge: p.count,
                })),
              ]}
              className="w-full sm:w-auto min-w-[180px]"
            />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchShipments()}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Consignments Responsive DataTable (Header bar removed as requested) */}
      <DataTable<Shipment>
        data={shipments}
        loading={loading}
        loadingText="Loading consignments for settlement…"
        rowKey={(s) => s.id}
        emptyIcon={<Package className="w-8 h-8" />}
        emptyTitle="No consignments found"
        emptyMessage="All consignments matching your filter have been settled or no records exist."
        footer={
          totalPages > 1 ? (
            <div className="px-5 py-3 bg-[#F7F8F8] dark:bg-slate-800/60 flex items-center justify-between">
              <div className="text-xs text-[#64748B] dark:text-slate-400">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-md text-xs font-semibold text-[#25776F] hover:bg-[#E7F1F2] dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold px-2 text-[#111827] dark:text-slate-300">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-md text-xs font-semibold text-[#25776F] hover:bg-[#E7F1F2] dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          ) : undefined
        }
        columns={[
          {
            key: "selection",
            header: (
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center cursor-pointer"
                title="Select / Deselect all"
              >
                {selectedIds.length === shipments.length && shipments.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-[#2F8E86]" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            ),
            width: "w-10",
            render: (s) => {
              const isSelected = selectedIds.includes(s.id);
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSelectOne(s.id);
                  }}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center cursor-pointer"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#2F8E86]" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              );
            },
          },
          {
            key: "shipmentNo",
            header: "GR / Waybill No",
            render: (s) => (
              <div
                className="whitespace-nowrap"
                title={`Bilty: ${s.shipmentNo}${s.truckNo ? ` | Vehicle: ${s.truckNo}` : ""}`}
              >
                <Link
                  href={`/shipments/details?id=${s.id}`}
                  className="font-mono font-bold text-[#2F8E86] dark:text-teal-400 hover:text-[#25776F] hover:underline block"
                >
                  {s.shipmentNo}
                </Link>
                {s.truckNo && (
                  <span className="flex items-center gap-1 text-[11px] text-[#64748B] dark:text-slate-400 font-sans mt-0.5">
                    <Truck className="w-3 h-3 text-[#94A3B8]" />
                    <span>{s.truckNo}</span>
                  </span>
                )}
              </div>
            ),
          },
          {
            key: "shipmentDate",
            header: "Date",
            render: (s) => (
              <span
                className="whitespace-nowrap text-[#64748B] dark:text-slate-400 font-medium text-xs"
                title={`Booking Date: ${formatDate(s.shipmentDate || (s as any).createdAt)}`}
              >
                {formatDate(s.shipmentDate || (s as any).createdAt)}
              </span>
            ),
          },
          {
            key: "parties",
            header: "Consignor & Receiver",
            render: (s) => (
              <div
                className="max-w-[220px]"
                title={`Consignor: ${s.consignorName || "—"}\nConsignee: ${s.consigneeName || "—"}`}
              >
                <div className="font-semibold text-[#111827] dark:text-white truncate">
                  {s.consignorName || "—"}
                </div>
                <div className="text-[#64748B] dark:text-slate-400 text-[11px] mt-0.5 truncate">
                  To: {s.consigneeName || "—"}
                </div>
              </div>
            ),
          },
          {
            key: "route",
            header: "Route",
            render: (s) => (
              <div
                className="flex items-center gap-1.5 font-bold text-[#111827] dark:text-slate-200 whitespace-nowrap text-xs"
                title={`Route: ${s.fromLocation || "Origin"} → ${s.toLocation || "Destination"}`}
              >
                <span>{s.fromLocation || "Origin"}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#4A90E2] shrink-0" />
                <span>{s.toLocation || "Destination"}</span>
              </div>
            ),
          },
          {
            key: "paymentTerm",
            header: "Payment Term",
            render: (s) => renderPaymentTerm(s.paymentTerm),
          },
          {
            key: "grandTotal",
            header: "Grand Total",
            align: "right",
            render: (s) => (
              <span
                className="font-mono font-bold text-[#111827] dark:text-white whitespace-nowrap text-xs"
                title={`Total Freight & Charges: ${formatCurrency(s.grandTotal)}`}
              >
                {formatCurrency(s.grandTotal)}
              </span>
            ),
          },
          {
            key: "dueAmount",
            header: "Due Amount",
            align: "right",
            render: (s) => {
              const due = s.dueAmount > 0 ? s.dueAmount : s.isSettled ? 0 : s.grandTotal || 0;
              return due > 0 ? (
                <span
                  className="font-mono font-bold text-[#D95C5C] dark:text-red-400 whitespace-nowrap text-xs"
                  title={`Outstanding Due: ${formatCurrency(due)}`}
                >
                  {formatCurrency(due)}
                </span>
              ) : (
                <span
                  className="font-mono font-semibold text-[#2F8E86] dark:text-teal-400 whitespace-nowrap text-xs"
                  title="Settled / No Due Balance"
                >
                  ₹0.00
                </span>
              );
            },
          },
          {
            key: "status",
            header: "Status",
            render: (s) => renderStatus(s),
          },
          {
            key: "actions",
            header: "Action",
            align: "right",
            render: (s) => {
              const due = s.dueAmount > 0 ? s.dueAmount : s.grandTotal || 0;
              const isDelivered = s.status === ShipmentStatus.Delivered && s.isSettled;
              return (
                <button
                  type="button"
                  onClick={() => handleOpenSingleSettle(s)}
                  title={isDelivered && due === 0 ? "Review or update settlement details" : "Settle consignment freight & confirm delivery"}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer ml-auto ${
                    isDelivered && due === 0
                      ? "bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 text-[#25776F] dark:text-teal-400 hover:bg-[#E7F1F2] dark:hover:bg-slate-700"
                      : "bg-[#2F8E86] hover:bg-[#25776F] text-white"
                  }`}
                >
                  {isDelivered && due === 0 ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Re-Settle</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Settle</span>
                    </>
                  )}
                </button>
              );
            },
          },
        ]}
      />

      {/* Delivery Settlement Modal (Wider max-w-2xl, strict conditional Remarks, fixed width dropdowns) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-[#E5EAEB] dark:border-slate-800 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto scrollbar-thin">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E5EAEB] dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E7F1F2] dark:bg-teal-950/40 text-[#2F8E86] flex items-center justify-center font-bold shadow-2xs shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#111827] dark:text-white">
                      Delivery Settlement
                    </h3>
                    {activeShipment ? (
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#E7F1F2] dark:bg-slate-800 text-[#25776F] dark:text-teal-300 border border-[#2F8E86]/30">
                        {activeShipment.shipmentNo}
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#E7F1F2] dark:bg-slate-800 text-[#25776F] dark:text-teal-300 border border-[#2F8E86]/30">
                        Bulk ({selectedIds.length} Consignments)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                    Record received freight, shortage/discount breakdown & confirm delivery.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSettlement} className="mt-5 space-y-4">
              {/* Financial Target Summary Card */}
              <div className="p-4 bg-[#E7F1F2] dark:bg-teal-950/30 rounded-xl border border-[#2F8E86]/20 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#25776F] dark:text-teal-300 font-bold uppercase tracking-wider block">
                    Total Due to Settle
                  </span>
                  <div className="text-2xl font-bold text-[#111827] dark:text-white font-mono mt-0.5">
                    {formatCurrency(targetDueAmount)}
                  </div>
                </div>
                {activeShipment && (
                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs text-[#64748B] dark:text-slate-400 font-medium">
                      Payment Term
                    </span>
                    <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-white dark:bg-slate-800 text-[#25776F] dark:text-teal-300 border border-[#2F8E86]/30 shadow-2xs">
                      {activeShipment.paymentTerm === PaymentTerm.ToPay || (activeShipment.paymentTerm as any) === 0
                        ? "ToPay (Collect)"
                        : activeShipment.paymentTerm === PaymentTerm.Paid || (activeShipment.paymentTerm as any) === 1
                        ? "Paid (Prepaid)"
                        : "TBB"}
                    </div>
                  </div>
                )}
              </div>

              {/* Received & Discount Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] dark:text-slate-200 mb-1">
                    Amount Received (₹) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={receivedAmount}
                    onChange={(e) => handleReceivedAmountChange(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2F8E86]/30 focus:border-[#2F8E86] font-mono font-bold text-[#111827] dark:text-white shadow-2xs"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] dark:text-slate-200 mb-1 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-amber-500" />
                    <span>% Discount / Deduction (₹)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={discountAmount}
                    onChange={(e) => handleDiscountAmountChange(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500 font-mono text-[#111827] dark:text-white shadow-2xs"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Deduction Reason & Remarks (when discount entered) - Only show remarks when "Other" is chosen */}
              {numDiscount > 0 && (
                <div className="space-y-3 p-3.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/70 dark:border-amber-800/40">
                  <div>
                    <label className="block text-xs font-semibold text-[#111827] dark:text-slate-200 mb-1">
                      Reason for Shortage / Deduction <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <CustomSelect
                      value={discountReason}
                      onChange={(val) => setDiscountReason(String(val))}
                      options={DEDUCTION_REASON_OPTIONS}
                      className="w-full min-w-0"
                    />
                  </div>

                  {/* Remark input is strictly displayed ONLY when "Other" reason is selected */}
                  {discountReason === "Other" && (
                    <div className="animate-in fade-in duration-150">
                      <label className="block text-xs font-semibold text-[#111827] dark:text-slate-200 mb-1">
                        Shortage / Deduction Reason Details <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={discountRemarks}
                        onChange={(e) => setDiscountRemarks(e.target.value)}
                        placeholder="Specify reason for shortage / deduction..."
                        className="w-full h-10 px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-[#111827] dark:text-white shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#2F8E86]/30 focus:border-[#2F8E86]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Payment Mode & Reference - Fixed length layout with min-w-0 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 min-w-0">
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-[#111827] dark:text-slate-200 mb-1">
                    Payment Mode <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <CustomSelect
                    value={paymentMode}
                    onChange={(val) => handlePaymentModeChange(String(val))}
                    options={PAYMENT_MODE_OPTIONS}
                    className="w-full min-w-0"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-[#111827] dark:text-slate-200 mb-1">
                    Ref / UTR / Cheque No
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. UTR83921820"
                    className="w-full h-10 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2F8E86]/30 focus:border-[#2F8E86] text-[#111827] dark:text-white shadow-2xs"
                  />
                </div>
              </div>

              {/* Delivered To & Date Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] dark:text-slate-200 mb-1">
                    Delivered To (Person / Stamp)
                  </label>
                  <input
                    type="text"
                    value={deliveredTo}
                    onChange={(e) => setDeliveredTo(e.target.value)}
                    placeholder="Recipient name / Storekeeper"
                    className="w-full h-10 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2F8E86]/30 focus:border-[#2F8E86] text-[#111827] dark:text-white shadow-2xs"
                  />
                </div>

                <div>
                  <DatePicker
                    value={deliveryDate}
                    onChange={(date) => setDeliveryDate(date)}
                    label="Delivery Date *"
                    align="right"
                    direction="up"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-[#111827] dark:text-slate-200 mb-1">
                  Settlement Remarks / Delivery Notes
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any handover comments, pod notes, or collection remarks..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2F8E86]/30 focus:border-[#2F8E86] text-[#111827] dark:text-white shadow-2xs"
                />
              </div>

              {/* Summary Calculation Check */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs flex items-center justify-between text-[#64748B] dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                <span>
                  Settled Amount: <strong className="text-[#111827] dark:text-slate-200 font-mono font-bold">{formatCurrency(totalSettled)}</strong>
                </span>
                <span>
                  Remaining Balance:{" "}
                  <strong
                    className={`font-mono ${
                      remainingBalance > 0
                        ? "text-[#D95C5C] dark:text-red-400 font-bold"
                        : "text-[#2F8E86] dark:text-teal-400 font-bold"
                    }`}
                  >
                    {formatCurrency(remainingBalance)}
                  </strong>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E5EAEB] dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8] dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2F8E86] hover:bg-[#25776F] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? "Saving..." : "Save Settlement"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
