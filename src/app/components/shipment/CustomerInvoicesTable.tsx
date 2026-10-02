"use client";

import React, { useState, useRef } from "react";
import { CreateConsignmentInvoiceReferenceRequest } from "@/types/shipment";
import { Receipt, Plus, Camera, FileText, X, Trash2, Download, Image as ImageIcon } from "lucide-react";

interface CustomerInvoicesTableProps {
  invoices: CreateConsignmentInvoiceReferenceRequest[];
  onChange: (invoices: CreateConsignmentInvoiceReferenceRequest[]) => void;
  disabled?: boolean;
}

export default function CustomerInvoicesTable({
  invoices,
  onChange,
  disabled = false,
}: CustomerInvoicesTableProps) {
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const handleAddRow = () => {
    const newRow: CreateConsignmentInvoiceReferenceRequest = {
      customerInvoiceNo: "",
      customerInvoiceDate: new Date().toISOString().split("T")[0],
      declaredGoodsValue: 0,
      ewayBillNo: "",
      documentType: "TaxInvoice",
      packageCount: 1,
      weightKg: 0,
      commodityDescription: "",
      privateMarka: "",
      documentUrl: "",
    };
    onChange([...invoices, newRow]);
  };

  const handleRemoveRow = (index: number) => {
    if (invoices.length === 1) {
      onChange([
        {
          customerInvoiceNo: "",
          customerInvoiceDate: new Date().toISOString().split("T")[0],
          declaredGoodsValue: 0,
          ewayBillNo: "",
          documentType: "TaxInvoice",
          packageCount: 1,
          weightKg: 0,
          commodityDescription: "",
          privateMarka: "",
          documentUrl: "",
        },
      ]);
      return;
    }
    const updated = invoices.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleFieldChange = (
    index: number,
    field: keyof CreateConsignmentInvoiceReferenceRequest,
    value: any
  ) => {
    const updated = invoices.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange(updated);
  };

  const handleFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read as Base64 Data URL
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      handleFieldChange(index, "documentUrl", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const totalDeclaredValue = invoices.reduce(
    (sum, inv) => sum + (Number(inv.declaredGoodsValue) || 0),
    0
  );
  const totalPackages = invoices.reduce(
    (sum, inv) => sum + (Number(inv.packageCount) || 0),
    0
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5EAEB] dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-semibold text-[#111827] dark:text-slate-100 flex items-center gap-2">
            <span className="p-1.5 bg-[#E7F1F2] text-[#2F8E86] rounded-lg text-sm">
              <Receipt className="w-4 h-4" />
            </span>
            Customer Commercial Bill / Paper Intake
          </h3>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
            Record customer given tax invoices, declared value (₹), e-way bills, and upload digital photo copies of customer bills.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs px-3 py-1.5 bg-[#F7F8F8] dark:bg-slate-800 rounded-lg border border-[#E5EAEB] dark:border-slate-700">
            <span className="text-[#64748B] dark:text-slate-400 font-medium">Total Value: </span>
            <span className="font-bold text-[#2F8E86] font-mono">
              ₹{totalDeclaredValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2F8E86] hover:bg-[#25776F] rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Bill</span>
            </button>
          )}
        </div>
      </div>

      {/* Customer Bills Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F7F8F8] dark:bg-slate-800/60 text-[#64748B] dark:text-slate-300 font-semibold border-y border-[#E5EAEB] dark:border-slate-700">
              <th className="py-2.5 px-2 w-8 text-center">#</th>
              <th className="py-2.5 px-3 min-w-[150px]">Invoice No *</th>
              <th className="py-2.5 px-2.5 min-w-[125px]">Invoice Date</th>
              <th className="py-2.5 px-3 min-w-[135px]">Value (₹) *</th>
              <th className="py-2.5 px-3 min-w-[145px]">E-Way Bill No</th>
              <th className="py-2.5 px-2.5 min-w-[125px]">Doc Type</th>
              <th className="py-2.5 px-3 min-w-[130px]">Private Marka</th>
              <th className="py-2.5 px-3 min-w-[160px]">Commodity / Description</th>
              <th className="py-2.5 px-3 min-w-[140px] text-center">Bill Photo / Scan</th>
              {!disabled && <th className="py-2.5 px-2 w-10 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5EAEB] dark:divide-slate-800">
            {invoices.map((inv, idx) => (
              <tr
                key={idx}
                className="hover:bg-[#F5FAFA] dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="py-2.5 px-2 text-center text-[#64748B] font-bold">
                  {idx + 1}
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    required
                    placeholder="e.g. AaL/TI/18/1949"
                    disabled={disabled}
                    value={inv.customerInvoiceNo}
                    onChange={(e) =>
                      handleFieldChange(idx, "customerInvoiceNo", e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-600 rounded-md focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86] font-semibold text-[#111827] dark:text-white placeholder:text-[#94A3B8]"
                  />
                </td>
                <td className="py-2 px-2.5">
                  <input
                    type="date"
                    disabled={disabled}
                    value={inv.customerInvoiceDate}
                    onChange={(e) =>
                      handleFieldChange(idx, "customerInvoiceDate", e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-600 rounded-md focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86] font-semibold text-[#111827] dark:text-white"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    disabled={disabled}
                    value={inv.declaredGoodsValue || ""}
                    onChange={(e) =>
                      handleFieldChange(
                        idx,
                        "declaredGoodsValue",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-600 rounded-md focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86] font-bold font-mono text-[#111827] dark:text-white placeholder:text-[#94A3B8]"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    placeholder="12-digit E-Way Bill"
                    disabled={disabled}
                    value={inv.ewayBillNo || ""}
                    onChange={(e) =>
                      handleFieldChange(idx, "ewayBillNo", e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-600 rounded-md focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86] font-semibold text-[#111827] dark:text-white placeholder:text-[#94A3B8]"
                  />
                </td>
                <td className="py-2 px-2.5">
                  <select
                    disabled={disabled}
                    value={inv.documentType || "TaxInvoice"}
                    onChange={(e) =>
                      handleFieldChange(idx, "documentType", e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-600 rounded-md focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86] font-semibold text-[#111827] dark:text-white"
                  >
                    <option value="TaxInvoice">Tax Invoice</option>
                    <option value="DeliveryChallan">Delivery Challan</option>
                    <option value="BillOfSupply">Bill of Supply</option>
                    <option value="JobWorkChallan">Job Work</option>
                  </select>
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    placeholder="Customer's mark on packages"
                    maxLength={100}
                    disabled={disabled}
                    value={inv.privateMarka || ""}
                    onChange={(e) =>
                      handleFieldChange(idx, "privateMarka", e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-600 rounded-md focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86] font-semibold text-[#111827] dark:text-white placeholder:text-[#94A3B8]"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    placeholder="e.g. Computer / Electronics"
                    disabled={disabled}
                    value={inv.commodityDescription || ""}
                    onChange={(e) =>
                      handleFieldChange(idx, "commodityDescription", e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-600 rounded-md focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86] font-semibold text-[#111827] dark:text-white placeholder:text-[#94A3B8]"
                  />
                </td>

                {/* Photo / Scan Upload Column */}
                <td className="py-2 px-3 text-center">
                  <input
                    type="file"
                    ref={(el) => {
                      fileInputRefs.current[idx] = el;
                    }}
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(idx, e)}
                  />

                  {inv.documentUrl ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            url: inv.documentUrl!,
                            title: `Customer Bill ${inv.customerInvoiceNo || `#${idx + 1}`}`,
                          })
                        }
                        className="group relative flex items-center gap-1 px-2 py-1 bg-[#E7F1F2] dark:bg-slate-800 hover:bg-[#D9E2E3] dark:hover:bg-slate-700 border border-[#D9E2E3] dark:border-slate-700 rounded-md text-[#25776F] dark:text-[#2F8E86] text-[11px] font-bold transition cursor-pointer"
                        title="Click to zoom bill photo"
                      >
                        {inv.documentUrl.startsWith("data:image") ? (
                          <img
                            src={inv.documentUrl}
                            alt="Bill preview"
                            className="w-4 h-4 object-cover rounded shadow-2xs"
                          />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                        <span>View Photo</span>
                      </button>

                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => handleFieldChange(idx, "documentUrl", "")}
                          className="p-1 text-[#94A3B8] hover:text-[#D95C5C] transition cursor-pointer"
                          title="Remove photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    !disabled && (
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[idx]?.click()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-[#E7F1F2] dark:hover:bg-slate-700 hover:text-[#25776F] border border-[#D9E2E3] dark:border-slate-700 rounded-md text-[#64748B] dark:text-slate-300 text-[11px] font-medium transition cursor-pointer shadow-2xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>
                    )
                  )}
                </td>

                {/* Remove Row */}
                {!disabled && (
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="p-1 text-[#94A3B8] hover:text-[#D95C5C] transition-colors rounded hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      title="Remove Bill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invoices.length > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#64748B] dark:text-slate-400 bg-[#F7F8F8] dark:bg-slate-800/40 p-2.5 rounded-lg border border-[#E5EAEB] dark:border-slate-700">
          <span className="flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-[#2F8E86]" />
            <span><strong>{invoices.length} Customer Commercial Bills</strong> recorded for this Bilty.</span>
          </span>
          <span>
            Total Declared Goods Value:{" "}
            <strong className="font-mono text-[#2F8E86]">
              ₹{totalDeclaredValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </strong>
          </span>
        </div>
      )}

      {/* Lightbox Zoom Modal for Bill Photo */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span className="font-bold text-xs text-slate-800 dark:text-white">
                  {previewImage.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage.url}
                  download="customer-bill.jpg"
                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-white rounded text-xs font-semibold transition inline-flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white text-base rounded transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-950 min-h-[300px]">
              {previewImage.url.startsWith("data:image") ? (
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="max-h-[75vh] max-w-full object-contain rounded shadow-lg"
                />
              ) : (
                <iframe
                  src={previewImage.url}
                  title={previewImage.title}
                  className="w-full h-[75vh] rounded"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
