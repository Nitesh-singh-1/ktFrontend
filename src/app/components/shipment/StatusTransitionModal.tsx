"use client";

import React, { useState } from "react";
import { Shipment, ShipmentStatus, UpdateShipmentStatusRequest } from "@/types/shipment";
import { STATUS_META } from "./ShipmentStatusBadge";
import { shipmentService } from "services/shipmentService";
import { RefreshCw, X } from "lucide-react";

interface StatusTransitionModalProps {
  shipment: Shipment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedShipment: Shipment) => void;
}

// State Machine transitions
const ALLOWED_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  [ShipmentStatus.Draft]: [ShipmentStatus.Booked, ShipmentStatus.Cancelled],
  [ShipmentStatus.Booked]: [ShipmentStatus.Manifested, ShipmentStatus.InTransit, ShipmentStatus.Cancelled],
  [ShipmentStatus.Manifested]: [ShipmentStatus.InTransit, ShipmentStatus.Cancelled],
  [ShipmentStatus.InTransit]: [ShipmentStatus.OutForDelivery, ShipmentStatus.Delivered, ShipmentStatus.Returned],
  [ShipmentStatus.OutForDelivery]: [ShipmentStatus.Delivered, ShipmentStatus.Returned],
  [ShipmentStatus.Delivered]: [],
  [ShipmentStatus.Cancelled]: [],
  [ShipmentStatus.Returned]: [],
};

export default function StatusTransitionModal({
  shipment,
  isOpen,
  onClose,
  onSuccess,
}: StatusTransitionModalProps) {
  const allowedNext = ALLOWED_TRANSITIONS[shipment.status] || [];

  const [selectedStatus, setSelectedStatus] = useState<ShipmentStatus>(
    allowedNext.length > 0 ? allowedNext[0] : shipment.status
  );
  const [location, setLocation] = useState(shipment.toLocation || "");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const req: UpdateShipmentStatusRequest = {
        newStatus: Number(selectedStatus),
        location: location.trim() || undefined,
        remarks: remarks.trim() || undefined,
      };

      const res = await shipmentService.updateShipmentStatus(shipment.id, req);
      if (res.success) {
        onSuccess(res.data || { ...shipment, status: req.newStatus });
        onClose();
      } else {
        setError(res.message || "Failed to update shipment status.");
      }
    } catch (err: any) {
      console.error("Status update error:", err);
      setError(err?.message || "Something went wrong while updating status.");
    } finally {
      setLoading(false);
    }
  };

  const currentMeta = STATUS_META[shipment.status];
  const CurrentIcon = currentMeta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-[#D9E2E3] dark:border-slate-800 max-w-lg w-full overflow-hidden animate-scaleIn">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 text-[#111827] dark:text-white flex items-center justify-between border-b border-[#E5EAEB] dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <span className="p-1.5 bg-[#E7F1F2] text-[#2F8E86] rounded-lg">
                <RefreshCw className="w-4 h-4 text-[#2F8E86]" />
              </span>
              <span>Update Consignment Status</span>
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Waybill / GR No: <strong className="text-[#2F8E86] font-mono">{shipment.shipmentNo}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#111827] dark:hover:text-white p-1 rounded-md transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Current Status Banner */}
          <div className="p-3.5 bg-[#F7F8F8] dark:bg-slate-800/60 rounded-xl border border-[#E5EAEB] dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
              Current Stage:
            </span>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${currentMeta.bg} ${currentMeta.text} ${currentMeta.border}`}>
              <CurrentIcon className="w-3.5 h-3.5" />
              <span>{currentMeta.label}</span>
            </div>
          </div>

          {allowedNext.length === 0 ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[#B76E32] text-xs font-semibold">
              This consignment is in terminal state ({currentMeta.label}). No further status transitions are permissible.
            </div>
          ) : (
            <>
              {/* Select Next Stage */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-300 mb-2">
                  Select Next Status Stage *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {allowedNext.map((stage) => {
                    const meta = STATUS_META[stage];
                    const IconComp = meta.icon;
                    const isSelected = selectedStatus === stage;
                    return (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => setSelectedStatus(stage)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                          isSelected
                            ? "bg-[#E7F1F2] dark:bg-slate-800 border-[#2F8E86] ring-2 ring-[#2F8E86]/20 shadow-2xs"
                            : "bg-white dark:bg-slate-800/80 border-[#E5EAEB] dark:border-slate-700 hover:bg-[#F5FAFA] dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? "bg-[#2F8E86] text-white" : "bg-slate-100 dark:bg-slate-700 text-[#64748B] dark:text-slate-300"}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={`text-xs font-bold ${isSelected ? "text-[#25776F] dark:text-white" : "text-[#111827] dark:text-slate-200"}`}>
                            {meta.label}
                          </div>
                          <div className="text-[10px] text-[#64748B] dark:text-slate-400">Stage code #{stage}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-300 mb-1">
                  Current Hub / Checkpoint Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Warehouse Hub 2, Patna Junction, In-Transit Toll"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-300 mb-1">
                  Transition Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dispatched with driver Ramesh, vehicle inspected, loaded onto Lorry NL-01-A-1234"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
                />
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-semibold rounded-lg">
              {error}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5EAEB] dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>

            {allowedNext.length > 0 && (
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? "Updating..." : "Update"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
