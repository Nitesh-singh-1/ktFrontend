"use client";

import React, { useState, useEffect } from "react";
import { TripDto, TripStatus } from "@/types/tms";
import { tripService } from "services/tripService";
import TripModal from "@/app/components/trip/TripModal";
import TripDetailsModal from "@/app/components/trip/TripDetailsModal";
import { Truck, Plus, Search, AlertTriangle, Send, Flag, FileText, Eye, CheckCircle2 } from "lucide-react";
import { DataTable } from "@/app/components/ui/DataTable";

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
        return { text: "IN TRANSIT", class: "bg-[#4A90E2]/10 text-[#4A90E2] border-[#4A90E2]/20 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800" };
      case TripStatus.Arrived:
        return { text: "ARRIVED AT HUB", class: "bg-[#E7F1F2] text-[#25776F] border-[#D9E2E3] dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800" };
      case TripStatus.Completed:
        return { text: "COMPLETED", class: "bg-[#E7F1F2] text-[#2F9E8F] border-[#2F9E8F]/20 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800" };
      case TripStatus.Cancelled:
        return { text: "CANCELLED", class: "bg-[#D95C5C]/10 text-[#D95C5C] border-[#D95C5C]/20 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-700" };
      default:
        return { text: "MANIFESTED / LOADING", class: "bg-[#F4A261]/10 text-[#F4A261] border-[#F4A261]/20 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800" };
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header Banner - FleetPulse Solid Style */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[#E5EAEB] dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#111827] dark:text-white tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#2F8E86]" />
              <span>Manifest & Dispatch (LR / Truck Challans)</span>
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] rounded-full">
              Step 4 & 5: Manifest → Dispatch
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
            Consolidate booked Bilties into vehicle loading sheets (Manifest), assign driver/truck, and dispatch directly onto the road.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2.5 bg-[#2F8E86] hover:bg-[#25776F] text-white font-semibold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Challan</span>
        </button>
      </div>

      {/* Financial & Operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Metric */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Total Manifests / Challans</p>
          <p className="text-2xl font-bold text-[#111827] dark:text-white mt-1">{trips.length}</p>
          <p className="text-[10px] text-[#94A3B8] mt-1">{draftCount} loading / pending dispatch</p>
        </div>

        {/* Primary Metric */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Vehicles In-Transit</p>
          <p className="text-2xl font-bold text-[#111827] dark:text-white mt-1">{activeInTransit}</p>
          <p className="text-[10px] text-[#4A90E2] mt-1">Active on the road</p>
        </div>

        {/* Cargo Metric */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Total Loaded Freight</p>
          <p className="text-xl font-bold text-[#111827] dark:text-white font-mono mt-1">
            ₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-[#94A3B8] mt-1">Consolidated manifest cargo</p>
        </div>

        {/* Margin Metric */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Net Route Margin</p>
          <p className="text-xl font-bold text-[#2F9E8F] font-mono mt-1">
            ₹{totalMargin.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-[#64748B] mt-1">After driver advances & fuel</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search Challan / Manifest no, truck, driver, route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-20 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2F8E86]/30 focus:border-[#2F8E86]"
          />
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
          <button
            type="submit"
            className="absolute right-1.5 top-1 px-3 py-1 bg-[#2F8E86] hover:bg-[#25776F] text-white font-semibold rounded-md text-[11px] transition cursor-pointer"
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-[#2F8E86] text-white shadow-xs"
                    : "bg-[#F7F8F8] dark:bg-slate-800 text-[#64748B] dark:text-slate-300 hover:bg-[#E7F1F2] border border-[#D9E2E3]"
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
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-[#D95C5C]/30 text-[#D95C5C] rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Challans / Manifests Table */}
      <DataTable<TripDto>
        data={trips}
        loading={loading}
        loadingText="Loading Manifests & Truck Challans…"
        rowKey={(t) => t.id}
        emptyIcon={<Truck className="w-8 h-8" />}
        emptyTitle="No Manifests or Truck Challans Found"
        emptyMessage="Create your first Manifest / Truck Challan to assign a truck, driver, and load booked Bilties from Point A to Point B."
        emptyAction={
          <button onClick={() => setCreateModalOpen(true)} className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-semibold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create First Manifest & Challan
          </button>
        }
        columns={[
          {
            key: "tripNo",
            header: "Manifest / Challan No",
            render: (t) => (
              <button onClick={() => setSelectedTripId(t.id)} className="font-mono font-bold text-[#2F8E86] dark:text-teal-400 hover:underline cursor-pointer whitespace-nowrap">{t.tripNo}</button>
            ),
          },
          {
            key: "date",
            header: "Date",
            render: (t) => <span className="font-medium text-[#64748B] dark:text-slate-300 whitespace-nowrap">{t.tripDate ? t.tripDate.split("T")[0] : "—"}</span>,
          },
          {
            key: "vehicle",
            header: "Assigned Lorry / Truck",
            render: (t) => (
              <span className="font-mono font-bold text-[#111827] dark:text-white whitespace-nowrap px-2 py-0.5 bg-[#F7F8F8] dark:bg-slate-800 rounded border border-[#D9E2E3] dark:border-slate-700">{t.vehicleNo}</span>
            ),
          },
          {
            key: "driver",
            header: "Driver & Crew",
            render: (t) => (
              <div>
                <div className="font-semibold text-[#111827] dark:text-slate-200">{t.driverName || "—"}</div>
                {t.driverMobile && <div className="text-[10px] text-[#94A3B8] font-mono">{t.driverMobile}</div>}
              </div>
            ),
          },
          {
            key: "route",
            header: "Route (Point A → Point B)",
            render: (t) => (
              <div className="font-medium text-[#111827] dark:text-slate-200 flex items-center gap-1 whitespace-nowrap">
                <span className="text-[#111827] dark:text-white font-bold">{t.originLocationName || "Origin"}</span>
                <span className="text-[#4A90E2]">→</span>
                <span className="text-[#111827] dark:text-white font-bold">{t.destinationLocationName || "Dest"}</span>
              </div>
            ),
          },
          {
            key: "cargo",
            header: "Loaded Bilties",
            align: "center",
            render: (t) => (
              <div className="whitespace-nowrap">
                <span className="font-bold text-[#111827] dark:text-white px-2 py-0.5 bg-[#F7F8F8] dark:bg-slate-800 rounded">{t.shipments?.length || 0} Bilties</span>
                <div className="text-[10px] text-[#94A3B8] mt-0.5">{t.totalPackages || 0} PKGS</div>
              </div>
            ),
          },
          {
            key: "freight",
            header: "Freight (₹)",
            align: "right",
            render: (t) => <span className="font-mono font-bold text-[#111827] dark:text-white whitespace-nowrap">₹{(Number(t.totalFreightRevenue) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>,
          },
          {
            key: "status",
            header: "Status",
            align: "center",
            render: (t) => {
              const badge = getStatusBadge(t.status);
              return <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold border rounded-md ${badge.class}`}>{badge.text}</span>;
            },
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (t) => {
              const isDraft = t.status === TripStatus.Loading || t.status === TripStatus.Draft;
              const isInTransit = t.status === TripStatus.Dispatched || t.status === TripStatus.InTransit;
              return (
                <div className="flex items-center justify-end gap-1.5">
                  {isDraft && (
                    <button onClick={() => handleRowDispatch(t.id, t.tripNo)} className="px-2.5 py-1 bg-[#2F8E86] hover:bg-[#25776F] text-white font-semibold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-1" title="Dispatch Vehicle & Consignments">
                      <Send className="w-3 h-3" /> Dispatch
                    </button>
                  )}
                  {isInTransit && (
                    <button onClick={() => handleRowArrival(t.id, t.startOdometer)} className="px-2.5 py-1 bg-[#E7F1F2] hover:bg-[#D9E2E3] text-[#25776F] border border-[#D9E2E3] font-semibold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-1" title="Record Hub Arrival">
                      <Flag className="w-3 h-3" /> Arrived
                    </button>
                  )}
                  <button onClick={() => setSelectedTripId(t.id)} className="px-2.5 py-1 bg-white hover:bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] font-semibold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-1" title="Inspect Manifest, Add Fuel/Expenses & Print Pink Challan">
                    <FileText className="w-3 h-3 text-[#2F8E86]" /> Details
                  </button>
                </div>
              );
            },
          },
        ]}
      />

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
