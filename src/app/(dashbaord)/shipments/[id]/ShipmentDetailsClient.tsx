"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Shipment,
  TaxTreatment,
  PaymentTerm,
} from "@/types/shipment";
import { shipmentService } from "services/shipmentService";
import ShipmentStatusBadge from "@/app/components/shipment/ShipmentStatusBadge";
import TrackingTimeline from "@/app/components/shipment/TrackingTimeline";
import StatusTransitionModal from "@/app/components/shipment/StatusTransitionModal";
import { printShipment } from "@/utils/print/printShipment";
import { numberToWords } from "@/utils/numberToWords";
import {
  AlertTriangle,
  ArrowLeft,
  Send,
  Printer,
  Edit,
  ArrowRight,
  Upload,
  Download,
} from "lucide-react";

export default function ShipmentDetailsClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const idFromParam = params?.id ? Number(params.id) : null;
  const idFromQuery = searchParams?.get("id") ? Number(searchParams.get("id")) : null;
  const id = idFromParam || idFromQuery;

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  useEffect(() => {
    if (id && !isNaN(id)) {
      fetchShipmentDetails(id);
    }
  }, [id]);

  const fetchShipmentDetails = async (shipmentId: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await shipmentService.getShipmentById(shipmentId);
      if (res.success && res.data) {
        setShipment(res.data);
      } else {
        setError(res.message || "Failed to load consignment details.");
      }
    } catch (err: any) {
      console.error("Error loading consignment:", err);
      setError(err?.message || "Failed to fetch consignment data.");
    } finally {
      setLoading(false);
    }
  };

  const getTaxLabel = (tax: TaxTreatment) => {
    switch (tax) {
      case TaxTreatment.GST_Regular:
        return "GST Regular (Tax Invoice)";
      case TaxTreatment.NonTaxable:
        return "Non-Taxable / Without GST";
      case TaxTreatment.GST_RCM:
        return "GST Reverse Charge (RCM)";
      case TaxTreatment.Exempt:
        return "Exempt Commodity";
      case TaxTreatment.CustomTax:
        return "Custom Tax Rate";
      default:
        return "Standard";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">Loading consignment details...</p>
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="p-8 max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900 shadow-sm text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Consignment Not Found</h2>
        <p className="text-xs text-red-600 dark:text-red-400">{error || "Could not retrieve consignment data."}</p>
        <div className="flex justify-center gap-3">
          {id && (
            <button
              onClick={() => fetchShipmentDetails(id)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer"
            >
              Retry
            </button>
          )}
          <Link
            href="/shipments"
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs"
          >
            Back to List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/shipments"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="Back to consignments"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {shipment.shipmentNo}
                </h1>
                <ShipmentStatusBadge status={shipment.status} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Booked on {new Date(shipment.shipmentDate || shipment.createdAt).toLocaleDateString('en-IN', {
                  dateStyle: "full",
                })} • {getTaxLabel(shipment.taxTreatment)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsStatusModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Update Status Stage</span>
          </button>

          <button
            type="button"
            onClick={() => printShipment(shipment)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Consignment Note</span>
          </button>

          <Link
            href={`/shipments/create?id=${shipment.id}`}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Link>
        </div>
      </div>

      {/* Movement & Route Ribbon */}
      <div className="bg-sky-900 text-white p-5 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] text-sky-300 uppercase tracking-widest font-bold">Origin</div>
            <div className="text-base font-extrabold">{shipment.fromLocation}</div>
          </div>
          <ArrowRight className="w-5 h-5 text-sky-400 shrink-0" />
          <div>
            <div className="text-[10px] text-sky-300 uppercase tracking-widest font-bold">Destination</div>
            <div className="text-base font-extrabold">{shipment.toLocation}</div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Assigned Vehicle</div>
            <div className="font-mono font-bold text-white">{shipment.truckNo || "NOT ASSIGNED"}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Invoice / Bill Ref</div>
            <div className="font-semibold text-white">{shipment.invoiceNo || "—"}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Payment Terms</div>
            <div className="font-extrabold text-amber-400">
              {shipment.paymentTerm === PaymentTerm.Paid ? "PAID" : shipment.paymentTerm === PaymentTerm.TBB ? "TO BE BILLED" : "TO PAY"}
            </div>
          </div>
        </div>
      </div>

      {/* Tracking Timeline Component */}
      <TrackingTimeline
        currentStatus={shipment.status}
        statusHistory={shipment.statusHistory || []}
      />

      {/* Sender & Receiver Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Consignor */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between">
            <span>Consignor (Sender)</span>
            <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Upload className="w-3 h-3" /> Origin
            </span>
          </div>
          <div className="text-base font-extrabold text-slate-900 dark:text-white">{shipment.consignorName}</div>
          {shipment.consignorGstNo && (
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <strong className="text-slate-700 dark:text-slate-200">GSTIN:</strong> <span className="font-mono font-bold">{shipment.consignorGstNo}</span>
            </div>
          )}
          <div className="text-xs text-slate-600 dark:text-slate-300">
            <strong className="text-slate-700 dark:text-slate-200">Mobile:</strong> {shipment.consignorMobile || "—"}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">
            <strong className="text-slate-700 dark:text-slate-200">Address:</strong> {shipment.consignorAddress || "—"}
          </div>
        </div>

        {/* Consignee */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between">
            <span>Consignee (Receiver)</span>
            <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <Download className="w-3 h-3" /> Destination
            </span>
          </div>
          <div className="text-base font-extrabold text-slate-900 dark:text-white">{shipment.consigneeName}</div>
          {shipment.consigneeGstNo && (
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <strong className="text-slate-700 dark:text-slate-200">GSTIN:</strong> <span className="font-mono font-bold">{shipment.consigneeGstNo}</span>
            </div>
          )}
          <div className="text-xs text-slate-600 dark:text-slate-300">
            <strong className="text-slate-700 dark:text-slate-200">Mobile:</strong> {shipment.consigneeMobile || "—"}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">
            <strong className="text-slate-700 dark:text-slate-200">Address:</strong> {shipment.consigneeAddress || "—"}
          </div>
        </div>
      </div>

      {/* Cargo Items Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider">
          Attached Cargo Goods ({shipment.items?.length || 0})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase">
              <tr>
                <th className="px-4 py-3 text-center w-12">#</th>
                <th className="px-4 py-3">Article / Package</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Weight (KG)</th>
                <th className="px-4 py-3 text-right">Rate (₹)</th>
                <th className="px-4 py-3 text-center">Quantity</th>
                <th className="px-4 py-3 text-right">Row Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {shipment.items && shipment.items.length > 0 ? (
                shipment.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200">{item.article || "—"}</td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{item.description || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-700 dark:text-slate-300">{item.weight || 0}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-700 dark:text-slate-300">₹{(item.rate || 0).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-center font-medium text-slate-700 dark:text-slate-300">{item.quantity || 1}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{(item.totalAmount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    No cargo line items specified
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Ledger & Dynamic Charges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Dynamic Charges List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between">
            <span>Ancillary Charges & Line Items</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{shipment.chargeItems?.length || 0} Added</span>
          </div>

          {shipment.chargeItems && shipment.chargeItems.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {shipment.chargeItems.map((c, i) => (
                <div key={i} className="py-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{c.chargeName}</span>
                    {c.isTaxable && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900">
                        Taxable
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">₹{(c.amount || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-4 text-center">No extra charges attached.</div>
          )}

          {shipment.remarks && (
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <strong className="text-slate-800 dark:text-slate-200">Operational Notes:</strong> {shipment.remarks}
            </div>
          )}
        </div>

        {/* Grand Total Ledger */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 flex justify-between">
            <span>Financial Breakdown</span>
            <span>INR (₹)</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Base Freight:</span>
              <span className="font-mono font-bold text-white">₹{(shipment.totalFreight || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-300">
              <span>Other Charges Subtotal:</span>
              <span className="font-mono font-bold text-white">₹{(shipment.totalOtherCharges || 0).toFixed(2)}</span>
            </div>

            {shipment.totalTaxAmount ? (
              <div className="flex justify-between text-slate-300">
                <span>Total GST / Tax:</span>
                <span className="font-mono font-bold text-emerald-400">₹{(shipment.totalTaxAmount || 0).toFixed(2)}</span>
              </div>
            ) : null}

            <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm font-black">
              <span className="text-blue-300">Grand Total:</span>
              <span className="font-mono text-xl text-emerald-400">
                ₹{(shipment.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-xs text-slate-400 pt-1">
              <span>Paid Amount:</span>
              <span className="font-mono text-slate-200">₹{(shipment.paidAmount || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-700/60 text-amber-300">
              <span>Balance Due:</span>
              <span className="font-mono text-sm">₹{(shipment.dueAmount || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700 text-[11px] text-slate-300">
            <span className="font-semibold text-slate-400">Amount in Words: </span>
            <span className="italic text-slate-200">{numberToWords(shipment.grandTotal || 0)}</span>
          </div>
        </div>
      </div>

      {/* Status Transition Modal */}
      {isStatusModalOpen && (
        <StatusTransitionModal
          shipment={shipment}
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          onSuccess={(updated) => {
            setShipment((prev) => (prev ? { ...prev, ...updated } : updated));
            fetchShipmentDetails(shipment.id);
          }}
        />
      )}
    </div>
  );
}
