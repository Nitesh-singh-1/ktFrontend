"use client";

import React, { useState, useEffect } from "react";
import { VehicleInsuranceClaimDto, VehicleClaimStatus } from "@/types/tms";
import { vehicleClaimService } from "services/vehicleClaimService";
import { toast } from "@/context/ToastContext";
import { ShieldAlert, X, AlertTriangle } from "lucide-react";

interface VehicleClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: VehicleInsuranceClaimDto | null;
}

const CLAIM_TYPES = ["Accident", "Own Damage", "Third Party", "Theft", "Fire", "Natural Calamity", "Other"];
const STATUSES: { value: VehicleClaimStatus; label: string }[] = [
  { value: VehicleClaimStatus.Filed, label: "Filed" },
  { value: VehicleClaimStatus.UnderReview, label: "Under Review" },
  { value: VehicleClaimStatus.Approved, label: "Approved" },
  { value: VehicleClaimStatus.Settled, label: "Settled" },
  { value: VehicleClaimStatus.Rejected, label: "Rejected" },
];

const inputCls =
  "w-full h-10 px-3.5 py-2 border border-[#D9E2E3] dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]";
const labelCls = "block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1";

export default function VehicleClaimModal({ isOpen, onClose, onSaved, initial }: VehicleClaimModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [vehicleNo, setVehicleNo] = useState("");
  const [claimNo, setClaimNo] = useState("");
  const [insurerName, setInsurerName] = useState("");
  const [policyNo, setPolicyNo] = useState("");
  const [claimType, setClaimType] = useState("Accident");
  const [incidentDate, setIncidentDate] = useState("");
  const [claimDate, setClaimDate] = useState(new Date().toISOString().split("T")[0]);
  const [claimAmount, setClaimAmount] = useState<string>("");
  const [approvedAmount, setApprovedAmount] = useState<string>("");
  const [status, setStatus] = useState<VehicleClaimStatus>(VehicleClaimStatus.Filed);
  const [surveyorName, setSurveyorName] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setVehicleNo(initial.vehicleNo || "");
      setClaimNo(initial.claimNo || "");
      setInsurerName(initial.insurerName || "");
      setPolicyNo(initial.policyNo || "");
      setClaimType(initial.claimType || "Accident");
      setIncidentDate(initial.incidentDate ? initial.incidentDate.split("T")[0] : "");
      setClaimDate(initial.claimDate ? initial.claimDate.split("T")[0] : new Date().toISOString().split("T")[0]);
      setClaimAmount(initial.claimAmount != null ? String(initial.claimAmount) : "");
      setApprovedAmount(initial.approvedAmount != null ? String(initial.approvedAmount) : "");
      setStatus(initial.status ?? VehicleClaimStatus.Filed);
      setSurveyorName(initial.surveyorName || "");
      setRemarks(initial.remarks || "");
    } else {
      setVehicleNo(""); setClaimNo(""); setInsurerName(""); setPolicyNo(""); setClaimType("Accident");
      setIncidentDate(""); setClaimDate(new Date().toISOString().split("T")[0]);
      setClaimAmount(""); setApprovedAmount(""); setStatus(VehicleClaimStatus.Filed);
      setSurveyorName(""); setRemarks("");
    }
    setError("");
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const num = (v: string) => (v === "" ? 0 : parseFloat(v) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim()) { setError("Vehicle number is required."); return; }
    try {
      setLoading(true);
      setError("");
      const payload: Partial<VehicleInsuranceClaimDto> = {
        vehicleNo: vehicleNo.trim().toUpperCase(),
        claimNo: claimNo.trim() || undefined,
        insurerName: insurerName.trim() || undefined,
        policyNo: policyNo.trim() || undefined,
        claimType: claimType || undefined,
        incidentDate: incidentDate || undefined,
        claimDate: claimDate || undefined,
        claimAmount: num(claimAmount),
        approvedAmount: num(approvedAmount),
        status,
        surveyorName: surveyorName.trim() || undefined,
        remarks: remarks.trim() || undefined,
      };
      if (initial?.id) {
        await vehicleClaimService.update(initial.id, payload);
        toast.success("Claim updated.");
      } else {
        await vehicleClaimService.create(payload);
        toast.success("Insurance claim filed.");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Save vehicle claim error:", err);
      setError(err?.message || "Failed to save claim.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[#E5EAEB] dark:border-slate-800 w-full max-w-2xl overflow-hidden my-6">
        <div className="px-6 py-4 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between bg-[#F7F8F8] dark:bg-slate-800/60">
          <div>
            <h2 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#2F8E86]" />
              <span>{initial ? "Edit Insurance Claim" : "File Insurance Claim"}</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">Vehicle insurance claim — accident, own-damage, theft, etc.</p>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#111827] dark:hover:text-white p-1.5 rounded-lg transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" /> <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Vehicle No *</label>
              <input type="text" required value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value.toUpperCase())} placeholder="e.g. MH12AB1234" className={`${inputCls} font-mono uppercase`} />
            </div>
            <div>
              <label className={labelCls}>Claim No</label>
              <input type="text" value={claimNo} onChange={(e) => setClaimNo(e.target.value)} placeholder="Insurer claim ref" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Claim Type</label>
              <select value={claimType} onChange={(e) => setClaimType(e.target.value)} className={`${inputCls} cursor-pointer`}>
                {CLAIM_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Insurer</label>
              <input type="text" value={insurerName} onChange={(e) => setInsurerName(e.target.value)} placeholder="e.g. ICICI Lombard" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Policy No</label>
              <input type="text" value={policyNo} onChange={(e) => setPolicyNo(e.target.value)} placeholder="Policy number" className={inputCls} />
            </div>
          </div>

          <div className="bg-[#F7F8F8] dark:bg-slate-800/40 p-3.5 rounded-xl border border-[#E5EAEB] dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Incident Date</label>
              <input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Claim Date</label>
              <input type="date" value={claimDate} onChange={(e) => setClaimDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Claimed (₹)</label>
              <input type="number" step="0.01" min="0" value={claimAmount} onChange={(e) => setClaimAmount(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Approved (₹)</label>
              <input type="number" step="0.01" min="0" value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Status</label>
              <select value={status} onChange={(e) => setStatus(Number(e.target.value) as VehicleClaimStatus)} className={`${inputCls} cursor-pointer`}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Surveyor</label>
              <input type="text" value={surveyorName} onChange={(e) => setSurveyorName(e.target.value)} placeholder="Surveyor name" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Remarks</label>
            <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes" className={inputCls} />
          </div>

          <div className="pt-4 border-t border-[#E5EAEB] dark:border-slate-800 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Saving…" : initial ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
