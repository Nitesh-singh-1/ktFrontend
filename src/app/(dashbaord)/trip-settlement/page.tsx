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
import {
  Truck,
  IndianRupee,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  User,
  MapPin,
  ArrowRight,
  Fuel,
  Receipt,
  Plus,
  Trash2,
  X,
  Gauge,
  Calculator,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export default function TripSettlementPage() {
  const [trips, setTrips] = useState<TripDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE"); // ACTIVE, ALL, COMPLETED

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
  }, [trips, statusFilter, search]);

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

    const completedCount = trips.filter(
      (t) => t.status === TripStatus.Completed
    ).length;

    return {
      activeCount: activeList.length,
      totalDriverAdvances,
      totalExpenses,
      totalFreight,
      completedCount,
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
    if (!activeTripSummary) return { totalAccountability: 0, totalExpenses: 0, netBalance: 0 };

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

  const getTripStatusBadge = (status: TripStatus | number) => {
    if (status === TripStatus.Completed || status === 6) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" /> Settled & Completed
        </span>
      );
    }
    if (status === TripStatus.Arrived || status === 4) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <Truck className="w-3 h-3" /> Arrived at Destination
        </span>
      );
    }
    if (status === TripStatus.InTransit || status === 3 || status === TripStatus.Dispatched || status === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Truck className="w-3 h-3" /> In Transit
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <AlertCircle className="w-3 h-3" /> Loading / Memo
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Truck className="w-7 h-7 text-indigo-600" />
            Trip Settlement
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Reconcile driver advances (cash + fuel) & ToPay cash against on-road expenses (diesel, toll, allowance, repairs) to compute Net Driver Balance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTrips}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Active Trips (Challans)
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {metrics.activeCount}
            </span>
            <span className="text-xs text-gray-500">pending settlement</span>
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
            Revenue: {formatCurrency(metrics.totalFreight)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Driver Advances Given
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(metrics.totalDriverAdvances)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Cash advance + Diesel vouchers</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              On-Road Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(metrics.totalExpenses)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Diesel, Toll, Repairs, Allowance</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Completed & Settled
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.completedCount}
            </span>
            <span className="text-xs text-gray-500">trips closed</span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            Reconciled Driver Ledgers
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Trip No, Vehicle, Driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-gray-200"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200"
          >
            <option value="ACTIVE">Active Trips (Pending Settlement)</option>
            <option value="COMPLETED">Completed & Settled Trips</option>
            <option value="ALL">All Trips</option>
          </select>
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
            Loading trips for settlement...
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            <Truck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="font-medium text-base text-gray-700 dark:text-gray-300">
              No trips found
            </p>
            <p className="text-sm mt-1">
              All trips matching your filter have been settled or no active trips exist.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 text-xs uppercase font-semibold">
                  <th className="py-3 px-4">Trip / Challan No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Vehicle & Driver</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4 text-right">Driver Advance</th>
                  <th className="py-3 px-4 text-right">On-Road Expenses</th>
                  <th className="py-3 px-4 text-right">Freight Margin</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredTrips.map((t) => {
                  const totalAdv = (t.driverAdvanceCash || 0) + (t.driverAdvanceFuel || 0);
                  const isCompleted = t.status === TripStatus.Completed;

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-gray-100">
                        {t.tripNo}
                        <span className="block text-xs font-normal text-gray-500 font-sans">
                          {t.shipments?.length || 0} Bilties loaded
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(t.tripDate)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                          🚚 {t.vehicleNo || "—"}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {t.driverName || "Driver"} {t.driverMobile ? `(${t.driverMobile})` : ""}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1 font-medium text-gray-800 dark:text-gray-200">
                          {t.originLocationName || "Origin"}
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          {t.destinationLocationName || "Destination"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-amber-600 dark:text-amber-400">
                        {formatCurrency(totalAdv)}
                        <span className="block text-[10px] text-gray-400">
                          Cash: ₹{t.driverAdvanceCash} | Fuel: ₹{t.driverAdvanceFuel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-red-600 dark:text-red-400">
                        {formatCurrency(t.totalExpenses || 0)}
                        <span className="block text-[10px] text-gray-400">
                          {t.expenses?.length || 0} vouchers
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(t.netProfitMargin || 0)}
                      </td>
                      <td className="py-3 px-4">{getTripStatusBadge(t.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenSettlement(t)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors ${
                            isCompleted
                              ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white"
                          }`}
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          {isCompleted ? "View Statement" : "Settle Trip"}
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

      {/* Trip Settlement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Trip Settlement Statement — #{activeTripSummary?.tripNo}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Vehicle: {activeTripSummary?.vehicleNo} | Driver: {activeTripSummary?.driverName}
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

            {loadingSummary ? (
              <div className="py-16 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                Calculating trip financials...
              </div>
            ) : (
              <form onSubmit={handleSubmitSettlement} className="mt-4 space-y-4">
                {/* Odometer & Kilometers */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-gray-500">
                      Start Odometer
                    </span>
                    <div className="text-base font-bold font-mono text-gray-800 dark:text-gray-200">
                      {activeTripSummary?.startOdometer || 0} KM
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-gray-500">
                      End Odometer *
                    </span>
                    <input
                      type="number"
                      value={endOdometer}
                      onChange={(e) => setEndOdometer(e.target.value)}
                      placeholder="e.g. 52400"
                      className="w-full mt-0.5 px-2 py-1 text-center font-mono font-bold text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-gray-500">
                      Total Distance
                    </span>
                    <div className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {Number(endOdometer) > (activeTripSummary?.startOdometer || 0)
                        ? Number(endOdometer) - (activeTripSummary?.startOdometer || 0)
                        : 0}{" "}
                      KM
                    </div>
                  </div>
                </div>

                {/* Driver Financial Ledger Reconciliation Box */}
                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 font-mono text-xs">
                  <div className="text-xs uppercase font-bold tracking-wider text-indigo-300 pb-1 border-b border-slate-700 flex items-center justify-between">
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
                          ? "🟢 Driver owes office (Cash Return)"
                          : "🔴 Office owes driver (Reimbursement)"}
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
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Extra On-Road Receipts Handed by Driver
                    </span>
                    <button
                      type="button"
                      onClick={handleAddExtraExpense}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Voucher
                    </button>
                  </div>

                  {extraExpenses.map((exp, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center text-xs"
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
                        className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-1.5"
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
                        className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-1.5 font-mono"
                      />

                      <input
                        type="text"
                        placeholder="Receipt / Slip No"
                        value={exp.receiptNo}
                        onChange={(e) =>
                          handleUpdateExtraExpense(idx, "receiptNo", e.target.value)
                        }
                        className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-1.5"
                      />

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Paid to / Remarks"
                          value={exp.remarks}
                          onChange={(e) =>
                            handleUpdateExtraExpense(idx, "remarks", e.target.value)
                          }
                          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-1.5"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraExpense(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Final Handover & Mode */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Settled / Reconciled Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={settledAmount}
                      onChange={(e) => setSettledAmount(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Settlement Mode *
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
                    >
                      <option value="CASH">Cash in Hand</option>
                      <option value="UPI">UPI / PhonePe / GPay</option>
                      <option value="BANK_TRANSFER">Bank IMPS / NEFT</option>
                    </select>
                  </div>
                </div>

                {/* Settlement Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Settlement Remarks / Handover Notes
                  </label>
                  <textarea
                    rows={2}
                    value={settlementRemarks}
                    onChange={(e) => setSettlementRemarks(e.target.value)}
                    placeholder="e.g. Received ₹1,250 cash from driver Ramesh; trip completed with zero shortage."
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                  />
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
                    className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md transition-colors"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Closing Trip...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Finalize & Settle Trip
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
