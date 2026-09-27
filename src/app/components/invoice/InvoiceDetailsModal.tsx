"use client";

import React, { useState, useEffect } from "react";
import { Invoice, InvoicePaymentStatus } from "@/types/shipment";
import { invoiceService } from "services/invoiceService";
import { FileText, Printer, X, CreditCard } from "lucide-react";

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: number | null;
  onRecordPayment?: (inv: Invoice) => void;
}

export default function InvoiceDetailsModal({
  isOpen,
  onClose,
  invoiceId,
  onRecordPayment,
}: InvoiceDetailsModalProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && invoiceId) {
      fetchInvoice(invoiceId);
    } else {
      setInvoice(null);
    }
  }, [isOpen, invoiceId]);

  const fetchInvoice = async (id: number) => {
    try {
      setLoading(true);
      setError("");
      const res = await invoiceService.getInvoiceById(id);
      setInvoice(res);
    } catch (err: any) {
      console.error("Fetch invoice details error:", err);
      setError(err?.message || "Failed to load invoice details.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: InvoicePaymentStatus) => {
    switch (status) {
      case InvoicePaymentStatus.Paid:
        return { text: "PAID", class: "bg-[#E7F1F2] text-[#2F9E8F] border-[#2F9E8F]/30" };
      case InvoicePaymentStatus.PartiallyPaid:
        return { text: "PARTIALLY PAID", class: "bg-[#F0F7FF] text-[#4A90E2] border-[#D0E2FF]" };
      case InvoicePaymentStatus.Cancelled:
        return { text: "CANCELLED", class: "bg-red-50 text-[#D95C5C] border-red-200" };
      default:
        return { text: "UNPAID", class: "bg-[#FDF3E7] text-[#B76E32] border-[#F4A261]/30" };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E5EAEB] w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Top Modal Bar */}
        <div className="px-6 py-4 border-b border-[#E5EAEB] flex items-center justify-between bg-[#F7F8F8]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E7F1F2] flex items-center justify-center text-[#2F8E86]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">
                Invoice Breakdown: <span className="font-mono text-[#2F8E86]">{invoice?.invoiceNo || "Loading..."}</span>
              </h2>
              <p className="text-xs text-[#64748B]">Official Freight Bill & Accounts Receivable Breakdown</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white border border-[#D9E2E3] hover:bg-[#E7F1F2] text-[#25776F] font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#94A3B8] hover:text-[#111827] p-1.5 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="p-16 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F8E86] mx-auto mb-3" />
              <p className="text-xs text-[#64748B] font-medium">Loading invoice details...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[#D95C5C] text-xs font-semibold">
              {error}
            </div>
          ) : invoice ? (
            <>
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#F7F8F8] rounded-xl border border-[#E5EAEB] text-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#64748B]">Billed To (Customer):</p>
                  <p className="font-bold text-[#111827] text-sm mt-0.5">{invoice.partyName || invoice.party?.name}</p>
                  <p className="text-[#64748B] mt-0.5">
                    GSTIN: <span className="font-mono font-semibold">{invoice.partyGstNo || invoice.party?.gstNo || "N/A"}</span>
                  </p>
                  <p className="text-[#94A3B8] mt-0.5">{invoice.partyAddress || invoice.party?.address || "—"}</p>
                </div>

                <div className="text-right space-y-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#64748B] mr-2">Status:</span>
                    <span
                      className={`inline-flex px-2 py-0.5 text-[10px] font-bold border rounded-md ${
                        getStatusBadge(invoice.paymentStatus).class
                      }`}
                    >
                      {getStatusBadge(invoice.paymentStatus).text}
                    </span>
                  </div>
                  <p className="text-[#64748B]">
                    Invoice Date: <span className="font-bold text-[#111827]">{invoice.invoiceDate ? invoice.invoiceDate.split("T")[0] : "—"}</span>
                  </p>
                  {invoice.dueDate && (
                    <p className="text-[#64748B]">
                      Due Date: <span className="font-bold text-[#111827]">{invoice.dueDate.split("T")[0]}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                  Invoice Items
                </h3>
                <div className="border border-[#E5EAEB] rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F7F8F8] border-b border-[#E5EAEB] text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Shipment Ref</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Rate</th>
                        <th className="py-2.5 px-3 text-right">Tax Rate</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5EAEB]">
                      {(invoice.items && invoice.items.length > 0) ? (
                        invoice.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-[#F5FAFA]">
                            <td className="py-2.5 px-3 font-semibold text-[#111827]">{it.description}</td>
                            <td className="py-2.5 px-3 font-mono text-[#2F8E86]">{it.shipmentNo || "—"}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-[#111827]">{it.quantity}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#111827]">₹{it.rate}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#64748B]">{it.taxRate ? `${it.taxRate}%` : "—"}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[#111827]">
                              ₹{(it.quantity * it.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-[#94A3B8]">
                            Standard Freight Charges
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Ledger Breakdown */}
              <div className="p-4 bg-[#F7F8F8] rounded-xl border border-[#E5EAEB] flex justify-end">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-[#64748B]">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold text-[#111827]">₹{invoice.subTotal}</span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>GST ({invoice.taxRate}%):</span>
                    <span className="font-mono font-bold text-[#111827]">₹{invoice.taxAmount}</span>
                  </div>
                  {invoice.otherCharges > 0 && (
                    <div className="flex justify-between text-[#64748B]">
                      <span>Other Charges:</span>
                      <span className="font-mono font-bold text-[#111827]">₹{invoice.otherCharges}</span>
                    </div>
                  )}
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-[#64748B]">
                      <span>Discount:</span>
                      <span className="font-mono font-bold text-[#2F9E8F]">- ₹{invoice.discount}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-[#E5EAEB] flex justify-between font-black text-[#111827] text-sm">
                    <span>Grand Total:</span>
                    <span className="font-mono text-[#2F8E86]">₹{invoice.grandTotal}</span>
                  </div>
                  <div className="flex justify-between text-[#64748B] pt-1">
                    <span>Paid Amount:</span>
                    <span className="font-mono font-bold text-[#2F9E8F]">₹{invoice.paidAmount}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#F4A261]">
                    <span>Outstanding Balance:</span>
                    <span className="font-mono">₹{invoice.balanceAmount}</span>
                  </div>
                </div>
              </div>

              {/* Payments Ledger Trail */}
              {invoice.payments && invoice.payments.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                    Payment Receipts Log
                  </h3>
                  <div className="border border-[#E5EAEB] rounded-xl overflow-hidden divide-y divide-[#E5EAEB] text-xs">
                    {invoice.payments.map((pmt) => (
                      <div key={pmt.id} className="p-3 bg-[#E7F1F2]/50 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[#111827]">{pmt.paymentMode}</p>
                          <p className="text-[10px] text-[#64748B]">
                            {pmt.paymentDate ? pmt.paymentDate.split("T")[0] : ""} {pmt.referenceNo ? `• Ref: ${pmt.referenceNo}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-[#2F9E8F] text-sm">+ ₹{pmt.amount}</p>
                          <p className="text-[10px] text-[#94A3B8]">{pmt.createdByName || "Cashier"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E5EAEB] flex items-center justify-between bg-[#F7F8F8]">
          {invoice && invoice.balanceAmount > 0 && onRecordPayment ? (
            <button
              onClick={() => {
                onClose();
                onRecordPayment(invoice);
              }}
              className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Payment (₹{invoice.balanceAmount} due)</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#D9E2E3] hover:bg-[#E7F1F2] text-[#25776F] font-bold rounded-lg text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
