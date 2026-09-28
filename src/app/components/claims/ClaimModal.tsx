"use client";

import React, { useState } from "react";
import { CreateClaimRequest, ClaimType } from "@/types/tms";
import { claimsService } from "services/claimsService";
import { AlertTriangle, X } from "lucide-react";
import { sanitizeMobile, validateMobile } from "@/utils/validation";

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function ClaimModal({ isOpen, onClose, onSaved }: ClaimModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [shipmentNo, setShipmentNo] = useState("");
  const [claimDate, setClaimDate] = useState(new Date().toISOString().split("T")[0]);
  const [claimType, setClaimType] = useState<ClaimType>(ClaimType.Damage);
  const [claimedAmount, setClaimedAmount] = useState<number>(0);
  const [claimantName, setClaimantName] = useState("");
  const [claimantMobile, setClaimantMobile] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Claim incident description is required.");
      return;
    }
    if (!claimedAmount || claimedAmount <= 0) {
      setError("Please enter a valid claimed amount.");
      return;
    }

    const mobErr = validateMobile(claimantMobile, "Claimant mobile");
    if (mobErr) {
      setError(mobErr);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload: CreateClaimRequest = {
        shipmentNo: shipmentNo.trim() || undefined,
        claimDate,
        claimType,
        claimedAmount: Number(claimedAmount),
        description: description.trim(),
        claimantName: claimantName.trim() || undefined,
        claimantMobile: claimantMobile.trim() || undefined,
      };

      const res = await claimsService.createClaim(payload);
      if (res.success || res.data) {
        onSaved();
        onClose();
      } else {
        setError(res.message || "Failed to log claim.");
      }
    } catch (err: any) {
      console.error("Create claim error:", err);
      setError(err?.message || "Failed to log claim incident.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-[#D9E2E3] dark:border-slate-800 w-full max-w-lg overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="p-1.5 bg-amber-50 text-[#F4A261] rounded-lg">
                <AlertTriangle className="w-4 h-4 text-[#F4A261]" />
              </span>
              <span>Report Cargo Damage / Shortage Claim</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Log incident details, affected consignment, and claim settlement requests.
            </p>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#111827] dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-[#F7F8F8] dark:hover:bg-slate-800 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Consignment / LR Number
              </label>
              <input
                type="text"
                placeholder="e.g. GR-2026-0001"
                value={shipmentNo}
                onChange={(e) => setShipmentNo(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-[#2F8E86] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Incident Date *
              </label>
              <input
                type="date"
                required
                value={claimDate}
                onChange={(e) => setClaimDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Claim Type *
              </label>
              <select
                value={claimType}
                onChange={(e) => setClaimType(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
              >
                <option value={ClaimType.Damage}>Cargo Damage (Physical)</option>
                <option value={ClaimType.Shortage}>Shortage / Missing Packages</option>
                <option value={ClaimType.TotalLoss}>Total Loss / Destruction</option>
                <option value={ClaimType.Delay}>Transit Delay Penalty</option>
                <option value={ClaimType.Accident}>Road Accident Loss</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Claimed Amount (₹) *
              </label>
              <input
                type="number"
                step="any"
                min="1"
                required
                placeholder="0.00"
                value={claimedAmount === 0 ? "" : claimedAmount}
                onChange={(e) => setClaimedAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-[#D95C5C] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Claimant Name / Entity
              </label>
              <input
                type="text"
                placeholder="e.g. Reliance Retail (Consignor)"
                value={claimantName}
                onChange={(e) => setClaimantName(e.target.value)}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
                Claimant Mobile
              </label>
              <input
                type="tel"
                maxLength={10}
                inputMode="numeric"
                placeholder="9876543210"
                value={claimantMobile}
                onChange={(e) => setClaimantMobile(sanitizeMobile(e.target.value))}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-[#111827] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
              Incident & Damage Description *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe package conditions, seals, cartons damaged or missing units..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
            />
          </div>

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
              className="px-5 py-2.5 bg-[#D95C5C] hover:bg-[#c74c4c] text-white font-bold rounded-lg text-xs shadow-2xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Filing Claim..." : "File Damage Claim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
