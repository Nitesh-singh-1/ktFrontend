"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Download, RefreshCw, X } from "lucide-react";

interface UpdateState {
  status: "idle" | "checking" | "available" | "downloading" | "downloaded" | "not-available" | "error";
  version?: string;
  percent?: number;
  message?: string;
}

export default function UpdateNotification() {
  const [updateState, setUpdateState] = useState<UpdateState>({ status: "idle" });
  const [appVersion, setAppVersion] = useState<string>("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if running in Electron environment
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      const api = (window as any).electronAPI;

      api.getAppVersion().then((ver: string) => {
        if (ver) setAppVersion(ver);
      });

      const unsubscribe = api.onUpdateStatus((data: any) => {
        console.log("Update status received in UI:", data);
        setUpdateState(data);
        if (["available", "downloading", "downloaded", "error"].includes(data.status)) {
          setIsVisible(true);
        }
      });

      return () => {
        if (typeof unsubscribe === "function") unsubscribe();
      };
    }
  }, []);

  const handleRestart = () => {
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      (window as any).electronAPI.quitAndInstall();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible || updateState.status === "idle" || updateState.status === "not-available") {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-sky-200 dark:border-slate-800 p-4 transform transition-all duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white text-lg flex-shrink-0 shadow-xs">
          {updateState.status === "downloaded" ? (
            <Sparkles className="w-5 h-5" />
          ) : updateState.status === "downloading" ? (
            <Download className="w-5 h-5 animate-bounce" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {updateState.status === "downloaded"
                ? "Update Ready to Install!"
                : updateState.status === "downloading"
                ? "Downloading Update..."
                : updateState.status === "available"
                ? "New Version Available"
                : "Software Update"}
            </h4>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {updateState.status === "downloaded" &&
              `Version ${updateState.version || ""} has finished downloading. Restart the app to apply the latest features and bug fixes.`}
            {updateState.status === "downloading" &&
              `Downloading version ${updateState.version || ""} (${updateState.percent || 0}% completed)`}
            {updateState.status === "available" &&
              `Version ${updateState.version || ""} is being downloaded automatically in the background.`}
            {updateState.status === "error" &&
              (updateState.message || "Failed to download update.")}
          </p>

          {/* Progress Bar */}
          {updateState.status === "downloading" && (
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-sky-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${updateState.percent || 0}%` }}
              />
            </div>
          )}

          {/* Actions */}
          {updateState.status === "downloaded" && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleRestart}
                className="flex-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Restart & Apply Update
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
