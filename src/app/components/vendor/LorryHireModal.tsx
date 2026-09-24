"use client";

import React, { useState, useEffect } from "react";
import {
  VendorDto,
  CreateLorryHireRequest,
  LocationLookupItem,
  VehicleLookupItem,
} from "@/types/tms";
import { vendorService } from "services/vendorService";
import { fleetService } from "services/fleetService";
import SearchableSelect from "../ui/SearchableSelect";
import { FileText, X } from "lucide-react";

interface LorryHireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function LorryHireModal({ isOpen, onClose, onSaved }: LorryHireModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [contractDate, setContractDate] = useState(new Date().toISOString().split("T")[0]);
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [vendorId, setVendorId] = useState<number | undefined>(undefined);
  const [vendorName, setVendorName] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverMobile, setDriverMobile] = useState("");
  const [fromLocation, setFromLocation] = useState("Pahari Patna Hub");
  const [toLocation, setToLocation] = useState("");

  // Financials
  const [totalHireAmount, setTotalHireAmount] = useState<number>(0);
  const [advanceCashPaid, setAdvanceCashPaid] = useState<number>(0);
  const [dieselAdvanceAmount, setDieselAdvanceAmount] = useState<number>(0);
  const [tdsPercentage, setTdsPercentage] = useState<number>(1);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchVendors();
    }
  }, [isOpen]);

  const fetchVendors = async () => {
    try {
      const list = await vendorService.getVendors();
      setVendors(list || []);
    } catch (err) {
      console.error("Fetch vendors error:", err);
    }
  };

  const resetForm = () => {
    setContractDate(new Date().toISOString().split("T")[0]);
    setVendorId(undefined);
    setVendorName("");
    setVehicleNo("");
    setDriverName("");
    setDriverMobile("");
    setFromLocation("Pahari Patna Hub");
    setToLocation("");
    setTotalHireAmount(0);
    setAdvanceCashPaid(0);
    setDieselAdvanceAmount(0);
    setTdsPercentage(1);
    setOtherDeductions(0);
    setRemarks("");
    setError("");
  };

  if (!isOpen) return null;

  const handleVendorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vId = Number(e.target.value);
    if (!vId) {
      setVendorId(undefined);
      setVendorName("");
      return;
    }
    const found = vendors.find((v) => v.id === vId);
    if (found) {
      setVendorId(found.id);
      setVendorName(found.name);
      if (found.tdsPercentage !== undefined) {
        setTdsPercentage(found.tdsPercentage);
      }
    }
  };

  // Live Balancer
  const tdsAmount = (totalHireAmount * Number(tdsPercentage)) / 100;
  const balancePayable = Math.max(
    0,
    totalHireAmount - advanceCashPaid - dieselAdvanceAmount - tdsAmount - otherDeductions
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim()) {
      setError("Hired Vehicle / Truck Number is required.");
      return;
    }
    if (!totalHireAmount || totalHireAmount <= 0) {
      setError("Total Hire / Freight Amount must be greater than zero.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload: CreateLorryHireRequest = {
        contractDate,
        vendorId,
        vendorName: vendorName.trim() || undefined,
        vehicleNo: vehicleNo.trim().toUpperCase(),
        driverName: driverName.trim() || undefined,
        driverMobile: driverMobile.trim() || undefined,
        fromLocation: fromLocation.trim() || undefined,
        toLocation: toLocation.trim() || undefined,
        totalHireAmount: Number(totalHireAmount),
        advanceCashPaid: Number(advanceCashPaid) || 0,
        dieselAdvanceAmount: Number(dieselAdvanceAmount) || 0,
        tdsPercentage: Number(tdsPercentage) || 0,
        otherDeductions: Number(otherDeductions) || 0,
        remarks: remarks.trim() || undefined,
      };

      const res = await vendorService.createLorryHireContract(payload);
      if (res.success || res.data) {
        onSaved();
        onClose();
      } else {
        setError(res.message || "Failed to create Lorry Hire contract.");
      }
    } catch (err: any) {
      console.error("Create lorry hire error:", err);
      setError(err?.message || "Failed to create Lorry Hire memo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Issue Lorry Hire Memo (Market Truck Contract)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Calculate TDS deductions, fuel advances, and track balance payable to vendor/broker.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Vendor & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Market Broker / Vendor *
              </label>
              <select
                value={vendorId || ""}
                onChange={handleVendorSelect}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Direct Truck Owner / Ad-hoc --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.panNo ? `(PAN: ${v.panNo})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Agreement Date *
              </label>
              <input
                type="date"
                required
                value={contractDate}
                onChange={(e) => setContractDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Vehicle & Driver */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Hired Vehicle No *
              </label>
              <SearchableSelect<VehicleLookupItem>
                value={vehicleNo}
                placeholder="Search truck..."
                onSearch={(q) => fleetService.lookupVehicles(q)}
                getItemKey={(v) => v.id}
                getItemLabel={(v) => v.vehicleNo}
                onChangeText={(t) => setVehicleNo(t.toUpperCase())}
                onSelect={(v) => {
                  setVehicleNo(v.vehicleNo);
                  if (v.driverName) setDriverName(v.driverName);
                  if (v.driverMobile) setDriverMobile(v.driverMobile);
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Driver Name
              </label>
              <input
                type="text"
                placeholder="e.g. Balwinder Singh"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Driver Mobile
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={driverMobile}
                onChange={(e) => setDriverMobile(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Route */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Loading Station (From)
              </label>
              <SearchableSelect<LocationLookupItem>
                value={fromLocation}
                placeholder="Search station..."
                onSearch={(q) => fleetService.lookupLocations(q)}
                getItemKey={(l) => l.id}
                getItemLabel={(l) => l.name}
                onChangeText={setFromLocation}
                onSelect={(l) => setFromLocation(l.name)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Unloading Destination (To)
              </label>
              <SearchableSelect<LocationLookupItem>
                value={toLocation}
                placeholder="Search destination..."
                onSearch={(q) => fleetService.lookupLocations(q)}
                getItemKey={(l) => l.id}
                getItemLabel={(l) => l.name}
                onChangeText={setToLocation}
                onSelect={(l) => setToLocation(l.name)}
              />
            </div>
          </div>

          {/* Financial Breakdown & TDS Balancer */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Lorry Freight & Settlement Balancer
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Total Lorry Hire Rate (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="0.00"
                  value={totalHireAmount === 0 ? "" : totalHireAmount}
                  onChange={(e) => setTotalHireAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-black text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Advance Cash Paid (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={advanceCashPaid === 0 ? "" : advanceCashPaid}
                  onChange={(e) => setAdvanceCashPaid(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Diesel / Fuel Advance (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={dieselAdvanceAmount === 0 ? "" : dieselAdvanceAmount}
                  onChange={(e) => setDieselAdvanceAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  TDS Deduction Rate (%)
                </label>
                <select
                  value={tdsPercentage}
                  onChange={(e) => setTdsPercentage(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-white"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={1}>1% (Individual / Prop)</option>
                  <option value={2}>2% (Company)</option>
                </select>
                <span className="text-[10px] text-slate-400">TDS: ₹{tdsAmount.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Other Deductions (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={otherDeductions === 0 ? "" : otherDeductions}
                  onChange={(e) => setOtherDeductions(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Net Balance Due</span>
                <span className="text-sm font-mono font-black text-blue-600 dark:text-blue-400">
                  ₹{balancePayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Hire Remarks / Terms
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Balance payable upon submission of signed POD copy"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Issuing Memo..." : "Issue Lorry Hire Slip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
