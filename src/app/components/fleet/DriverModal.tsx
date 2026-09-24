"use client";

import React, { useState, useEffect } from "react";
import { DriverMaster } from "@/types/shipment";
import { fleetService } from "services/fleetService";
import { User, X, AlertTriangle } from "lucide-react";

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

  const handleMobileChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "").slice(0, 10);
    setMobile(digitsOnly);
  };

  if (!isOpen) return null;

  const validateForm = (): string | null => {
    if (!name.trim()) return "Driver Full Name is required.";

    // Only characters eligible to be in a person's name (letters, spaces, dots, hyphens)
    const nameRegex = /^[a-zA-Z\s\.\-]+$/;
    if (!nameRegex.test(name.trim())) {
      return "Driver Name contains invalid characters. Only alphabetic letters, spaces, dots, and hyphens are allowed.";
    }

    if (mobile.trim()) {
      if (mobile.trim().length !== 10 || !/^[6-9]\d{9}$/.test(mobile.trim())) {
        return "Driver Mobile Number must be a valid 10-digit Indian mobile number.";
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valError = validateForm();
    if (valError) {
      setError(valError);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-sky-50/50 dark:bg-slate-800/60">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>{initialDriver ? "Edit Fleet Driver" : "Register New Fleet Driver"}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage commercial drivers with valid licenses and contacts.
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

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Driver Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Surendra Yadav"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3.5 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Only letters, spaces, dots, and hyphens allowed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Driving License No (DL)
              </label>
              <input
                type="text"
                placeholder="e.g. BR0120190012345"
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value.toUpperCase())}
                className="w-full h-10 px-3.5 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mobile (10 Digits)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {mobile.length}/10
                </span>
              </div>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={mobile}
                onChange={(e) => handleMobileChange(e.target.value)}
                className="w-full h-10 px-3.5 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Permanent / Residential Address
            </label>
            <textarea
              rows={2}
              placeholder="Village/City, District, State"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
              <span>Active in Driver Directory</span>
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
                {loading ? "Saving..." : initialDriver ? "Update Driver" : "Save Driver"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
