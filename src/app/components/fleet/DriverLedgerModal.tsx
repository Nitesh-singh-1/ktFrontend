"use client";

import React, { useState, useEffect } from "react";
import { DriverLedgerEntryDto } from "@/types/tms";
import { driverLedgerService } from "services/driverLedgerService";
import { toast } from "@/context/ToastContext";
import { Wallet, X, AlertTriangle } from "lucide-react";

interface DriverLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: DriverLedgerEntryDto | null;
}

const inputCls =
  "w-full h-10 px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]";
const labelCls = "block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1";

export default function DriverLedgerModal({ isOpen, onClose, onSaved, initial }: DriverLedgerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [driverName, setDriverName] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [isAdvance, setIsAdvance] = useState(true);
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setDriverName(initial.driverName || "");
      setEntryDate(initial.entryDate ? initial.entryDate.split("T")[0] : new Date().toISOString().split("T")[0]);
      setIsAdvance(initial.isAdvance);
      setAmount(initial.amount != null ? String(initial.amount) : "");
      setReason(initial.reason || "");
      setRemarks(initial.remarks || "");
    } else {
      setDriverName(""); setEntryDate(new Date().toISOString().split("T")[0]);
      setIsAdvance(true); setAmount(""); setReason(""); setRemarks("");
    }
    setError("");
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim()) { setError("Driver name is required."); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError("Amount must be greater than zero."); return; }
    try {
      setLoading(true);
      setError("");
      const payload: Partial<DriverLedgerEntryDto> = {
        driverName: driverName.trim(),
        entryDate: entryDate || undefined,
        isAdvance,
        amount: amt,
        reason: reason.trim() || undefined,
        remarks: remarks.trim() || undefined,
      };
      if (initial?.id) {
        await driverLedgerService.update(initial.id, payload);
        toast.success("Entry updated.");
      } else {
        await driverLedgerService.create(payload);
        toast.success(`${isAdvance ? "Advance" : "Recovery"} recorded.`);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Save driver ledger error:", err);
      setError(err?.message || "Failed to save entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[#E5EAEB] dark:border-slate-800 w-full max-w-lg overflow-hidden my-6">
        <div className="px-6 py-4 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between bg-[#F7F8F8] dark:bg-slate-800/60">
          <div>
            <h2 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#2F8E86]" />
              <span>{initial ? "Edit Ledger Entry" : "New Driver Entry"}</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">Record a driver advance or a recovery / settlement.</p>
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

          {/* Advance / Recovery toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsAdvance(true)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isAdvance ? "bg-[#FDECEC] text-[#D95C5C] border-[#F4A6A6]" : "bg-white text-[#64748B] border-[#E5EAEB] hover:bg-[#F7F8F8]"
              }`}
            >
              Advance Paid (Debit)
            </button>
            <button
              type="button"
              onClick={() => setIsAdvance(false)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                !isAdvance ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-white text-[#64748B] border-[#E5EAEB] hover:bg-[#F7F8F8]"
              }`}
            >
              Recovery / Settlement (Credit)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Driver Name *</label>
              <input type="text" required value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="e.g. Ramesh Yadav" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Amount (₹) *</label>
              <input type="number" step="0.01" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={`${inputCls} font-mono font-bold`} />
            </div>
            <div>
              <label className={labelCls}>Reason</label>
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Trip advance, Fuel" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Remarks</label>
            <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes" className={inputCls} />
          </div>

          <div className="pt-4 border-t border-[#E5EAEB] dark:border-slate-800 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Saving…" : initial ? "Update" : "Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
