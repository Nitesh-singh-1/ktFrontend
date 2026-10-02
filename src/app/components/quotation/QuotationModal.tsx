"use client";

import React, { useState, useEffect } from "react";
import { Quotation } from "@/types/quotation";
import { quotationService } from "services/quotationService";
import { toast } from "@/context/ToastContext";
import { FileText, X, AlertTriangle } from "lucide-react";

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Quotation | null;
}

const RATE_BASIS = ["Per Kg", "Per MT", "Per Trip", "Fixed"];
const VEHICLE_TYPES = ["Open Body Truck", "Closed Container", "Trailer / 40ft", "Mini Truck / LCV", "Tanker", "Reefer"];

const inputCls =
  "w-full h-10 px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]";
const labelCls = "block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1";

export default function QuotationModal({ isOpen, onClose, onSaved, initial }: QuotationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [partyName, setPartyName] = useState("");
  const [partyMobile, setPartyMobile] = useState("");
  const [partyGstNo, setPartyGstNo] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [goodsDescription, setGoodsDescription] = useState("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [ratePerUnit, setRatePerUnit] = useState<string>("");
  const [rateBasis, setRateBasis] = useState("Per Kg");
  const [estimatedFreight, setEstimatedFreight] = useState<string>("");
  const [validUntil, setValidUntil] = useState("");
  const [terms, setTerms] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setPartyName(initial.partyName || "");
      setPartyMobile(initial.partyMobile || "");
      setPartyGstNo(initial.partyGstNo || "");
      setFromLocation(initial.fromLocation || "");
      setToLocation(initial.toLocation || "");
      setVehicleType(initial.vehicleType || "");
      setGoodsDescription(initial.goodsDescription || "");
      setWeightKg(initial.weightKg != null ? String(initial.weightKg) : "");
      setRatePerUnit(initial.ratePerUnit != null ? String(initial.ratePerUnit) : "");
      setRateBasis(initial.rateBasis || "Per Kg");
      setEstimatedFreight(initial.estimatedFreight != null ? String(initial.estimatedFreight) : "");
      setValidUntil(initial.validUntil || "");
      setTerms(initial.terms || "");
      setNotes(initial.notes || "");
    } else {
      setPartyName(""); setPartyMobile(""); setPartyGstNo("");
      setFromLocation(""); setToLocation(""); setVehicleType("");
      setGoodsDescription(""); setWeightKg(""); setRatePerUnit("");
      setRateBasis("Per Kg"); setEstimatedFreight(""); setValidUntil("");
      setTerms(""); setNotes("");
    }
    setError("");
  }, [isOpen, initial]);

  // Auto-suggest freight from weight × rate for per-kg / per-MT basis.
  useEffect(() => {
    const w = parseFloat(weightKg);
    const r = parseFloat(ratePerUnit);
    if (!isNaN(w) && !isNaN(r) && (rateBasis === "Per Kg" || rateBasis === "Per MT")) {
      setEstimatedFreight((w * r).toFixed(2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightKg, ratePerUnit, rateBasis]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName.trim()) {
      setError("Customer / party name is required.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const payload: Partial<Quotation> = {
        partyName: partyName.trim(),
        partyMobile: partyMobile.trim() || undefined,
        partyGstNo: partyGstNo.trim().toUpperCase() || undefined,
        fromLocation: fromLocation.trim() || undefined,
        toLocation: toLocation.trim() || undefined,
        vehicleType: vehicleType.trim() || undefined,
        goodsDescription: goodsDescription.trim() || undefined,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        ratePerUnit: ratePerUnit ? parseFloat(ratePerUnit) : undefined,
        rateBasis: rateBasis || undefined,
        estimatedFreight: estimatedFreight ? parseFloat(estimatedFreight) : 0,
        validUntil: validUntil || undefined,
        terms: terms.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      if (initial?.id) {
        await quotationService.updateQuotation(initial.id, payload);
        toast.success("Quotation updated.");
      } else {
        const created = await quotationService.createQuotation(payload);
        toast.success(`Quotation ${created.quoteNo} created.`);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Save quotation error:", err);
      setError(err?.message || "Failed to save quotation.");
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
              <FileText className="w-4 h-4 text-[#2F8E86]" />
              <span>{initial ? `Edit Quotation ${initial.quoteNo}` : "New Freight Quotation"}</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">Prepare a freight rate quote for a customer enquiry.</p>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#111827] dark:hover:text-white p-1.5 rounded-lg transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className={labelCls}>Customer / Party *</label>
              <input type="text" required value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="e.g. Bharat Traders" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Mobile</label>
              <input type="tel" maxLength={10} value={partyMobile} onChange={(e) => setPartyMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>GSTIN</label>
              <input type="text" value={partyGstNo} onChange={(e) => setPartyGstNo(e.target.value.toUpperCase())} placeholder="Optional" className={`${inputCls} uppercase`} />
            </div>
          </div>

          {/* Route + vehicle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>From (Origin)</label>
              <input type="text" value={fromLocation} onChange={(e) => setFromLocation(e.target.value)} placeholder="e.g. Delhi" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>To (Destination)</label>
              <input type="text" value={toLocation} onChange={(e) => setToLocation(e.target.value)} placeholder="e.g. Mumbai" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Vehicle Type</label>
              <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={`${inputCls} cursor-pointer`}>
                <option value="">-- Any --</option>
                {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Goods / Commodity</label>
            <input type="text" value={goodsDescription} onChange={(e) => setGoodsDescription(e.target.value)} placeholder="e.g. FMCG cartons, steel coils…" className={inputCls} />
          </div>

          {/* Rate + freight */}
          <div className="bg-[#F7F8F8] dark:bg-slate-800/40 p-3.5 rounded-xl border border-[#E5EAEB] dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Weight</label>
              <input type="number" step="0.01" min="0" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="Kg" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Rate</label>
              <input type="number" step="0.01" min="0" value={ratePerUnit} onChange={(e) => setRatePerUnit(e.target.value)} placeholder="₹ / unit" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Basis</label>
              <select value={rateBasis} onChange={(e) => setRateBasis(e.target.value)} className={`${inputCls} cursor-pointer`}>
                {RATE_BASIS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Est. Freight (₹)</label>
              <input type="number" step="0.01" min="0" value={estimatedFreight} onChange={(e) => setEstimatedFreight(e.target.value)} placeholder="0.00" className={`${inputCls} font-mono font-bold`} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Valid Until</label>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Terms</label>
              <input type="text" value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="e.g. Payment 15 days, loading extra" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Internal Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Follow-up remarks, competitor rate, etc." className={`${inputCls} h-auto py-2`} />
          </div>

          <div className="pt-4 border-t border-[#E5EAEB] dark:border-slate-800 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Saving…" : initial ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
