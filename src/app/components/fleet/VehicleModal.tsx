"use client";

import React, { useState, useEffect } from "react";
import { VehicleMaster, DriverLookupItem } from "@/types/shipment";
import { fleetService } from "services/fleetService";
import { Truck, X, AlertTriangle } from "lucide-react";
import { sanitizeMobile, validateMobile, firstError } from "@/utils/validation";
import CustomSelect from "@/app/components/ui/CustomSelect";
import { DatePicker } from "@/app/components/ui/DatePicker";

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
  const [pucValidUntil, setPucValidUntil] = useState("");
  const [taxValidUntil, setTaxValidUntil] = useState("");

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
        setPucValidUntil(initialVehicle.pucValidUntil || "");
        setTaxValidUntil(initialVehicle.taxValidUntil || "");
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
    setPucValidUntil("");
    setTaxValidUntil("");
    setOwnerName("");
    setOwnerMobile("");
    setDriverId(undefined);
    setDriverName("");
    setDriverMobile("");
    setIsActive(true);
    setError("");
  };

  const handleDriverChange = (val: any) => {
    const dId = Number(val);
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
    setOwnerMobile(sanitizeMobile(val));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim()) {
      setError("Vehicle / Lorry Registration No is required.");
      return;
    }

    const mobErr = firstError(
      validateMobile(ownerMobile, "Owner mobile"),
      validateMobile(driverMobile, "Driver mobile"),
    );
    if (mobErr) {
      setError(mobErr);
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
        pucValidUntil: pucValidUntil || undefined,
        taxValidUntil: taxValidUntil || undefined,
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

  const driverOptions = [
    { label: "-- No Driver Assigned --", value: "" },
    ...availableDrivers.map((d) => ({
      label: `${d.name}${d.mobile ? ` (${d.mobile})` : ""}`,
      value: d.id,
    })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[#E5EAEB] dark:border-slate-800 w-full max-w-4xl overflow-visible relative my-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between bg-[#F7F8F8] dark:bg-slate-800/60 rounded-t-2xl">
          <div>
            <h2 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#2F8E86]" />
              <span>{initialVehicle ? "Edit Fleet Vehicle" : "Add New Fleet Vehicle (Truck)"}</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Register commercial vehicles for trip manifest and autocomplete.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#111827] dark:hover:text-white p-1.5 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-visible rounded-b-2xl">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Vehicle No, Body Type, Ownership Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Vehicle / Truck Reg No * (ALL CAPS)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BR-01-GB-4589"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                className="w-full h-10 px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-mono font-bold text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86] uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Vehicle Body Type
              </label>
              <CustomSelect
                value={vehicleType}
                onChange={(v) => setVehicleType(String(v))}
                options={VEHICLE_BODY_TYPES}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Ownership Category
              </label>
              <CustomSelect
                value={ownerType}
                onChange={(v) => setOwnerType(String(v))}
                options={OWNER_TYPES}
                className="w-full"
              />
            </div>
          </div>

          {/* Row 2: Capacity, Engine Number, Chassis Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Carrying Capacity (in MT)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 16.5"
                value={capacityTons}
                onChange={(e) => setCapacityTons(e.target.value)}
                className="w-full h-10 px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-medium text-[#111827] dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Engine Number
              </label>
              <input
                type="text"
                placeholder="e.g. 6DTI987654"
                value={engineNo}
                onChange={(e) => setEngineNo(e.target.value.toUpperCase())}
                className="w-full h-10 px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-mono font-bold text-[#111827] dark:text-white uppercase focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Chassis Number
              </label>
              <input
                type="text"
                placeholder="e.g. MAT45892300189"
                value={chassisNo}
                onChange={(e) => setChassisNo(e.target.value.toUpperCase())}
                className="w-full h-10 px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-mono font-bold text-[#111827] dark:text-white uppercase focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]"
              />
            </div>
          </div>

          {/* Row 3: Validity Compliance Dates (Using uniform DatePicker) */}
          <div className="bg-[#F7F8F8] dark:bg-slate-800/40 p-4 rounded-xl border border-[#E5EAEB] dark:border-slate-800 space-y-3">
            <p className="text-[11px] font-bold text-[#64748B] dark:text-slate-300 uppercase tracking-wider">
              Document Expiries & Compliance
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <DatePicker
                  value={fitnessValidUntil}
                  onChange={(d) => setFitnessValidUntil(d)}
                  label="Fitness Until"
                  align="left"
                  direction="auto"
                  disableFutureDates={false}
                  className="w-full"
                />
              </div>

              <div>
                <DatePicker
                  value={insuranceValidUntil}
                  onChange={(d) => setInsuranceValidUntil(d)}
                  label="Insurance Until"
                  align="left"
                  direction="auto"
                  disableFutureDates={false}
                  className="w-full"
                />
              </div>

              <div>
                <DatePicker
                  value={permitValidUntil}
                  onChange={(d) => setPermitValidUntil(d)}
                  label="Permit Until"
                  align="left"
                  direction="auto"
                  disableFutureDates={false}
                  className="w-full"
                />
              </div>

              <div>
                <DatePicker
                  value={pucValidUntil}
                  onChange={(d) => setPucValidUntil(d)}
                  label="PUC Until"
                  align="right"
                  direction="auto"
                  disableFutureDates={false}
                  className="w-full"
                />
              </div>

              <div>
                <DatePicker
                  value={taxValidUntil}
                  onChange={(d) => setTaxValidUntil(d)}
                  label="Road Tax Until"
                  align="right"
                  direction="auto"
                  disableFutureDates={false}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Assigned Driver, Owner Name, Owner Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Default Assigned Driver
              </label>
              <CustomSelect
                value={driverId || ""}
                onChange={handleDriverChange}
                options={driverOptions}
                searchable={true}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Owner / Transporter Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Singh Fleet"
                value={ownerName}
                onChange={(e) => setOwnerName(toTitleCase(e.target.value))}
                className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86] capitalize"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#111827] dark:text-slate-300">
                  Owner Mobile (10 Digits)
                </label>
                <span className="text-[10px] text-[#94A3B8] font-mono">
                  {ownerMobile.length}/10
                </span>
              </div>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={ownerMobile}
                onChange={(e) => handleMobileChange(e.target.value)}
                className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E5EAEB] dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Saving..." : initialVehicle ? "Update Truck" : "Save Truck"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
