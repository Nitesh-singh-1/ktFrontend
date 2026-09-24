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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden animate-scaleIn">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-sky-400" />
              <span>Update Consignment Status</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Waybill / GR No: <strong className="text-white font-mono">{shipment.shipmentNo}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Current Status Banner */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Current Stage:
            </span>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${currentMeta.bg} ${currentMeta.text} ${currentMeta.border}`}>
              <CurrentIcon className="w-3.5 h-3.5" />
              <span>{currentMeta.label}</span>
            </div>
          </div>

          {allowedNext.length === 0 ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-400 text-xs font-semibold">
              This consignment is in terminal state ({currentMeta.label}). No further status transitions are permissible.
            </div>
          ) : (
            <>
              {/* Select Next Stage */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
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
                            ? "bg-sky-50 dark:bg-sky-950/60 border-sky-600 dark:border-sky-500 ring-2 ring-sky-500/20 shadow-xs"
                            : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? "bg-sky-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={`text-xs font-bold ${isSelected ? "text-sky-900 dark:text-white" : "text-slate-800 dark:text-slate-200"}`}>
                            {meta.label}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">Stage code #{stage}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Current Hub / Checkpoint Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Warehouse Hub 2, Patna Junction, In-Transit Toll"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Transition Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dispatched with driver Ramesh, vehicle inspected, loaded onto Lorry NL-01-A-1234"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
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
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>

            {allowedNext.length > 0 && (
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition shadow-md shadow-sky-600/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Updating..." : "Commit Status Change"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
