"use client";

import React, { useState, useEffect, useRef } from "react";
import { UploadPodRequest, PodPendingShipmentDto } from "@/types/tms";
import { podService } from "services/podService";
import { Dropdown } from "@/app/components/ui/Dropdown";
import { FileCheck, PenTool, X, Upload, FileText } from "lucide-react";
import { sanitizeMobile, validateMobile } from "@/utils/validation";

interface PodUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultShipmentId?: number;
}

export default function PodUploadModal({
  isOpen,
  onClose,
  onSaved,
  defaultShipmentId,
}: PodUploadModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [shipments, setShipments] = useState<PodPendingShipmentDto[]>([]);
  const [shipmentId, setShipmentId] = useState<number | undefined>(defaultShipmentId);
  const [receiverName, setReceiverName] = useState("");
  const [receiverMobile, setReceiverMobile] = useState("");
  const [receiverAadharOrId, setReceiverAadharOrId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [remarks, setRemarks] = useState("");

  // Canvas Signature State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchShipments();
      if (defaultShipmentId) setShipmentId(defaultShipmentId);
    }
  }, [isOpen, defaultShipmentId]);

  const fetchShipments = async () => {
    try {
      const res = await podService.getPendingShipments();
      setShipments(res || []);
    } catch (err) {
      console.error("Fetch pending shipments error:", err);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("POD document must be under 4 MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDocumentUrl(typeof reader.result === "string" ? reader.result : "");
      setDocumentName(file.name);
      setError("");
    };
    reader.onerror = () => setError("Could not read the selected file.");
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  // Signature Canvas Helpers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipmentId) {
      setError("Please select a Consignment / Waybill.");
      return;
    }
    if (!receiverName.trim()) {
      setError("Receiver / Consignee Signatory Name is required.");
      return;
    }

    const mobErr = validateMobile(receiverMobile, "Receiver mobile");
    if (mobErr) {
      setError(mobErr);
      return;
    }

    try {
      setLoading(true);
      setError("");

      let signatureUrl: string | undefined = undefined;
      if (hasSignature && canvasRef.current) {
        signatureUrl = canvasRef.current.toDataURL("image/png");
      }

      const payload: UploadPodRequest = {
        shipmentId,
        deliveryDate,
        receiverName: receiverName.trim(),
        receiverMobile: receiverMobile.trim() || undefined,
        receiverAadharOrId: receiverAadharOrId.trim() || undefined,
        documentUrl: documentUrl.trim() || undefined,
        signatureUrl,
        remarks: remarks.trim() || undefined,
      };

      const res = await podService.uploadPod(payload);
      if (res.success || res.data) {
        onSaved();
        onClose();
      } else {
        setError(res.message || "Failed to upload Proof of Delivery.");
      }
    } catch (err: any) {
      console.error("Upload POD error:", err);
      setError(err?.message || "Failed to upload Proof of Delivery.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E5EAEB] w-full max-w-xl overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5EAEB] flex items-center justify-between bg-[#F7F8F8]">
          <div>
            <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#2F8E86]" /> Electronic Proof of Delivery (e-POD)
            </h2>
            <p className="text-xs text-[#64748B]">
              Record consignee delivery acknowledgement, recipient ID, and digital signature.
            </p>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#111827] p-1.5 rounded-lg transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[#D95C5C] text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Consignment Selector & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#64748B] mb-1">
                Select Consignment (LR / GR) *
              </label>
              <Dropdown
                options={shipments.map((s) => ({
                  value: s.id,
                  label: s.shipmentNo || `Shipment #${s.id}`,
                  sublabel: `${s.consignorName || "—"} → ${s.consigneeName || "—"}`,
                }))}
                value={shipmentId}
                onChange={(v) => setShipmentId(Number(v))}
                placeholder="-- Choose Shipment / LR --"
                emptyText="No consignments awaiting POD"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#64748B] mb-1">
                Delivery Date *
              </label>
              <input
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
              />
            </div>
          </div>

          {/* Receiver Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#64748B] mb-1">
                Receiver / Signatory Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mukesh Kumar (Godown Mgr)"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#64748B] mb-1">
                Receiver Mobile Number
              </label>
              <input
                type="tel"
                maxLength={10}
                inputMode="numeric"
                placeholder="9876543210"
                value={receiverMobile}
                onChange={(e) => setReceiverMobile(sanitizeMobile(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-mono font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#64748B] mb-1">
              Receiver Aadhar / ID Proof No
            </label>
            <input
              type="text"
              placeholder="e.g. Aadhar ending in 4920 or Company Stamp ID"
              value={receiverAadharOrId}
              onChange={(e) => setReceiverAadharOrId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-mono font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
            />
          </div>

          {/* Digital Signature Pad */}
          <div className="bg-[#F7F8F8] p-4 rounded-xl border border-[#E5EAEB] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-[#2F8E86]" /> Digital Receiver Signature (Draw on screen)
              </span>
              {hasSignature && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[11px] font-bold text-[#D95C5C] hover:underline cursor-pointer"
                >
                  Clear Signature
                </button>
              )}
            </div>

            <div className="border border-[#D9E2E3] rounded-xl overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={500}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full touch-none cursor-crosshair"
              />
            </div>
            <p className="text-[10px] text-[#94A3B8]">Sign with finger or stylus</p>
          </div>

          {/* Physical POD document upload */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] mb-1">
              Scanned POD / Delivery Receipt (photo or PDF)
            </label>
            {documentUrl ? (
              <div className="flex items-center justify-between gap-3 p-3 bg-[#F7F8F8] border border-[#D9E2E3] rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-[#2F8E86] shrink-0" />
                  <span className="text-xs font-semibold text-[#111827] truncate">{documentName || "POD document attached"}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {documentUrl.startsWith("data:image") && (
                    <img src={documentUrl} alt="POD" className="h-8 w-8 object-cover rounded border border-[#D9E2E3]" />
                  )}
                  <button
                    type="button"
                    onClick={() => { setDocumentUrl(""); setDocumentName(""); }}
                    className="text-[11px] font-bold text-[#D95C5C] hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-[#D9E2E3] rounded-lg text-xs font-semibold text-[#64748B] hover:bg-[#E7F1F2] hover:text-[#25776F] hover:border-[#2F8E86] transition cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Upload signed delivery receipt (max 4 MB)</span>
                <input type="file" accept="image/*,application/pdf" onChange={handleDocumentUpload} className="hidden" />
              </label>
            )}
            <p className="text-[10px] text-[#94A3B8] mt-1">
              The physical POD signed by the receiver — typically photographed and uploaded by the driver.
            </p>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-[#64748B] mb-1">
              Delivery Notes / Shortage Remarks (if any)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Delivered 10 pkgs in sound condition with seal intact"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E5EAEB] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#D9E2E3] hover:bg-[#E7F1F2] text-[#25776F] font-bold rounded-lg text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Saving…" : "Save POD"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
