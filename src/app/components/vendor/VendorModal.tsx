"use client";

import React, { useState, useEffect } from "react";
import { Users, X, Landmark, Building2, Check } from "lucide-react";
import { VendorDto } from "@/types/tms";
import { vendorService } from "services/vendorService";
import {
  sanitizeMobile,
  validateMobile,
  validateEmail,
  validateGstin,
  validatePan,
  validateIfsc,
  firstError,
} from "@/utils/validation";

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialVendor?: VendorDto | null;
}

export default function VendorModal({
  isOpen,
  onClose,
  onSaved,
  initialVendor,
}: VendorModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [panNo, setPanNo] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [tdsPercentage, setTdsPercentage] = useState<number>(1);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (initialVendor) {
        setName(initialVendor.name || "");
        setCode(initialVendor.code || "");
        setPanNo(initialVendor.panNo || "");
        setGstNo(initialVendor.gstNo || "");
        setContactPerson(initialVendor.contactPerson || "");
        setMobile(initialVendor.mobile || "");
        setEmail(initialVendor.email || "");
        setAddress(initialVendor.address || "");
        setCity(initialVendor.city || "");
        setState(initialVendor.state || "");
        setTdsPercentage(initialVendor.tdsPercentage || 1);
        setBankName(initialVendor.bankName || "");
        setAccountNumber(initialVendor.accountNumber || "");
        setIfscCode(initialVendor.ifscCode || "");
        setAccountHolderName(initialVendor.accountHolderName || "");
        setIsActive(initialVendor.isActive ?? true);
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialVendor]);

  const resetForm = () => {
    setName("");
    setCode("");
    setPanNo("");
    setGstNo("");
    setContactPerson("");
    setMobile("");
    setEmail("");
    setAddress("");
    setCity("");
    setState("");
    setTdsPercentage(1);
    setBankName("");
    setAccountNumber("");
    setIfscCode("");
    setAccountHolderName("");
    setIsActive(true);
    setError("");
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vendor / Transporter Name is required.");
      return;
    }

    const valErr = firstError(
      validateGstin(gstNo),
      validatePan(panNo),
      validateMobile(mobile),
      validateEmail(email),
      validateIfsc(ifscCode),
    );
    if (valErr) {
      setError(valErr);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload: Partial<VendorDto> = {
        name: name.trim(),
        code: code.trim() || undefined,
        panNo: panNo.trim().toUpperCase() || undefined,
        gstNo: gstNo.trim().toUpperCase() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        mobile: mobile.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        tdsPercentage: Number(tdsPercentage) || 0,
        bankName: bankName.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        ifscCode: ifscCode.trim().toUpperCase() || undefined,
        accountHolderName: accountHolderName.trim() || undefined,
        isActive,
      };

      if (initialVendor?.id) {
        await vendorService.updateVendor(initialVendor.id, payload);
      } else {
        await vendorService.createVendor(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Save vendor error:", err);
      setError(err?.message || "Failed to save market vendor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-[#D9E2E3] dark:border-slate-800 w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="p-1.5 bg-[#E7F1F2] text-[#2F8E86] rounded-lg">
                <Users className="w-4 h-4 text-[#2F8E86]" />
              </span>
              {initialVendor ? "Edit Market Vendor / Broker" : "Register Market Truck Vendor / Broker"}
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Manage fleet supplier, TDS taxation percentage, and payout bank details.
            </p>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#111827] dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-[#F7F8F8] dark:hover:bg-slate-800 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Vendor / Transporter Business Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Star Transport Logistics"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-semibold text-[#111827] dark:text-white bg-white dark:bg-slate-800 placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Vendor Code
              </label>
              <input
                type="text"
                placeholder="e.g. VND-01"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-[#111827] dark:text-slate-200 bg-white dark:bg-slate-800 placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
              />
            </div>
          </div>

          {/* Taxation & TDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                PAN Number
              </label>
              <input
                type="text"
                maxLength={10}
                placeholder="AAACB1234F"
                value={panNo}
                onChange={(e) => setPanNo(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-[#111827] dark:text-white bg-white dark:bg-slate-800 placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                GSTIN Number
              </label>
              <input
                type="text"
                maxLength={15}
                placeholder="27AAACB1234F1Z1"
                value={gstNo}
                onChange={(e) => setGstNo(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-[#111827] dark:text-white bg-white dark:bg-slate-800 placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                TDS Deduction (%)
              </label>
              <select
                value={tdsPercentage}
                onChange={(e) => setTdsPercentage(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-[#111827] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={1}>1% (Individual / Sole Prop 194C)</option>
                <option value={2}>2% (Company / Firm 194C)</option>
              </select>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                placeholder="e.g. Anil Verma"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-white bg-white dark:bg-slate-800 placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Mobile Phone
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={mobile}
                onChange={(e) => setMobile(sanitizeMobile(e.target.value))}
                className="w-full px-3 py-2 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-[#111827] dark:text-white bg-white dark:bg-slate-800 placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="accounts@startransport.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-white bg-white dark:bg-slate-800 placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
              />
            </div>
          </div>

          {/* Bank Details Payout Section */}
          <div className="bg-[#F7F8F8] dark:bg-slate-800/60 p-4 rounded-xl border border-[#E5EAEB] dark:border-slate-700 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-300 flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-[#2F8E86]" />
              Bank Payout Details (for Advance & Hire Settlement)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] dark:text-slate-400 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] dark:text-slate-400 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 308948201948"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-[#111827] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] dark:text-slate-400 mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  maxLength={11}
                  placeholder="SBIN0001234"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-[#111827] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] dark:text-slate-400 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Star Transport Logistics Pvt Ltd"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#64748B] dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-[#2F8E86] focus:ring-[#2F8E86]"
              />
              <span>Active Supplier in Vendor Directory</span>
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
                {loading ? "Saving..." : initialVendor ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
