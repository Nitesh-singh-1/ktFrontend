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

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
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
  const [licenseValidUntil, setLicenseValidUntil] = useState("");
  const [mobile, setMobile] = useState("");
  const [aadharNo, setAadharNo] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (initialDriver) {
        setName(initialDriver.name || "");
        setLicenseNo(initialDriver.licenseNo || "");
        setLicenseValidUntil(initialDriver.licenseValidUntil || "");
        setMobile(initialDriver.mobile || "");
        setAadharNo(initialDriver.aadharNo || "");
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
    setLicenseValidUntil("");
    setMobile("");
    setAadharNo("");
    setAddress("");
    setIsActive(true);
    setError("");
  };

  const handleMobileChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "").slice(0, 10);
    setMobile(digitsOnly);
  };

  const handleAadharChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "").slice(0, 12);
    setAadharNo(digitsOnly);
  };

  if (!isOpen) return null;

  const validateForm = (): string | null => {
    if (!name.trim()) return "Driver Full Name is required.";

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
        name: toTitleCase(name.trim()),
        licenseNo: licenseNo.trim().toUpperCase() || undefined,
        licenseValidUntil: licenseValidUntil || undefined,
        mobile: mobile.trim() || undefined,
        aadharNo: aadharNo.trim() || undefined,
        address: address.trim() ? toTitleCase(address.trim()) : undefined,
        isActive,
      };

      if (initialDriver && initialDriver.id) {
        await fleetService.updateDriver(initialDriver.id, payload);
      } else {
        await fleetService.createDriver(payload);
      }
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[#E5EAEB] dark:border-slate-800 w-full max-w-md overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between bg-[#F7F8F8] dark:bg-slate-800/60">
          <div>
            <h2 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-[#2F8E86]" />
              <span>{initialDriver ? "Edit Fleet Driver" : "Register New Fleet Driver"}</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Manage commercial drivers with valid licenses and contacts.
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
              Driver Full Name * (Capitalized)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Surendra Yadav"
              value={name}
              onChange={(e) => setName(toTitleCase(e.target.value))}
              className="w-full h-10 px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-semibold text-[#111827] dark:text-white capitalize focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]"
            />
            <span className="text-[10px] text-[#94A3B8] mt-0.5 block">First letters will automatically be capitalized</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Driving License No (DL)
              </label>
              <input
                type="text"
                placeholder="e.g. BR0120190012345"
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value.toUpperCase())}
                className="w-full h-10 px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-mono font-bold text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86] uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                License Valid Until
              </label>
              <input
                type="date"
                value={licenseValidUntil}
                onChange={(e) => setLicenseValidUntil(e.target.value)}
                className="w-full h-10 px-3 py-1.5 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#111827] dark:text-slate-300">
                  Mobile (10 Digits)
                </label>
                <span className="text-[10px] text-[#94A3B8] font-mono">
                  {mobile.length}/10
                </span>
              </div>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={mobile}
                onChange={(e) => handleMobileChange(e.target.value)}
                className="w-full h-10 px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-mono font-bold text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Aadhar Card Number
              </label>
              <input
                type="text"
                maxLength={12}
                placeholder="1234 5678 9012"
                value={aadharNo}
                onChange={(e) => handleAadharChange(e.target.value)}
                className="w-full h-10 px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-mono font-bold text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
              Permanent / Residential Address
            </label>
            <textarea
              rows={2}
              placeholder="Village/City, District, State"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#111827] dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-[#2F8E86] focus:ring-[#2F8E86]"
              />
              <span>Active in Driver Directory</span>
            </label>

            <div className="flex items-center gap-3">
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
                {loading ? "Saving..." : initialDriver ? "Update Driver" : "Save Driver"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
