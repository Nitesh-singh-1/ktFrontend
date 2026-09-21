"use client";

import React, { useState, useEffect } from "react";
import { DriverMaster } from "@/types/shipment";
import { fleetService } from "services/fleetService";

interface DriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialDriver?: DriverMaster | null;
}

export default function DriverModal({
  isOpen,
  onClose,
  onSaved,
  initialDriver,
}: DriverModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (initialDriver) {
        setName(initialDriver.name || "");
        setLicenseNo(initialDriver.licenseNo || "");
        setMobile(initialDriver.mobile || "");
        setAddress(initialDriver.address || "");
        setIsActive(initialDriver.isActive ?? true);
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialDriver]);

  const resetForm = () => {
    setName("");
    setLicenseNo("");
    setMobile("");
    setAddress("");
    setIsActive(true);
    setError("");
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Driver Full Name is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload: Partial<DriverMaster> = {
        name: name.trim(),
        licenseNo: licenseNo.trim().toUpperCase() || undefined,
        mobile: mobile.trim() || undefined,
        address: address.trim() || undefined,
        isActive,
      };

      await fleetService.createDriver(payload);
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Save driver error:", err);
      setError(err?.message || "Failed to save driver details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>👨‍✈️</span> {initialDriver ? "Edit Fleet Driver" : "Register New Fleet Driver"}
            </h2>
            <p className="text-xs text-slate-500">
              Manage driver profile, commercial driving license, and contact details.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Driver Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Surendra Yadav"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Driving License No (DL)
              </label>
              <input
                type="text"
                placeholder="e.g. BR0120190012345"
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Driver Mobile Phone
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Permanent / Residential Address
            </label>
            <textarea
              rows={2}
              placeholder="Village/City, District, State"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Active in Driver Directory</span>
            </label>

            <div className="flex items-center gap-3">
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
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Saving..." : initialDriver ? "Update Driver" : "Save Driver"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
