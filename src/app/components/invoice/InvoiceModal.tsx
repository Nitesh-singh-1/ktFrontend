"use client";

import React, { useState, useEffect } from "react";
import {
  Invoice,
  CreateInvoiceRequest,
  PartyLookupItem,
  Shipment,
} from "@/types/shipment";
import { invoiceService } from "services/invoiceService";
import { partyService } from "services/partyService";
import { shipmentService } from "services/shipmentService";
import SearchableSelect from "../ui/SearchableSelect";
import { Receipt, X, Package, Plus } from "lucide-react";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface InvoiceFormItem {
  shipmentId?: number;
  shipmentNo?: string;
  description: string;
  quantity: number;
  rate: number;
  taxRate: number;
  totalAmount: number;
}

export default function InvoiceModal({ isOpen, onClose, onSaved }: InvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form Fields
  const [selectedParty, setSelectedParty] = useState<PartyLookupItem | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [globalTaxRate, setGlobalTaxRate] = useState<number>(18);
  const [discount, setDiscount] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const [remarks, setRemarks] = useState("");

  // Line items
  const [items, setItems] = useState<InvoiceFormItem[]>([
    { description: "Freight Charges", quantity: 1, rate: 0, taxRate: 18, totalAmount: 0 },
  ]);

  // Available shipments to link
  const [availableShipments, setAvailableShipments] = useState<Shipment[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchUnbilledShipments();
    }
  }, [isOpen]);

  const resetForm = () => {
    setSelectedParty(null);
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setDueDate("");
    setGlobalTaxRate(18);
    setDiscount(0);
    setOtherCharges(0);
    setPaidAmount(0);
    setPaymentMode("Cash");
    setRemarks("");
    setItems([{ description: "Freight Charges", quantity: 1, rate: 0, taxRate: 18, totalAmount: 0 }]);
    setError("");
  };

  const fetchUnbilledShipments = async () => {
    try {
      setLoadingShipments(true);
      const res = await shipmentService.getShipments({ pageSize: 30 });
      if (res.success && res.data) {
        setAvailableShipments(res.data);
      }
    } catch (err) {
      console.error("Fetch shipments error:", err);
    } finally {
      setLoadingShipments(false);
    }
  };

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      { description: "", quantity: 1, rate: 0, taxRate: globalTaxRate, totalAmount: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceFormItem, value: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    const qty = Number(current.quantity) || 0;
    const rate = Number(current.rate) || 0;
    current.totalAmount = qty * rate;

    updated[index] = current;
    setItems(updated);
  };

  const handleLinkShipment = (shipment: Shipment) => {
    // Check if already linked
    if (items.some((it) => it.shipmentId === shipment.id)) {
      alert(`Consignment ${shipment.shipmentNo} is already linked.`);
      return;
    }

    const desc = `Freight: ${shipment.fromLocation || "Origin"} to ${shipment.toLocation || "Dest"} (${shipment.shipmentNo})`;
    const freightAmount = shipment.totalFreight || shipment.grandTotal || 0;

    setItems([
      ...items.filter((it) => it.rate > 0 || it.description !== "Freight Charges"),
      {
        shipmentId: shipment.id,
        shipmentNo: shipment.shipmentNo,
        description: desc,
        quantity: 1,
        rate: freightAmount,
        taxRate: globalTaxRate,
        totalAmount: freightAmount,
      },
    ]);
  };

  // Calculations
  const subTotal = items.reduce((acc, it) => acc + (Number(it.totalAmount) || 0), 0);
  const taxAmount = (subTotal * (Number(globalTaxRate) || 0)) / 100;
  const grandTotal = Math.max(0, subTotal + taxAmount + (Number(otherCharges) || 0) - (Number(discount) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty) {
      setError("Please select a Customer / Billing Party.");
      return;
    }

    if (items.length === 0 || subTotal <= 0) {
      setError("Please add at least one line item with a positive rate.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const shipmentIdsToLink = items
        .map((it) => it.shipmentId)
        .filter((id): id is number => typeof id === "number");

      const payload: CreateInvoiceRequest = {
        invoiceDate,
        dueDate: dueDate || undefined,
        partyId: selectedParty.id,
        taxRate: Number(globalTaxRate) || 0,
        discount: Number(discount) || 0,
        otherCharges: Number(otherCharges) || 0,
        paidAmount: Number(paidAmount) || 0,
        paymentMode: Number(paidAmount) > 0 ? paymentMode : undefined,
        remarks: remarks.trim() || undefined,
        shipmentIdsToLink: shipmentIdsToLink.length > 0 ? shipmentIdsToLink : undefined,
        items: items.map((it) => ({
          shipmentId: it.shipmentId,
          shipmentNo: it.shipmentNo,
          description: it.description || "Freight charges",
          quantity: Number(it.quantity) || 1,
          rate: Number(it.rate) || 0,
          taxRate: Number(it.taxRate) || Number(globalTaxRate) || 0,
        })),
      };

      const res = await invoiceService.createInvoice(payload);
      if (res.success || res.data) {
        onSaved();
        onClose();
      } else {
        setError(res.message || "Failed to generate freight invoice.");
      }
    } catch (err: any) {
      console.error("Create invoice error:", err);
      setError(err?.message || "Failed to generate freight invoice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Generate Freight & Commercial Invoice
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create an auto-numbered invoice, link consignments, and balance ledger receivables.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Customer / Party Selection & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Billed To / Master Customer (Party) *
              </label>
              <SearchableSelect<PartyLookupItem>
                value={selectedParty?.name || ""}
                placeholder="Search party by name, GSTIN, code..."
                onSearch={(q) => partyService.lookupParties(q)}
                getItemKey={(p) => p.id}
                getItemLabel={(p) => p.name}
                onSelect={(p) => setSelectedParty(p)}
                renderItem={(p) => (
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {p.gstNo ? `GST: ${p.gstNo}` : "Unregistered"} {p.city ? `• ${p.city}` : ""}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                      #{p.id}
                    </span>
                  </div>
                )}
              />
              {selectedParty && (
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  GST: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{selectedParty.gstNo || "N/A"}</span> •{" "}
                  Address: {selectedParty.address || "N/A"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Quick Consignment Linker */}
          {availableShipments.length > 0 && (
            <div className="bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Quick Link Available Consignments (Waybills):
                </span>
                <span className="text-[10px] text-slate-400">Click to import freight line</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {availableShipments.slice(0, 8).map((shp) => (
                  <button
                    key={shp.id}
                    type="button"
                    onClick={() => handleLinkShipment(shp)}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-blue-400 rounded-md text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{shp.shipmentNo}</span>
                    <span className="text-slate-400">→ ₹{shp.totalFreight || shp.grandTotal}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Invoice Line Items
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-md border border-blue-200 dark:border-blue-800 transition cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-2 px-3 w-8">#</th>
                    <th className="py-2 px-3">Description / Service</th>
                    <th className="py-2 px-3 w-20">Qty</th>
                    <th className="py-2 px-3 w-28">Rate (₹)</th>
                    <th className="py-2 px-3 w-28 text-right">Amount (₹)</th>
                    <th className="py-2 px-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Freight charges Patna to Ranchi"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", parseFloat(e.target.value) || 1)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, "rate", parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₹{(item.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financials & Ledger Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Left: Remarks, Due Date & Payment Collection */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Payment Intake Box */}
              <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Received Payment / Initial Settlement</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(0)}
                      className="px-2 py-0.5 text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      Unpaid (₹0)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaidAmount(grandTotal)}
                      className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer shadow-2xs"
                    >
                      Full (₹{grandTotal.toFixed(2)})
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Amount Received Now (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max={grandTotal}
                      value={paidAmount === 0 ? "" : paidAmount}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      disabled={paidAmount <= 0}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                    >
                      <option value="Cash">Cash (Counter)</option>
                      <option value="UPI / QR">UPI / QR</option>
                      <option value="Bank Transfer / NEFT">Bank Transfer (NEFT/RTGS)</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                {paidAmount > 0 && grandTotal - paidAmount <= 0 && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    ✓ Full payment recorded. This invoice will immediately settle to Outstanding = ₹0.00.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Invoice Remarks / Terms
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Payment due within 15 days of invoice date"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Right: Balance Ledger */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                <span>Subtotal (Line Items):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹{subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-2">
                  <span>GST Tax Rate (%):</span>
                  <select
                    value={globalTaxRate}
                    onChange={(e) => setGlobalTaxRate(Number(e.target.value))}
                    className="px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold cursor-pointer"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% (GTA RCM/ITC)</option>
                    <option value={12}>12% (Forward)</option>
                    <option value={18}>18% (Standard)</option>
                  </select>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  + ₹{taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <span>Other Ancillary Charges (₹):</span>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={otherCharges === 0 ? "" : otherCharges}
                  onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-24 px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded text-right font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <span>Discount / Rebate (₹):</span>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={discount === 0 ? "" : discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-24 px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded text-right font-mono font-bold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-sm font-black text-slate-900 dark:text-white">Grand Total:</span>
                <span className="text-base font-mono font-black text-blue-600 dark:text-blue-400">
                  ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span className="font-semibold">Paid / Received:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  - ₹{(Number(paidAmount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Balance Due (Outstanding):</span>
                <span className={`text-sm font-mono font-bold ${grandTotal - paidAmount <= 0 && grandTotal > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`}>
                  ₹{Math.max(0, grandTotal - paidAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Generating Invoice..." : "Create Freight Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
