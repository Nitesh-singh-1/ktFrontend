"use client";

import React from "react";
import { ShipmentChargeItem, PaymentTerm, TaxTreatment } from "@/types/shipment";
import { numberToWords } from "@/utils/numberToWords";

interface DynamicChargesTableProps {
  totalFreight: number;
  onTotalFreightChange: (val: number) => void;
  chargeItems: ShipmentChargeItem[];
  onChargeItemsChange: (items: ShipmentChargeItem[]) => void;
  taxTreatment: TaxTreatment;
  totalTaxAmount: number;
  onTotalTaxAmountChange: (val: number) => void;
  paymentTerm: PaymentTerm;
  onPaymentTermChange: (val: PaymentTerm) => void;
  paidAmount: number;
  onPaidAmountChange: (val: number) => void;
  disabled?: boolean;
}

const COMMON_PRESETS = [
  { name: "Loading / Hamali", defaultAmount: 100, isTaxable: false },
  { name: "Door Delivery (DD Charge)", defaultAmount: 150, isTaxable: false },
  { name: "Stationary / Documentation", defaultAmount: 20, isTaxable: false },
  { name: "Toll / Surcharge", defaultAmount: 0, isTaxable: false },
  { name: "Unloading Charge", defaultAmount: 0, isTaxable: false },
  { name: "Insurance / FOV", defaultAmount: 0, isTaxable: true },
];

export default function DynamicChargesTable({
  totalFreight,
  onTotalFreightChange,
  chargeItems,
  onChargeItemsChange,
  taxTreatment,
  totalTaxAmount,
  onTotalTaxAmountChange,
  paymentTerm,
  onPaymentTermChange,
  paidAmount,
  onPaidAmountChange,
  disabled = false,
}: DynamicChargesTableProps) {
  const handleAddCharge = (name = "", amount = 0, isTaxable = false) => {
    const newCharge: ShipmentChargeItem = {
      chargeName: name,
      amount,
      isTaxable,
    };
    onChargeItemsChange([...chargeItems, newCharge]);
  };

  const handleAddPreset = (preset: { name: string; defaultAmount: number; isTaxable: boolean }) => {
    const exists = chargeItems.some((c) => c.chargeName.toLowerCase() === preset.name.toLowerCase());
    if (exists) {
      alert(`"${preset.name}" is already added.`);
      return;
    }
    handleAddCharge(preset.name, preset.defaultAmount, preset.isTaxable);
  };

  const handleRemoveCharge = (index: number) => {
    const updated = chargeItems.filter((_, i) => i !== index);
    onChargeItemsChange(updated);
  };

  const handleFieldChange = (index: number, field: keyof ShipmentChargeItem, value: any) => {
    const updated = [...chargeItems];
    updated[index] = { ...updated[index], [field]: value };
    onChargeItemsChange(updated);
  };

  // Financial Computations
  const totalOtherCharges = chargeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const subtotalBeforeTax = Number(totalFreight) + totalOtherCharges;
  const isTaxApplicable = taxTreatment === TaxTreatment.GST_Regular || taxTreatment === TaxTreatment.CustomTax;

  const grandTotal = Math.round((subtotalBeforeTax + (isTaxApplicable ? Number(totalTaxAmount) : 0)) * 100) / 100;
  const dueAmount = Math.max(0, Math.round((grandTotal - Number(paidAmount)) * 100) / 100);

  const handlePaymentTermSelect = (term: PaymentTerm) => {
    onPaymentTermChange(term);
    if (term === PaymentTerm.Paid) {
      onPaidAmountChange(grandTotal);
    } else if (term === PaymentTerm.ToPay || term === PaymentTerm.TBB) {
      onPaidAmountChange(0);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 text-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-emerald-600 font-bold">💰</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Freight, Ancillary Charges & Settlement
          </h3>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Base Freight & Charge Presets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Base Freight */}
          <div className="lg:col-span-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Base Freight Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0"
                disabled={disabled}
                placeholder="0.00"
                value={totalFreight === 0 ? "" : totalFreight}
                onChange={(e) => onTotalFreightChange(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">Standard haulage & transportation charges</p>
          </div>

          {/* Preset Buttons */}
          <div className="lg:col-span-8 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <span>⚡</span> Quick Add Common Fee Line-Items:
              </div>
              <div className="flex flex-wrap gap-2">
                {COMMON_PRESETS.map((preset) => {
                  const isAdded = chargeItems.some((c) => c.chargeName.toLowerCase() === preset.name.toLowerCase());
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      disabled={disabled || isAdded}
                      onClick={() => handleAddPreset(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                        isAdded
                          ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                          : "bg-white hover:bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400 shadow-xs cursor-pointer"
                      }`}
                    >
                      {isAdded ? `✓ ${preset.name}` : `+ ${preset.name}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {!disabled && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleAddCharge("", 0, false)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>+ Custom Other Fee</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Charges Table */}
        {chargeItems.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-2 bg-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between">
              <span>Attached Charges ({chargeItems.length})</span>
              <span>Subtotal: ₹{totalOtherCharges.toFixed(2)}</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-2 w-12 text-center">#</th>
                  <th className="px-4 py-2">Charge Description / Fee Type</th>
                  <th className="px-4 py-2 w-32 text-right">Amount (₹)</th>
                  <th className="px-4 py-2 w-28 text-center">Is Taxable?</th>
                  {!disabled && <th className="px-3 py-2 w-12 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chargeItems.map((charge, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        disabled={disabled}
                        placeholder="e.g. Loading / Hamali, Delivery Surcharge"
                        value={charge.chargeName}
                        onChange={(e) => handleFieldChange(idx, "chargeName", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        disabled={disabled}
                        placeholder="0.00"
                        value={charge.amount === 0 ? "" : charge.amount}
                        onChange={(e) => handleFieldChange(idx, "amount", parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-right bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={charge.isTaxable || false}
                        onChange={(e) => handleFieldChange(idx, "isTaxable", e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                    </td>
                    {!disabled && (
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveCharge(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 transition"
                          title="Remove charge"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tax, Payment Terms & Totals Summary Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-200">
          {/* Left: Payment Terms & Settlement */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Payment Terms *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { term: PaymentTerm.ToPay, label: "To Pay (Dest)", icon: "📍" },
                  { term: PaymentTerm.Paid, label: "Paid (Origin)", icon: "✅" },
                  { term: PaymentTerm.TBB, label: "To Be Billed", icon: "📑" },
                ].map(({ term, label, icon }) => (
                  <button
                    key={term}
                    type="button"
                    disabled={disabled}
                    onClick={() => handlePaymentTermSelect(term)}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      paymentTerm === term
                        ? "bg-blue-600 text-white border-blue-600 font-bold shadow-xs"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-medium"
                    }`}
                  >
                    <span className="text-sm">{icon}</span>
                    <span className="text-xs leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Paid Amount Input */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Advance / Paid Amount (₹)
                </label>
                {paymentTerm === PaymentTerm.Paid && (
                  <span className="text-[11px] font-semibold text-emerald-600">Full Settlement</span>
                )}
              </div>
              <input
                type="number"
                step="any"
                min="0"
                disabled={disabled}
                value={paidAmount === 0 ? "" : paidAmount}
                onChange={(e) => onPaidAmountChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Right: Real-time Calculation Ledger */}
          <div className="bg-slate-900 text-white p-5 rounded-xl shadow-xs space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 flex justify-between">
              <span>Financial Ledger</span>
              <span>INR (₹)</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Base Freight:</span>
                <span className="font-mono font-bold text-white">₹{totalFreight.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Total Other Charges:</span>
                <span className="font-mono font-bold text-white">₹{totalOtherCharges.toFixed(2)}</span>
              </div>

              {/* Tax Line */}
              {isTaxApplicable && (
                <div className="flex justify-between items-center py-1 text-slate-300">
                  <span>GST / Tax Amount:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-mono">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      disabled={disabled}
                      value={totalTaxAmount === 0 ? "" : totalTaxAmount}
                      onChange={(e) => onTotalTaxAmountChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-24 px-2 py-0.5 text-right bg-slate-800 border border-slate-700 rounded text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-black">
                <span className="text-blue-300">Grand Total:</span>
                <span className="font-mono text-lg text-emerald-400">
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between text-xs text-slate-400 pt-1">
                <span>Paid / Advance:</span>
                <span className="font-mono text-slate-200">₹{paidAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-800 text-amber-300">
                <span>Balance Due:</span>
                <span className="font-mono text-sm">₹{dueAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* In Words */}
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300">
              <span className="font-semibold text-slate-400">In Words: </span>
              <span className="italic text-slate-200">{numberToWords(grandTotal) || "Zero Rupees"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
