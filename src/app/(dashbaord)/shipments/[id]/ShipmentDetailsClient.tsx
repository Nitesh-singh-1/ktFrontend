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
              className="btn-primary"
            >
              Retry
            </button>
          )}
          <Link
            href="/shipments"
            className="btn-secondary"
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
      <div className="bg-white rounded-2xl p-6 border border-[#E5EAEB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/shipments"
              className="p-1.5 text-[#64748B] hover:text-[#111827] hover:bg-[#F7F8F8] rounded-lg transition"
              title="Back to consignments"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-[#111827] font-mono">
                  {shipment.shipmentNo}
                </h1>
                <ShipmentStatusBadge status={shipment.status} />
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
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
            className="px-4 py-2.5 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Update Status Stage</span>
          </button>

          <button
            type="button"
            onClick={() => printShipment(shipment)}
            className="px-4 py-2.5 bg-white hover:bg-[#E7F1F2] text-[#25776F] font-bold rounded-xl text-xs border border-[#D9E2E3] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Consignment Note</span>
          </button>

          <Link
            href={`/shipments/create?id=${shipment.id}`}
            className="px-4 py-2.5 bg-white hover:bg-[#E7F1F2] text-[#25776F] font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-[#D9E2E3]"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Link>
        </div>
      </div>

      {/* Movement & Route Ribbon */}
      <div className="bg-white border border-[#E5EAEB] p-5 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] text-[#64748B] uppercase tracking-widest font-bold">Origin</div>
            <div className="text-base font-bold text-[#111827]">{shipment.fromLocation}</div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#4A90E2] shrink-0" />
          <div>
            <div className="text-[10px] text-[#64748B] uppercase tracking-widest font-bold">Destination</div>
            <div className="text-base font-bold text-[#111827]">{shipment.toLocation}</div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <div className="text-[10px] text-[#64748B] uppercase font-bold">Assigned Vehicle</div>
            <div className="font-mono font-bold text-[#111827]">{shipment.truckNo || "NOT ASSIGNED"}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#64748B] uppercase font-bold">Invoice / Bill Ref</div>
            <div className="font-semibold text-[#111827]">{shipment.invoiceNo || "—"}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#64748B] uppercase font-bold">Payment Terms</div>
            <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold border ${
              shipment.paymentTerm === PaymentTerm.Paid
                ? "bg-[#E8F6F4] text-[#2F9E8F] border-[#C2E9E3]"
                : shipment.paymentTerm === PaymentTerm.TBB
                ? "bg-[#EFF6FF] text-[#4A90E2] border-[#BFDBFE]"
                : "bg-[#FEF6EE] text-[#F4A261] border-[#FBD38D]"
            }`}>
              {shipment.paymentTerm === PaymentTerm.Paid ? "PAID" : shipment.paymentTerm === PaymentTerm.TBB ? "TO BE BILLED" : "TO PAY"}
            </span>
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
        <div className="bg-white rounded-xl border border-[#E5EAEB] p-5 shadow-xs space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E5EAEB] pb-2 flex justify-between">
            <span>Consignor (Sender)</span>
            <span className="text-[#2F8E86] font-semibold flex items-center gap-1">
              <Upload className="w-3 h-3" /> Origin
            </span>
          </div>
          <div className="text-base font-bold text-[#111827]">{shipment.consignorName}</div>
          {shipment.consignorGstNo && (
            <div className="text-xs text-[#64748B]">
              <strong className="text-[#111827]">GSTIN:</strong> <span className="font-mono font-bold text-[#111827]">{shipment.consignorGstNo}</span>
            </div>
          )}
          <div className="text-xs text-[#64748B]">
            <strong className="text-[#111827]">Mobile:</strong> {shipment.consignorMobile || "—"}
          </div>
          <div className="text-xs text-[#64748B]">
            <strong className="text-[#111827]">Address:</strong> {shipment.consignorAddress || "—"}
          </div>
        </div>

        {/* Consignee */}
        <div className="bg-white rounded-xl border border-[#E5EAEB] p-5 shadow-xs space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E5EAEB] pb-2 flex justify-between">
            <span>Consignee (Receiver)</span>
            <span className="text-[#4A90E2] font-semibold flex items-center gap-1">
              <Download className="w-3 h-3" /> Destination
            </span>
          </div>
          <div className="text-base font-bold text-[#111827]">{shipment.consigneeName}</div>
          {shipment.consigneeGstNo && (
            <div className="text-xs text-[#64748B]">
              <strong className="text-[#111827]">GSTIN:</strong> <span className="font-mono font-bold text-[#111827]">{shipment.consigneeGstNo}</span>
            </div>
          )}
          <div className="text-xs text-[#64748B]">
            <strong className="text-[#111827]">Mobile:</strong> {shipment.consigneeMobile || "—"}
          </div>
          <div className="text-xs text-[#64748B]">
            <strong className="text-[#111827]">Address:</strong> {shipment.consigneeAddress || "—"}
          </div>
        </div>
      </div>

      {/* Cargo Items Table */}
      <div className="bg-white rounded-xl border border-[#E5EAEB] shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-[#F7F8F8] border-b border-[#E5EAEB] text-[#111827] text-xs font-bold uppercase tracking-wider">
          Attached Cargo Goods ({shipment.items?.length || 0})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F8F8] border-b border-[#E5EAEB] text-[#64748B] font-bold uppercase text-[10px]">
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
            <tbody className="divide-y divide-[#E5EAEB]">
              {shipment.items && shipment.items.length > 0 ? (
                shipment.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#F5FAFA]">
                    <td className="px-4 py-2.5 text-center font-bold text-[#94A3B8]">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-semibold text-[#111827]">{item.article || "—"}</td>
                    <td className="px-4 py-2.5 text-[#64748B]">{item.description || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-[#111827]">{item.weight || 0}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-[#111827]">₹{(item.rate || 0).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-center font-medium text-[#111827]">{item.quantity || 1}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-[#111827]">
                      ₹{(item.totalAmount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-[#94A3B8]">
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
        <div className="bg-white rounded-xl border border-[#E5EAEB] p-5 shadow-xs space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#111827] border-b border-[#E5EAEB] pb-2 flex justify-between">
            <span>Ancillary Charges & Line Items</span>
            <span className="text-[#2F8E86] font-semibold">{shipment.chargeItems?.length || 0} Added</span>
          </div>

          {shipment.chargeItems && shipment.chargeItems.length > 0 ? (
            <div className="divide-y divide-[#E5EAEB] text-xs">
              {shipment.chargeItems.map((c, i) => (
                <div key={i} className="py-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#111827]">{c.chargeName}</span>
                    {c.isTaxable && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#E7F1F2] text-[#25776F] font-bold border border-[#D9E2E3]">
                        Taxable
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-[#111827]">₹{(c.amount || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#94A3B8] py-4 text-center">No extra charges attached.</div>
          )}

          {shipment.remarks && (
            <div className="mt-4 p-3 bg-[#F7F8F8] rounded-lg border border-[#E5EAEB] text-xs text-[#64748B]">
              <strong className="text-[#111827]">Operational Notes:</strong> {shipment.remarks}
            </div>
          )}
        </div>

        {/* Grand Total Ledger */}
        <div className="bg-[#F7F8F8] rounded-2xl p-5 border border-[#E5EAEB] shadow-xs space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E5EAEB] pb-2 flex justify-between">
            <span>Financial Breakdown</span>
            <span>INR (₹)</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-[#64748B]">
              <span>Base Freight:</span>
              <span className="font-mono font-bold text-[#111827]">₹{(shipment.totalFreight || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-[#64748B]">
              <span>Other Charges Subtotal:</span>
              <span className="font-mono font-bold text-[#111827]">₹{(shipment.totalOtherCharges || 0).toFixed(2)}</span>
            </div>

            {shipment.totalTaxAmount ? (
              <div className="flex justify-between text-[#64748B]">
                <span>Total GST / Tax:</span>
                <span className="font-mono font-bold text-[#2F9E8F]">₹{(shipment.totalTaxAmount || 0).toFixed(2)}</span>
              </div>
            ) : null}

            <div className="pt-2 border-t border-[#D9E2E3] flex justify-between items-center text-sm font-bold">
              <span className="text-[#111827]">Grand Total:</span>
              <span className="font-mono text-xl text-[#2F8E86]">
                ₹{(shipment.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-xs text-[#64748B] pt-1">
              <span>Paid Amount:</span>
              <span className="font-mono text-[#2F9E8F] font-semibold">₹{(shipment.paidAmount || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-xs font-bold pt-1 border-t border-[#E5EAEB] text-[#F4A261]">
              <span>Balance Due:</span>
              <span className="font-mono text-sm">₹{(shipment.dueAmount || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E5EAEB] text-[11px] text-[#64748B]">
            <span className="font-semibold text-[#111827]">Amount in Words: </span>
            <span className="italic text-[#64748B]">{numberToWords(shipment.grandTotal || 0)}</span>
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
