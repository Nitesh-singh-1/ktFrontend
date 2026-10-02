"use client";

import React, { useState, useEffect } from "react";
import { VendorRateContractDto, RateType } from "@/types/tms";
import { vendorRateService } from "services/vendorRateService";
import { toast } from "@/context/ToastContext";
import { Truck, X, AlertTriangle } from "lucide-react";

interface VendorRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: VendorRateContractDto | null;
}

const RATE_TYPES: { value: RateType; label: string }[] = [
  { value: RateType.PerTrip, label: "Per Trip / Full Load" },
  { value: RateType.PerTon, label: "Per Ton (MT)" },
  { value: RateType.PerKg, label: "Per Kg" },
  { value: RateType.PerPackage, label: "Per Package" },
  { value: RateType.Fixed, label: "Fixed Lump Sum" },
];

const inputCls =
  "w-full h-10 px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]";
const labelCls = "block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1";

export default function VendorRateModal({ isOpen, onClose, onSaved, initial }: VendorRateModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [vendorName, setVendorName] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [rateType, setRateType] = useState<RateType>(RateType.PerTrip);
  const [hireRate, setHireRate] = useState<string>("");
  const [minGuaranteeAmount, setMinGuaranteeAmount] = useState<string>("");
  const [loadingCharge, setLoadingCharge] = useState<string>("");
  const [unloadingCharge, setUnloadingCharge] = useState<string>("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setVendorName(initial.vendorName || "");
      setFromLocation(initial.fromLocation || "");
      setToLocation(initial.toLocation || "");
      setVehicleType(initial.vehicleType || "");
      setRateType(initial.rateType ?? RateType.PerTrip);
      setHireRate(initial.hireRate != null ? String(initial.hireRate) : "");
      setMinGuaranteeAmount(initial.minGuaranteeAmount != null ? String(initial.minGuaranteeAmount) : "");
      setLoadingCharge(initial.loadingCharge != null ? String(initial.loadingCharge) : "");
      setUnloadingCharge(initial.unloadingCharge != null ? String(initial.unloadingCharge) : "");
      setEffectiveFrom(initial.effectiveFrom || "");
      setEffectiveTo(initial.effectiveTo || "");
      setRemarks(initial.remarks || "");
    } else {
      setVendorName(""); setFromLocation(""); setToLocation(""); setVehicleType("");
      setRateType(RateType.PerTrip); setHireRate(""); setMinGuaranteeAmount("");
      setLoadingCharge(""); setUnloadingCharge(""); setEffectiveFrom(""); setEffectiveTo(""); setRemarks("");
    }
    setError("");
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const num = (v: string) => (v === "" ? 0 : parseFloat(v) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) { setError("Vendor / transporter name is required."); return; }
    if (!fromLocation.trim() || !toLocation.trim()) { setError("Both origin and destination are required."); return; }
    if (num(hireRate) <= 0) { setError("Hire rate must be greater than zero."); return; }
    try {
      setLoading(true);
      setError("");
      const payload: Partial<VendorRateContractDto> = {
        vendorName: vendorName.trim(),
        fromLocation: fromLocation.trim(),
        toLocation: toLocation.trim(),
        vehicleType: vehicleType.trim() || undefined,
        rateType,
        hireRate: num(hireRate),
        minGuaranteeAmount: num(minGuaranteeAmount),
        loadingCharge: num(loadingCharge),
        unloadingCharge: num(unloadingCharge),
        effectiveFrom: effectiveFrom || undefined,
        effectiveTo: effectiveTo || undefined,
        remarks: remarks.trim() || undefined,
      };
      if (initial?.id) {
        await vendorRateService.update(initial.id, payload);
        toast.success("Vendor rate updated.");
      } else {
        await vendorRateService.create(payload);
        toast.success("Vendor rate created.");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Save vendor rate error:", err);
      setError(err?.message || "Failed to save vendor rate contract.");
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
              <span>{initial ? "Edit Vendor Hire Rate" : "New Vendor Hire Rate"}</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">Lorry-hire rate you pay a market vendor/transporter for a route.</p>
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

          <div>
            <label className={labelCls}>Vendor / Transporter *</label>
            <input type="text" required value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="e.g. Shri Balaji Roadlines" className={inputCls} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>From (Origin) *</label>
              <input type="text" required value={fromLocation} onChange={(e) => setFromLocation(e.target.value)} placeholder="e.g. Delhi" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>To (Destination) *</label>
              <input type="text" required value={toLocation} onChange={(e) => setToLocation(e.target.value)} placeholder="e.g. Mumbai" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Vehicle Type</label>
              <input type="text" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="e.g. 32ft Trailer" className={inputCls} />
            </div>
          </div>

          <div className="bg-[#F7F8F8] dark:bg-slate-800/40 p-3.5 rounded-xl border border-[#E5EAEB] dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Rate Basis</label>
              <select value={rateType} onChange={(e) => setRateType(Number(e.target.value) as RateType)} className={`${inputCls} cursor-pointer`}>
                {RATE_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Hire Rate (₹) *</label>
              <input type="number" step="0.01" min="0" value={hireRate} onChange={(e) => setHireRate(e.target.value)} placeholder="0.00" className={`${inputCls} font-mono font-bold`} />
            </div>
            <div>
              <label className={labelCls}>Min Guarantee (₹)</label>
              <input type="number" step="0.01" min="0" value={minGuaranteeAmount} onChange={(e) => setMinGuaranteeAmount(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Loading (₹)</label>
              <input type="number" step="0.01" min="0" value={loadingCharge} onChange={(e) => setLoadingCharge(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Unloading (₹)</label>
              <input type="number" step="0.01" min="0" value={unloadingCharge} onChange={(e) => setUnloadingCharge(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Effective From</label>
              <input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Effective To</label>
              <input type="date" value={effectiveTo} onChange={(e) => setEffectiveTo(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Remarks</label>
            <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes" className={inputCls} />
          </div>

          <div className="pt-4 border-t border-[#E5EAEB] dark:border-slate-800 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Saving…" : initial ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
