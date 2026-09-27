"use client";

import React, { useState, useEffect } from "react";
import { TyreDto, TyreStatus } from "@/types/tms";
import { tyreService } from "services/tyreService";
import { toast } from "@/context/ToastContext";
import { CircleDot, X, AlertTriangle } from "lucide-react";

interface TyreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: TyreDto | null;
}

const STATUS_OPTIONS: { value: TyreStatus; label: string }[] = [
  { value: TyreStatus.InStock, label: "In Stock" },
  { value: TyreStatus.Fitted, label: "Fitted on Vehicle" },
  { value: TyreStatus.UnderRetread, label: "Under Retread" },
  { value: TyreStatus.Scrapped, label: "Scrapped / Disposed" },
];

const inputCls =
  "w-full h-10 px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]";
const labelCls = "block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1";

export default function TyreModal({ isOpen, onClose, onSaved, initial }: TyreModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [serialNo, setSerialNo] = useState("");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState<TyreStatus>(TyreStatus.InStock);
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchaseCost, setPurchaseCost] = useState<string>("");
  const [purchaseOdometer, setPurchaseOdometer] = useState<string>("");
  const [currentOdometer, setCurrentOdometer] = useState<string>("");
  const [retreadCount, setRetreadCount] = useState<string>("");
  const [disposalDate, setDisposalDate] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setSerialNo(initial.serialNo || "");
      setBrand(initial.brand || "");
      setSize(initial.size || "");
      setVehicleNo(initial.vehicleNo || "");
      setPosition(initial.position || "");
      setStatus(initial.status ?? TyreStatus.InStock);
      setPurchaseDate(initial.purchaseDate || "");
      setPurchaseCost(initial.purchaseCost != null ? String(initial.purchaseCost) : "");
      setPurchaseOdometer(initial.purchaseOdometer != null ? String(initial.purchaseOdometer) : "");
      setCurrentOdometer(initial.currentOdometer != null ? String(initial.currentOdometer) : "");
      setRetreadCount(initial.retreadCount != null ? String(initial.retreadCount) : "");
      setDisposalDate(initial.disposalDate || "");
      setRemarks(initial.remarks || "");
    } else {
      setSerialNo(""); setBrand(""); setSize(""); setVehicleNo(""); setPosition("");
      setStatus(TyreStatus.InStock); setPurchaseDate(""); setPurchaseCost("");
      setPurchaseOdometer(""); setCurrentOdometer(""); setRetreadCount(""); setDisposalDate(""); setRemarks("");
    }
    setError("");
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const num = (v: string) => (v === "" ? 0 : parseFloat(v) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNo.trim()) { setError("Tyre serial number is required."); return; }
    try {
      setLoading(true);
      setError("");
      const payload: Partial<TyreDto> = {
        serialNo: serialNo.trim().toUpperCase(),
        brand: brand.trim() || undefined,
        size: size.trim() || undefined,
        vehicleNo: vehicleNo.trim().toUpperCase() || undefined,
        position: position.trim() || undefined,
        status,
        purchaseDate: purchaseDate || undefined,
        purchaseCost: num(purchaseCost),
        purchaseOdometer: num(purchaseOdometer),
        currentOdometer: num(currentOdometer),
        retreadCount: retreadCount ? parseInt(retreadCount, 10) || 0 : 0,
        disposalDate: status === TyreStatus.Scrapped ? (disposalDate || undefined) : undefined,
        remarks: remarks.trim() || undefined,
      };
      if (initial?.id) {
        await tyreService.update(initial.id, payload);
        toast.success("Tyre updated.");
      } else {
        await tyreService.create(payload);
        toast.success(`Tyre ${payload.serialNo} added.`);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Save tyre error:", err);
      setError(err?.message || "Failed to save tyre.");
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
              <CircleDot className="w-4 h-4 text-[#2F8E86]" />
              <span>{initial ? `Edit Tyre ${initial.serialNo}` : "Add New Tyre"}</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">Track tyre lifecycle — stock, fitment, retread and disposal.</p>
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
              <label className={labelCls}>Serial No *</label>
              <input type="text" required value={serialNo} onChange={(e) => setSerialNo(e.target.value.toUpperCase())} placeholder="e.g. MRF-2024-8891" className={`${inputCls} font-mono uppercase`} />
            </div>
            <div>
              <label className={labelCls}>Brand</label>
              <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. MRF, Apollo" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Size</label>
              <input type="text" value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. 10.00 R20" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Status</label>
              <select value={status} onChange={(e) => setStatus(Number(e.target.value) as TyreStatus)} className={`${inputCls} cursor-pointer`}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Fitted Vehicle No</label>
              <input type="text" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value.toUpperCase())} placeholder="e.g. MH12AB1234" className={`${inputCls} font-mono uppercase`} />
            </div>
            <div>
              <label className={labelCls}>Position</label>
              <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Rear-Left-Outer" className={inputCls} />
            </div>
          </div>

          <div className="bg-[#F7F8F8] dark:bg-slate-800/40 p-3.5 rounded-xl border border-[#E5EAEB] dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Purchase Date</label>
              <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Cost (₹)</label>
              <input type="number" step="0.01" min="0" value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fit Odometer (km)</label>
              <input type="number" step="1" min="0" value={purchaseOdometer} onChange={(e) => setPurchaseOdometer(e.target.value)} placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Current Odometer</label>
              <input type="number" step="1" min="0" value={currentOdometer} onChange={(e) => setCurrentOdometer(e.target.value)} placeholder="0" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Retread Count</label>
              <input type="number" step="1" min="0" value={retreadCount} onChange={(e) => setRetreadCount(e.target.value)} placeholder="0" className={inputCls} />
            </div>
            {status === TyreStatus.Scrapped && (
              <div>
                <label className={labelCls}>Disposal Date</label>
                <input type="date" value={disposalDate} onChange={(e) => setDisposalDate(e.target.value)} className={inputCls} />
              </div>
            )}
            <div className={status === TyreStatus.Scrapped ? "" : "sm:col-span-2"}>
              <label className={labelCls}>Remarks</label>
              <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes" className={inputCls} />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5EAEB] dark:border-slate-800 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Saving…" : initial ? "Update Tyre" : "Add Tyre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
