"use client";

import React, { useState, useEffect } from "react";
import { PodRecordDto, PodStatus } from "@/types/tms";
import { podService } from "services/podService";
import PodUploadModal from "@/app/components/pod/PodUploadModal";
import { ClipboardList, Clock, CheckCircle2, Search, Plus, FileCheck, X, AlertTriangle } from "lucide-react";

export default function PodPage() {
  const [pods, setPods] = useState<PodRecordDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedPodForPreview, setSelectedPodForPreview] = useState<PodRecordDto | null>(null);

  useEffect(() => {
    fetchPods();
  }, [statusFilter]);

  const fetchPods = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await podService.getPods({
        search: searchTerm || undefined,
        status: statusFilter !== "" ? Number(statusFilter) : undefined,
      });
      setPods(res || []);
    } catch (err: any) {
      console.error("Fetch pods error:", err);
      setError(err?.message || "Failed to load Proof of Delivery records.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (pod: PodRecordDto) => {
    if (!confirm(`Verify POD for Consignment ${pod.shipmentNo}? This will formally mark the consignment as DELIVERED.`)) return;
    try {
      await podService.verifyPod(pod.id);
      fetchPods();
    } catch (err: any) {
      alert(err?.message || "Failed to verify POD.");
    }
  };

  const handleReject = async (pod: PodRecordDto) => {
    const reason = prompt("Enter reason for rejecting POD:");
    if (!reason) return;
    try {
      await podService.rejectPod(pod.id, reason);
      fetchPods();
    } catch (err: any) {
      alert(err?.message || "Failed to reject POD.");
    }
  };

  // KPIs
  const totalPods = pods.length;
  const verifiedCount = pods.filter((p) => p.status === PodStatus.Verified).length;
  const pendingCount = pods.filter((p) => p.status === PodStatus.Uploaded || p.status === PodStatus.Pending).length;

  const getStatusBadge = (status: PodStatus) => {
    switch (status) {
      case PodStatus.Verified:
        return { text: "VERIFIED (DELIVERED)", class: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" };
      case PodStatus.Rejected:
        return { text: "REJECTED", class: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" };
      default:
        return { text: "PENDING VERIFICATION", class: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Proof of Delivery (POD) & Verification
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full">
              Delivery Assurance
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Capture electronic signatures, verify scanned delivery receipts, and formally transition consignments to &ldquo;Delivered&rdquo; stage.
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Upload New e-POD</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total POD Records</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalPods}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Awaiting Verification</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verified & Delivered</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{verifiedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search consignment no, receiver name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { label: "All PODs", value: "" },
            { label: "Pending Verification", value: PodStatus.Uploaded.toString() },
            { label: "Verified Delivered", value: PodStatus.Verified.toString() },
            { label: "Rejected", value: PodStatus.Rejected.toString() },
          ].map((tab) => {
            const isSelected = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isSelected ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* POD Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400 text-xs font-medium">Loading Proof of Delivery records...</div>
        ) : pods.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
              <FileCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No POD Records Found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Upload delivery receipts or electronic signatures for in-transit consignments to formally verify delivery.
            </p>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Upload First POD</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Waybill / LR No</th>
                  <th className="py-3 px-4">Delivery Date</th>
                  <th className="py-3 px-4">Receiver / Signatory</th>
                  <th className="py-3 px-4">Receiver ID / Contact</th>
                  <th className="py-3 px-4 text-center">Digital Signature</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pods.map((p) => {
                  const statusBadge = getStatusBadge(p.status);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      {/* LR No */}
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {p.shipmentNo}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {p.deliveryDate ? p.deliveryDate.split("T")[0] : "—"}
                      </td>

                      {/* Receiver */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {p.receiverName}
                      </td>

                      {/* ID / Mobile */}
                      <td className="py-3.5 px-4">
                        {p.receiverMobile && <div className="font-mono text-slate-700 dark:text-slate-300">{p.receiverMobile}</div>}
                        {p.receiverAadharOrId && <div className="text-[10px] text-slate-400 dark:text-slate-500">ID: {p.receiverAadharOrId}</div>}
                      </td>

                      {/* Signature Preview */}
                      <td className="py-3.5 px-4 text-center">
                        {p.signatureUrl ? (
                          <button
                            onClick={() => setSelectedPodForPreview(p)}
                            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            View Signature
                          </button>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[10px] italic">Physical Receipt</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold border rounded-md ${statusBadge.class}`}>
                          {statusBadge.text}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {p.status !== PodStatus.Verified && (
                            <button
                              onClick={() => handleVerify(p)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                            >
                              Verify POD
                            </button>
                          )}
                          {p.status !== PodStatus.Rejected && p.status !== PodStatus.Verified && (
                            <button
                              onClick={() => handleReject(p)}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-600 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 font-bold rounded-lg text-xs transition cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Signature Preview Modal */}
      {selectedPodForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Signature for {selectedPodForPreview.shipmentNo}
              </h3>
              <button onClick={() => setSelectedPodForPreview(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              {selectedPodForPreview.signatureUrl ? (
                <img src={selectedPodForPreview.signatureUrl} alt="Signature" className="max-h-32 object-contain" />
              ) : (
                <span className="text-xs text-slate-400">No signature image available</span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Signatory: <span className="font-bold text-slate-900 dark:text-white">{selectedPodForPreview.receiverName}</span></p>
            <div className="flex justify-end">
              <button onClick={() => setSelectedPodForPreview(null)} className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <PodUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSaved={fetchPods}
      />
    </div>
  );
}
