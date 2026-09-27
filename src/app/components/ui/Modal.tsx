"use client";

import React, { useEffect } from "react";
import Button from "./Button";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "full";
  onSave?: () => void;
  saveText?: string;
  cancelText?: string;
  isSaving?: boolean;
  saveDisabled?: boolean;
  showFooterButtons?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "3xl",
  onSave,
  saveText = "Save Changes",
  cancelText = "Cancel",
  isSaving = false,
  saveDisabled = false,
  showFooterButtons = false,
}: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthMap: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    full: "max-w-full m-4",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div
        className={`relative bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xl overflow-hidden flex flex-col w-full my-auto transition-all animate-in fade-in zoom-in-95 duration-150 ${
          maxWidthMap[maxWidth] || "max-w-3xl"
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between bg-[#F7F8F8] dark:bg-slate-800/50">
          <div>
            <h3 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#111827] dark:hover:text-white rounded-lg hover:bg-[#E7F1F2] dark:hover:bg-slate-700 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-130px)] space-y-5">
          {children}
        </div>

        {/* Standard Footer */}
        {footer ? (
          footer
        ) : showFooterButtons ? (
          <div className="px-6 py-4 bg-[#F7F8F8] dark:bg-slate-800/50 border-t border-[#E5EAEB] dark:border-slate-800 flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              {cancelText}
            </Button>
            {onSave && (
              <Button
                variant="primary"
                onClick={onSave}
                isLoading={isSaving}
                disabled={saveDisabled || isSaving}
              >
                {saveText}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
