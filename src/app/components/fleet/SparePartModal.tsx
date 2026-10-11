"use client";

import React, { useState, useEffect } from "react";
import { SparePartDto } from "@/types/tms";
import { sparePartService } from "services/sparePartService";
import { toast } from "@/context/ToastContext";
import { Cog, X, AlertTriangle } from "lucide-react";

interface SparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: SparePartDto | null;
}

const CATEGORIES = ["Engine", "Electrical", "Tyre & Tube", "Body & Cabin", "Brakes & Suspension", "Filters & Oil", "Consumable", "Other"];
const UNITS = ["pcs", "set", "litre", "kg", "metre", "box"];

const inputCls =
  "w-full h-10 px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]";
const labelCls = "block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1";

export default function SparePartModal({ isOpen, onClose, onSaved, initial }: SparePartModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [partName, setPartName] = useState("");
  const [partNo, setPartNo] = useState("");
  const [category, setCategory] = useState("Engine");
  const [unit, setUnit] = useState("pcs");
  const [stockQuantity, setStockQuantity] = useState<string>("");
  const [reorderLevel, setReorderLevel] = useState<string>("");
  const [unitCost, setUnitCost] = useState<string>("");
  const [storeLocation, setStoreLocation] = useState("");
  const [supplier, setSupplier] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setPartName(initial.partName || "");
      setPartNo(initial.partNo || "");
      setCategory(initial.category || "Engine");
      setUnit(initial.unit || "pcs");
      setStockQuantity(initial.stockQuantity != null ? String(initial.stockQuantity) : "");
      setReorderLevel(initial.reorderLevel != null ? String(initial.reorderLevel) : "");
      setUnitCost(initial.unitCost != null ? String(initial.unitCost) : "");
      setStoreLocation(initial.storeLocation || "");
      setSupplier(initial.supplier || "");
      setRemarks(initial.remarks || "");
    } else {
      setPartName(""); setPartNo(""); setCategory("Engine"); setUnit("pcs");
      setStockQuantity(""); setReorderLevel(""); setUnitCost("");
      setStoreLocation(""); setSupplier(""); setRemarks("");
    }
    setError("");
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const num = (v: string) => (v === "" ? 0 : parseFloat(v) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim()) { setError("Part name is required."); return; }
    try {
      setLoading(true);
      setError("");
      const payload: Partial<SparePartDto> = {
        partName: partName.trim(),
        partNo: partNo.trim() || undefined,
        category: category || undefined,
        unit: unit || undefined,
        stockQuantity: num(stockQuantity),
        reorderLevel: num(reorderLevel),
        unitCost: num(unitCost),
        storeLocation: storeLocation.trim() || undefined,
        supplier: supplier.trim() || undefined,
        remarks: remarks.trim() || undefined,
      };
      if (initial?.id) {
        await sparePartService.update(initial.id, payload);
        toast.success("Spare part updated.");
      } else {
        await sparePartService.create(payload);
        toast.success(`${payload.partName} added to stock.`);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Save spare part error:", err);
      setError(err?.message || "Failed to save spare part.");
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
              <Cog className="w-4 h-4 text-[#2F8E86]" />
              <span>{initial ? `Edit ${initial.partName}` : "Add Spare Part"}</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">Workshop inventory item with stock level and reorder point.</p>
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
            <div className="sm:col-span-2">
              <label className={labelCls}>Part Name *</label>
              <input type="text" required value={partName} onChange={(e) => setPartName(e.target.value)} placeholder="e.g. Air Filter Element" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Part No</label>
              <input type="text" value={partNo} onChange={(e) => setPartNo(e.target.value)} placeholder="e.g. AF-2290" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputCls} cursor-pointer`}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className={`${inputCls} cursor-pointer`}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>In Stock</label>
              <input type="number" step="0.01" min="0" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Reorder At</label>
              <input type="number" step="0.01" min="0" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} placeholder="0" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Unit Cost (₹)</label>
              <input type="number" step="0.01" min="0" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="0.00" className={`${inputCls} font-mono`} />
            </div>
            <div>
              <label className={labelCls}>Store / Rack</label>
              <input type="text" value={storeLocation} onChange={(e) => setStoreLocation(e.target.value)} placeholder="e.g. Rack B-4" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Supplier</label>
              <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="e.g. Bosch Distributor" className={inputCls} />
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
