"use client";

import React, { useState, useEffect } from "react";
import { RateCardDto, RateType } from "@/types/tms";
import { rateCardService } from "services/rateCardService";
import { toast } from "@/context/ToastContext";
import { IndianRupee, X, AlertTriangle } from "lucide-react";

interface RateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: RateCardDto | null;
}

const RATE_TYPES: { value: RateType; label: string }[] = [
  { value: RateType.PerKg, label: "Per Kg" },
  { value: RateType.PerTon, label: "Per Ton (MT)" },
  { value: RateType.PerPackage, label: "Per Package" },
  { value: RateType.PerTrip, label: "Per Trip / Full Load" },
  { value: RateType.Fixed, label: "Fixed Lump Sum" },
];

const inputCls =
  "w-full h-10 px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]";
const labelCls = "block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1";

export default function RateCardModal({ isOpen, onClose, onSaved, initial }: RateCardModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [partyName, setPartyName] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [commodityType, setCommodityType] = useState("");
  const [rateType, setRateType] = useState<RateType>(RateType.PerKg);
  const [baseRate, setBaseRate] = useState<string>("");
  const [minFreightAmount, setMinFreightAmount] = useState<string>("");
  const [hamaliRatePerKg, setHamaliRatePerKg] = useState<string>("");
  const [doorDeliveryCharge, setDoorDeliveryCharge] = useState<string>("");
  const [stationaryCharge, setStationaryCharge] = useState<string>("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setPartyName(initial.partyName || "");
      setFromLocation(initial.fromLocation || "");
      setToLocation(initial.toLocation || "");
      setCommodityType(initial.commodityType || "");
      setRateType(initial.rateType ?? RateType.PerKg);
      setBaseRate(initial.baseRate != null ? String(initial.baseRate) : "");
      setMinFreightAmount(initial.minFreightAmount != null ? String(initial.minFreightAmount) : "");
      setHamaliRatePerKg(initial.hamaliRatePerKg != null ? String(initial.hamaliRatePerKg) : "");
      setDoorDeliveryCharge(initial.doorDeliveryCharge != null ? String(initial.doorDeliveryCharge) : "");
      setStationaryCharge(initial.stationaryCharge != null ? String(initial.stationaryCharge) : "");
      setEffectiveFrom(initial.effectiveFrom || "");
      setEffectiveTo(initial.effectiveTo || "");
    } else {
      setPartyName(""); setFromLocation(""); setToLocation(""); setCommodityType("");
      setRateType(RateType.PerKg); setBaseRate(""); setMinFreightAmount("");
      setHamaliRatePerKg(""); setDoorDeliveryCharge(""); setStationaryCharge("");
      setEffectiveFrom(""); setEffectiveTo("");
    }
    setError("");
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const num = (v: string) => (v === "" ? 0 : parseFloat(v) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromLocation.trim() || !toLocation.trim()) {
      setError("Both origin and destination are required.");
      return;
    }
    if (num(baseRate) <= 0) {
      setError("Base rate must be greater than zero.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const payload: Partial<RateCardDto> = {
        partyName: partyName.trim() || undefined,
        fromLocation: fromLocation.trim(),
        toLocation: toLocation.trim(),
        commodityType: commodityType.trim() || undefined,
        rateType,
        baseRate: num(baseRate),
        minFreightAmount: num(minFreightAmount),
        hamaliRatePerKg: num(hamaliRatePerKg),
        doorDeliveryCharge: num(doorDeliveryCharge),
        stationaryCharge: num(stationaryCharge),
        effectiveFrom: effectiveFrom || undefined,
        effectiveTo: effectiveTo || undefined,
      };
      if (initial?.id) {
        await rateCardService.updateRateCard(initial.id, payload);
        toast.success("Rate contract updated.");
      } else {
        await rateCardService.createRateCard(payload);
        toast.success("Rate contract created.");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Save rate card error:", err);
      setError(err?.message || "Failed to save rate contract.");
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
              <IndianRupee className="w-4 h-4 text-[#2F8E86]" />
              <span>{initial ? "Edit Rate Contract" : "New Rate Contract"}</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">Define freight tariff for a route — applied automatically during booking.</p>
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
            <label className={labelCls}>Customer / Party</label>
            <input type="text" value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="Leave blank for standard tariff (all customers)" className={inputCls} />
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
              <label className={labelCls}>Commodity</label>
              <input type="text" value={commodityType} onChange={(e) => setCommodityType(e.target.value)} placeholder="Any / specific" className={inputCls} />
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
              <label className={labelCls}>Base Rate (₹) *</label>
              <input type="number" step="0.01" min="0" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} placeholder="0.00" className={`${inputCls} font-mono font-bold`} />
            </div>
            <div>
              <label className={labelCls}>Min Freight (₹)</label>
              <input type="number" step="0.01" min="0" value={minFreightAmount} onChange={(e) => setMinFreightAmount(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Hamali / Kg (₹)</label>
              <input type="number" step="0.01" min="0" value={hamaliRatePerKg} onChange={(e) => setHamaliRatePerKg(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Door Delivery (₹)</label>
              <input type="number" step="0.01" min="0" value={doorDeliveryCharge} onChange={(e) => setDoorDeliveryCharge(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Stationary (₹)</label>
              <input type="number" step="0.01" min="0" value={stationaryCharge} onChange={(e) => setStationaryCharge(e.target.value)} placeholder="0.00" className={inputCls} />
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

          <div className="pt-4 border-t border-[#E5EAEB] dark:border-slate-800 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Saving…" : initial ? "Update Contract" : "Create Contract"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
