"use client";

import React, { useState } from "react";
import { CreateClaimRequest, ClaimType } from "@/types/tms";
import { claimsService } from "services/claimsService";

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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>⚠️</span> Report Cargo Damage / Shortage Claim
            </h2>
            <p className="text-xs text-slate-500">
              Log incident details, affected consignment, and claim settlement requests.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Consignment / LR Number
              </label>
              <input
                type="text"
                placeholder="e.g. GR-2026-0001"
                value={shipmentNo}
                onChange={(e) => setShipmentNo(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Incident Date *
              </label>
              <input
                type="date"
                required
                value={claimDate}
                onChange={(e) => setClaimDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Claim Type *
              </label>
              <select
                value={claimType}
                onChange={(e) => setClaimType(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={ClaimType.Damage}>Cargo Damage (Physical)</option>
                <option value={ClaimType.Shortage}>Shortage / Missing Packages</option>
                <option value={ClaimType.TotalLoss}>Total Loss / Destruction</option>
                <option value={ClaimType.Delay}>Transit Delay Penalty</option>
                <option value={ClaimType.Accident}>Road Accident Loss</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-red-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Claimant Name / Entity
              </label>
              <input
                type="text"
                placeholder="e.g. Reliance Retail (Consignor)"
                value={claimantName}
                onChange={(e) => setClaimantName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Claimant Mobile
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={claimantMobile}
                onChange={(e) => setClaimantMobile(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Incident & Damage Description *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe package conditions, seals, cartons damaged or missing units..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Filing Claim..." : "File Damage Claim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
