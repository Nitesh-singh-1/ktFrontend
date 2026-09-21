"use client";

import React from "react";
import { ShipmentStatus, ShipmentStatusHistory } from "@/types/shipment";
import ShipmentStatusBadge, { STATUS_META } from "./ShipmentStatusBadge";

interface TrackingTimelineProps {
  currentStatus: ShipmentStatus;
  statusHistory: ShipmentStatusHistory[];
}

const ORDERED_STAGES = [
  ShipmentStatus.Booked,
  ShipmentStatus.Manifested,
  ShipmentStatus.InTransit,
  ShipmentStatus.OutForDelivery,
  ShipmentStatus.Delivered,
];

export default function TrackingTimeline({ currentStatus, statusHistory = [] }: TrackingTimelineProps) {
  const isCancelled = currentStatus === ShipmentStatus.Cancelled;
  const isReturned = currentStatus === ShipmentStatus.Returned;

  // Determine stage progress
  const currentStageIndex = ORDERED_STAGES.indexOf(currentStatus);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>📍</span> Consignment Tracking & Lifecycle
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Real-time status progression and audit timeline</p>
        </div>
        <ShipmentStatusBadge status={currentStatus} />
      </div>

      {/* Visual Stepper / Progress Bar for Standard Pipeline */}
      {!isCancelled && !isReturned ? (
        <div className="py-3 px-2">
          <div className="relative flex items-center justify-between">
            {/* Background Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 w-full z-0" />
            {/* Active Progress Line */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 transition-all duration-500 z-0"
              style={{
                width: `${
                  currentStageIndex >= 0
                    ? (currentStageIndex / (ORDERED_STAGES.length - 1)) * 100
                    : 0
                }%`,
              }}
            />

            {ORDERED_STAGES.map((stage, idx) => {
              const isPast = currentStageIndex > idx;
              const isCurrent = currentStageIndex === idx;
              const meta = STATUS_META[stage];

              return (
                <div key={stage} className="relative z-10 flex flex-col items-center group">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shadow-sm ${
                      isCurrent
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-100 scale-110"
                        : isPast
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-slate-400 border-2 border-slate-200"
                    }`}
                  >
                    {isPast ? "✓" : meta.icon}
                  </div>
                  <span
                    className={`text-[11px] font-bold mt-2 text-center whitespace-nowrap ${
                      isCurrent ? "text-indigo-600" : isPast ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          isCancelled ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-orange-50 border-orange-200 text-orange-800"
        }`}>
          <span className="text-2xl">{isCancelled ? "🚫" : "↩️"}</span>
          <div>
            <div className="text-sm font-bold">
              {isCancelled ? "Consignment Cancelled" : "Consignment Returned"}
            </div>
            <div className="text-xs opacity-80">
              {isCancelled
                ? "This shipment has been voided/cancelled."
                : "This shipment was marked for return to origin."}
            </div>
          </div>
        </div>
      )}

      {/* Vertical Detailed History Audit Trail */}
      <div className="pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Audit Log & Event History
        </h4>

        {statusHistory && statusHistory.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {statusHistory
              .slice()
              .reverse()
              .map((event, idx) => {
                const toMeta = STATUS_META[event.toStatus] || { label: "Status Updated", icon: "📌" };
                return (
                  <div key={event.id || idx} className="relative">
                    {/* Node Dot */}
                    <div className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white shadow-xs" />

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 hover:border-indigo-200 transition">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ShipmentStatusBadge status={event.toStatus} showIcon={false} />
                          {event.location && (
                            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                              <span>📍</span> {event.location}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(event.changedAt).toLocaleString('en-IN', {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>

                      {event.remarks && (
                        <p className="text-xs text-slate-600 mt-2 italic bg-white p-2 rounded-md border border-slate-100">
                          "{event.remarks}"
                        </p>
                      )}

                      <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                        <span>Updated by: <strong className="text-slate-600 font-semibold">{event.changedByUserName || "System"}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs">
            No status history transitions recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
