"use client";

import React, { useState, useEffect } from "react";
import { LocationMaster } from "@/types/shipment";
import { fleetService } from "services/fleetService";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialLocation?: LocationMaster | null;
}

export default function LocationModal({
  isOpen,
  onClose,
  onSaved,
  initialLocation,
}: LocationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (initialLocation) {
        setName(initialLocation.name || "");
        setCode(initialLocation.code || "");
        setCity(initialLocation.city || "");
        setState(initialLocation.state || "");
        setIsActive(initialLocation.isActive ?? true);
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialLocation]);

  const resetForm = () => {
    setName("");
    setCode("");
    setCity("");
    setState("");
    setIsActive(true);
    setError("");
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Station / Location Name is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload: Partial<LocationMaster> = {
        name: name.trim(),
        code: code.trim().toUpperCase() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        isActive,
      };

      await fleetService.createLocation(payload);
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Save location error:", err);
      setError(err?.message || "Failed to save station / location.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>📍</span> {initialLocation ? "Edit Station / Hub" : "Add Station / Operating Hub"}
            </h2>
            <p className="text-xs text-slate-500">
              Manage origin stations and destination booking nodes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Station / Hub Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pahari Patna Hub or Mumbai Central"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Station Code / Short Code
            </label>
            <input
              type="text"
              placeholder="e.g. PAT-01 or MUM-HUB"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City
              </label>
              <input
                type="text"
                placeholder="e.g. Patna"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                State
              </label>
              <input
                type="text"
                placeholder="e.g. Bihar"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Active in Routing Dropdowns</span>
            </label>

            <div className="flex items-center gap-3">
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
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Saving..." : initialLocation ? "Update Station" : "Save Station"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
