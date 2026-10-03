"use client";

import React, { useEffect, useState } from "react";
import { Printer, X, FileText, Layout, Check } from "lucide-react";
import {
  BiltyCopyKind,
  BiltyPrintLayout,
  BiltyPaperSize,
  BiltyPrintOptions,
  BiltyCopyDef,
} from "@/utils/print/shipmentPrintTemplate";
import { loadBiltyPrintPrefs, saveBiltyPrintPrefs, copyLabel } from "@/utils/print/printPreferences";

interface PrintOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (opts: BiltyPrintOptions) => void;
  title?: string;
  subtitle?: string;
  defaultKinds?: BiltyCopyKind[];
}

const ALL_KINDS: BiltyCopyKind[] = ["consignor", "consignee", "office", "driver"];

export default function PrintOptionsModal({
  isOpen,
  onClose,
  onPrint,
  title = "Print Options",
  subtitle = "Choose which copies to print and how to lay them out.",
  defaultKinds,
}: PrintOptionsModalProps) {
  const [selectedKinds, setSelectedKinds] = useState<BiltyCopyKind[]>([]);
  const [layout, setLayout] = useState<BiltyPrintLayout>("3-up");
  const [paper, setPaper] = useState<BiltyPaperSize>("A4");
  const [rememberChoice, setRememberChoice] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    if (defaultKinds && defaultKinds.length > 0) {
      setSelectedKinds(defaultKinds);
    } else {
      const prefs = loadBiltyPrintPrefs();
      setSelectedKinds(prefs.copies.map((c) => c.kind));
      setLayout(prefs.layout);
      setPaper(prefs.paper);
    }
  }, [isOpen, defaultKinds]);

  if (!isOpen) return null;

  const toggle = (kind: BiltyCopyKind) => {
    setSelectedKinds((prev) =>
      prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]
    );
  };

  const setOnlyCopy = (kind: BiltyCopyKind) => {
    setSelectedKinds([kind]);
  };

  const setAllCopies = () => {
    setSelectedKinds(["consignor", "consignee", "office"]);
  };

  const handlePrint = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedKinds.length === 0) return;

    const copies: BiltyCopyDef[] = selectedKinds.map((k) => ({ kind: k, label: copyLabel(k) }));
    const opts: BiltyPrintOptions = { copies, layout, paper };

    if (rememberChoice) saveBiltyPrintPrefs(opts);
    onPrint(opts);
    onClose();
  };

  const canPrint = selectedKinds.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-[#D9E2E3] dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <span className="p-1.5 bg-[#E7F1F2] text-[#2F8E86] rounded-lg">
                <Printer className="w-4 h-4 text-[#2F8E86]" />
              </span>
              <span>{title}</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#111827] dark:hover:text-white p-1.5 rounded-lg hover:bg-[#F7F8F8] dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handlePrint} className="p-6 space-y-5">
          {/* Copies */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#2F8E86]" /> Copies to Print
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setOnlyCopy("consignee")}
                  className="px-2 py-0.5 rounded-md bg-[#E7F1F2] dark:bg-slate-800 text-[#25776F] dark:text-teal-300 hover:bg-[#d5e7e8] font-semibold transition cursor-pointer"
                >
                  Customer (Consignee)
                </button>
                <button
                  type="button"
                  onClick={() => setOnlyCopy("consignor")}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold transition cursor-pointer"
                >
                  Consignor
                </button>
                <button
                  type="button"
                  onClick={setAllCopies}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold transition cursor-pointer"
                >
                  3-Copy Set
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_KINDS.map((kind) => {
                const checked = selectedKinds.includes(kind);
                return (
                  <label
                    key={kind}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      checked
                        ? "bg-[#E7F1F2] border-[#2F8E86] text-[#25776F]"
                        : "bg-white dark:bg-slate-800 border-[#D9E2E3] dark:border-slate-700 text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(kind)}
                      className="w-4 h-4 rounded text-[#2F8E86] focus:ring-[#2F8E86] border-slate-300"
                    />
                    <span className="text-xs font-semibold">{copyLabel(kind)}</span>
                  </label>
                );
              })}
            </div>
            {selectedKinds.length === 0 && (
              <p className="text-[11px] text-[#D95C5C] mt-1.5 font-semibold">
                Select at least one copy to print.
              </p>
            )}
          </div>

          {/* Layout */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5 text-[#2F8E86]" /> Layout
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLayout("3-up")}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                  layout === "3-up"
                    ? "bg-[#E7F1F2] border-[#2F8E86] text-[#25776F]"
                    : "bg-white dark:bg-slate-800 border-[#D9E2E3] dark:border-slate-700 text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Stacked on one page</span>
                  {layout === "3-up" && <Check className="w-3.5 h-3.5 text-[#2F8E86]" />}
                </div>
                <div className="text-[10px] font-normal text-[#94A3B8] mt-0.5">
                  All copies fit on a single sheet (recommended for 2–3 copies).
                </div>
              </button>
              <button
                type="button"
                onClick={() => setLayout("one-per-page")}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                  layout === "one-per-page"
                    ? "bg-[#E7F1F2] border-[#2F8E86] text-[#25776F]"
                    : "bg-white dark:bg-slate-800 border-[#D9E2E3] dark:border-slate-700 text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>One copy per page</span>
                  {layout === "one-per-page" && <Check className="w-3.5 h-3.5 text-[#2F8E86]" />}
                </div>
                <div className="text-[10px] font-normal text-[#94A3B8] mt-0.5">
                  Full-size layout on a separate sheet for each copy.
                </div>
              </button>
            </div>
          </div>

          {/* Paper */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-300 mb-2">
              Paper Size
            </label>
            <div className="flex gap-2">
              {(["A4", "A5"] as BiltyPaperSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPaper(size)}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    paper === size
                      ? "bg-[#2F8E86] border-[#2F8E86] text-white"
                      : "bg-white dark:bg-slate-800 border-[#D9E2E3] dark:border-slate-700 text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Remember + Actions */}
          <div className="pt-4 border-t border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#64748B] dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberChoice}
                onChange={(e) => setRememberChoice(e.target.checked)}
                className="rounded text-[#2F8E86] focus:ring-[#2F8E86]"
              />
              <span>Remember for next time</span>
            </label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canPrint}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4 mr-1 inline" />
                Print {selectedKinds.length > 0 ? `(${selectedKinds.length})` : ""}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
