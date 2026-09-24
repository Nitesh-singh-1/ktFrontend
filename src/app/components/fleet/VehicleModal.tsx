"use client";

import React, { useState, useEffect } from "react";
import { VehicleMaster, DriverLookupItem } from "@/types/shipment";
import { fleetService } from "services/fleetService";
import { Truck, X, AlertTriangle } from "lucide-react";

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialVehicle?: VehicleMaster | null;
}

const VEHICLE_BODY_TYPES = [
  { value: "Open Body Truck", label: "Open Body Truck (Full Truck Load)" },
  { value: "Closed Container", label: "Closed Container (Weatherproof)" },
  { value: "Trailer / 40ft Flatbed", label: "High-Capacity Trailer / Flatbed" },
  { value: "Mini Truck / LCV", label: "Mini Truck / LCV (Pickup / Tata Ace)" },
  { value: "Tanker", label: "Liquid / Chemical Tanker" },
  { value: "Refrigerated Container", label: "Cold Chain / Refrigerated Reefer" },
  { value: "Other", label: "Other Commercial Vehicle" },
];

export default function VehicleModal({
  isOpen,
  onClose,
  onSaved,
  initialVehicle,
}: VehicleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [vehicleNo, setVehicleNo] = useState("");
  const [vehicleType, setVehicleType] = useState("Open Body Truck");
  const [capacity, setCapacity] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [driverId, setDriverId] = useState<number | undefined>(undefined);
  const [driverName, setDriverName] = useState("");
  const [driverMobile, setDriverMobile] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [availableDrivers, setAvailableDrivers] = useState<DriverLookupItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchDrivers();
      if (initialVehicle) {
        setVehicleNo(initialVehicle.vehicleNo || "");
        setVehicleType(initialVehicle.vehicleType || "Open Body Truck");
        setCapacity(initialVehicle.capacity ? initialVehicle.capacity.toString() : "");
        setOwnerName(initialVehicle.ownerName || "");
        setOwnerMobile(initialVehicle.ownerMobile || "");
        setDriverId(initialVehicle.driverId);
        setDriverName(initialVehicle.driverName || "");
        setDriverMobile(initialVehicle.driverMobile || "");
        setIsActive(initialVehicle.isActive ?? true);
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialVehicle]);

  const fetchDrivers = async () => {
    try {
      const list = await fleetService.lookupDrivers();
      setAvailableDrivers(list || []);
    } catch (err) {
      console.error("Fetch drivers error:", err);
    }
  };

  const resetForm = () => {
    setVehicleNo("");
    setVehicleType("Open Body Truck");
    setCapacity("");
    setOwnerName("");
    setOwnerMobile("");
    setDriverId(undefined);
    setDriverName("");
    setDriverMobile("");
    setIsActive(true);
    setError("");
  };

  const handleDriverSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dId = Number(e.target.value);
    if (!dId) {
      setDriverId(undefined);
      setDriverName("");
      setDriverMobile("");
      return;
    }
    const found = availableDrivers.find((d) => d.id === dId);
    if (found) {
      setDriverId(found.id);
      setDriverName(found.name);
      setDriverMobile(found.mobile || "");
    }
  };

  const handleMobileChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    setOwnerMobile(digits);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim()) {
      setError("Vehicle / Lorry Registration No is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload: Partial<VehicleMaster> = {
        vehicleNo: vehicleNo.trim().toUpperCase(),
        vehicleType: vehicleType.trim() || undefined,
        capacity: capacity.trim() || undefined,
        ownerName: ownerName.trim() || undefined,
        ownerMobile: ownerMobile.trim() || undefined,
        driverId: driverId || undefined,
        driverName: driverName.trim() || undefined,
        driverMobile: driverMobile.trim() || undefined,
        isActive,
      };

      await fleetService.createVehicle(payload);
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Save vehicle error:", err);
      setError(err?.message || "Failed to save vehicle details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-sky-50/50 dark:bg-slate-800/60">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>{initialVehicle ? "Edit Fleet Vehicle" : "Add New Fleet Vehicle (Truck)"}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Register commercial vehicles for trip manifest and autocomplete.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Vehicle No & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle / Truck Reg No *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BR-01-GB-4589"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                className="w-full h-10 px-3.5 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle Body Type (Standardized)
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {VEHICLE_BODY_TYPES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Capacity & Driver Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Carrying Capacity (Tons / MT)
              </label>
              <input
                type="text"
                placeholder="e.g. 16 MT or 25 Tons"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full h-10 px-3.5 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Default Assigned Driver
              </label>
              <select
                value={driverId || ""}
                onChange={handleDriverSelect}
                className="w-full h-10 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">-- No Driver Assigned --</option>
                {availableDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.mobile ? `(${d.mobile})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Owner Details */}
          <div className="bg-sky-50/40 dark:bg-slate-800/40 p-3.5 rounded-xl border border-sky-100 dark:border-slate-800 space-y-3">
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Vehicle Ownership & Contact
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Owner / Transporter Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Singh Fleet"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Owner Mobile
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={ownerMobile}
                  onChange={(e) => handleMobileChange(e.target.value)}
                  className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span>Active in Vehicle Directory</span>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Saving..." : initialVehicle ? "Update Vehicle" : "Save Vehicle"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
