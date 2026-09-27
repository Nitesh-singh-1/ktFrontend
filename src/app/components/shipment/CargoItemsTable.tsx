"use client";

import React from "react";
import { ShipmentItem } from "@/types/shipment";
import { Package, Plus, Trash2 } from "lucide-react";

interface CargoItemsTableProps {
  items: ShipmentItem[];
  onChange: (items: ShipmentItem[]) => void;
  disabled?: boolean;
}

export default function CargoItemsTable({ items, onChange, disabled = false }: CargoItemsTableProps) {
  const handleAddItem = () => {
    const newItem: ShipmentItem = {
      article: "",
      description: "",
      weight: 0,
      rate: 0,
      quantity: 1,
      totalAmount: 0,
    };
    onChange([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleFieldChange = (index: number, field: keyof ShipmentItem, value: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    // Auto-calculate row total if rate or weight/quantity change
    if (field === "weight" || field === "rate" || field === "quantity") {
      const weight = field === "weight" ? Number(value) || 0 : Number(current.weight) || 0;
      const rate = field === "rate" ? Number(value) || 0 : Number(current.rate) || 0;
      const qty = field === "quantity" ? Number(value) || 0 : Number(current.quantity) || 0;

      const calcTotal = weight > 0 ? weight * rate : qty * rate;
      current.totalAmount = Math.round(calcTotal * 100) / 100;
    }

    updated[index] = current;
    onChange(updated);
  };

  const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalItemsAmount = items.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-[#F7F8F8] dark:bg-slate-800/80 border-b border-[#E5EAEB] dark:border-slate-800 text-[#111827] dark:text-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#2F8E86]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-300">Cargo / Goods Line Items</h3>
          <span className="text-xs bg-[#E7F1F2] text-[#25776F] px-2 py-0.5 rounded-md font-semibold">
            {items.length} {items.length === 1 ? "Item" : "Items"}
          </span>
        </div>

        {!disabled && (
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2F8E86] hover:bg-[#25776F] text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F7F8F8] dark:bg-slate-800/50 border-b border-[#E5EAEB] dark:border-slate-800 text-[#64748B] dark:text-slate-400 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-2.5 w-12 text-center">#</th>
              <th className="px-4 py-2.5 min-w-[140px]">Article / Package</th>
              <th className="px-4 py-2.5 min-w-[200px]">Goods Description</th>
              <th className="px-4 py-2.5 w-28 text-right">Weight (KG)</th>
              <th className="px-4 py-2.5 w-28 text-right">Rate (₹)</th>
              <th className="px-4 py-2.5 w-24 text-right">Quantity</th>
              <th className="px-4 py-2.5 w-32 text-right">Row Total (₹)</th>
              {!disabled && <th className="px-3 py-2.5 w-14 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5EAEB] dark:divide-slate-800">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-2 text-center font-bold text-slate-400">
                  {index + 1}
                </td>

                <td className="px-4 py-2">
                  <input
                    type="text"
                    disabled={disabled}
                    placeholder="e.g. 10 Bags, Boxes"
                    value={item.article || ""}
                    onChange={(e) => handleFieldChange(index, "article", e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-md text-xs font-medium text-[#111827] dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]"
                  />
                </td>

                <td className="px-4 py-2">
                  <input
                    type="text"
                    disabled={disabled}
                    placeholder="e.g. Industrial Fasteners"
                    value={item.description || ""}
                    onChange={(e) => handleFieldChange(index, "description", e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-md text-xs font-medium text-[#111827] dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]"
                  />
                </td>

                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    disabled={disabled}
                    placeholder="0.00"
                    value={item.weight === 0 ? "" : item.weight}
                    onChange={(e) => handleFieldChange(index, "weight", parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-right bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-md text-xs font-semibold text-[#111827] dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]"
                  />
                </td>

                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    disabled={disabled}
                    placeholder="0.00"
                    value={item.rate === 0 ? "" : item.rate}
                    onChange={(e) => handleFieldChange(index, "rate", parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-right bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-md text-xs font-semibold text-[#111827] dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]"
                  />
                </td>

                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    min="1"
                    disabled={disabled}
                    placeholder="1"
                    value={item.quantity === 0 ? "" : item.quantity}
                    onChange={(e) => handleFieldChange(index, "quantity", parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-1.5 text-right bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-md text-xs font-medium text-[#111827] dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]"
                  />
                </td>

                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    step="any"
                    disabled={disabled}
                    value={item.totalAmount === 0 ? "" : item.totalAmount}
                    onChange={(e) => handleFieldChange(index, "totalAmount", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 text-right bg-[#F7F8F8] dark:bg-slate-800/80 font-bold text-[#111827] dark:text-white border border-[#D9E2E3] dark:border-slate-700 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]"
                  />
                </td>

                {!disabled && (
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length <= 1}
                      title="Delete row"
                      className="p-1 text-[#94A3B8] hover:text-[#D95C5C] disabled:opacity-30 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>

          <tfoot className="bg-[#F7F8F8] dark:bg-slate-800/80 font-bold text-[#111827] dark:text-slate-200 border-t border-[#E5EAEB] dark:border-slate-800">
            <tr>
              <td colSpan={3} className="px-4 py-2.5 text-right uppercase tracking-wider text-xs text-[#64748B] dark:text-slate-400">
                Totals:
              </td>
              <td className="px-4 py-2.5 text-right text-xs text-[#111827] dark:text-slate-200">
                {totalWeight.toLocaleString()} KG
              </td>
              <td className="px-4 py-2.5 text-right text-xs text-[#94A3B8]">
                —
              </td>
              <td className="px-4 py-2.5 text-right text-xs text-[#111827] dark:text-slate-200">
                {totalQty} Pkgs
              </td>
              <td className="px-4 py-2.5 text-right text-xs font-black text-[#111827] dark:text-white">
                ₹{totalItemsAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              {!disabled && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
