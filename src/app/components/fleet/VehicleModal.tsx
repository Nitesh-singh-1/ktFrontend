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

const OWNER_TYPES = [
  { value: "Self Owned", label: "Self Owned Fleet" },
  { value: "Market / Attached", label: "Market / Attached Vehicle" },
  { value: "Contract", label: "Third-Party Contract" },
];

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

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
  const [ownerType, setOwnerType] = useState("Self Owned");
  const [capacityTons, setCapacityTons] = useState<number | string>("");
  const [engineNo, setEngineNo] = useState("");
  const [chassisNo, setChassisNo] = useState("");
  const [fitnessValidUntil, setFitnessValidUntil] = useState("");
  const [insuranceValidUntil, setInsuranceValidUntil] = useState("");
  const [permitValidUntil, setPermitValidUntil] = useState("");
  
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
        setOwnerType(initialVehicle.ownerType || "Self Owned");
        setCapacityTons(initialVehicle.capacityTons ?? (initialVehicle as any).capacity ?? "");
        setEngineNo(initialVehicle.engineNo || "");
        setChassisNo(initialVehicle.chassisNo || "");
        setFitnessValidUntil(initialVehicle.fitnessValidUntil || "");
        setInsuranceValidUntil(initialVehicle.insuranceValidUntil || "");
        setPermitValidUntil(initialVehicle.permitValidUntil || "");
        setOwnerName((initialVehicle as any).ownerName || "");
        setOwnerMobile((initialVehicle as any).ownerMobile || "");
        setDriverId((initialVehicle as any).driverId);
        setDriverName((initialVehicle as any).driverName || "");
        setDriverMobile((initialVehicle as any).driverMobile || "");
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
    setOwnerType("Self Owned");
    setCapacityTons("");
    setEngineNo("");
    setChassisNo("");
    setFitnessValidUntil("");
    setInsuranceValidUntil("");
    setPermitValidUntil("");
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

      const parsedCapacity = typeof capacityTons === "string" ? parseFloat(capacityTons) || 0 : (capacityTons || 0);

      const payload: Partial<VehicleMaster> & { [key: string]: any } = {
        vehicleNo: vehicleNo.trim().toUpperCase(),
        vehicleType: vehicleType.trim() || undefined,
        ownerType: ownerType.trim() || undefined,
        capacityTons: parsedCapacity,
        capacity: parsedCapacity > 0 ? `${parsedCapacity} MT` : undefined,
        engineNo: engineNo.trim().toUpperCase() || undefined,
        chassisNo: chassisNo.trim().toUpperCase() || undefined,
        fitnessValidUntil: fitnessValidUntil || undefined,
        insuranceValidUntil: insuranceValidUntil || undefined,
        permitValidUntil: permitValidUntil || undefined,
        ownerName: ownerName.trim() ? toTitleCase(ownerName.trim()) : undefined,
        ownerMobile: ownerMobile.trim() || undefined,
        driverId: driverId || undefined,
        driverName: driverName.trim() ? toTitleCase(driverName.trim()) : undefined,
        driverMobile: driverMobile.trim() || undefined,
        isActive,
      };

      if (initialVehicle && initialVehicle.id) {
        await fleetService.updateVehicle(initialVehicle.id, payload);
      } else {
        await fleetService.createVehicle(payload);
      }
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Vehicle No & Body Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle / Truck Reg No * (ALL CAPS)
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
                Vehicle Body Type
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

          {/* Owner Type & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ownership Category
              </label>
              <select
                value={ownerType}
                onChange={(e) => setOwnerType(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {OWNER_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Carrying Capacity (in Metric Tons / MT)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 16.5"
                value={capacityTons}
                onChange={(e) => setCapacityTons(e.target.value)}
                className="w-full h-10 px-3.5 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Engine & Chassis Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Engine Number
              </label>
              <input
                type="text"
                placeholder="e.g. 6DTI987654"
                value={engineNo}
                onChange={(e) => setEngineNo(e.target.value.toUpperCase())}
                className="w-full h-10 px-3.5 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Chassis Number
              </label>
              <input
                type="text"
                placeholder="e.g. MAT45892300189"
                value={chassisNo}
                onChange={(e) => setChassisNo(e.target.value.toUpperCase())}
                className="w-full h-10 px-3.5 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Validity Compliance Dates */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Document Expiries & Compliance
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Fitness Valid Until
                </label>
                <input
                  type="date"
                  value={fitnessValidUntil}
                  onChange={(e) => setFitnessValidUntil(e.target.value)}
                  className="w-full h-9 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Insurance Valid Until
                </label>
                <input
                  type="date"
                  value={insuranceValidUntil}
                  onChange={(e) => setInsuranceValidUntil(e.target.value)}
                  className="w-full h-9 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  National Permit Until
                </label>
                <input
                  type="date"
                  value={permitValidUntil}
                  onChange={(e) => setPermitValidUntil(e.target.value)}
                  className="w-full h-9 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Assigned Driver & Owner Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Owner / Transporter Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Singh Fleet"
                value={ownerName}
                onChange={(e) => setOwnerName(toTitleCase(e.target.value))}
                className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 capitalize"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Owner Mobile Number (10 Digits)
            </label>
            <input
              type="tel"
              maxLength={10}
              placeholder="9876543210"
              value={ownerMobile}
              onChange={(e) => handleMobileChange(e.target.value)}
              className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
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
              <span>Active in Fleet Directory</span>
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
