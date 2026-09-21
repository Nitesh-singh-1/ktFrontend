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

type MasterTab = "vehicles" | "drivers" | "locations";

export default function FleetMasterPage() {
  const [activeTab, setActiveTab] = useState<MasterTab>("vehicles");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Data lists
  const [vehicles, setVehicles] = useState<VehicleMaster[]>([]);
  const [drivers, setDrivers] = useState<DriverMaster[]>([]);
  const [locations, setLocations] = useState<LocationMaster[]>([]);

  // Modals
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleMaster | null>(null);

  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverMaster | null>(null);

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationMaster | null>(null);

  useEffect(() => {
    fetchAllMasters();
  }, []);

  const fetchAllMasters = async () => {
    try {
      setLoading(true);
      setError(null);
      const [vList, dList, lList] = await Promise.all([
        fleetService.getVehicles(),
        fleetService.getDrivers(),
        fleetService.getLocations(),
      ]);
      setVehicles(vList || []);
      setDrivers(dList || []);
      setLocations(lList || []);
    } catch (err: any) {
      console.error("Error fetching fleet masters:", err);
      setError(err?.message || "Failed to load fleet and station masters.");
    } finally {
      setLoading(false);
    }
  };

  // Delete handlers
  const handleDeleteVehicle = async (v: VehicleMaster) => {
    if (!confirm(`Are you sure you want to remove Vehicle ${v.vehicleNo}?`)) return;
    try {
      await fleetService.deleteVehicle(v.id);
      fetchAllMasters();
    } catch (err: any) {
      alert(err?.message || "Failed to delete vehicle.");
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

  const handleDeleteLocation = async (l: LocationMaster) => {
    if (!confirm(`Are you sure you want to remove Station ${l.name}?`)) return;
    try {
      await fleetService.deleteLocation(l.id);
      fetchAllMasters();
    } catch (err: any) {
      alert(err?.message || "Failed to delete station.");
    }
  };

  // Filtered lists
  const filteredVehicles = vehicles.filter(
    (v) =>
      v.vehicleNo?.toLowerCase().includes(search.toLowerCase()) ||
      v.vehicleType?.toLowerCase().includes(search.toLowerCase()) ||
      v.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      v.driverName?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.licenseNo?.toLowerCase().includes(search.toLowerCase()) ||
      d.mobile?.includes(search)
  );

  const filteredLocations = locations.filter(
    (l) =>
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.code?.toLowerCase().includes(search.toLowerCase()) ||
      l.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Fleet, Drivers & Stations Master
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              TMS Masters
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maintain your master registry of vehicles (trucks), drivers, and routing stations/hubs for quick autocomplete.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "vehicles" && (
            <button
              onClick={() => {
                setEditingVehicle(null);
                setVehicleModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <span>+</span>
              <span>Add Vehicle</span>
            </button>
          )}

          {activeTab === "drivers" && (
            <button
              onClick={() => {
                setEditingDriver(null);
                setDriverModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <span>+</span>
              <span>Add Driver</span>
            </button>
          )}

          {activeTab === "locations" && (
            <button
              onClick={() => {
                setEditingLocation(null);
                setLocationModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <span>+</span>
              <span>Add Station / Hub</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab("vehicles")}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
            activeTab === "vehicles" ? "bg-blue-50/70 border-blue-600 ring-1 ring-blue-600/30" : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Fleet Vehicles (Trucks)</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{vehicles.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
              🚚
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab("drivers")}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
            activeTab === "drivers" ? "bg-purple-50/70 border-purple-600 ring-1 ring-purple-600/30" : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Fleet Drivers</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{drivers.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
              👨‍✈️
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab("locations")}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
            activeTab === "locations" ? "bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-600/30" : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Stations & Hubs</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{locations.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
              📍
            </div>
          </div>
        </div>
      </div>

      {/* Tab Selector & Search Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          {[
            { id: "vehicles", label: "🚚 Vehicles (Trucks)", count: vehicles.length },
            { id: "drivers", label: "👨‍✈️ Drivers", count: drivers.length },
            { id: "locations", label: "📍 Stations & Hubs", count: locations.length },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as MasterTab);
                  setSearch("");
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-700"
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
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Master Data Tables */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading fleet and station records...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: VEHICLES */}
            {activeTab === "vehicles" && (
              <div>
                {filteredVehicles.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <div className="text-4xl">🚚</div>
                    <p className="text-sm font-bold text-slate-800">No Vehicles Found</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Add your trucks and lorries to enable rapid vehicle selection and dispatch assignment.
                    </p>
                    <button
                      onClick={() => {
                        setEditingVehicle(null);
                        setVehicleModalOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition cursor-pointer"
                    >
                      + Add First Vehicle
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          <th className="py-3 px-4">Vehicle / Lorry No</th>
                          <th className="py-3 px-4">Body Type</th>
                          <th className="py-3 px-4">Carrying Capacity</th>
                          <th className="py-3 px-4">Assigned Driver</th>
                          <th className="py-3 px-4">Owner / Transporter</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredVehicles.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                              {v.vehicleNo}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-700">
                              {v.vehicleType || "Truck"}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                              {v.capacity || "—"}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900">{v.driverName || "—"}</div>
                              {v.driverMobile && (
                                <div className="text-[10px] text-slate-400 font-mono">{v.driverMobile}</div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-slate-800">{v.ownerName || "Self Owned"}</div>
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
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold rounded-lg text-xs transition cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteVehicle(v)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                                  title="Delete Vehicle"
                                >
                                  🗑️
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
                    <div className="text-4xl">👨‍✈️</div>
                    <p className="text-sm font-bold text-slate-800">No Drivers Registered</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Add commercial drivers with driving license numbers and contact information.
                    </p>
                    <button
                      onClick={() => {
                        setEditingDriver(null);
                        setDriverModalOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition cursor-pointer"
                    >
                      + Register First Driver
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          <th className="py-3 px-4">Driver Name</th>
                          <th className="py-3 px-4">License Number (DL)</th>
                          <th className="py-3 px-4">Mobile Number</th>
                          <th className="py-3 px-4">Residential Address</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredDrivers.map((d) => (
                          <tr key={d.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {d.name}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                              {d.licenseNo || "—"}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                              {d.mobile || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                              {d.address || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingDriver(d);
                                    setDriverModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold rounded-lg text-xs transition cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteDriver(d)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                                  title="Delete Driver"
                                >
                                  🗑️
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

            {/* TAB 3: STATIONS & HUBS */}
            {activeTab === "locations" && (
              <div>
                {filteredLocations.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <div className="text-4xl">📍</div>
                    <p className="text-sm font-bold text-slate-800">No Stations / Hubs Found</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Add operational hubs and destination cities to empower route autocomplete in waybills.
                    </p>
                    <button
                      onClick={() => {
                        setEditingLocation(null);
                        setLocationModalOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition cursor-pointer"
                    >
                      + Add First Station / Hub
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          <th className="py-3 px-4">Station / Hub Name</th>
                          <th className="py-3 px-4">Station Code</th>
                          <th className="py-3 px-4">City</th>
                          <th className="py-3 px-4">State</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredLocations.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {l.name}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                              {l.code || "—"}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                              {l.city || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {l.state || "—"}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingLocation(l);
                                    setLocationModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold rounded-lg text-xs transition cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteLocation(l)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                                  title="Delete Station"
                                >
                                  🗑️
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
      <VehicleModal
        isOpen={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        onSaved={fetchAllMasters}
        initialVehicle={editingVehicle}
      />

      <DriverModal
        isOpen={driverModalOpen}
        onClose={() => setDriverModalOpen(false)}
        onSaved={fetchAllMasters}
        initialDriver={editingDriver}
      />

      <LocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSaved={fetchAllMasters}
        initialLocation={editingLocation}
      />
    </div>
  );
}
