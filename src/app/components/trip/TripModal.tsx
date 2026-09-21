"use client";

import React, { useState, useEffect } from "react";
import {
  CreateTripRequest,
  ShipmentDto,
  VehicleLookupItem,
  DriverLookupItem,
  LocationLookupItem,
} from "@/types/tms";
import { tripService } from "services/tripService";
import { fleetService } from "services/fleetService";
import SearchableSelect from "../ui/SearchableSelect";

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function TripModal({ isOpen, onClose, onSaved }: TripModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form Fields
  const [tripNo, setTripNo] = useState("");
  const [tripDate, setTripDate] = useState(new Date().toISOString().split("T")[0]);
  const [vehicleNo, setVehicleNo] = useState("");
  const [vehicleId, setVehicleId] = useState<number | undefined>(undefined);
  const [driverName, setDriverName] = useState("");
  const [driverMobile, setDriverMobile] = useState("");
  const [driverId, setDriverId] = useState<number | undefined>(undefined);
  const [originLocationName, setOriginLocationName] = useState("Pahari Patna Hub");
  const [originLocationId, setOriginLocationId] = useState<number | undefined>(undefined);
  const [destinationLocationName, setDestinationLocationName] = useState("");
  const [destinationLocationId, setDestinationLocationId] = useState<number | undefined>(undefined);
  const [startOdometer, setStartOdometer] = useState<number>(0);
  const [sealNo, setSealNo] = useState("");
  const [driverAdvanceCash, setDriverAdvanceCash] = useState<number>(0);
  const [driverAdvanceFuel, setDriverAdvanceFuel] = useState<number>(0);
  const [remarks, setRemarks] = useState("");

  // Available shipments to load
  const [availableShipments, setAvailableShipments] = useState<ShipmentDto[]>([]);
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<number[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchShipments();
    }
  }, [isOpen]);

  const resetForm = () => {
    setTripNo("");
    setTripDate(new Date().toISOString().split("T")[0]);
    setVehicleNo("");
    setVehicleId(undefined);
    setDriverName("");
    setDriverMobile("");
    setDriverId(undefined);
    setOriginLocationName("Pahari Patna Hub");
    setOriginLocationId(undefined);
    setDestinationLocationName("");
    setDestinationLocationId(undefined);
    setStartOdometer(0);
    setSealNo("");
    setDriverAdvanceCash(0);
    setDriverAdvanceFuel(0);
    setRemarks("");
    setSelectedShipmentIds([]);
    setError("");
  };

  const fetchShipments = async () => {
    try {
      setLoadingShipments(true);
      const list = await tripService.getUnmanifestedShipments();
      setAvailableShipments(list || []);
    } catch (err) {
      console.error("Fetch unmanifested shipments error:", err);
    } finally {
      setLoadingShipments(false);
    }
  };

  if (!isOpen) return null;

  const toggleShipmentSelection = (id: number) => {
    if (selectedShipmentIds.includes(id)) {
      setSelectedShipmentIds(selectedShipmentIds.filter((sId) => sId !== id));
    } else {
      setSelectedShipmentIds([...selectedShipmentIds, id]);
    }
  };

  const selectAllShipments = () => {
    if (selectedShipmentIds.length === availableShipments.length) {
      setSelectedShipmentIds([]);
    } else {
      setSelectedShipmentIds(availableShipments.map((s) => s.id));
    }
  };

  // Computations
  const selectedShipments = availableShipments.filter((s) => selectedShipmentIds.includes(s.id));
  const totalLoadedWeightKg = selectedShipments.reduce((sum, s) => {
    const w = s.items?.reduce((wSum, it) => wSum + (Number(it.weight) || 0), 0) || 0;
    return sum + w;
  }, 0);
  const totalLoadedPackages = selectedShipments.reduce((sum, s) => {
    const p = s.items?.reduce((pSum, it) => pSum + (Number(it.quantity) || 1), 0) || 1;
    return sum + p;
  }, 0);
  const totalLoadedRevenue = selectedShipments.reduce((sum, s) => sum + (Number(s.totalFreight) || Number(s.grandTotal) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim()) {
      setError("Assigned Vehicle / Lorry Number is required.");
      return;
    }
    if (!destinationLocationName.trim()) {
      setError("Destination Station / Hub is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload: CreateTripRequest = {
        tripNo: tripNo.trim() || undefined,
        tripDate,
        vehicleId,
        vehicleNo: vehicleNo.trim().toUpperCase(),
        driverId,
        driverName: driverName.trim() || undefined,
        driverMobile: driverMobile.trim() || undefined,
        originLocationId,
        originLocationName: originLocationName.trim() || undefined,
        destinationLocationId,
        destinationLocationName: destinationLocationName.trim() || undefined,
        startOdometer: Number(startOdometer) || 0,
        sealNo: sealNo.trim() || undefined,
        driverAdvanceCash: Number(driverAdvanceCash) || 0,
        driverAdvanceFuel: Number(driverAdvanceFuel) || 0,
        remarks: remarks.trim() || undefined,
        shipmentIdsToLoad: selectedShipmentIds.length > 0 ? selectedShipmentIds : undefined,
      };

      const res = await tripService.createTrip(payload);
      if (res.success || res.data) {
        onSaved();
        onClose();
      } else {
        setError(res.message || "Failed to create trip manifest.");
      }
    } catch (err: any) {
      console.error("Create trip error:", err);
      setError(err?.message || "Failed to create trip manifest.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🚚</span> Create Dispatch Trip Manifest (Loading Sheet)
            </h2>
            <p className="text-xs text-slate-500">
              Assign vehicle, driver, and batch-load booked consignments onto the dispatch manifest.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Top Row: Manifest Date & Route */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Trip / Manifest No
              </label>
              <input
                type="text"
                placeholder="Auto-generated (e.g. TRP-2026-0001)"
                value={tripNo}
                onChange={(e) => setTripNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-blue-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dispatch Date *
              </label>
              <input
                type="date"
                required
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Origin Station / Hub *
              </label>
              <SearchableSelect<LocationLookupItem>
                value={originLocationName}
                placeholder="Search origin..."
                onSearch={(q) => fleetService.lookupLocations(q)}
                getItemKey={(l) => l.id}
                getItemLabel={(l) => l.name}
                onChangeText={setOriginLocationName}
                onSelect={(l) => {
                  setOriginLocationId(l.id);
                  setOriginLocationName(l.name);
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Destination Station *
              </label>
              <SearchableSelect<LocationLookupItem>
                value={destinationLocationName}
                placeholder="Search destination..."
                onSearch={(q) => fleetService.lookupLocations(q)}
                getItemKey={(l) => l.id}
                getItemLabel={(l) => l.name}
                onChangeText={setDestinationLocationName}
                onSelect={(l) => {
                  setDestinationLocationId(l.id);
                  setDestinationLocationName(l.name);
                }}
              />
            </div>
          </div>

          {/* Vehicle & Driver Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assigned Truck No *
              </label>
              <SearchableSelect<VehicleLookupItem>
                value={vehicleNo}
                placeholder="Search vehicle..."
                onSearch={(q) => fleetService.lookupVehicles(q)}
                getItemKey={(v) => v.id}
                getItemLabel={(v) => v.vehicleNo}
                onChangeText={(t) => setVehicleNo(t.toUpperCase())}
                onSelect={(v) => {
                  setVehicleId(v.id);
                  setVehicleNo(v.vehicleNo);
                  if (v.driverName) setDriverName(v.driverName);
                  if (v.driverMobile) setDriverMobile(v.driverMobile);
                }}
                renderItem={(v) => (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono font-bold text-slate-900">{v.vehicleNo}</span>
                    <span className="text-[10px] text-slate-400">{v.vehicleType}</span>
                  </div>
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Driver Name
              </label>
              <SearchableSelect<DriverLookupItem>
                value={driverName}
                placeholder="Search driver..."
                onSearch={(q) => fleetService.lookupDrivers(q)}
                getItemKey={(d) => d.id}
                getItemLabel={(d) => d.name}
                onChangeText={setDriverName}
                onSelect={(d) => {
                  setDriverId(d.id);
                  setDriverName(d.name);
                  if (d.mobile) setDriverMobile(d.mobile);
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Driver Mobile
              </label>
              <input
                type="tel"
                placeholder="9876543210"
                value={driverMobile}
                onChange={(e) => setDriverMobile(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Start Odometer (Km)
              </label>
              <input
                type="number"
                placeholder="0"
                value={startOdometer === 0 ? "" : startOdometer}
                onChange={(e) => setStartOdometer(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Advances & Container Seal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Driver Cash Advance (₹)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={driverAdvanceCash === 0 ? "" : driverAdvanceCash}
                onChange={(e) => setDriverAdvanceCash(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Diesel / Fuel Advance (₹)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={driverAdvanceFuel === 0 ? "" : driverAdvanceFuel}
                onChange={(e) => setDriverAdvanceFuel(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Container / Truck Seal No
              </label>
              <input
                type="text"
                placeholder="e.g. SEAL-89201"
                value={sealNo}
                onChange={(e) => setSealNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Batch Consignment Loading Section */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  📦 Select Consignments to Load on Manifest
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                  {selectedShipmentIds.length} Selected
                </span>
              </div>

              {availableShipments.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllShipments}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  {selectedShipmentIds.length === availableShipments.length ? "Deselect All" : "Select All Available"}
                </button>
              )}
            </div>

            {loadingShipments ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading unmanifested consignments...</div>
            ) : availableShipments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No unmanifested consignments found with status &ldquo;Booked&rdquo;. You can still create a trip manifest and load consignments later.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                {availableShipments.map((shp) => {
                  const isChecked = selectedShipmentIds.includes(shp.id);
                  const weight = shp.items?.reduce((sum, it) => sum + (Number(it.weight) || 0), 0) || 0;
                  const pkgs = shp.items?.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0) || 1;

                  return (
                    <div
                      key={shp.id}
                      onClick={() => toggleShipmentSelection(shp.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition ${
                        isChecked ? "bg-blue-50/60" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-mono font-bold text-slate-900">{shp.shipmentNo}</div>
                          <div className="text-[11px] text-slate-500">
                            {shp.consignorName} → {shp.consigneeName} ({shp.fromLocation} to {shp.toLocation})
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-800">₹{shp.totalFreight || shp.grandTotal}</div>
                        <div className="text-[10px] text-slate-400">{pkgs} PKG • {weight} Kg</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Live Load Meter Footer */}
            {selectedShipmentIds.length > 0 && (
              <div className="p-3 bg-blue-900 text-white flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-4">
                  <span>Total Packages: {totalLoadedPackages}</span>
                  <span>Total Weight: {totalLoadedWeightKg.toLocaleString()} Kg ({(totalLoadedWeightKg / 1000).toFixed(2)} MT)</span>
                </div>
                <div>Freight Revenue: ₹{totalLoadedRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dispatch Instructions / Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Driver to follow NH-31, reach destination hub before 8 AM"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Generating Manifest..." : "Create Trip Manifest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
