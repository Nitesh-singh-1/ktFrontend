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
        return { text: "PAID", class: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800" };
      case InvoicePaymentStatus.PartiallyPaid:
        return { text: "PARTIALLY PAID", class: "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800" };
      case InvoicePaymentStatus.Cancelled:
        return { text: "CANCELLED", class: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800" };
      default:
        return { text: "UNPAID", class: "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800" };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Top Modal Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Invoice Breakdown: <span className="font-mono text-blue-600 dark:text-blue-400">{invoice?.invoiceNo || "Loading..."}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Official Freight Bill & Accounts Receivable Breakdown</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="p-16 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Loading invoice details...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs font-semibold">
              {error}
            </div>
          ) : invoice ? (
            <>
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Billed To (Customer):</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{invoice.partyName || invoice.party?.name}</p>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    GSTIN: <span className="font-mono font-semibold">{invoice.partyGstNo || invoice.party?.gstNo || "N/A"}</span>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">{invoice.partyAddress || invoice.party?.address || "—"}</p>
                </div>

                <div className="text-right space-y-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 mr-2">Status:</span>
                    <span
                      className={`inline-flex px-2 py-0.5 text-[10px] font-bold border rounded-md ${
                        getStatusBadge(invoice.paymentStatus).class
                      }`}
                    >
                      {getStatusBadge(invoice.paymentStatus).text}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Invoice Date: <span className="font-bold text-slate-800 dark:text-slate-200">{invoice.invoiceDate ? invoice.invoiceDate.split("T")[0] : "—"}</span>
                  </p>
                  {invoice.dueDate && (
                    <p className="text-slate-600 dark:text-slate-400">
                      Due Date: <span className="font-bold text-slate-800 dark:text-slate-200">{invoice.dueDate.split("T")[0]}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Invoice Items
                </h3>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Shipment Ref</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Rate</th>
                        <th className="py-2.5 px-3 text-right">Tax Rate</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(invoice.items && invoice.items.length > 0) ? (
                        invoice.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{it.description}</td>
                            <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400">{it.shipmentNo || "—"}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200">{it.quantity}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">₹{it.rate}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">{it.taxRate ? `${it.taxRate}%` : "—"}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              ₹{(it.quantity * it.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400">
                            Standard Freight Charges
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Ledger Breakdown */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-end">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">₹{invoice.subTotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>GST ({invoice.taxRate}%):</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">₹{invoice.taxAmount}</span>
                  </div>
                  {invoice.otherCharges > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Other Charges:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">₹{invoice.otherCharges}</span>
                    </div>
                  )}
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Discount:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">- ₹{invoice.discount}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-slate-900 dark:text-white text-sm">
                    <span>Grand Total:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">₹{invoice.grandTotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 pt-1">
                    <span>Paid Amount:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{invoice.paidAmount}</span>
                  </div>
                  <div className="flex justify-between font-bold text-amber-700 dark:text-amber-400">
                    <span>Outstanding Balance:</span>
                    <span className="font-mono">₹{invoice.balanceAmount}</span>
                  </div>
                </div>
              </div>

              {/* Payments Ledger Trail */}
              {invoice.payments && invoice.payments.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Payment Receipts Log
                  </h3>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {invoice.payments.map((pmt) => (
                      <div key={pmt.id} className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{pmt.paymentMode}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {pmt.paymentDate ? pmt.paymentDate.split("T")[0] : ""} {pmt.referenceNo ? `• Ref: ${pmt.referenceNo}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">+ ₹{pmt.amount}</p>
                          <p className="text-[10px] text-slate-400">{pmt.createdByName || "Cashier"}</p>
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
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          {invoice && invoice.balanceAmount > 0 && onRecordPayment ? (
            <button
              onClick={() => {
                onClose();
                onRecordPayment(invoice);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Payment (₹{invoice.balanceAmount} due)</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
