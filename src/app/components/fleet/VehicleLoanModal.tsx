"use client";

import React, { useState, useEffect } from "react";
import { VehicleLoanDto } from "@/types/tms";
import { vehicleLoanService } from "services/vehicleLoanService";
import { toast } from "@/context/ToastContext";
import { Landmark, X, AlertTriangle } from "lucide-react";

interface VehicleLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: VehicleLoanDto | null;
}

const inputCls =
  "w-full h-10 px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]";
const labelCls = "block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1";

export default function VehicleLoanModal({ isOpen, onClose, onSaved, initial }: VehicleLoanModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [vehicleNo, setVehicleNo] = useState("");
  const [lender, setLender] = useState("");
  const [loanAccountNo, setLoanAccountNo] = useState("");
  const [principalAmount, setPrincipalAmount] = useState<string>("");
  const [emiAmount, setEmiAmount] = useState<string>("");
  const [tenureMonths, setTenureMonths] = useState<string>("");
  const [emisPaid, setEmisPaid] = useState<string>("");
  const [interestRate, setInterestRate] = useState<string>("");
  const [loanStartDate, setLoanStartDate] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setVehicleNo(initial.vehicleNo || "");
      setLender(initial.lender || "");
      setLoanAccountNo(initial.loanAccountNo || "");
      setPrincipalAmount(initial.principalAmount != null ? String(initial.principalAmount) : "");
      setEmiAmount(initial.emiAmount != null ? String(initial.emiAmount) : "");
      setTenureMonths(initial.tenureMonths != null ? String(initial.tenureMonths) : "");
      setEmisPaid(initial.emisPaid != null ? String(initial.emisPaid) : "");
      setInterestRate(initial.interestRate != null ? String(initial.interestRate) : "");
      setLoanStartDate(initial.loanStartDate || "");
      setNextDueDate(initial.nextDueDate || "");
      setRemarks(initial.remarks || "");
    } else {
      setVehicleNo(""); setLender(""); setLoanAccountNo(""); setPrincipalAmount("");
      setEmiAmount(""); setTenureMonths(""); setEmisPaid(""); setInterestRate("");
      setLoanStartDate(""); setNextDueDate(""); setRemarks("");
    }
    setError("");
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const num = (v: string) => (v === "" ? 0 : parseFloat(v) || 0);
  const int = (v: string) => (v === "" ? 0 : parseInt(v, 10) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lender.trim()) { setError("Lender / financier name is required."); return; }
    try {
      setLoading(true);
      setError("");
      const payload: Partial<VehicleLoanDto> = {
        vehicleNo: vehicleNo.trim().toUpperCase() || undefined,
        lender: lender.trim(),
        loanAccountNo: loanAccountNo.trim() || undefined,
        principalAmount: num(principalAmount),
        emiAmount: num(emiAmount),
        tenureMonths: int(tenureMonths),
        emisPaid: int(emisPaid),
        interestRate: num(interestRate),
        loanStartDate: loanStartDate || undefined,
        nextDueDate: nextDueDate || undefined,
        remarks: remarks.trim() || undefined,
      };
      if (initial?.id) {
        await vehicleLoanService.update(initial.id, payload);
        toast.success("Loan updated.");
      } else {
        await vehicleLoanService.create(payload);
        toast.success("Vehicle loan added.");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Save vehicle loan error:", err);
      setError(err?.message || "Failed to save vehicle loan.");
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
              <Landmark className="w-4 h-4 text-[#2F8E86]" />
              <span>{initial ? "Edit Vehicle Loan" : "Add Vehicle Loan / EMI"}</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">Vehicle finance with EMI schedule and next due date.</p>
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
              <label className={labelCls}>Vehicle No</label>
              <input type="text" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value.toUpperCase())} placeholder="e.g. MH12AB1234" className={`${inputCls} font-mono uppercase`} />
            </div>
            <div>
              <label className={labelCls}>Lender / Financier *</label>
              <input type="text" required value={lender} onChange={(e) => setLender(e.target.value)} placeholder="e.g. HDFC Bank" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Loan A/C No</label>
              <input type="text" value={loanAccountNo} onChange={(e) => setLoanAccountNo(e.target.value)} placeholder="e.g. LN-889201" className={inputCls} />
            </div>
          </div>

          <div className="bg-[#F7F8F8] dark:bg-slate-800/40 p-3.5 rounded-xl border border-[#E5EAEB] dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Principal (₹)</label>
              <input type="number" step="0.01" min="0" value={principalAmount} onChange={(e) => setPrincipalAmount(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>EMI (₹)</label>
              <input type="number" step="0.01" min="0" value={emiAmount} onChange={(e) => setEmiAmount(e.target.value)} placeholder="0.00" className={`${inputCls} font-mono font-bold`} />
            </div>
            <div>
              <label className={labelCls}>Interest %</label>
              <input type="number" step="0.01" min="0" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tenure (months)</label>
              <input type="number" step="1" min="0" value={tenureMonths} onChange={(e) => setTenureMonths(e.target.value)} placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>EMIs Paid</label>
              <input type="number" step="1" min="0" value={emisPaid} onChange={(e) => setEmisPaid(e.target.value)} placeholder="0" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Loan Start Date</label>
              <input type="date" value={loanStartDate} onChange={(e) => setLoanStartDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Next EMI Due</label>
              <input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} className={inputCls} />
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
