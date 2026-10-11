"use client";

import React, { useState, useEffect, useMemo } from "react";
import { tripService } from "../../../../services/tripService";
import {
  TripDto,
  TripStatus,
  TripExpenseType,
  TripSettlementSummaryDto,
} from "@/types/tms";
import { formatCurrency, formatDate } from "@/utils/configFormatter";
import { toast } from "@/context/ToastContext";
import { DataTable } from "@/app/components/ui/DataTable";
import CustomSelect from "@/app/components/ui/CustomSelect";
import TablePagination from "@/app/components/ui/TablePagination";
import PagePermissionGuard from "@/app/components/ui/PagePermissionGuard";
import {
  Truck,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  User,
  ArrowRight,
  Receipt,
  Plus,
  Trash2,
  X,
  Calculator,
  ShieldCheck,
  RotateCcw,
  FileText,
} from "lucide-react";

const STATUS_FILTER_OPTIONS = [
  { label: "Active Trips (Pending Settlement)", value: "ACTIVE" },
  { label: "Completed & Settled Trips", value: "COMPLETED" },
  { label: "All Trips", value: "ALL" },
];

function TripSettlementContent() {
  const [trips, setTrips] = useState<TripDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE"); // ACTIVE, ALL, COMPLETED
  const [vehicleFilter, setVehicleFilter] = useState("ALL");
  const [driverFilter, setDriverFilter] = useState("ALL");

  // Pagination (client-side; backend returns full list today)
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Settlement Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTripSummary, setActiveTripSummary] =
    useState<TripSettlementSummaryDto | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Settlement Form Fields
  const [endOdometer, setEndOdometer] = useState<number | string>("");
  const [collectedToPay, setCollectedToPay] = useState<number | string>("");
  const [settledAmount, setSettledAmount] = useState<number | string>("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [settlementRemarks, setSettlementRemarks] = useState("");
  const [settlementDate, setSettlementDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Additional Expenses in Modal
  const [extraExpenses, setExtraExpenses] = useState<
    {
      expenseType: TripExpenseType;
      amount: number | string;
      receiptNo: string;
      paidTo: string;
      remarks: string;
    }[]
  >([]);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await tripService.getTrips();
      setTrips(res || []);
    } catch (err: any) {
      console.error("Fetch trips error:", err);
      setError(err?.message || "Failed to load trips.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      if (t.status === TripStatus.Cancelled) return false;

      if (statusFilter === "ACTIVE") {
        if (t.status === TripStatus.Completed) return false;
      } else if (statusFilter === "COMPLETED") {
        if (t.status !== TripStatus.Completed) return false;
      }

      if (vehicleFilter !== "ALL" && t.vehicleNo !== vehicleFilter) {
        return false;
      }

      if (driverFilter !== "ALL" && t.driverName !== driverFilter) {
        return false;
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesNo = t.tripNo?.toLowerCase().includes(q);
        const matchesVeh = t.vehicleNo?.toLowerCase().includes(q);
        const matchesDriver = t.driverName?.toLowerCase().includes(q);
        const matchesOrigin = t.originLocationName?.toLowerCase().includes(q);
        const matchesDest = t.destinationLocationName?.toLowerCase().includes(q);
        if (!matchesNo && !matchesVeh && !matchesDriver && !matchesOrigin && !matchesDest) {
          return false;
        }
      }

      return true;
    });
  }, [trips, statusFilter, vehicleFilter, driverFilter, search]);

  // Reset page when filters change / list shrinks
  useEffect(() => {
    setPage(1);
  }, [statusFilter, vehicleFilter, driverFilter, search]);

  const totalCount = filteredTrips.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pagedTrips = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTrips.slice(start, start + pageSize);
  }, [filteredTrips, page, pageSize]);

  // Dynamic Vehicle & Driver options
  const vehicleOptions = useMemo(() => {
    const set = new Set<string>();
    trips.forEach((t) => {
      if (t.vehicleNo) set.add(t.vehicleNo);
    });
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [
      { label: `All Vehicles (${sorted.length})`, value: "ALL" },
      ...sorted.map((v) => ({ label: v, value: v })),
    ];
  }, [trips]);

  const driverOptions = useMemo(() => {
    const set = new Set<string>();
    trips.forEach((t) => {
      if (t.driverName) set.add(t.driverName);
    });
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [
      { label: `All Drivers (${sorted.length})`, value: "ALL" },
      ...sorted.map((d) => ({ label: d, value: d })),
    ];
  }, [trips]);

  // Overall Financial KPIs
  const metrics = useMemo(() => {
    const activeList = trips.filter(
      (t) => t.status !== TripStatus.Cancelled && t.status !== TripStatus.Completed
    );

    const totalDriverAdvances = activeList.reduce(
      (sum, t) => sum + (t.driverAdvanceCash || 0) + (t.driverAdvanceFuel || 0),
      0
    );

    const totalExpenses = activeList.reduce(
      (sum, t) => sum + (t.totalExpenses || 0),
      0
    );

    const totalFreight = activeList.reduce(
      (sum, t) => sum + (t.totalFreightRevenue || 0),
      0
    );

    const completedList = trips.filter(
      (t) => t.status === TripStatus.Completed
    );
    const completedRevenue = completedList.reduce(
      (sum, t) => sum + (t.totalFreightRevenue || 0),
      0
    );

    return {
      activeCount: activeList.length,
      totalDriverAdvances,
      totalExpenses,
      totalFreight,
      completedCount: completedList.length,
      completedRevenue,
    };
  }, [trips]);

  // Open Settlement Modal
  const handleOpenSettlement = async (trip: TripDto) => {
    try {
      setLoadingSummary(true);
      setIsModalOpen(true);
      setExtraExpenses([]);

      const summary = await tripService.getTripSettlementSummary(trip.id);
      setActiveTripSummary(summary);

      setEndOdometer(summary?.endOdometer || summary?.startOdometer || "");
      setCollectedToPay(summary?.collectedToPayFreight || 0);

      const netBalance = summary?.netDriverBalance || 0;
      setSettledAmount(Math.abs(netBalance));
      setPaymentMode("CASH");
      setSettlementRemarks("");
      setSettlementDate(new Date().toISOString().split("T")[0]);
    } catch (err: any) {
      console.error("Fetch trip settlement summary error:", err);
      toast.error(err?.message || "Failed to load trip financials.");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Extra expense handlers
  const handleAddExtraExpense = () => {
    setExtraExpenses([
      ...extraExpenses,
      {
        expenseType: TripExpenseType.Toll,
        amount: "",
        receiptNo: "",
        paidTo: "",
        remarks: "",
      },
    ]);
  };

  const handleRemoveExtraExpense = (index: number) => {
    setExtraExpenses(extraExpenses.filter((_, i) => i !== index));
  };

  const handleUpdateExtraExpense = (index: number, field: string, value: any) => {
    const updated = [...extraExpenses];
    (updated[index] as any)[field] = value;
    setExtraExpenses(updated);
  };

  // Live Math Calculation in Settlement Modal
  const modalMath = useMemo(() => {
    if (!activeTripSummary)
      return {
        advCash: 0,
        advFuel: 0,
        toPay: 0,
        totalAccountability: 0,
        baseExpenses: 0,
        additionalExpSum: 0,
        totalExpenses: 0,
        netBalance: 0,
      };

    const advCash = activeTripSummary.driverAdvanceCash || 0;
    const advFuel = activeTripSummary.driverAdvanceFuel || 0;
    const toPay = Number(collectedToPay) || 0;
    const totalAccountability = advCash + advFuel + toPay;

    const baseExpenses = activeTripSummary.totalExpenses || 0;
    const additionalExpSum = extraExpenses.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0
    );
    const totalExpenses = baseExpenses + additionalExpSum;

    const netBalance = totalAccountability - totalExpenses;

    return {
      advCash,
      advFuel,
      toPay,
      totalAccountability,
      baseExpenses,
      additionalExpSum,
      totalExpenses,
      netBalance,
    };
  }, [activeTripSummary, collectedToPay, extraExpenses]);

  // Submit Settlement
  const handleSubmitSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTripSummary) return;

    try {
      setSubmitting(true);

      const validExtra = extraExpenses
        .filter((e) => Number(e.amount) > 0)
        .map((e) => ({
          expenseType: e.expenseType,
          amount: Number(e.amount),
          receiptNo: e.receiptNo.trim() || undefined,
          paidTo: e.paidTo.trim() || undefined,
          remarks: e.remarks.trim() || undefined,
          expenseDate: settlementDate,
        }));

      const res = await tripService.settleTrip({
        tripId: activeTripSummary.tripId,
        endOdometer: endOdometer ? Number(endOdometer) : undefined,
        collectedToPayFreight: Number(collectedToPay) || 0,
        settledAmount: Number(settledAmount) || 0,
        paymentMode,
        settlementRemarks: settlementRemarks.trim() || undefined,
        settlementDate,
        additionalExpenses: validExtra.length > 0 ? validExtra : undefined,
      });

      if (res?.success) {
        toast.success(
          res.message || "Trip settled and marked as Completed successfully!"
        );
        setIsModalOpen(false);
        fetchTrips();
      } else {
        toast.error(res?.message || "Failed to settle trip.");
      }
    } catch (err: any) {
      console.error("Submit trip settlement error:", err);
      toast.error(err?.message || "Error processing trip settlement.");
    } finally {
      setSubmitting(false);
    }
  };

  // Clean enterprise dot-indicator status (no colored pill)
  const renderTripStatus = (status: TripStatus | number) => {
    if (status === TripStatus.Completed || status === 6) {
      return (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#25776F] dark:text-teal-400"
          title="Status: Settled & Completed"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F8E86] shrink-0" />
          <span>Settled & Completed</span>
        </span>
      );
    }
    if (status === TripStatus.Arrived || status === 4) {
      return (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-400"
          title="Status: Arrived at Destination"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
          <span>Arrived</span>
        </span>
      );
    }
    if (status === TripStatus.Unloaded || status === 5) {
      return (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-400"
          title="Status: Unloaded"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
          <span>Unloaded</span>
        </span>
      );
    }
    if (
      status === TripStatus.InTransit ||
      status === 3 ||
      status === TripStatus.Dispatched ||
      status === 2
    ) {
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
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400"
        title="Status: Loading / Memo"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        <span>Loading / Memo</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Trip Settlement
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Reconcile driver advances (cash + fuel) &amp; ToPay cash against on-road expenses to compute Net Driver Balance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchTrips}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-[#E7F1F2] dark:hover:bg-slate-700 text-[#25776F] border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Clean KPI Cards (matches delivery-settlement) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Trips */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Trips
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Truck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {metrics.activeCount}
            </span>
            <span className="text-xs text-slate-500">pending settlement</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
            Revenue: {formatCurrency(metrics.totalFreight)}
          </p>
        </div>

        {/* Card 2: Driver Advances Given */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Driver Advances Given
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <IndianRupee className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              {formatCurrency(metrics.totalDriverAdvances)}
            </span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
            Cash + Fuel vouchers
          </p>
        </div>

        {/* Card 3: On-Road Expenses */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              On-Road Expenses
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <Receipt className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
              {formatCurrency(metrics.totalExpenses)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Diesel, Toll, Repairs, Allowance
          </p>
        </div>

        {/* Card 4: Completed & Settled */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Completed &amp; Settled
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#2F8E86]/10 text-[#2F8E86] flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#2F8E86] dark:text-teal-400 font-mono">
              {metrics.completedCount}
            </span>
            <span className="text-xs text-slate-500">trips closed</span>
          </div>
          <p className="text-xs text-[#25776F] dark:text-teal-400 mt-1.5 font-medium">
            Reconciled Driver Ledgers
          </p>
        </div>
      </div>

      {/* Filter and Search Bar with CustomSelect */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#94A3B8]">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search by Trip No, Vehicle, Driver, Route..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#F7F8F8] dark:bg-slate-800/80 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs font-medium text-[#111827] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2F8E86]/30 focus:border-[#2F8E86]"
              />
            </div>
          </div>

          {/* CustomSelect Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(String(val))}
              icon={<Filter className="w-3.5 h-3.5" />}
              options={STATUS_FILTER_OPTIONS}
              className="w-full sm:w-auto min-w-[200px]"
            />

            <CustomSelect
              value={vehicleFilter}
              onChange={(val) => setVehicleFilter(String(val))}
              icon={<Truck className="w-3.5 h-3.5" />}
              searchable={true}
              options={vehicleOptions}
              className="w-full sm:w-auto min-w-[160px]"
            />

            <CustomSelect
              value={driverFilter}
              onChange={(val) => setDriverFilter(String(val))}
              icon={<User className="w-3.5 h-3.5" />}
              searchable={true}
              options={driverOptions}
              className="w-full sm:w-auto min-w-[160px]"
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
            onClick={fetchTrips}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Trips DataTable */}
      <DataTable<TripDto>
        data={pagedTrips}
        loading={loading}
        loadingText="Loading trips for settlement..."
        rowKey={(t) => t.id}
        emptyIcon={<Truck className="w-8 h-8" />}
        emptyTitle="No trips found"
        emptyMessage="All trips matching your filter have been settled or no active trips exist."
        footer={
          totalPages > 1 ? (
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={setPage}
            />
          ) : undefined
        }
        columns={[
          {
            key: "tripNo",
            header: "Trip / Challan No",
            render: (t) => (
              <div className="whitespace-nowrap" title={`Trip: ${t.tripNo}`}>
                <span className="font-mono font-bold text-[#2F8E86] dark:text-teal-400">
                  {t.tripNo}
                </span>
                <span className="block text-[11px] font-normal text-[#64748B] dark:text-slate-400 font-sans mt-0.5">
                  {t.shipments?.length || 0} bilties loaded
                </span>
              </div>
            ),
          },
          {
            key: "tripDate",
            header: "Date",
            render: (t) => (
              <span
                className="whitespace-nowrap text-[#64748B] dark:text-slate-400 font-medium text-xs"
                title={`Trip Date: ${formatDate(t.tripDate)}`}
              >
                {formatDate(t.tripDate)}
              </span>
            ),
          },
          {
            key: "vehicleDriver",
            header: "Vehicle & Driver",
            render: (t) => (
              <div
                className="max-w-[220px]"
                title={`Vehicle: ${t.vehicleNo || "—"}\nDriver: ${t.driverName || "—"}`}
              >
                <div className="font-semibold text-[#111827] dark:text-white flex items-center gap-1 truncate">
                  <Truck className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                  <span>{t.vehicleNo || "—"}</span>
                </div>
                <div className="text-[#64748B] dark:text-slate-400 text-[11px] mt-0.5 flex items-center gap-1 truncate">
                  <User className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {t.driverName || "Driver"}
                    {t.driverMobile ? ` (${t.driverMobile})` : ""}
                  </span>
                </div>
              </div>
            ),
          },
          {
            key: "route",
            header: "Route",
            render: (t) => (
              <div
                className="flex items-center gap-1.5 font-bold text-[#111827] dark:text-slate-200 whitespace-nowrap text-xs"
                title={`Route: ${t.originLocationName || "Origin"} → ${t.destinationLocationName || "Destination"}`}
              >
                <span>{t.originLocationName || "Origin"}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#4A90E2] shrink-0" />
                <span>{t.destinationLocationName || "Destination"}</span>
              </div>
            ),
          },
          {
            key: "driverAdv",
            header: "Driver Advance",
            align: "right",
            render: (t) => {
              const totalAdv =
                (t.driverAdvanceCash || 0) + (t.driverAdvanceFuel || 0);
              return (
                <div className="whitespace-nowrap">
                  <span
                    className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs"
                    title={`Total Driver Advance: ${formatCurrency(totalAdv)}`}
                  >
                    {formatCurrency(totalAdv)}
                  </span>
                  <span className="block text-[10px] text-[#94A3B8] font-sans mt-0.5">
                    Cash: {formatCurrency(t.driverAdvanceCash || 0)} | Fuel:{" "}
                    {formatCurrency(t.driverAdvanceFuel || 0)}
                  </span>
                </div>
              );
            },
          },
          {
            key: "expenses",
            header: "On-Road Expenses",
            align: "right",
            render: (t) => (
              <div className="whitespace-nowrap">
                <span
                  className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs"
                  title={`Total On-Road Expenses: ${formatCurrency(t.totalExpenses || 0)}`}
                >
                  {formatCurrency(t.totalExpenses || 0)}
                </span>
                <span className="block text-[10px] text-[#94A3B8] font-sans mt-0.5">
                  {t.expenses?.length || 0} vouchers
                </span>
              </div>
            ),
          },
          {
            key: "freightMargin",
            header: "Freight Margin",
            align: "right",
            render: (t) => (
              <span
                className="font-mono font-bold text-[#111827] dark:text-white whitespace-nowrap text-xs"
                title={`Net Profit Margin: ${formatCurrency(t.netProfitMargin || 0)}`}
              >
                {formatCurrency(t.netProfitMargin || 0)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (t) => renderTripStatus(t.status),
          },
          {
            key: "action",
            header: "Action",
            align: "right",
            render: (t) => {
              const isCompleted = t.status === TripStatus.Completed;
              return (
                <button
                  type="button"
                  onClick={() => handleOpenSettlement(t)}
                  title={isCompleted ? "View Settlement Statement" : "Settle this trip"}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer ml-auto ${
                    isCompleted
                      ? "bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 text-[#25776F] dark:text-teal-400 hover:bg-[#E7F1F2] dark:hover:bg-slate-700"
                      : "bg-[#2F8E86] hover:bg-[#25776F] text-white"
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Statement</span>
                    </>
                  ) : (
                    <>
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Settle Trip</span>
                    </>
                  )}
                </button>
              );
            },
          },
        ]}
      />

      {/* Trip Settlement Modal — Driver Reconciliation Ledger retained */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-[#E5EAEB] dark:border-slate-800 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto scrollbar-thin">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E5EAEB] dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E7F1F2] dark:bg-teal-950/40 text-[#2F8E86] flex items-center justify-center font-bold shadow-2xs shrink-0">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-[#111827] dark:text-white">
                      Trip Settlement Statement
                    </h3>
                    {activeTripSummary && (
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#E7F1F2] dark:bg-slate-800 text-[#25776F] dark:text-teal-300 border border-[#2F8E86]/30">
                        {activeTripSummary.tripNo}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                    Vehicle: {activeTripSummary?.vehicleNo || "—"} | Driver:{" "}
                    {activeTripSummary?.driverName || "—"}
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

            {loadingSummary ? (
              <div className="py-16 text-center text-slate-500">
                <div className="w-8 h-8 border-4 border-[#2F8E86] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Calculating trip financials...
              </div>
            ) : (
              <form onSubmit={handleSubmitSettlement} className="mt-5 space-y-4">
                {/* Odometer & Kilometers */}
                <div className="p-3 bg-[#F7F8F8] dark:bg-slate-800 rounded-xl border border-[#E5EAEB] dark:border-slate-700 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-[#64748B]">
                      Start Odometer
                    </span>
                    <div className="text-base font-bold font-mono text-[#111827] dark:text-slate-200">
                      {activeTripSummary?.startOdometer || 0} KM
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-[#64748B]">
                      End Odometer *
                    </span>
                    <input
                      type="number"
                      value={endOdometer}
                      onChange={(e) => setEndOdometer(e.target.value)}
                      placeholder="e.g. 52400"
                      className="w-full mt-0.5 px-2 py-1 text-center font-mono font-bold text-sm bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2F8E86]/30 focus:border-[#2F8E86]"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-[#64748B]">
                      Total Distance
                    </span>
                    <div className="text-base font-bold font-mono text-[#2F8E86] dark:text-teal-400">
                      {Number(endOdometer) > (activeTripSummary?.startOdometer || 0)
                        ? Number(endOdometer) - (activeTripSummary?.startOdometer || 0)
                        : 0}{" "}
                      KM
                    </div>
                  </div>
                </div>

                {/* Driver Financial Ledger Reconciliation Box (RETAINED — signature UX) */}
                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 font-mono text-xs">
                  <div className="text-xs uppercase font-bold tracking-wider text-teal-300 pb-1 border-b border-slate-700 flex items-center justify-between">
                    <span>Driver Reconciliation Ledger</span>
                    <span>Values in ₹ INR</span>
                  </div>

                  {/* Section A: Driver Accountability */}
                  <div className="space-y-1">
                    <div className="text-slate-400 font-semibold font-sans uppercase text-[10px]">
                      A. Driver Funds & Cash Accountability
                    </div>
                    <div className="flex justify-between text-slate-300 pl-2">
                      <span>(+) Advance Cash given:</span>
                      <span>{formatCurrency(modalMath.advCash)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 pl-2">
                      <span>(+) Fuel Advance given:</span>
                      <span>{formatCurrency(modalMath.advFuel)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300 pl-2">
                      <span>(+) ToPay Freight Collected by Driver:</span>
                      <input
                        type="number"
                        value={collectedToPay}
                        onChange={(e) => setCollectedToPay(e.target.value)}
                        className="w-24 px-1.5 py-0.5 text-right font-mono bg-slate-800 border border-slate-700 rounded text-amber-300"
                      />
                    </div>
                    <div className="flex justify-between font-bold text-amber-400 pt-1 border-t border-slate-800">
                      <span>Total Driver Accountability:</span>
                      <span>{formatCurrency(modalMath.totalAccountability)}</span>
                    </div>
                  </div>

                  {/* Section B: Approved Expenses */}
                  <div className="space-y-1 pt-2 border-t border-slate-800">
                    <div className="text-slate-400 font-semibold font-sans uppercase text-[10px]">
                      B. Approved On-Road Expenses
                    </div>
                    <div className="flex justify-between text-slate-300 pl-2">
                      <span>(-) Diesel / Fuel:</span>
                      <span>{formatCurrency(activeTripSummary?.fuelExpenses || 0)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 pl-2">
                      <span>(-) Toll Taxes:</span>
                      <span>{formatCurrency(activeTripSummary?.tollExpenses || 0)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 pl-2">
                      <span>(-) Driver Allowance / Food:</span>
                      <span>{formatCurrency(activeTripSummary?.driverExpenses || 0)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 pl-2">
                      <span>(-) Repair / Maintenance / Police / Other:</span>
                      <span>
                        {formatCurrency(
                          (activeTripSummary?.maintenanceExpenses || 0) +
                            (activeTripSummary?.otherExpenses || 0)
                        )}
                      </span>
                    </div>
                    {(modalMath.additionalExpSum || 0) > 0 && (
                      <div className="flex justify-between text-amber-300 pl-2">
                        <span>(-) Extra Settlement Receipts:</span>
                        <span>{formatCurrency(modalMath.additionalExpSum || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-red-400 pt-1 border-t border-slate-800">
                      <span>Total Expenses Incurred:</span>
                      <span>{formatCurrency(modalMath.totalExpenses)}</span>
                    </div>
                  </div>

                  {/* Section C: Net Result */}
                  <div className="p-3 bg-slate-800/90 rounded-lg flex items-center justify-between font-bold text-sm">
                    <div>
                      <span className="text-xs uppercase font-sans">
                        Net Driver Settlement Balance:
                      </span>
                      <div className="text-[11px] font-normal text-slate-400 font-sans">
                        {modalMath.netBalance >= 0
                          ? "Driver owes office (Cash Return)"
                          : "Office owes driver (Reimbursement)"}
                      </div>
                    </div>
                    <div
                      className={`text-lg font-mono ${
                        modalMath.netBalance >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {formatCurrency(Math.abs(modalMath.netBalance))}
                    </div>
                  </div>
                </div>

                {/* Additional Expenses Section (Quick Add) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111827] dark:text-slate-300">
                      Extra On-Road Receipts Handed by Driver
                    </span>
                    <button
                      type="button"
                      onClick={handleAddExtraExpense}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2F8E86] hover:text-[#25776F] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Voucher
                    </button>
                  </div>

                  {extraExpenses.map((exp, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#F7F8F8] dark:bg-slate-800 rounded-lg border border-[#E5EAEB] dark:border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center text-xs"
                    >
                      <select
                        value={exp.expenseType}
                        onChange={(e) =>
                          handleUpdateExtraExpense(
                            idx,
                            "expenseType",
                            Number(e.target.value)
                          )
                        }
                        className="bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#2F8E86]/30 focus:border-[#2F8E86]"
                      >
                        <option value={TripExpenseType.Fuel}>Diesel / Fuel</option>
                        <option value={TripExpenseType.Toll}>Toll Tax</option>
                        <option value={TripExpenseType.DriverAllowance}>Allowance</option>
                        <option value={TripExpenseType.VehicleRepair}>Vehicle Repair</option>
                        <option value={TripExpenseType.PoliceKharcha}>Police / Kharcha</option>
                        <option value={TripExpenseType.LoadingCharges}>Hamali / Loading</option>
                        <option value={TripExpenseType.Misc}>Misc / Other</option>
                      </select>

                      <input
                        type="number"
                        placeholder="Amount (₹) *"
                        value={exp.amount}
                        onChange={(e) =>
                          handleUpdateExtraExpense(idx, "amount", e.target.value)
                        }
                        className="bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded p-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-[#2F8E86]/30 focus:border-[#2F8E86]"
                      />

                      <input
                        type="text"
                        placeholder="Receipt / Slip No"
                        value={exp.receiptNo}
                        onChange={(e) =>
                          handleUpdateExtraExpense(idx, "receiptNo", e.target.value)
                        }
                        className="bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#2F8E86]/30 focus:border-[#2F8E86]"
                      />

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Paid to / Remarks"
                          value={exp.remarks}
                          onChange={(e) =>
                            handleUpdateExtraExpense(idx, "remarks", e.target.value)
                          }
                          className="w-full bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#2F8E86]/30 focus:border-[#2F8E86]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraExpense(idx)}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Final Handover & Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#111827] dark:text-slate-200 mb-1">
                      Settled / Reconciled Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={settledAmount}
                      onChange={(e) => setSettledAmount(e.target.value)}
                      className="w-full h-10 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2F8E86]/30 focus:border-[#2F8E86] font-mono font-bold text-[#111827] dark:text-white shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#111827] dark:text-slate-200 mb-1">
                      Settlement Mode *
                    </label>
                    <CustomSelect
                      value={paymentMode}
                      onChange={(val) => setPaymentMode(String(val))}
                      options={[
                        { label: "Cash in Hand", value: "CASH" },
                        { label: "UPI / PhonePe / GPay", value: "UPI" },
                        { label: "Bank IMPS / NEFT", value: "BANK_TRANSFER" },
                      ]}
                      className="w-full min-w-0"
                    />
                  </div>
                </div>

                {/* Settlement Notes */}
                <div>
                  <label className="block text-xs font-semibold text-[#111827] dark:text-slate-200 mb-1">
                    Settlement Remarks / Handover Notes
                  </label>
                  <textarea
                    rows={2}
                    value={settlementRemarks}
                    onChange={(e) => setSettlementRemarks(e.target.value)}
                    placeholder="e.g. Received ₹1,250 cash from driver Ramesh; trip completed with zero shortage."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2F8E86]/30 focus:border-[#2F8E86] text-[#111827] dark:text-white shadow-2xs"
                  />
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
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Closing Trip...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Finalize & Settle Trip</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TripSettlementPage() {
  return (
    <PagePermissionGuard permission="trip_settlement.view" moduleName="Trip Settlement">
      <TripSettlementContent />
    </PagePermissionGuard>
  );
}
