"use client";

import React, { useState, useEffect } from "react";
import { EmptyTripLogDto } from "@/types/tms";
import { emptyTripService } from "services/emptyTripService";
import { toast } from "@/context/ToastContext";
import { Truck, X, AlertTriangle } from "lucide-react";

interface EmptyTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: EmptyTripLogDto | null;
}

const REASONS = ["Return Run", "Repositioning", "Breakdown", "Maintenance", "Other"];

const inputCls =
  "w-full h-10 px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]";
const labelCls = "block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1";

export default function EmptyTripModal({ isOpen, onClose, onSaved, initial }: EmptyTripModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [vehicleNo, setVehicleNo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [tripDate, setTripDate] = useState(new Date().toISOString().split("T")[0]);
  const [distanceKm, setDistanceKm] = useState<string>("");
  const [fuelCost, setFuelCost] = useState<string>("");
  const [reason, setReason] = useState("Return Run");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setVehicleNo(initial.vehicleNo || "");
      setDriverName(initial.driverName || "");
      setFromLocation(initial.fromLocation || "");
      setToLocation(initial.toLocation || "");
      setTripDate(initial.tripDate ? initial.tripDate.split("T")[0] : new Date().toISOString().split("T")[0]);
      setDistanceKm(initial.distanceKm != null ? String(initial.distanceKm) : "");
      setFuelCost(initial.fuelCost != null ? String(initial.fuelCost) : "");
      setReason(initial.reason || "Return Run");
      setRemarks(initial.remarks || "");
    } else {
      setVehicleNo(""); setDriverName(""); setFromLocation(""); setToLocation("");
      setTripDate(new Date().toISOString().split("T")[0]); setDistanceKm(""); setFuelCost("");
      setReason("Return Run"); setRemarks("");
    }
    setError("");
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const num = (v: string) => (v === "" ? 0 : parseFloat(v) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim()) { setError("Vehicle number is required."); return; }
    try {
      setLoading(true);
      setError("");
      const payload: Partial<EmptyTripLogDto> = {
        vehicleNo: vehicleNo.trim().toUpperCase(),
        driverName: driverName.trim() || undefined,
        fromLocation: fromLocation.trim() || undefined,
        toLocation: toLocation.trim() || undefined,
        tripDate: tripDate || undefined,
        distanceKm: num(distanceKm),
        fuelCost: num(fuelCost),
        reason: reason || undefined,
        remarks: remarks.trim() || undefined,
      };
      if (initial?.id) {
        await emptyTripService.update(initial.id, payload);
        toast.success("Empty trip updated.");
      } else {
        await emptyTripService.create(payload);
        toast.success("Empty trip logged.");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Save empty trip error:", err);
      setError(err?.message || "Failed to save empty trip.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[#E5EAEB] dark:border-slate-800 w-full max-w-2xl overflow-hidden my-6">
        <div className="px-6 py-4 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between bg-[#F7F8F8] dark:bg-slate-800/60">
          <div>
            <h2 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#2F8E86]" />
              <span>{initial ? "Edit Empty Trip" : "Log Empty Trip"}</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">Record a deadhead / empty run and its running cost.</p>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#111827] dark:hover:text-white p-1.5 rounded-lg transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" /> <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Vehicle No *</label>
              <input type="text" required value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value.toUpperCase())} placeholder="e.g. MH12AB1234" className={`${inputCls} font-mono uppercase`} />
            </div>
            <div>
              <label className={labelCls}>Driver</label>
              <input type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Driver name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={tripDate} onChange={(e) => setTripDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>From (Origin)</label>
              <input type="text" value={fromLocation} onChange={(e) => setFromLocation(e.target.value)} placeholder="e.g. Mumbai" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>To (Destination)</label>
              <input type="text" value={toLocation} onChange={(e) => setToLocation(e.target.value)} placeholder="e.g. Pune" className={inputCls} />
            </div>
          </div>

          <div className="bg-[#F7F8F8] dark:bg-slate-800/40 p-3.5 rounded-xl border border-[#E5EAEB] dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Distance (km)</label>
              <input type="number" step="0.1" min="0" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fuel / Run Cost (₹)</label>
              <input type="number" step="0.01" min="0" value={fuelCost} onChange={(e) => setFuelCost(e.target.value)} placeholder="0.00" className={`${inputCls} font-mono`} />
            </div>
            <div>
              <label className={labelCls}>Reason</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputCls} cursor-pointer`}>
                {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Remarks</label>
            <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes" className={inputCls} />
          </div>

          <div className="pt-4 border-t border-[#E5EAEB] dark:border-slate-800 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Saving…" : initial ? "Update" : "Log Trip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
