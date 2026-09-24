"use client";

import React, { useState, useEffect } from "react";
import {
  VehicleMaster,
  DriverMaster,
  LocationMaster,
} from "@/types/shipment";
import { fleetService } from "services/fleetService";
import VehicleModal from "@/app/components/fleet/VehicleModal";
import DriverModal from "@/app/components/fleet/DriverModal";
import LocationModal from "@/app/components/fleet/LocationModal";
import {
  MapPin,
  User,
  Truck,
  Plus,
  Search,
  AlertTriangle,
  Trash2,
  Building2,
  CheckCircle2,
} from "lucide-react";

// Order requested: Station/Hub -> Driver -> Vehicle
type MasterTab = "locations" | "drivers" | "vehicles";

export default function FleetMasterPage() {
  const [activeTab, setActiveTab] = useState<MasterTab>("locations");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Data lists
  const [locations, setLocations] = useState<LocationMaster[]>([]);
  const [drivers, setDrivers] = useState<DriverMaster[]>([]);
  const [vehicles, setVehicles] = useState<VehicleMaster[]>([]);

  // Modals
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationMaster | null>(null);

  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverMaster | null>(null);

  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleMaster | null>(null);

  useEffect(() => {
    fetchAllMasters();
  }, []);

  const fetchAllMasters = async () => {
    try {
      setLoading(true);
      setError(null);
      const [lList, dList, vList] = await Promise.all([
        fleetService.getLocations(),
        fleetService.getDrivers(),
        fleetService.getVehicles(),
      ]);
      setLocations(lList || []);
      setDrivers(dList || []);
      setVehicles(vList || []);
    } catch (err: any) {
      console.error("Error fetching fleet masters:", err);
      setError(err?.message || "Failed to load station and fleet masters.");
    } finally {
      setLoading(false);
    }
  };

  // Delete handlers
  const handleDeleteLocation = async (l: LocationMaster) => {
    if (!confirm(`Are you sure you want to remove Station ${l.name}?`)) return;
    try {
      await fleetService.deleteLocation(l.id);
      fetchAllMasters();
    } catch (err: any) {
      alert(err?.message || "Failed to delete station.");
    }
  };

  const handleDeleteDriver = async (d: DriverMaster) => {
    if (!confirm(`Are you sure you want to remove Driver ${d.name}?`)) return;
    try {
      await fleetService.deleteDriver(d.id);
      fetchAllMasters();
    } catch (err: any) {
      alert(err?.message || "Failed to delete driver.");
    }
  };

  const handleDeleteVehicle = async (v: VehicleMaster) => {
    if (!confirm(`Are you sure you want to remove Vehicle ${v.vehicleNo}?`)) return;
    try {
      await fleetService.deleteVehicle(v.id);
      fetchAllMasters();
    } catch (err: any) {
      alert(err?.message || "Failed to delete vehicle.");
    }
  };

  // Filtered lists
  const filteredLocations = locations.filter(
    (l) =>
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.code?.toLowerCase().includes(search.toLowerCase()) ||
      l.city?.toLowerCase().includes(search.toLowerCase()) ||
      l.state?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.licenseNo?.toLowerCase().includes(search.toLowerCase()) ||
      d.mobile?.includes(search)
  );

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.vehicleNo?.toLowerCase().includes(search.toLowerCase()) ||
      v.vehicleType?.toLowerCase().includes(search.toLowerCase()) ||
      v.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      v.driverName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-sky-100 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Stations, Drivers & Fleet Master
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800">
              Operations Directory
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maintain master records for operating stations/hubs, commercial drivers, and fleet vehicles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "locations" && (
            <button
              onClick={() => {
                setEditingLocation(null);
                setLocationModalOpen(true);
              }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Station / Hub</span>
            </button>
          )}

          {activeTab === "drivers" && (
            <button
              onClick={() => {
                setEditingDriver(null);
                setDriverModalOpen(true);
              }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Driver</span>
            </button>
          )}

          {activeTab === "vehicles" && (
            <button
              onClick={() => {
                setEditingVehicle(null);
                setVehicleModalOpen(true);
              }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Vehicle</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Overview (Ordered: Station/Hub -> Driver -> Vehicle) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Stations & Hubs */}
        <div
          onClick={() => setActiveTab("locations")}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
            activeTab === "locations"
              ? "bg-sky-50/80 border-sky-600 ring-1 ring-sky-600/30 dark:bg-sky-950/40 dark:border-sky-500"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">1. Stations & Operating Hubs</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{locations.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300 flex items-center justify-center font-bold text-lg">
              <MapPin className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
        </div>

        {/* 2. Drivers */}
        <div
          onClick={() => setActiveTab("drivers")}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
            activeTab === "drivers"
              ? "bg-sky-50/80 border-sky-600 ring-1 ring-sky-600/30 dark:bg-sky-950/40 dark:border-sky-500"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">2. Fleet Drivers</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{drivers.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300 flex items-center justify-center font-bold text-lg">
              <User className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
        </div>

        {/* 3. Vehicles */}
        <div
          onClick={() => setActiveTab("vehicles")}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
            activeTab === "vehicles"
              ? "bg-sky-50/80 border-sky-600 ring-1 ring-sky-600/30 dark:bg-sky-950/40 dark:border-sky-500"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">3. Fleet Vehicles (Trucks)</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{vehicles.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300 flex items-center justify-center font-bold text-lg">
              <Truck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Selector & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Navigation Tabs (Ordered: Station/Hub -> Driver -> Vehicle) */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          {[
            { id: "locations", label: "Stations & Hubs", icon: MapPin, count: locations.length },
            { id: "drivers", label: "Drivers", icon: User, count: drivers.length },
            { id: "vehicles", label: "Vehicles (Trucks)", icon: Truck, count: vehicles.length },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as MasterTab);
                  setSearch("");
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 dark:bg-sky-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-slate-700 dark:bg-sky-800 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder={`Search ${activeTab === 'locations' ? 'stations' : activeTab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Master Data Tables */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading station and fleet records...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: STATIONS & HUBS */}
            {activeTab === "locations" && (
              <div>
                {filteredLocations.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">No Stations / Hubs Found</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Add operational booking hubs and destination stations to enable route selection.
                    </p>
                    <button
                      onClick={() => {
                        setEditingLocation(null);
                        setLocationModalOpen(true);
                      }}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs shadow-xs transition cursor-pointer"
                    >
                      + Add First Station / Hub
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          <th className="py-3 px-4">Station / Hub Name</th>
                          <th className="py-3 px-4">Station Code</th>
                          <th className="py-3 px-4">City</th>
                          <th className="py-3 px-4">State</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                        {filteredLocations.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                              {l.name}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                              {l.code || "—"}
                            </td>
                            <td className="py-3.5 px-4 font-semibold">
                              {l.city || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                              {l.state || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingLocation(l);
                                    setLocationModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-sky-700 font-bold rounded-lg text-xs transition cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteLocation(l)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                                  title="Delete Station"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DRIVERS */}
            {activeTab === "drivers" && (
              <div>
                {filteredDrivers.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center">
                      <User className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">No Drivers Registered</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Add commercial drivers with license details and verified mobile numbers.
                    </p>
                    <button
                      onClick={() => {
                        setEditingDriver(null);
                        setDriverModalOpen(true);
                      }}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs shadow-xs transition cursor-pointer"
                    >
                      + Register First Driver
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          <th className="py-3 px-4">Driver Name</th>
                          <th className="py-3 px-4">License Number (DL)</th>
                          <th className="py-3 px-4">Mobile Number</th>
                          <th className="py-3 px-4">Residential Address</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                        {filteredDrivers.map((d) => (
                          <tr key={d.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                              {d.name}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {d.licenseNo || "—"}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300 font-semibold">
                              {d.mobile || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                              {d.address || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingDriver(d);
                                    setDriverModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-sky-700 font-bold rounded-lg text-xs transition cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteDriver(d)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                                  title="Delete Driver"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: VEHICLES */}
            {activeTab === "vehicles" && (
              <div>
                {filteredVehicles.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center">
                      <Truck className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">No Vehicles Found</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Register trucks and lorries to enable dispatch assignment in Challans.
                    </p>
                    <button
                      onClick={() => {
                        setEditingVehicle(null);
                        setVehicleModalOpen(true);
                      }}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs shadow-xs transition cursor-pointer"
                    >
                      + Add First Vehicle
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          <th className="py-3 px-4">Vehicle / Lorry No</th>
                          <th className="py-3 px-4">Body Type</th>
                          <th className="py-3 px-4">Carrying Capacity</th>
                          <th className="py-3 px-4">Assigned Driver</th>
                          <th className="py-3 px-4">Owner / Transporter</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                        {filteredVehicles.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                              {v.vehicleNo}
                            </td>
                            <td className="py-3.5 px-4 font-medium">
                              {v.vehicleType || "Truck"}
                            </td>
                            <td className="py-3.5 px-4 font-semibold">
                              {v.capacity || "—"}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900 dark:text-white">{v.driverName || "—"}</div>
                              {v.driverMobile && (
                                <div className="text-[10px] text-slate-400 font-mono">{v.driverMobile}</div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-medium">{v.ownerName || "Self Owned"}</div>
                              {v.ownerMobile && (
                                <div className="text-[10px] text-slate-400 font-mono">{v.ownerMobile}</div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingVehicle(v);
                                    setVehicleModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-sky-700 font-bold rounded-lg text-xs transition cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteVehicle(v)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                                  title="Delete Vehicle"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <LocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSaved={fetchAllMasters}
        initialLocation={editingLocation}
      />

      <DriverModal
        isOpen={driverModalOpen}
        onClose={() => setDriverModalOpen(false)}
        onSaved={fetchAllMasters}
        initialDriver={editingDriver}
      />

      <VehicleModal
        isOpen={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        onSaved={fetchAllMasters}
        initialVehicle={editingVehicle}
      />
    </div>
  );
}
