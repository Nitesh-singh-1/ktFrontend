"use client";

import React, { useState, useEffect } from "react";
import { TripDto, TripStatus } from "@/types/tms";
import { tripService } from "services/tripService";
import TripModal from "@/app/components/trip/TripModal";
import TripDetailsModal from "@/app/components/trip/TripDetailsModal";
import { Truck, Plus, Search, AlertTriangle, Send, Flag, FileText, Eye, CheckCircle2 } from "lucide-react";

export default function TripsPage() {
  const [trips, setTrips] = useState<TripDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);

  useEffect(() => {
    fetchTrips();
  }, [statusFilter]);

  const fetchTrips = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await tripService.getTrips({
        search: searchTerm || undefined,
        status: statusFilter !== "" ? Number(statusFilter) : undefined,
      });
      setTrips(res || []);
    } catch (err: any) {
      console.error("Fetch trips error:", err);
      setError(err?.message || "Failed to load Manifests & Truck Challans.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrips(search);
  };

  const handleRowDispatch = async (tripId: number, tripNo: string) => {
    if (!confirm(`Dispatch Manifest / Truck Challan ${tripNo}? All loaded consignments will automatically transition to "In Transit".`)) return;
    try {
      setLoading(true);
      await tripService.dispatchTrip(tripId);
      await fetchTrips();
    } catch (err: any) {
      alert(err?.message || "Failed to dispatch trip.");
    } finally {
      setLoading(false);
    }
  };

  const handleRowArrival = async (tripId: number, currentOdo?: number) => {
    const endOdo = prompt("Enter ending odometer reading (Km):", currentOdo?.toString() || "0");
    if (endOdo === null) return;
    try {
      setLoading(true);
      await tripService.arriveTrip(tripId, parseFloat(endOdo) || undefined);
      await fetchTrips();
    } catch (err: any) {
      alert(err?.message || "Failed to record arrival.");
    } finally {
      setLoading(false);
    }
  };

  // Financial KPIs
  const totalRevenue = trips.reduce((sum, t) => sum + (Number(t.totalFreightRevenue) || 0), 0);
  const totalMargin = trips.reduce((sum, t) => sum + (Number(t.netProfitMargin) || 0), 0);
  const activeInTransit = trips.filter((t) => t.status === TripStatus.Dispatched || t.status === TripStatus.InTransit).length;
  const draftCount = trips.filter((t) => t.status === TripStatus.Loading || t.status === TripStatus.Draft).length;

  const getStatusBadge = (status: TripStatus) => {
    switch (status) {
      case TripStatus.Dispatched:
      case TripStatus.InTransit:
        return { text: "IN TRANSIT", class: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800" };
      case TripStatus.Arrived:
        return { text: "ARRIVED AT HUB", class: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800" };
      case TripStatus.Completed:
        return { text: "COMPLETED", class: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800" };
      case TripStatus.Cancelled:
        return { text: "CANCELLED", class: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" };
      default:
        return { text: "MANIFESTED / LOADING", class: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800" };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner - Primary / Secondary / Neutral Design */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Manifest & Dispatch (LR / Truck Challans)</span>
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
              Step 4 & 5: Manifest → Dispatch
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Consolidate booked Bilties into vehicle loading sheets (Manifest), assign driver/truck, and dispatch directly onto the road.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Manifest & Challan</span>
        </button>
      </div>

      {/* Financial & Operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Neutral Metric */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Manifests / Challans</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{trips.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">{draftCount} loading / pending dispatch</p>
        </div>

        {/* Primary Metric */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Vehicles In-Transit</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{activeInTransit}</p>
          <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-1">Active on the road</p>
        </div>

        {/* Tertiary Metric */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Loaded Freight</p>
          <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
            ₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Consolidated manifest cargo</p>
        </div>

        {/* Semantic Success Metric */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Net Route Margin</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            ₹{totalMargin.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">After driver advances & fuel</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search Challan / Manifest no, truck, driver, route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-20 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <button
            type="submit"
            className="absolute right-1.5 top-1 px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-white font-bold rounded-md text-[11px] transition cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { label: "All Manifests", value: "" },
            { label: "Loading / Draft", value: TripStatus.Loading.toString() },
            { label: "In Transit", value: TripStatus.Dispatched.toString() },
            { label: "Arrived at Hub", value: TripStatus.Arrived.toString() },
            { label: "Completed", value: TripStatus.Completed.toString() },
          ].map((tab) => {
            const isSelected = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Challans / Manifests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-xs">Loading Manifests & Truck Challans...</div>
        ) : trips.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
              <Truck className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">No Manifests or Truck Challans Found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Create your first Manifest / Truck Challan to assign a truck, driver, and load booked Bilties from Point A to Point B.
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Manifest & Challan</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="py-3 px-4">Manifest / Challan No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Assigned Lorry / Truck</th>
                  <th className="py-3 px-4">Driver & Crew</th>
                  <th className="py-3 px-4">Route (Point A → Point B)</th>
                  <th className="py-3 px-4 text-center">Loaded Bilties</th>
                  <th className="py-3 px-4 text-right">Freight (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {trips.map((t) => {
                  const statusBadge = getStatusBadge(t.status);
                  const isDraft = t.status === TripStatus.Loading || t.status === TripStatus.Draft;
                  const isInTransit = t.status === TripStatus.Dispatched || t.status === TripStatus.InTransit;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      {/* Challan / Manifest No */}
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        <button
                          onClick={() => setSelectedTripId(t.id)}
                          className="hover:underline cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{t.tripNo}</span>
                        </button>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {t.tripDate ? t.tripDate.split("T")[0] : "—"}
                      </td>

                      {/* Vehicle */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                          {t.vehicleNo}
                        </span>
                      </td>

                      {/* Driver */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{t.driverName || "—"}</div>
                        {t.driverMobile && <div className="text-[10px] text-slate-400 font-mono">{t.driverMobile}</div>}
                      </td>

                      {/* Route */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <span className="text-slate-900 dark:text-white font-bold">{t.originLocationName || "Origin"}</span>
                          <span className="text-slate-400">→</span>
                          <span className="text-slate-900 dark:text-white font-bold">{t.destinationLocationName || "Dest"}</span>
                        </div>
                      </td>

                      {/* Loaded Cargo */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-slate-900 dark:text-white px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                          {t.shipments?.length || 0} Bilties
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{t.totalPackages || 0} PKGS</div>
                      </td>

                      {/* Revenue */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₹{(Number(t.totalFreightRevenue) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold border rounded-md ${statusBadge.class}`}>
                          {statusBadge.text}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Dispatch Action */}
                          {isDraft && (
                            <button
                              onClick={() => handleRowDispatch(t.id, t.tripNo)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                              title="Dispatch Vehicle & Consignments"
                            >
                              <Send className="w-3 h-3" />
                              <span>Dispatch</span>
                            </button>
                          )}

                          {/* 1-Click Arrival Action */}
                          {isInTransit && (
                            <button
                              onClick={() => handleRowArrival(t.id, t.startOdometer)}
                              className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-1"
                              title="Record Hub Arrival"
                            >
                              <Flag className="w-3 h-3" />
                              <span>Arrived</span>
                            </button>
                          )}

                          {/* Inspect & Print */}
                          <button
                            onClick={() => setSelectedTripId(t.id)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-1"
                            title="Inspect Manifest, Add Fuel/Expenses & Print Pink Challan"
                          >
                            <FileText className="w-3 h-3 text-slate-500" />
                            <span>Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Manifest & LR / Truck Challan Modal */}
      <TripModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSaved={fetchTrips}
      />

      {/* Challan Details, Expenses & Pink Challan Print Modal */}
      <TripDetailsModal
        isOpen={!!selectedTripId}
        onClose={() => setSelectedTripId(null)}
        tripId={selectedTripId}
        onUpdated={fetchTrips}
      />
    </div>
  );
}
