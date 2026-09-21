"use client";

import React, { useState, useEffect } from "react";
import { TripDto, TripStatus, TripExpenseType } from "@/types/tms";
import { tripService } from "services/tripService";

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

  useEffect(() => {
    if (isOpen && tripId) {
      loadTrip(tripId);
    } else {
      setTrip(null);
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
      setError(err?.message || "Failed to load trip manifest.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleDispatch = async () => {
    if (!trip) return;
    if (!confirm(`Dispatch Trip ${trip.tripNo}? All loaded consignments will automatically transition to "In Transit".`)) return;

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
        return { text: "IN TRANSIT", class: "bg-blue-100 text-blue-800 border-blue-300" };
      case TripStatus.Arrived:
        return { text: "ARRIVED", class: "bg-purple-100 text-purple-800 border-purple-300" };
      case TripStatus.Completed:
        return { text: "COMPLETED", class: "bg-emerald-100 text-emerald-800 border-emerald-300" };
      case TripStatus.Cancelled:
        return { text: "CANCELLED", class: "bg-red-100 text-red-800 border-red-300" };
      default:
        return { text: "LOADING / DRAFT", class: "bg-amber-100 text-amber-800 border-amber-300" };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="text-xl">🚚</span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Dispatch Trip Manifest: <span className="font-mono text-blue-600">{trip?.tripNo || "Loading..."}</span>
              </h2>
              <p className="text-xs text-slate-500">
                Route: <span className="font-semibold">{trip?.originLocationName || "Origin"}</span> → <span className="font-semibold">{trip?.destinationLocationName || "Destination"}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition">
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="p-16 text-center text-slate-500 text-xs">Loading trip manifest...</div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-xl">{error}</div>
          ) : trip ? (
            <>
              {/* Trip Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Assigned Vehicle</p>
                  <p className="font-mono font-black text-slate-900 text-sm mt-0.5">{trip.vehicleNo}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Assigned Driver</p>
                  <p className="font-bold text-slate-800 mt-0.5">{trip.driverName || "—"}</p>
                  {trip.driverMobile && <p className="text-[10px] text-slate-400 font-mono">{trip.driverMobile}</p>}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Current Status</p>
                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold border rounded-md mt-0.5 ${getStatusBadge(trip.status).class}`}>
                    {getStatusBadge(trip.status).text}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Net Profit Margin</p>
                  <p className="font-mono font-black text-emerald-600 text-sm mt-0.5">
                    ₹{trip.netProfitMargin?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}
                  </p>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                {trip.status === TripStatus.Draft || trip.status === TripStatus.Loading ? (
                  <button
                    onClick={handleDispatch}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>🚀</span>
                    <span>Dispatch Trip (Mark In Transit)</span>
                  </button>
                ) : null}

                {trip.status === TripStatus.Dispatched || trip.status === TripStatus.InTransit ? (
                  <button
                    onClick={handleArrive}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>🏁</span>
                    <span>Mark Hub Arrival (Out For Delivery)</span>
                  </button>
                ) : null}

                <button
                  onClick={() => setShowExpenseForm(!showExpenseForm)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>⛽</span>
                  <span>+ Record On-Road Expense</span>
                </button>
              </div>

              {/* Expense Logging Form */}
              {showExpenseForm && (
                <form onSubmit={handleAddExpense} className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900">Record On-Road Expense (Fuel, Toll, Allowance)</span>
                    <button type="button" onClick={() => setShowExpenseForm(false)} className="text-slate-400 hover:text-slate-600 text-xs">
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Expense Type</label>
                      <select
                        value={expenseType}
                        onChange={(e) => setExpenseType(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
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
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Amount (₹) *</label>
                      <input
                        type="number"
                        required
                        step="any"
                        min="1"
                        placeholder="0.00"
                        value={expenseAmount === 0 ? "" : expenseAmount}
                        onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Receipt / Bill Ref</label>
                      <input
                        type="text"
                        placeholder="e.g. PUMP-892"
                        value={receiptNo}
                        onChange={(e) => setReceiptNo(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Remarks</label>
                      <input
                        type="text"
                        placeholder="e.g. 50L diesel at Varanasi"
                        value={expenseRemarks}
                        onChange={(e) => setExpenseRemarks(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Save Expense Entry
                    </button>
                  </div>
                </form>
              )}

              {/* Loaded Shipments Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Loaded Consignments on Manifest ({trip.shipments?.length || 0})
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Shipment No</th>
                        <th className="py-2.5 px-3">Loaded Weight</th>
                        <th className="py-2.5 px-3">Packages</th>
                        <th className="py-2.5 px-3 text-right">Freight Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {trip.shipments && trip.shipments.length > 0 ? (
                        trip.shipments.map((shp) => (
                          <tr key={shp.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{shp.shipmentNo}</td>
                            <td className="py-2.5 px-3 font-semibold">{shp.loadedWeight} Kg</td>
                            <td className="py-2.5 px-3">{shp.loadedPackages} PKGS</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹{shp.freightAmount}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-400">No consignments loaded on this manifest yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* On-Road Expenses Ledger */}
              {trip.expenses && trip.expenses.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    On-Road Expense Audit Trail
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                    {trip.expenses.map((exp) => (
                      <div key={exp.id} className="p-3 bg-slate-50 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{exp.expenseTypeName || "Expense"}</p>
                          <p className="text-[10px] text-slate-500">{exp.expenseDate ? exp.expenseDate.split("T")[0] : ""} {exp.receiptNo ? `• Ref: ${exp.receiptNo}` : ""} {exp.remarks ? `• ${exp.remarks}` : ""}</p>
                        </div>
                        <div className="text-right font-mono font-bold text-red-600 text-sm">
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
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50/70">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
