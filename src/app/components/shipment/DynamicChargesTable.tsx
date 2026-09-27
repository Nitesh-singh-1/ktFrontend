"use client";

import React, { useState, useEffect } from "react";
import { ShipmentChargeItem, PaymentTerm, TaxTreatment } from "@/types/shipment";
import { numberToWords } from "@/utils/numberToWords";
import { IndianRupee, Zap, X, Building2, MapPin, CheckCircle2, FileText, Plus } from "lucide-react";

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
  fromLocation?: string;
  toLocation?: string;
  disabled?: boolean;
}

const COMMON_PRESETS = [
  { name: "Hamali", defaultAmount: 100, isTaxable: false },
  { name: "D.D. Char (Door Delivery)", defaultAmount: 150, isTaxable: false },
  { name: "St. Char (Stationery)", defaultAmount: 20, isTaxable: false },
  { name: "S. Char (Surcharge)", defaultAmount: 50, isTaxable: false },
  { name: "Unloading Charge", defaultAmount: 0, isTaxable: false },
  { name: "FOV / Insurance", defaultAmount: 0, isTaxable: true },
];

const GST_RATES = [
  { rate: 0, label: "0% (Exempt)" },
  { rate: 5, label: "5% (GTA Standard)" },
  { rate: 12, label: "12% (With ITC)" },
  { rate: 18, label: "18% (Courier/Express)" },
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
  fromLocation = "",
  toLocation = "",
  disabled = false,
}: DynamicChargesTableProps) {
  const [selectedGstRate, setSelectedGstRate] = useState<number | null>(5);
  const [customGstRate, setCustomGstRate] = useState<string>("5");
  const [baseFreightInput, setBaseFreightInput] = useState<string>(
    totalFreight > 0 ? totalFreight.toString() : ""
  );

  useEffect(() => {
    if (totalFreight !== parseFloat(baseFreightInput) && !isNaN(totalFreight)) {
      setBaseFreightInput(totalFreight > 0 ? totalFreight.toString() : "");
    }
  }, [totalFreight]);

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

  const handleBaseFreightTextChange = (val: string) => {
    // Only allow clean decimal numbers
    const clean = val.replace(/[^0-9.]/g, "");
    setBaseFreightInput(clean);
    const num = parseFloat(clean) || 0;
    onTotalFreightChange(num);

    // If GST rate is selected, auto calculate tax
    if (taxTreatment === TaxTreatment.GST_Regular && selectedGstRate !== null) {
      recalculateTax(num, chargeItems, selectedGstRate);
    }
  };

  const recalculateTax = (freight: number, charges: ShipmentChargeItem[], rate: number) => {
    const taxableCharges = charges
      .filter((c) => c.isTaxable)
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const taxableTotal = freight + taxableCharges;
    const computedTax = Math.round(taxableTotal * (rate / 100) * 100) / 100;
    onTotalTaxAmountChange(computedTax);
  };

  const handleGstRateSelect = (rate: number) => {
    setSelectedGstRate(rate);
    setCustomGstRate(rate.toString());
    recalculateTax(totalFreight, chargeItems, rate);
  };

  const handleCustomGstRateChange = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, "");
    setCustomGstRate(clean);
    const rateNum = parseFloat(clean) || 0;
    setSelectedGstRate(rateNum);
    recalculateTax(totalFreight, chargeItems, rateNum);
  };

  // Financial Computations
  const totalOtherCharges = chargeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const subtotalBeforeTax = Number(totalFreight) + totalOtherCharges;
  const isTaxApplicable = taxTreatment === TaxTreatment.GST_Regular || taxTreatment === TaxTreatment.CustomTax;

  const grandTotal = Math.round((subtotalBeforeTax + (isTaxApplicable ? Number(totalTaxAmount) : 0)) * 100) / 100;
  const dueAmount = Math.max(0, Math.round((grandTotal - Number(paidAmount)) * 100) / 100);

  // Determine Inter-state vs Intra-state from route text
  const fromClean = fromLocation.trim().toLowerCase();
  const toClean = toLocation.trim().toLowerCase();
  const isInterState = fromClean && toClean && fromClean !== toClean && !fromClean.includes(toClean) && !toClean.includes(fromClean);

  const handlePaymentTermSelect = (term: PaymentTerm) => {
    onPaymentTermChange(term);
    if (term === PaymentTerm.Paid) {
      onPaidAmountChange(grandTotal);
    } else if (term === PaymentTerm.ToPay || term === PaymentTerm.TBB) {
      onPaidAmountChange(0);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs overflow-hidden space-y-4">
      {/* Header */}
      <div className="px-5 py-3.5 bg-[#F7F8F8] dark:bg-slate-800/60 border-b border-[#E5EAEB] dark:border-slate-800 text-[#111827] dark:text-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-[#47868C]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-300">
            5. Freight, Ancillary Charges & Settlement Ledger
          </h3>
        </div>
        <span className="text-[11px] text-[#64748B] font-medium">Auto-calculates ledger in real-time</span>
      </div>

      <div className="p-5 space-y-6">
        {/* Base Freight & Charge Presets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Base Freight Input (Text field without scroll/spinner bugs) */}
          <div className="lg:col-span-4 p-4 bg-[#F7F8F8] dark:bg-slate-800/40 rounded-xl border border-[#E5EAEB] dark:border-slate-700">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-300">
                Base Freight Amount (₹) *
              </label>
              <span className="text-[10px] text-[#94A3B8] font-semibold">Direct Input</span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#94A3B8] font-bold text-sm">
                ₹
              </span>
              <input
                type="text"
                inputMode="decimal"
                disabled={disabled}
                placeholder="0.00"
                value={baseFreightInput}
                onChange={(e) => handleBaseFreightTextChange(e.target.value)}
                className="w-full h-10 pl-8 pr-3.5 py-2 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-sm font-bold text-[#111827] dark:text-white focus:ring-1 focus:ring-[#47868C] focus:border-[#47868C] focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-1.5">
              Standard haulage & transportation tariff
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="lg:col-span-8 p-4 bg-[#F7F8F8] dark:bg-slate-800/40 rounded-xl border border-[#E5EAEB] dark:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#F4A261]" />
                <span>Quick Add Common Fee Line-Items:</span>
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1 ${
                        isAdded
                          ? "bg-slate-100 dark:bg-slate-700 text-[#94A3B8] border-[#E5EAEB] dark:border-slate-600 cursor-not-allowed"
                          : "bg-white dark:bg-slate-900 hover:bg-[#E7F1F2] dark:hover:bg-slate-800 text-[#3F7C82] dark:text-[#47868C] border-[#D9E2E3] dark:border-slate-700 shadow-2xs cursor-pointer"
                      }`}
                    >
                      {isAdded && <CheckCircle2 className="w-3 h-3 text-[#94A3B8]" />}
                      <span>{preset.name}</span>
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
                  className="text-xs font-bold text-[#47868C] hover:text-[#3F7C82] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Other Fee</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Charges Table */}
        {chargeItems.length > 0 && (
          <div className="border border-[#E5EAEB] dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-2 bg-[#F7F8F8] dark:bg-slate-800 text-xs font-bold text-[#111827] dark:text-slate-300 uppercase tracking-wider flex justify-between">
              <span>Attached Charges ({chargeItems.length})</span>
              <span className="font-mono">Subtotal: ₹{totalOtherCharges.toFixed(2)}</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8F8] dark:bg-slate-850 border-b border-[#E5EAEB] dark:border-slate-700 text-[#64748B] dark:text-slate-400 font-semibold">
                <tr>
                  <th className="px-4 py-2 w-12 text-center">#</th>
                  <th className="px-4 py-2">Charge Description / Fee Type</th>
                  <th className="px-4 py-2 w-36 text-right">Amount (₹)</th>
                  <th className="px-4 py-2 w-28 text-center">Is Taxable?</th>
                  {!disabled && <th className="px-3 py-2 w-12 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAEB] dark:divide-slate-800">
                {chargeItems.map((charge, idx) => (
                  <tr key={idx} className="hover:bg-[#F5FAFA] dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-2 text-center text-[#94A3B8] font-bold">{idx + 1}</td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        disabled={disabled}
                        placeholder="e.g. Loading / Hamali, Delivery Surcharge"
                        value={charge.chargeName}
                        onChange={(e) => handleFieldChange(idx, "chargeName", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#47868C]"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="text"
                        inputMode="decimal"
                        disabled={disabled}
                        placeholder="0.00"
                        value={charge.amount === 0 ? "" : charge.amount}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/[^0-9.]/g, "");
                          handleFieldChange(idx, "amount", parseFloat(clean) || 0);
                        }}
                        className="w-full px-2.5 py-1.5 text-right bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-bold font-mono text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#47868C]"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={charge.isTaxable || false}
                        onChange={(e) => handleFieldChange(idx, "isTaxable", e.target.checked)}
                        className="w-4 h-4 rounded text-[#47868C] focus:ring-[#47868C] border-[#D9E2E3]"
                      />
                    </td>
                    {!disabled && (
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveCharge(idx)}
                          className="p-1 text-[#94A3B8] hover:text-[#D95C5C] transition cursor-pointer"
                          title="Remove charge"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* GST Rate Preset Selector for Regular Tax Invoice */}
        {taxTreatment === TaxTreatment.GST_Regular && (
          <div className="bg-[#F7F8F8] dark:bg-slate-800/60 p-4 rounded-xl border border-[#E5EAEB] dark:border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#47868C]" />
                <span className="text-xs font-bold text-[#111827] dark:text-white uppercase tracking-wide">
                  GST Rate & Tax Split Matrix (GTA Regime)
                </span>
              </div>
              <span className="text-[11px] text-[#4A90E2] font-semibold">
                {isInterState ? "Inter-State Route: IGST Applicable" : "Intra-State Route: CGST + SGST Applicable"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {GST_RATES.map((g) => {
                const isSelected = selectedGstRate === g.rate;
                return (
                  <button
                    key={g.rate}
                    type="button"
                    onClick={() => handleGstRateSelect(g.rate)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                      isSelected
                        ? "bg-[#47868C] text-white border-[#47868C] shadow-xs"
                        : "bg-white dark:bg-slate-900 text-[#64748B] dark:text-slate-300 border-[#D9E2E3] dark:border-slate-700 hover:bg-[#F5FAFA]"
                    }`}
                  >
                    <span>{g.label}</span>
                    <span className="text-[10px] opacity-80 mt-0.5">
                      {g.rate === 0
                        ? "Nil GST"
                        : isInterState
                        ? `IGST ${g.rate}%`
                        : `CGST ${g.rate / 2}% + SGST ${g.rate / 2}%`}
                    </span>
                  </button>
                );
              })}

              {/* Custom GST Rate Input */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-2.5 py-1">
                <span className="text-xs font-bold text-[#64748B]">Custom:</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="%"
                  value={customGstRate}
                  onChange={(e) => handleCustomGstRateChange(e.target.value)}
                  className="w-12 text-xs font-mono font-bold text-[#111827] dark:text-white focus:outline-none"
                />
                <span className="text-xs font-bold text-[#64748B]">%</span>
              </div>
            </div>
          </div>
        )}

        {/* Tax, Payment Terms & Totals Summary Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-[#E5EAEB] dark:border-slate-800">
          {/* Left: Payment Terms & Settlement */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-300 mb-2">
                Freight Payment Term *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { term: PaymentTerm.ToPay, label: "To Pay (Dest)", icon: MapPin },
                  { term: PaymentTerm.Paid, label: "Paid (Origin)", icon: CheckCircle2 },
                  { term: PaymentTerm.TBB, label: "To Be Billed", icon: FileText },
                ].map(({ term, label, icon: IconComponent }) => (
                  <button
                    key={term}
                    type="button"
                    disabled={disabled}
                    onClick={() => handlePaymentTermSelect(term)}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      paymentTerm === term
                        ? "bg-[#47868C] text-white border-[#47868C] font-bold shadow-xs"
                        : "bg-white dark:bg-slate-900 hover:bg-[#F5FAFA] dark:hover:bg-slate-800 text-[#64748B] dark:text-slate-300 border-[#D9E2E3] dark:border-slate-700 font-medium"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="text-xs leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Paid Amount Input */}
            <div className="p-3.5 bg-[#F7F8F8] dark:bg-slate-800/40 rounded-xl border border-[#E5EAEB] dark:border-slate-700">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-[#111827] dark:text-slate-300 uppercase tracking-wider">
                  Advance / Paid Amount (₹)
                </label>
                {paymentTerm === PaymentTerm.Paid && (
                  <span className="text-[11px] font-semibold text-[#2F9E8F]">
                    Full Settlement (Prepaid)
                  </span>
                )}
              </div>
              <input
                type="text"
                inputMode="decimal"
                disabled={disabled}
                value={paidAmount === 0 ? "" : paidAmount}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^0-9.]/g, "");
                  onPaidAmountChange(parseFloat(clean) || 0);
                }}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-sm font-bold font-mono text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#47868C]"
              />
            </div>
          </div>

          {/* Right: Real-time Calculation Ledger */}
          <div className="bg-white dark:bg-slate-900 text-[#111827] dark:text-white p-5 rounded-xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E5EAEB] dark:border-slate-800 pb-2 flex justify-between">
              <span>Financial Ledger</span>
              <span>INR (₹)</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#64748B] dark:text-slate-300">
                <span>Base Freight:</span>
                <span className="font-mono font-bold text-[#111827] dark:text-white">₹{totalFreight.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-[#64748B] dark:text-slate-300">
                <span>Total Other Charges:</span>
                <span className="font-mono font-bold text-[#111827] dark:text-white">₹{totalOtherCharges.toFixed(2)}</span>
              </div>

              {/* Tax Line */}
              {isTaxApplicable && (
                <div className="flex justify-between items-center py-1 text-[#64748B] dark:text-slate-300 border-t border-[#E5EAEB] dark:border-slate-800/80">
                  <div>
                    <span>GST / Tax ({selectedGstRate ?? 5}%):</span>
                    {totalTaxAmount > 0 && (
                      <span className="block text-[10px] text-[#4A90E2] font-mono">
                        {isInterState
                          ? `IGST (${selectedGstRate ?? 5}%): ₹${totalTaxAmount.toFixed(2)}`
                          : `CGST (${((selectedGstRate ?? 5) / 2).toFixed(1)}%): ₹${(totalTaxAmount / 2).toFixed(2)} + SGST (${((selectedGstRate ?? 5) / 2).toFixed(1)}%): ₹${(totalTaxAmount / 2).toFixed(2)}`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#94A3B8] font-mono">₹</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      disabled={disabled}
                      value={totalTaxAmount === 0 ? "" : totalTaxAmount}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9.]/g, "");
                        onTotalTaxAmountChange(parseFloat(clean) || 0);
                      }}
                      placeholder="0.00"
                      className="w-24 px-2 py-0.5 text-right bg-[#F7F8F8] dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-[#2F9E8F] focus:outline-none focus:border-[#47868C]"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-[#E5EAEB] dark:border-slate-800 flex justify-between items-center text-sm font-black">
                <span className="text-[#47868C]">Grand Total (Total Freight):</span>
                <span className="font-mono text-lg text-[#111827] dark:text-white">
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between text-xs text-[#64748B] dark:text-slate-400 pt-1">
                <span>Paid / Advance at Origin:</span>
                <span className="font-mono text-[#111827] dark:text-slate-200">₹{paidAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xs font-bold pt-1 border-t border-[#E5EAEB] dark:border-slate-800 text-[#F4A261]">
                <span>Balance Due (To Collect):</span>
                <span className="font-mono text-sm">₹{dueAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* In Words */}
            <div className="pt-2 border-t border-[#E5EAEB] dark:border-slate-800 text-[11px] text-[#64748B] dark:text-slate-300">
              <span className="font-semibold text-[#94A3B8]">In Words: </span>
              <span className="italic text-[#111827] dark:text-slate-200">{numberToWords(grandTotal) || "Zero Rupees"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
