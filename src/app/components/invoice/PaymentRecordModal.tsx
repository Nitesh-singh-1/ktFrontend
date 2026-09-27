"use client";

import React, { useState } from "react";
import { Invoice, RecordPaymentRequest } from "@/types/shipment";
import { invoiceService } from "services/invoiceService";
import { CreditCard, X } from "lucide-react";

interface PaymentRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  invoice: Invoice | null;
}

export default function PaymentRecordModal({
  isOpen,
  onClose,
  onSaved,
  invoice,
}: PaymentRecordModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [amount, setAmount] = useState<number>(invoice?.balanceAmount || 0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState("Bank Transfer / NEFT");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");

  // Update amount if invoice changes
  React.useEffect(() => {
    if (invoice) {
      setAmount(invoice.balanceAmount || 0);
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setReferenceNo("");
      setNotes("");
      setError("");
    }
  }, [invoice, isOpen]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError("Please enter a valid payment amount greater than 0.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload: RecordPaymentRequest = {
        amount: Number(amount),
        paymentDate,
        paymentMode,
        referenceNo: referenceNo.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await invoiceService.recordPayment(invoice.id, payload);
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Record payment error:", err);
      setError(err?.message || "Failed to record payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E5EAEB] w-full max-w-lg overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5EAEB] flex items-center justify-between bg-[#F7F8F8]">
          <div>
            <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#47868C]" /> Record Payment Receipt
            </h2>
            <p className="text-xs text-[#64748B]">
              Invoice <span className="font-mono font-bold text-[#47868C]">{invoice.invoiceNo}</span> • {invoice.partyName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#111827] p-1.5 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[#D95C5C] text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Invoice Balances Banner */}
          <div className="bg-[#F7F8F8] p-3.5 rounded-xl border border-[#E5EAEB] grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-[#64748B] text-[10px] font-bold">Total Invoiced</p>
              <p className="font-mono font-bold text-[#111827] mt-0.5">₹{invoice.grandTotal}</p>
            </div>
            <div>
              <p className="text-[#64748B] text-[10px] font-bold">Already Paid</p>
              <p className="font-mono font-bold text-[#2F9E8F] mt-0.5">₹{invoice.paidAmount}</p>
            </div>
            <div>
              <p className="text-[#64748B] text-[10px] font-bold">Outstanding</p>
              <p className="font-mono font-bold text-[#4A90E2] mt-0.5">₹{invoice.balanceAmount}</p>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] mb-1">
              Received Payment Amount (₹) *
            </label>
            <input
              type="number"
              step="any"
              min="1"
              max={invoice.balanceAmount || undefined}
              required
              value={amount === 0 ? "" : amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white border border-[#D9E2E3] rounded-lg text-sm font-mono font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C]"
            />
          </div>

          {/* Date & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#64748B] mb-1">
                Receipt Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#64748B] mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 border border-[#D9E2E3] rounded-lg text-xs font-semibold bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C]"
              >
                <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                <option value="UPI / Online">UPI / Online</option>
                <option value="Cheque / DD">Cheque / Demand Draft</option>
                <option value="Cash">Cash Receipt</option>
                <option value="TDS / Adjustment">TDS / Ledger Adjustment</option>
              </select>
            </div>
          </div>

          {/* Reference / UTR */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] mb-1">
              Transaction Ref / UTR / Cheque No
            </label>
            <input
              type="text"
              placeholder="e.g. UTR1948205820"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-mono font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] mb-1">
              Notes / Receipt Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Received full settlement against bill"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E5EAEB] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#D9E2E3] hover:bg-[#E7F1F2] text-[#3F7C82] font-bold rounded-lg text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#47868C] hover:bg-[#3F7C82] text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Recording..." : "Record Payment Receipt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
