"use client";

import React, { useState, useEffect, useRef } from "react";
import { UploadPodRequest, ShipmentDto } from "@/types/tms";
import { podService } from "services/podService";
import { shipmentService } from "services/shipmentService";

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

  const [shipments, setShipments] = useState<ShipmentDto[]>([]);
  const [shipmentId, setShipmentId] = useState<number | undefined>(defaultShipmentId);
  const [receiverName, setReceiverName] = useState("");
  const [receiverMobile, setReceiverMobile] = useState("");
  const [receiverAadharOrId, setReceiverAadharOrId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);
  const [documentUrl, setDocumentUrl] = useState("");
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
      const res = await shipmentService.getShipments({ pageSize: 50 });
      if (res.success && res.data) {
        setShipments(res.data);
      }
    } catch (err) {
      console.error("Fetch shipments error:", err);
    }
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>✍️</span> Electronic Proof of Delivery (e-POD)
            </h2>
            <p className="text-xs text-slate-500">
              Record consignee delivery acknowledgement, recipient ID, and digital signature.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Consignment Selector & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Consignment (LR / GR) *
              </label>
              <select
                required
                value={shipmentId || ""}
                onChange={(e) => setShipmentId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Choose Shipment / LR --</option>
                {shipments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shipmentNo} ({s.consignorName} → {s.consigneeName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Delivery Date *
              </label>
              <input
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Receiver Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Receiver / Signatory Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mukesh Kumar (Godown Mgr)"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Receiver Mobile Number
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={receiverMobile}
                onChange={(e) => setReceiverMobile(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Receiver Aadhar / ID Proof No
            </label>
            <input
              type="text"
              placeholder="e.g. Aadhar ending in 4920 or Company Stamp ID"
              value={receiverAadharOrId}
              onChange={(e) => setReceiverAadharOrId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Digital Signature Pad */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>🖋️</span> Digital Receiver Signature (Draw on screen)
              </span>
              {hasSignature && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
                >
                  Clear Signature
                </button>
              )}
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden bg-white">
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
            <p className="text-[10px] text-slate-400">Sign with finger or stylus</p>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Delivery Notes / Shortage Remarks (if any)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Delivered 10 pkgs in sound condition with seal intact"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Footer Actions */}
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
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Uploading POD..." : "Upload & Save Proof of Delivery"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
