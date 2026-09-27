"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CreateTripRequest,
  ShipmentDto,
  VehicleLookupItem,
  DriverLookupItem,
  LocationLookupItem,
} from "@/types/tms";
import { PaymentTerm } from "@/types/shipment";
import { tripService } from "services/tripService";
import { fleetService } from "services/fleetService";
import SearchableSelect from "../ui/SearchableSelect";
import { 
  Truck, 
  X, 
  AlertTriangle, 
  Search, 
  Zap, 
  ClipboardList, 
  Package, 
  Scale, 
  Trash2, 
  MapPin, 
  Check 
} from "lucide-react";

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
  const [voiceDriverName, setVoiceDriverName] = useState(""); // Voice Driver / Co-Driver
  const [driverMobile, setDriverMobile] = useState("");
  const [driverId, setDriverId] = useState<number | undefined>(undefined);
  const [originLocationName, setOriginLocationName] = useState("Zero Mile, Pahari, Patna-7");
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

  // Search filter for unassigned bilties
  const [biltySearchQuery, setBiltySearchQuery] = useState("");

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
    setVoiceDriverName("");
    setDriverMobile("");
    setDriverId(undefined);
    setOriginLocationName("Zero Mile, Pahari, Patna-7");
    setOriginLocationId(undefined);
    setDestinationLocationName("");
    setDestinationLocationId(undefined);
    setStartOdometer(0);
    setSealNo("");
    setDriverAdvanceCash(0);
    setDriverAdvanceFuel(0);
    setRemarks("");
    setSelectedShipmentIds([]);
    setBiltySearchQuery("");
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

  const addShipmentById = (id: number) => {
    if (!selectedShipmentIds.includes(id)) {
      setSelectedShipmentIds([...selectedShipmentIds, id]);
    }
  };

  const removeShipmentById = (id: number) => {
    setSelectedShipmentIds(selectedShipmentIds.filter((sId) => sId !== id));
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
  const unselectedShipments = availableShipments.filter((s) => !selectedShipmentIds.includes(s.id));

  // Filtered dropdown list of unselected bilties
  const filteredAvailableBilties = unselectedShipments.filter((s) => {
    if (!biltySearchQuery.trim()) return true;
    const q = biltySearchQuery.toLowerCase();
    return (
      s.shipmentNo.toLowerCase().includes(q) ||
      (s.invoiceNo && s.invoiceNo.toLowerCase().includes(q)) ||
      (s.consignorName && s.consignorName.toLowerCase().includes(q)) ||
      (s.consigneeName && s.consigneeName.toLowerCase().includes(q)) ||
      (s.toLocation && s.toLocation.toLowerCase().includes(q))
    );
  });

  const totalLoadedWeightKg = selectedShipments.reduce((sum, s) => {
    const w = s.items?.reduce((wSum, it) => wSum + (Number(it.weight) || 0), 0) || 0;
    return sum + w;
  }, 0);

  const totalLoadedPackages = selectedShipments.reduce((sum, s) => {
    const p = s.items?.reduce((pSum, it) => pSum + (Number(it.quantity) || 1), 0) || 1;
    return sum + p;
  }, 0);

  const totalPaidFreight = selectedShipments
    .filter((s) => s.paymentTerm === PaymentTerm.Paid)
    .reduce((sum, s) => sum + (Number(s.totalFreight) || Number(s.grandTotal) || 0), 0);

  const totalToPayFreight = selectedShipments
    .filter((s) => s.paymentTerm === PaymentTerm.ToPay)
    .reduce((sum, s) => sum + (Number(s.totalFreight) || Number(s.grandTotal) || 0), 0);

  const totalTbbFreight = selectedShipments
    .filter((s) => s.paymentTerm === PaymentTerm.TBB)
    .reduce((sum, s) => sum + (Number(s.totalFreight) || Number(s.grandTotal) || 0), 0);

  const totalLoadedFreight = selectedShipments.reduce(
    (sum, s) => sum + (Number(s.totalFreight) || Number(s.grandTotal) || 0),
    0
  );

  const getPaymentTermLabel = (term: PaymentTerm) => {
    switch (term) {
      case PaymentTerm.Paid:
        return { label: "PAID", class: "bg-[#E7F1F2] text-[#2F9E8F] border-[#2F9E8F]/30" };
      case PaymentTerm.TBB:
        return { label: "TBB", class: "bg-blue-50 text-[#4A90E2] border-[#4A90E2]/30" };
      case PaymentTerm.ToPay:
      default:
        return { label: "TO PAY", class: "bg-amber-50 text-[#B76E32] border-[#F4A261]/30" };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim()) {
      setError("Assigned Vehicle / Lorry Number is required.");
      return;
    }
    if (!destinationLocationName.trim()) {
      setError("Destination Route / Station (Point B) is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const combinedRemarks = [
        voiceDriverName.trim() ? `Voice Driver: ${voiceDriverName.trim()}` : "",
        remarks.trim(),
      ]
        .filter(Boolean)
        .join(" | ");

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
        remarks: combinedRemarks || undefined,
        shipmentIdsToLoad: selectedShipmentIds.length > 0 ? selectedShipmentIds : undefined,
      };

      const res = await tripService.createTrip(payload);
      if (res?.success || res?.data || (res as any)?.id || (res as any)?.tripNo) {
        onSaved();
        onClose();
      } else {
        setError(res?.message || "Failed to create LR / Truck Challan.");
      }
    } catch (err: any) {
      console.error("Create trip error:", err);
      setError(err?.message || "Failed to create LR / Truck Challan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-[#D9E2E3] dark:border-slate-800 w-full max-w-5xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#E7F1F2] text-[#47868C] rounded-lg">
                <Truck className="w-4 h-4 text-[#47868C]" />
              </span>
              <h2 className="text-base font-bold text-[#111827] dark:text-white uppercase tracking-tight">
                Create LR / Truck Challan (Vehicle Movement)
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-[#E7F1F2] text-[#3F7C82] border border-[#D9E2E3] rounded-full">
                Step 3: Point A → Point B
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Assign truck details, route (Origin to Destination), and attach multiple booked Bilties/GRs to this single vehicle.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#111827] dark:hover:text-white rounded-lg hover:bg-[#F7F8F8] dark:hover:bg-slate-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D95C5C] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Challan Meta & Route (Point A to Point B) */}
          <div className="bg-[#F7F8F8] dark:bg-slate-800/40 p-4 rounded-xl border border-[#E5EAEB] dark:border-slate-700 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-300 flex items-center gap-1.5 border-b border-[#E5EAEB] dark:border-slate-700 pb-2">
              <MapPin className="w-4 h-4 text-[#47868C]" /> 1. Challan Details & Route (Point A → Point B)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Challan No */}
              <div>
                <label className="block text-xs font-semibold text-[#111827] dark:text-slate-300 mb-1">
                  Challan / LR No
                </label>
                <input
                  type="text"
                  placeholder="Auto (e.g. 195 or CHN-2026-01)"
                  value={tripNo}
                  onChange={(e) => setTripNo(e.target.value)}
                  className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-[#47868C] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C]"
                />
              </div>

              {/* Challan Date */}
              <div>
                <label className="block text-xs font-semibold text-[#111827] dark:text-slate-300 mb-1">
                  Challan Date *
                </label>
                <input
                  type="date"
                  required
                  value={tripDate}
                  onChange={(e) => setTripDate(e.target.value)}
                  className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C] cursor-pointer"
                />
              </div>

              {/* Point A: Origin Station */}
              <div>
                <label className="block text-xs font-semibold text-[#111827] dark:text-slate-300 mb-1">
                  From (Point A / Origin Hub) *
                </label>
                <SearchableSelect<LocationLookupItem>
                  value={originLocationName}
                  placeholder="Search Origin (e.g. Zero Mile, Pahari)..."
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

              {/* Point B: Destination Station / Route */}
              <div>
                <label className="block text-xs font-semibold text-[#111827] dark:text-slate-300 mb-1">
                  To (Point B / Destination Hub) *
                </label>
                <SearchableSelect<LocationLookupItem>
                  value={destinationLocationName}
                  placeholder="Search Destination (e.g. Gaya, Mumbai)..."
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
          </div>

          {/* Section 2: Truck & Driver Crew Assignment */}
          <div className="bg-[#F7F8F8] dark:bg-slate-800/40 p-4 rounded-xl border border-[#E5EAEB] dark:border-slate-700 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-300 flex items-center gap-1.5 border-b border-[#E5EAEB] dark:border-slate-700 pb-2">
              <Truck className="w-4 h-4 text-[#47868C]" /> 2. Truck & Crew Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Lorry No */}
              <div>
                <label className="block text-xs font-semibold text-[#111827] dark:text-slate-300 mb-1">
                  Assigned Lorry / Truck No *
                </label>
                <SearchableSelect<VehicleLookupItem>
                  value={vehicleNo}
                  placeholder="Search Lorry (e.g. BR01-8778)..."
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
                      <span className="font-mono font-bold text-[#111827] dark:text-white">
                        {v.vehicleNo}
                      </span>
                      <span className="text-[10px] text-[#64748B]">{v.vehicleType}</span>
                    </div>
                  )}
                />
              </div>

              {/* Main Driver Name */}
              <div>
                <label className="block text-xs font-semibold text-[#111827] dark:text-slate-300 mb-1">
                  Driver Name
                </label>
                <SearchableSelect<DriverLookupItem>
                  value={driverName}
                  placeholder="Search Driver..."
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

              {/* Voice Driver / Co-Driver */}
              <div>
                <label className="block text-xs font-semibold text-[#111827] dark:text-slate-300 mb-1">
                  Voice Driver (Co-Driver / Helper)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pappu Kumar"
                  value={voiceDriverName}
                  onChange={(e) => setVoiceDriverName(e.target.value)}
                  className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-slate-100 placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C]"
                />
              </div>

              {/* Driver Mobile */}
              <div>
                <label className="block text-xs font-semibold text-[#111827] dark:text-slate-300 mb-1">
                  Driver Mobile
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={driverMobile}
                  onChange={(e) => setDriverMobile(e.target.value)}
                  className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-[#111827] dark:text-slate-100 placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C]"
                />
              </div>
            </div>

            {/* Advances & Seal */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#111827] dark:text-slate-300 mb-1">
                  Driver Cash Advance (₹)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={driverAdvanceCash === 0 ? "" : driverAdvanceCash}
                  onChange={(e) => setDriverAdvanceCash(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-[#111827] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] dark:text-slate-300 mb-1">
                  Diesel / Fuel Advance (₹)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={driverAdvanceFuel === 0 ? "" : driverAdvanceFuel}
                  onChange={(e) => setDriverAdvanceFuel(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-[#111827] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] dark:text-slate-300 mb-1">
                  Start Odometer (Km)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={startOdometer === 0 ? "" : startOdometer}
                  onChange={(e) => setStartOdometer(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-[#111827] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] dark:text-slate-300 mb-1">
                  Truck Seal No
                </label>
                <input
                  type="text"
                  placeholder="e.g. SEAL-9821"
                  value={sealNo}
                  onChange={(e) => setSealNo(e.target.value)}
                  className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-[#111827] dark:text-slate-100 placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Bilty/GR Selector Dropdown & Batch Loading */}
          <div className="border border-[#E5EAEB] dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs space-y-0">
            {/* Dropdown Header Bar */}
            <div className="p-4 bg-[#F7F8F8] dark:bg-slate-800/60 border-b border-[#E5EAEB] dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#47868C]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-200">
                    3. Load Bilties / GRs to this Truck
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 bg-[#47868C] text-white rounded-full">
                    {selectedShipmentIds.length} Bilties Attached
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">
                  Select created Bilties from the searchable dropdown or check them below to load onto this truck.
                </p>
              </div>

              {/* Searchable Dropdown for Quick Add */}
              <div className="w-full md:w-80">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Bilty No, Party, Destination..."
                    value={biltySearchQuery}
                    onChange={(e) => setBiltySearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            {/* Quick Dropdown Picker Box if searching or unselected available */}
            {biltySearchQuery.trim() && filteredAvailableBilties.length > 0 && (
              <div className="p-3 bg-amber-50/60 dark:bg-slate-800 border-b border-[#E5EAEB] dark:border-slate-700 max-h-40 overflow-y-auto space-y-1.5">
                <div className="text-[11px] font-bold text-[#64748B] dark:text-slate-400">
                  Search Results ({filteredAvailableBilties.length} unassigned Bilties found):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredAvailableBilties.map((bilty) => {
                    const pkgs = bilty.items?.reduce((pSum, it) => pSum + (Number(it.quantity) || 1), 0) || 1;
                    const freightAmt = Number(bilty.totalFreight) || Number(bilty.grandTotal) || 0;
                    const goodsVal = Number(bilty.goodsValue) || 0;
                    return (
                      <button
                        key={bilty.id}
                        type="button"
                        onClick={() => {
                          addShipmentById(bilty.id);
                          setBiltySearchQuery("");
                        }}
                        className="p-2.5 bg-white dark:bg-slate-850 hover:bg-[#E7F1F2]/50 dark:hover:bg-slate-800 border border-[#E5EAEB] dark:border-slate-700 rounded-lg text-left flex items-center justify-between transition cursor-pointer"
                      >
                        <div>
                          <div className="font-mono font-bold text-xs text-[#47868C]">
                            + Bill #{bilty.shipmentNo}
                          </div>
                          <div className="text-[10px] text-[#64748B] dark:text-slate-300 truncate max-w-[200px]">
                            {bilty.consignorName} → {bilty.consigneeName} ({bilty.toLocation})
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-[11px] text-[#3F7C82]">
                            Value: ₹{goodsVal.toLocaleString("en-IN")}
                          </div>
                          <div className="text-[10px] text-[#64748B] font-semibold">
                            Freight: ₹{freightAmt.toLocaleString("en-IN")} • {pkgs} PKG
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Loaded Bilties Table */}
            <div className="p-0">
              <div className="px-4 py-2 bg-[#F7F8F8] dark:bg-slate-800/80 border-b border-[#E5EAEB] dark:border-slate-700 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-300">
                  Loaded Bilties on Lorry ({selectedShipments.length})
                </span>

                {availableShipments.length > 0 && (
                  <button
                    type="button"
                    onClick={selectAllShipments}
                    className="text-xs font-bold text-[#47868C] hover:text-[#3F7C82] hover:underline cursor-pointer"
                  >
                    {selectedShipmentIds.length === availableShipments.length
                      ? "Deselect All"
                      : "Batch Load All Available Bilties"}
                  </button>
                )}
              </div>

              {selectedShipments.length === 0 ? (
                <div className="p-8 text-center space-y-2 bg-white dark:bg-slate-900">
                  <div className="w-12 h-12 rounded-2xl bg-[#E7F1F2] dark:bg-slate-800 text-[#47868C] flex items-center justify-center mx-auto mb-2">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-[#111827] dark:text-slate-300">
                    No Bilties Loaded onto this Truck Yet
                  </p>
                  <p className="text-[11px] text-[#94A3B8] max-w-sm mx-auto">
                    Use the search bar above or check available bilties below to assign them to this truck run.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white dark:bg-slate-900">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F7F8F8] dark:bg-slate-800/60 text-[#64748B] dark:text-slate-300 font-semibold border-b border-[#E5EAEB] dark:border-slate-700">
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[110px]">Bill No (GR)</th>
                        <th className="py-2.5 px-3 min-w-[70px] text-center">Qty (Pkgs)</th>
                        <th className="py-2.5 px-3 min-w-[110px]">From</th>
                        <th className="py-2.5 px-3 min-w-[120px] text-right">Bilty Goods Value (₹)</th>
                        <th className="py-2.5 px-3 min-w-[110px] text-right">Freight (₹)</th>
                        <th className="py-2.5 px-3 min-w-[100px] text-center">Payment Term</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Consignee (Receiver)</th>
                        <th className="py-2.5 px-3 w-16 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5EAEB] dark:divide-slate-800">
                      {selectedShipments.map((s, idx) => {
                        const pkgs = s.items?.reduce((pSum, it) => pSum + (Number(it.quantity) || 1), 0) || 1;
                        const paymentBadge = getPaymentTermLabel(s.paymentTerm);
                        const freightVal = Number(s.totalFreight) || Number(s.grandTotal) || 0;
                        const goodsVal = Number(s.goodsValue) || 0;

                        return (
                          <tr
                            key={s.id}
                            className="hover:bg-[#F5FAFA] dark:hover:bg-slate-800/40 transition"
                          >
                            <td className="py-2.5 px-3 text-center text-[#94A3B8] font-bold">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-[#47868C]">
                              {s.shipmentNo}
                              {s.invoiceNo && (
                                <span className="block text-[10px] text-[#94A3B8] font-normal">
                                  Inv: {s.invoiceNo}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-[#111827] dark:text-white">
                              {pkgs}
                            </td>
                            <td className="py-2.5 px-3 text-[#64748B] dark:text-slate-300">
                              {s.fromLocation || "Pahari"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[#111827] dark:text-slate-200">
                              ₹{goodsVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[#111827] dark:text-white">
                              ₹{freightVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`inline-flex px-2 py-0.5 text-[10px] font-bold border rounded-md ${paymentBadge.class}`}
                              >
                                {paymentBadge.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-[#111827] dark:text-slate-200">
                              <div>{s.consigneeName || "—"}</div>
                              <div className="text-[10px] text-[#94A3B8]">To: {s.toLocation}</div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeShipmentById(s.id)}
                                className="p-1 text-[#94A3B8] hover:text-[#D95C5C] transition cursor-pointer flex items-center gap-1"
                                title="Remove Bilty from Truck"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Live Challan Meter & Financial Breakdown Footer */}
              {selectedShipmentIds.length > 0 && (
                <div className="bg-[#F7F8F8] dark:bg-slate-800/80 p-4 border-t border-[#E5EAEB] dark:border-slate-700 space-y-3">
                  {/* Physical Manifest Summary */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-[#E5EAEB] dark:border-slate-700 pb-2.5">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="font-bold flex items-center gap-1.5 text-[#111827] dark:text-white">
                        <ClipboardList className="w-3.5 h-3.5 text-[#47868C]" />
                        <span>Total Bilties: {selectedShipments.length}</span>
                      </span>
                      <span className="font-bold flex items-center gap-1.5 text-[#111827] dark:text-white">
                        <Package className="w-3.5 h-3.5 text-[#F4A261]" />
                        <span>Total Packages: {totalLoadedPackages}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-[#64748B] dark:text-slate-300 font-semibold">
                        <Scale className="w-3.5 h-3.5 text-[#2F9E8F]" />
                        <span>Weight: {totalLoadedWeightKg.toLocaleString()} Kg ({(totalLoadedWeightKg / 1000).toFixed(2)} MT)</span>
                      </span>
                    </div>
                    <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
                      Lorry Dispatch Manifest Summary
                    </div>
                  </div>

                  {/* Clarified Financial Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-0.5">
                    {/* Total Freight */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-[#E5EAEB] dark:border-slate-700 shadow-2xs">
                      <div className="text-[10px] text-[#64748B] font-medium flex items-center justify-between">
                        <span>Total Freight Revenue</span>
                        <span className="text-[#47868C] font-bold">100%</span>
                      </div>
                      <div className="text-sm font-black font-mono text-[#111827] dark:text-white mt-1">
                        ₹{totalLoadedFreight.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[9px] text-[#94A3B8] mt-0.5">Gross freight of all loaded bilties</div>
                    </div>

                    {/* Paid at Origin */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-[#E5EAEB] dark:border-slate-700 shadow-2xs">
                      <div className="text-[10px] text-[#2F9E8F] font-medium flex items-center justify-between">
                        <span>Paid at Origin (Prepaid)</span>
                        <span className="bg-[#E7F1F2] text-[#2F9E8F] px-1 py-0.2 rounded text-[9px] font-bold">Sender Paid</span>
                      </div>
                      <div className="text-sm font-black font-mono text-[#2F9E8F] mt-1">
                        ₹{totalPaidFreight.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[9px] text-[#94A3B8] mt-0.5">Already collected at booking counter</div>
                    </div>

                    {/* To-Pay to Collect at Destination */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-amber-200 dark:border-amber-900/40 shadow-2xs">
                      <div className="text-[10px] text-[#B76E32] font-bold flex items-center justify-between">
                        <span>To-Pay at Destination</span>
                        <span className="bg-amber-50 text-[#B76E32] px-1 py-0.2 rounded text-[9px] font-bold">To Collect</span>
                      </div>
                      <div className="text-sm font-black font-mono text-[#B76E32] mt-1">
                        ₹{totalToPayFreight.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[9px] text-[#B76E32]/80 mt-0.5">Cash driver/branch collects from receiver</div>
                    </div>

                    {/* TBB / Credit */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-[#E5EAEB] dark:border-slate-700 shadow-2xs">
                      <div className="text-[10px] text-[#4A90E2] font-medium flex items-center justify-between">
                        <span>TBB (To-Be-Billed)</span>
                        <span className="bg-blue-50 text-[#4A90E2] px-1 py-0.2 rounded text-[9px] font-bold">Credit Ledger</span>
                      </div>
                      <div className="text-sm font-black font-mono text-[#4A90E2] mt-1">
                        ₹{totalTbbFreight.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[9px] text-[#94A3B8] mt-0.5">Billed to monthly customer account</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Unassigned Bilties Accordion / Quick List */}
            {unselectedShipments.length > 0 && (
              <div className="p-4 bg-[#F7F8F8] dark:bg-slate-800/50 border-t border-[#E5EAEB] dark:border-slate-700">
                <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-300 mb-2">
                  Other Unassigned Bilties Available to Load ({unselectedShipments.length}):
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-[#E5EAEB] dark:divide-slate-700 bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-700 rounded-lg">
                  {unselectedShipments.map((shp) => {
                    const pkgs = shp.items?.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0) || 1;
                    return (
                      <div
                        key={shp.id}
                        onClick={() => toggleShipmentSelection(shp.id)}
                        className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-[#F5FAFA] dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => {}}
                            className="rounded text-[#47868C] focus:ring-[#47868C]"
                          />
                          <div>
                            <span className="font-mono font-bold text-xs text-[#111827] dark:text-white">
                              Bill #{shp.shipmentNo}
                            </span>
                            <span className="text-[11px] text-[#64748B] dark:text-slate-400 ml-2">
                              {shp.consignorName} → {shp.consigneeName} ({shp.toLocation})
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-xs text-[#111827] dark:text-white">
                            ₹{shp.totalFreight || shp.grandTotal}
                          </span>
                          <span className="text-[10px] text-[#94A3B8] ml-2">{pkgs} PKG</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Dispatch Remarks */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-slate-300 mb-1">
              Dispatch Instructions / Operational Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Driver to stop at Jehanabad and Makhdumpur unloading points before reaching destination"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-slate-100 placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C]"
            />
          </div>

          {/* Standardized Footer Actions */}
          <div className="pt-4 border-t border-[#E5EAEB] dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating LR Challan...</span>
                </>
              ) : (
                "Create & Issue LR / Truck Challan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
