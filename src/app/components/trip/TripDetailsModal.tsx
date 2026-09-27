"use client";

import React, { useState, useEffect } from "react";
import { TripDto, TripStatus, TripExpenseType } from "@/types/tms";
import { tripService } from "services/tripService";
import { Truck, Send, Flag, Fuel, Printer, X, FileText } from "lucide-react";
import { getTenantPrintProfile } from "@/utils/print/tenantProfile";

interface TripDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: number | null;
  onUpdated: () => void;
}

export default function TripDetailsModal({
  isOpen,
  onClose,
  tripId,
  onUpdated,
}: TripDetailsModalProps) {
  const [trip, setTrip] = useState<TripDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // Expense form state
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseType, setExpenseType] = useState<TripExpenseType>(TripExpenseType.Fuel);
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [receiptNo, setReceiptNo] = useState("");
  const [expenseRemarks, setExpenseRemarks] = useState("");

  // Print Challan View
  const [showPrintView, setShowPrintView] = useState(false);

  useEffect(() => {
    if (isOpen && tripId) {
      loadTrip(tripId);
    } else {
      setTrip(null);
      setShowPrintView(false);
    }
  }, [isOpen, tripId]);

  const loadTrip = async (id: number) => {
    try {
      setLoading(true);
      setError("");
      const res = await tripService.getTripById(id);
      setTrip(res);
    } catch (err: any) {
      console.error("Load trip error:", err);
      setError(err?.message || "Failed to load LR / Truck Challan.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleDispatch = async () => {
    if (!trip) return;
    if (!confirm(`Dispatch Truck Challan ${trip.tripNo}? All loaded consignments will automatically transition to "In Transit".`)) return;

    try {
      setActionLoading(true);
      await tripService.dispatchTrip(trip.id);
      loadTrip(trip.id);
      onUpdated();
    } catch (err: any) {
      alert(err?.message || "Failed to dispatch trip.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleArrive = async () => {
    if (!trip) return;
    const endOdo = prompt("Enter ending odometer reading (Km):", trip.startOdometer?.toString() || "0");
    if (endOdo === null) return;

    try {
      setActionLoading(true);
      await tripService.arriveTrip(trip.id, parseFloat(endOdo) || undefined);
      loadTrip(trip.id);
      onUpdated();
    } catch (err: any) {
      alert(err?.message || "Failed to record arrival.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !expenseAmount || expenseAmount <= 0) return;

    try {
      setActionLoading(true);
      await tripService.addExpense(trip.id, {
        expenseType,
        amount: Number(expenseAmount),
        receiptNo: receiptNo.trim() || undefined,
        remarks: expenseRemarks.trim() || undefined,
      });
      setShowExpenseForm(false);
      setExpenseAmount(0);
      setReceiptNo("");
      setExpenseRemarks("");
      loadTrip(trip.id);
      onUpdated();
    } catch (err: any) {
      alert(err?.message || "Failed to record on-road expense.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: TripStatus) => {
    switch (status) {
      case TripStatus.Dispatched:
      case TripStatus.InTransit:
        return { text: "IN TRANSIT", class: "bg-blue-50 text-[#4A90E2] border-[#4A90E2]/30" };
      case TripStatus.Arrived:
        return { text: "ARRIVED", class: "bg-[#E7F1F2] text-[#25776F] border-[#2F8E86]/30" };
      case TripStatus.Completed:
        return { text: "COMPLETED", class: "bg-[#E7F1F2] text-[#2F9E8F] border-[#2F9E8F]/30" };
      case TripStatus.Cancelled:
        return { text: "CANCELLED", class: "bg-red-50 text-[#D95C5C] border-[#D95C5C]/30" };
      default:
        return { text: "LOADING / DRAFT", class: "bg-amber-50 text-[#B76E32] border-[#F4A261]/30" };
    }
  };

  const totalLoadedPackages = trip?.shipments?.reduce((sum, s) => sum + (s.loadedPackages || 1), 0) || trip?.totalPackages || 0;
  const totalFreight = trip?.shipments?.reduce((sum, s) => sum + (Number(s.freightAmount) || 0), 0) || trip?.totalFreightRevenue || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-[#D9E2E3] dark:border-slate-800 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="p-1.5 bg-[#E7F1F2] text-[#2F8E86] rounded-lg">
              <Truck className="w-5 h-5 text-[#2F8E86]" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
                <span>Manifest & Truck Challan:</span>
                <span className="font-mono text-[#2F8E86] font-black">
                  {trip?.tripNo || "Loading..."}
                </span>
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Route: <span className="font-semibold">{trip?.originLocationName || "Origin"}</span> →{" "}
                <span className="font-semibold">{trip?.destinationLocationName || "Destination"}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#111827] dark:hover:text-white p-1.5 rounded-lg hover:bg-[#F7F8F8] dark:hover:bg-slate-800 transition cursor-pointer font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="p-16 text-center text-[#94A3B8] text-xs">Loading truck challan...</div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-[#D95C5C] text-xs font-semibold rounded-xl border border-red-200">{error}</div>
          ) : trip ? (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#F7F8F8] dark:bg-slate-800/40 rounded-xl border border-[#E5EAEB] dark:border-slate-700 text-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#94A3B8]">Assigned Lorry</p>
                  <p className="font-mono font-black text-[#111827] dark:text-white text-sm mt-0.5">
                    {trip.vehicleNo}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#94A3B8]">Driver & Crew</p>
                  <p className="font-bold text-[#111827] dark:text-slate-200 mt-0.5">
                    {trip.driverName || "—"}
                  </p>
                  {trip.driverMobile && (
                    <p className="text-[10px] text-[#94A3B8] font-mono">{trip.driverMobile}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#94A3B8]">Dispatch Status</p>
                  <span
                    className={`inline-flex px-2 py-0.5 text-[10px] font-bold border rounded-md mt-0.5 ${
                      getStatusBadge(trip.status).class
                    }`}
                  >
                    {getStatusBadge(trip.status).text}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#94A3B8]">Net Profit Margin</p>
                  <p className="font-mono font-black text-[#2F9E8F] text-sm mt-0.5">
                    ₹
                    {trip.netProfitMargin?.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    }) || "0.00"}
                  </p>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 rounded-xl shadow-2xs">
                <div className="flex flex-wrap items-center gap-2">
                  {trip.status === TripStatus.Draft || trip.status === TripStatus.Loading ? (
                    <button
                      onClick={handleDispatch}
                      disabled={actionLoading}
                      className="btn-primary"
                    >
                      <Send className="w-4 h-4" />
                      <span>Dispatch Truck (Mark In Transit)</span>
                    </button>
                  ) : null}

                  {trip.status === TripStatus.Dispatched || trip.status === TripStatus.InTransit ? (
                    <button
                      onClick={handleArrive}
                      disabled={actionLoading}
                      className="btn-primary"
                    >
                      <Flag className="w-4 h-4" />
                      <span>Mark Hub Arrival (Out For Delivery)</span>
                    </button>
                  ) : null}

                  <button
                    onClick={() => setShowExpenseForm(!showExpenseForm)}
                    className="btn-secondary"
                  >
                    <Fuel className="w-4 h-4 text-[#2F8E86]" />
                    <span>+ Record Expense</span>
                  </button>
                </div>

                {/* Print Pink Challan Button */}
                <button
                  type="button"
                  onClick={() => setShowPrintView(true)}
                  className="px-4 py-2 bg-pink-100 hover:bg-pink-200 text-pink-900 border border-pink-300 font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Pink Truck Challan</span>
                </button>
              </div>

              {/* Expense Logging Form */}
              {showExpenseForm && (
                <form
                  onSubmit={handleAddExpense}
                  className="p-4 bg-blue-50/50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                      Record On-Road Expense (Fuel, Toll, Allowance)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowExpenseForm(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Expense Type
                      </label>
                      <select
                        value={expenseType}
                        onChange={(e) => setExpenseType(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                      >
                        <option value={TripExpenseType.Fuel}>Fuel / Diesel</option>
                        <option value={TripExpenseType.Toll}>Toll Tax / Fastag</option>
                        <option value={TripExpenseType.DriverAllowance}>Driver Daily Allowance</option>
                        <option value={TripExpenseType.PoliceKharcha}>Police / Road Kharcha</option>
                        <option value={TripExpenseType.VehicleRepair}>Vehicle Repair / Tyre</option>
                        <option value={TripExpenseType.LoadingCharges}>Loading / Hamali</option>
                        <option value={TripExpenseType.UnloadingCharges}>Unloading</option>
                        <option value={TripExpenseType.Misc}>Miscellaneous</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Amount (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        step="any"
                        min="1"
                        placeholder="0.00"
                        value={expenseAmount === 0 ? "" : expenseAmount}
                        onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Receipt / Bill Ref
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. PUMP-892"
                        value={receiptNo}
                        onChange={(e) => setReceiptNo(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Remarks
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 50L diesel at Varanasi"
                        value={expenseRemarks}
                        onChange={(e) => setExpenseRemarks(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="btn-primary h-9 min-w-[120px] text-xs"
                    >
                      Save Expense Entry
                    </button>
                  </div>
                </form>
              )}

              {/* Loaded Bilties Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span>Loaded Bilties on Truck ({trip.shipments?.length || 0})</span>
                  <span className="font-mono text-[#2F8E86]">
                    Total Packages: {totalLoadedPackages} | Freight: ₹{totalFreight.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </h3>
                <div className="border border-[#E5EAEB] dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F7F8F8] dark:bg-slate-800 border-b border-[#E5EAEB] dark:border-slate-700 text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Bilty / GR No</th>
                        <th className="py-2.5 px-3">Loaded Weight</th>
                        <th className="py-2.5 px-3">Packages</th>
                        <th className="py-2.5 px-3 text-right">Freight (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5EAEB] dark:divide-slate-800">
                      {trip.shipments && trip.shipments.length > 0 ? (
                        trip.shipments.map((shp) => (
                          <tr key={shp.id} className="hover:bg-[#F5FAFA] dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#2F8E86]">
                              {shp.shipmentNo}
                            </td>
                            <td className="py-2.5 px-3 font-semibold">{shp.loadedWeight} Kg</td>
                            <td className="py-2.5 px-3">{shp.loadedPackages} PKGS</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[#111827] dark:text-white">
                              ₹{shp.freightAmount}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-[#94A3B8]">
                            No Bilties loaded on this Challan yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* On-Road Expenses Ledger */}
              {trip.expenses && trip.expenses.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-300 mb-2">
                    On-Road Expense Audit Trail
                  </h3>
                  <div className="border border-[#E5EAEB] dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-[#E5EAEB] dark:divide-slate-800 text-xs">
                    {trip.expenses.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-3 bg-[#F7F8F8] dark:bg-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-[#111827] dark:text-white">
                            {exp.expenseTypeName || "Expense"}
                          </p>
                          <p className="text-[10px] text-[#64748B]">
                            {exp.expenseDate ? exp.expenseDate.split("T")[0] : ""}{" "}
                            {exp.receiptNo ? `• Ref: ${exp.receiptNo}` : ""}{" "}
                            {exp.remarks ? `• ${exp.remarks}` : ""}
                          </p>
                        </div>
                        <div className="text-right font-mono font-bold text-[#D95C5C] text-sm">
                          - ₹{exp.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5EAEB] dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <div className="text-xs text-[#64748B]">
            Created: {trip?.tripDate ? trip.tripDate.split("T")[0] : ""}
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>

      {/* Printable Pink Truck Challan Modal matching Photo 3 */}
      {showPrintView && trip && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full p-6 text-slate-900 dark:text-slate-100 space-y-4 max-h-[92vh] overflow-y-auto print:p-0 print:m-0 print:max-w-none print:shadow-none print:rounded-none">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 print:hidden">
              <span className="font-bold text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-rose-600" /> Print Preview: Authentic Pink Truck Challan Slip
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-primary h-9 min-w-[120px] text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Challan Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintView(false)}
                  className="btn-secondary h-9 min-w-[80px] text-xs flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Pink Challan Slip Layout (Dynamic Client Branding) */}
            {(() => {
              const profile = getTenantPrintProfile();
              return (
                <div className="bg-[#ffe4e6] border-2 border-rose-400 p-6 rounded-xl space-y-4 font-sans text-rose-950">
                  {/* Slip Header */}
                  <div className="text-center border-b-2 border-rose-400 pb-3">
                    <h1 className="text-xl font-black tracking-wider uppercase">
                      TRUCK CHALLAN
                    </h1>
                    <h2 className="text-2xl font-black text-rose-900 mt-1 tracking-tight">
                      {profile.companyName || "KESHRI TRANSPORT"}
                    </h2>
                    <p className="text-xs font-bold text-rose-800">
                      {profile.address || "ZERO MILE, PAHARI, PATNA-7"}
                      {profile.gstin ? ` | GSTIN: ${profile.gstin}` : ""}
                      {profile.panNumber ? ` | PAN: ${profile.panNumber}` : ""}
                    </p>
                  </div>

                  {/* Challan Meta Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-b-2 border-rose-300 pb-3">
                    <div>
                      <span className="font-bold text-rose-800">Challan No: </span>
                      <span className="font-mono font-black text-sm">{trip.tripNo}</span>
                    </div>
                    <div>
                      <span className="font-bold text-rose-800">Date: </span>
                      <span className="font-bold">{trip.tripDate ? trip.tripDate.split("T")[0] : ""}</span>
                    </div>
                    <div>
                      <span className="font-bold text-rose-800">Lorry No: </span>
                      <span className="font-mono font-black text-sm">{trip.vehicleNo}</span>
                    </div>
                    <div>
                      <span className="font-bold text-rose-800">Driver Name: </span>
                      <span className="font-bold">{trip.driverName || "—"}</span>
                    </div>

                    <div className="col-span-2">
                      <span className="font-bold text-rose-800">From Hub: </span>
                      <span className="font-bold">{trip.originLocationName || profile.address || "Zero Mile, Pahari"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-bold text-rose-800">Destination Route To: </span>
                      <span className="font-bold">{trip.destinationLocationName || "—"}</span>
                    </div>
                  </div>

                  {/* Bilties Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse border border-rose-400 bg-white/70">
                      <thead>
                        <tr className="bg-rose-200/80 border-b border-rose-400 text-rose-950 font-black text-[11px]">
                          <th className="py-2 px-2 border-r border-rose-300 w-8 text-center">Sl.</th>
                          <th className="py-2 px-3 border-r border-rose-300 min-w-[90px]">Bill No.</th>
                          <th className="py-2 px-2 border-r border-rose-300 text-center w-14">Qty.</th>
                          <th className="py-2 px-3 border-r border-rose-300 min-w-[90px]">From</th>
                          <th className="py-2 px-3 border-r border-rose-300 text-right min-w-[90px]">Freight</th>
                          <th className="py-2 px-3 border-r border-rose-300 text-center min-w-[90px]">Freight Paid</th>
                          <th className="py-2 px-3">Consignee Name</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-300">
                        {trip.shipments && trip.shipments.length > 0 ? (
                          trip.shipments.map((shp, idx) => (
                            <tr key={shp.id} className="hover:bg-white transition">
                              <td className="py-1.5 px-2 text-center font-bold border-r border-rose-300">{idx + 1}</td>
                              <td className="py-1.5 px-3 font-mono font-bold border-r border-rose-300">{shp.shipmentNo}</td>
                              <td className="py-1.5 px-2 text-center font-bold border-r border-rose-300">{shp.loadedPackages || 1}</td>
                              <td className="py-1.5 px-3 border-r border-rose-300">{trip.originLocationName || "Pahari"}</td>
                              <td className="py-1.5 px-3 text-right font-mono font-bold border-r border-rose-300">₹{shp.freightAmount}</td>
                              <td className="py-1.5 px-3 text-center border-r border-rose-300 font-semibold text-[10px]">
                                {shp.freightAmount > 0 ? "TO PAY" : "PAID"}
                              </td>
                              <td className="py-1.5 px-3 font-medium truncate max-w-[180px]">
                                {shp.shipmentNo} Party
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-4 text-center text-rose-400">
                              No Bilties listed
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Challan Footer & Signature Blocks (Cash and Fuel Advance Shown Individually) */}
                  <div className="pt-3 border-t-2 border-rose-400 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold text-rose-900 bg-rose-200/50 p-2.5 rounded-lg border border-rose-300">
                      <div>
                        <span className="text-rose-700 block text-[10px] uppercase">Total Packages</span>
                        <span className="font-mono text-sm">{totalLoadedPackages} PKGS</span>
                      </div>
                      <div>
                        <span className="text-rose-700 block text-[10px] uppercase">Cash Advance</span>
                        <span className="font-mono text-sm">₹{(trip.driverAdvanceCash || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-rose-700 block text-[10px] uppercase">Fuel / Diesel Advance</span>
                        <span className="font-mono text-sm">₹{(trip.driverAdvanceFuel || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-rose-700 block text-[10px] uppercase">Total Freight</span>
                        <span className="font-mono text-sm">₹{totalFreight.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 pt-8 text-xs font-bold text-center">
                      <div className="border-t border-rose-800 mx-6 pt-1">
                        Driver Signature / Thumb Impression
                      </div>
                      <div className="border-t border-rose-800 mx-6 pt-1">
                        For {profile.companyName || "Keshri Transport"} (Booking Incharge)
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
