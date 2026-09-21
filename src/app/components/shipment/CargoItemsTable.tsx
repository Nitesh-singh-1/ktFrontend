"use client";

import React from "react";
import { ShipmentItem } from "@/types/shipment";

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
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 text-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-blue-600 font-bold">📦</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Cargo / Goods Line Items</h3>
          <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
            {items.length} {items.length === 1 ? "Item" : "Items"}
          </span>
        </div>

        {!disabled && (
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <span>+</span> Add Item
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
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
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50/60 transition-colors">
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
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>

                <td className="px-4 py-2">
                  <input
                    type="text"
                    disabled={disabled}
                    placeholder="e.g. Industrial Fasteners"
                    value={item.description || ""}
                    onChange={(e) => handleFieldChange(index, "description", e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-2.5 py-1.5 text-right bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-2.5 py-1.5 text-right bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-2.5 py-1.5 text-right bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-2.5 py-1.5 text-right bg-slate-50 font-bold text-slate-900 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>

                {!disabled && (
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length <= 1}
                      title="Delete row"
                      className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>

          <tfoot className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
            <tr>
              <td colSpan={3} className="px-4 py-2.5 text-right uppercase tracking-wider text-xs text-slate-600">
                Totals:
              </td>
              <td className="px-4 py-2.5 text-right text-xs text-slate-800">
                {totalWeight.toLocaleString()} KG
              </td>
              <td className="px-4 py-2.5 text-right text-xs text-slate-400">
                —
              </td>
              <td className="px-4 py-2.5 text-right text-xs text-slate-800">
                {totalQty} Pkgs
              </td>
              <td className="px-4 py-2.5 text-right text-xs font-black text-slate-900">
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
