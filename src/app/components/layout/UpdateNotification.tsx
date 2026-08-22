"use client";

import React, { useEffect, useState } from "react";

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
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-indigo-100 p-4 transform transition-all duration-300 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-lg flex-shrink-0 shadow-md">
          {updateState.status === "downloaded" ? "✨" : updateState.status === "downloading" ? "⬇️" : "🚀"}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900">
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
              className="text-gray-400 hover:text-gray-600 text-xs font-semibold p-1"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-1">
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
            <div className="w-full bg-gray-100 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${updateState.percent || 0}%` }}
              />
            </div>
          )}

          {/* Actions */}
          {updateState.status === "downloaded" && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleRestart}
                className="flex-1 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-xs font-bold hover:shadow-md transition-all duration-200"
              >
                Restart & Apply Update
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
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
