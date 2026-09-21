"use client";

import React, { useState, useEffect } from "react";
import { ClaimDto, ClaimStatus } from "@/types/tms";
import { claimsService } from "services/claimsService";
import ClaimModal from "@/app/components/claims/ClaimModal";

export default function ClaimsPage() {
  const [claims, setClaims] = useState<ClaimDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  const fetchClaims = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await claimsService.getClaims({
        search: searchTerm || undefined,
        status: statusFilter !== "" ? Number(statusFilter) : undefined,
      });
      setClaims(res || []);
    } catch (err: any) {
      console.error("Fetch claims error:", err);
      setError(err?.message || "Failed to load cargo claims.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (claim: ClaimDto) => {
    const newStatusStr = prompt(
      "Update Claim Status:\n1 = Investigating\n2 = Approved\n3 = Rejected\n4 = Settled",
      "1"
    );
    if (!newStatusStr) return;
    const newStatus = Number(newStatusStr) as ClaimStatus;

    let settledAmt: number | undefined = undefined;
    if (newStatus === ClaimStatus.Approved || newStatus === ClaimStatus.Settled) {
      const amt = prompt("Enter approved/settled compensation amount (₹):", claim.claimedAmount.toString());
      if (amt) settledAmt = parseFloat(amt);
    }

    const remarks = prompt("Enter resolution remarks / insurance notes:");

    try {
      await claimsService.updateClaimStatus(claim.id, {
        status: newStatus,
        settledAmount: settledAmt,
        resolutionRemarks: remarks || undefined,
      });
      fetchClaims();
    } catch (err: any) {
      alert(err?.message || "Failed to update claim.");
    }
  };

  // KPIs
  const totalClaims = claims.length;
  const openCount = claims.filter((c) => c.status === ClaimStatus.Reported || c.status === ClaimStatus.Investigating).length;
  const totalSettled = claims.reduce((sum, c) => sum + (Number(c.settledAmount) || 0), 0);

  const getStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.Approved:
        return { text: "APPROVED", class: "bg-blue-50 text-blue-700 border-blue-200" };
      case ClaimStatus.Settled:
        return { text: "SETTLED", class: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case ClaimStatus.Rejected:
        return { text: "REJECTED", class: "bg-red-50 text-red-700 border-red-200" };
      case ClaimStatus.Investigating:
        return { text: "INVESTIGATING", class: "bg-purple-50 text-purple-700 border-purple-200" };
      default:
        return { text: "REPORTED", class: "bg-amber-50 text-amber-700 border-amber-200" };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Cargo Damage, Shortage & Loss Claims
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full">
              Insurance & Claims
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Log transit damage incidents, investigate shortage shortages, track insurance claims, and record compensation settlements.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <span>+</span>
          <span>Report New Claim</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Reported Incidents</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalClaims}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg">
            ⚠️
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Open Under Investigation</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{openCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
            🔍
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Compensation Settled</p>
            <p className="text-xl font-black text-emerald-600 font-mono mt-1">
              ₹{totalSettled.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            🛡️
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search claim no, LR no, claimant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { label: "All Claims", value: "" },
            { label: "Reported", value: ClaimStatus.Reported.toString() },
            { label: "Investigating", value: ClaimStatus.Investigating.toString() },
            { label: "Approved", value: ClaimStatus.Approved.toString() },
            { label: "Settled", value: ClaimStatus.Settled.toString() },
            { label: "Rejected", value: ClaimStatus.Rejected.toString() },
          ].map((tab) => {
            const isSelected = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isSelected ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Claims Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-xs">Loading cargo claims...</div>
        ) : claims.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="text-4xl">🛡️</div>
            <p className="text-sm font-bold text-slate-800">No Cargo Claims Reported</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All consignments are moving intact with 0 incident reports on record.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-xs transition cursor-pointer"
            >
              + Report Incident / Claim
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Claim ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Consignment (LR)</th>
                  <th className="py-3 px-4">Claim Type</th>
                  <th className="py-3 px-4">Claimant Details</th>
                  <th className="py-3 px-4 text-right">Claimed (₹)</th>
                  <th className="py-3 px-4 text-right">Settled (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((c) => {
                  const statusBadge = getStatusBadge(c.status);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {c.claimNo}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {c.claimDate ? c.claimDate.split("T")[0] : "—"}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {c.shipmentNo || "—"}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{c.claimTypeName || "Damage"}</span>
                        <div className="text-[10px] text-slate-400 max-w-xs truncate">{c.description}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{c.claimantName || "Consignee"}</div>
                        {c.claimantMobile && <div className="text-[10px] text-slate-400 font-mono">{c.claimantMobile}</div>}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-red-600">
                        ₹{c.claimedAmount}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                        ₹{c.settledAmount || 0}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold border rounded-md ${statusBadge.class}`}>
                          {statusBadge.text}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleUpdateStatus(c)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Claim Creation Modal */}
      <ClaimModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchClaims}
      />
    </div>
  );
}
