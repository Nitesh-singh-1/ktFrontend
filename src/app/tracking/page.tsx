"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { trackingService } from "services/trackingService";
import { PublicTrackingDto } from "@/types/tms";

export default function PublicTrackingPage() {
  const [lrNo, setLrNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<PublicTrackingDto | null>(null);

  // Auto-search if query param ?lrNo= is present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryLr = params.get("lrNo") || params.get("no");
      if (queryLr) {
        setLrNo(queryLr);
        handleTrack(queryLr);
      }
    }
  }, []);

  const handleTrack = async (searchLr: string) => {
    if (!searchLr.trim()) {
      setError("Please enter a valid Waybill / Consignment / GR Number.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTrackingData(null);
      const res = await trackingService.getPublicTracking(searchLr.trim());
      if (res && res.trackingNumber) {
        setTrackingData(res);
      } else {
        setError(`No tracking record found for "${searchLr}". Please verify your Waybill number.`);
      }
    } catch (err: any) {
      console.error("Tracking error:", err);
      setError(err?.message || `Unable to locate consignment "${searchLr}". Please check the number.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTrack(lrNo);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Brand Bar */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-6 sm:px-12 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
            KT
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900">
              K-Transport Tracking Portal
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Live Freight & Waybill Status Radar
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
        >
          Staff Login →
        </Link>
      </header>

      {/* Hero Search Section */}
      <div className="bg-gradient-to-b from-blue-900 to-slate-900 text-white py-12 px-6 text-center shadow-inner">
        <div className="max-w-2xl mx-auto space-y-4">
          <span className="text-xs uppercase font-bold tracking-widest px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full inline-block">
            Universal Consignment Tracker
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Track Your Consignment in Real-Time
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            Enter your Goods Receipt (GR) or Lorry Receipt (LR) number to monitor route dispatch, hub transit, and proof of delivery.
          </p>

          <form onSubmit={handleSubmit} className="pt-2 max-w-lg mx-auto flex gap-2">
            <input
              type="text"
              placeholder="e.g. GR-2026-0001 or LR Number..."
              value={lrNo}
              onChange={(e) => setLrNo(e.target.value)}
              className="flex-1 px-4 py-3 bg-white text-slate-900 rounded-xl text-xs sm:text-sm font-mono font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Tracking..." : "Track Now"}
            </button>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-8 space-y-6">
        {/* Error Notice */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2.5">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="p-16 text-center">
            <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Querying consignment satellite timeline...</p>
          </div>
        )}

        {/* Tracking Details & Visual Timeline */}
        {trackingData && !loading && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-200">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Waybill / LR Number</div>
                  <div className="text-xl font-mono font-black text-blue-600">{trackingData.trackingNumber}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                    {trackingData.currentStatus || "In Transit"}
                  </span>
                </div>
              </div>

              {/* Route & Cargo Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Origin Hub</p>
                  <p className="font-bold text-slate-900 mt-0.5">{trackingData.fromLocation || "Origin Station"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Destination</p>
                  <p className="font-bold text-slate-900 mt-0.5">{trackingData.toLocation || "Destination City"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Booking Date</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{trackingData.bookingDate ? trackingData.bookingDate.split("T")[0] : "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Packages</p>
                  <p className="font-bold text-slate-900 mt-0.5">{trackingData.totalPackages || 1} PKGS ({trackingData.totalWeightKg || 0} Kg)</p>
                </div>
              </div>

              {/* Delivery Receipt Details if Delivered */}
              {trackingData.deliveredToPerson && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-800">✅ Delivered Successfully</span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Received by: <span className="font-bold">{trackingData.deliveredToPerson}</span>
                    </p>
                  </div>
                  {trackingData.deliveredAt && (
                    <span className="text-[10px] text-emerald-600 font-mono">
                      {trackingData.deliveredAt.split("T")[0]}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Event Timeline Stepper */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-3">
                <span>📍</span> Waybill Journey & Milestone Audit Log
              </h3>

              {trackingData.timeline && trackingData.timeline.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {trackingData.timeline.map((event, idx) => (
                    <div key={idx} className="relative group">
                      {/* Node Bullet */}
                      <div
                        className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                          event.isCompleted ? "border-blue-600 bg-blue-600 ring-2 ring-blue-100" : "border-slate-300"
                        }`}
                      />

                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{event.eventTitle}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{event.timestamp ? event.timestamp.split("T")[0] : ""}</span>
                        </div>
                        {event.location && (
                          <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
                            Station / Hub: {event.location}
                          </p>
                        )}
                        {event.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Consignment booked and scheduled for dispatch.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        Enterprise Freight Dispatch System • Powered by K-Transport TMS
      </footer>
    </div>
  );
}
