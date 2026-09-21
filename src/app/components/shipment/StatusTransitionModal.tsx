"use client";

import React, { useState } from "react";
import { Shipment, ShipmentStatus, UpdateShipmentStatusRequest } from "@/types/shipment";
import { STATUS_META } from "./ShipmentStatusBadge";
import { shipmentService } from "services/shipmentService";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-scaleIn">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <span>🚀</span> Update Consignment Status
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Waybill / GR No: <strong className="text-white font-mono">{shipment.shipmentNo}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-md transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Current Status Banner */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Current Stage:
            </span>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${currentMeta.bg} ${currentMeta.text} ${currentMeta.border}`}>
              {currentMeta.icon} {currentMeta.label}
            </div>
          </div>

          {allowedNext.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
              This consignment is in terminal state ({currentMeta.label}). No further status transitions are permissible.
            </div>
          ) : (
            <>
              {/* Select Next Stage */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Select Next Status Stage *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {allowedNext.map((stage) => {
                    const meta = STATUS_META[stage];
                    const isSelected = selectedStatus === stage;
                    return (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => setSelectedStatus(stage)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xl">{meta.icon}</span>
                        <div>
                          <div className={`text-xs font-bold ${isSelected ? "text-indigo-900" : "text-slate-800"}`}>
                            {meta.label}
                          </div>
                          <div className="text-[10px] text-slate-500">Stage code #{stage}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Current Hub / Checkpoint Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Warehouse Hub 2, Patna Junction, In-Transit Toll"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Transition Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dispatched with driver Ramesh, vehicle inspected, loaded onto Lorry NL-01-A-1234"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
              {error}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>

            {allowedNext.length > 0 && (
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
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
