import { shipmentService } from "services/shipmentService";
import { fleetService } from "services/fleetService";
import {
  generateShipmentPrintTemplate,
  generateShipmentPrintTemplateWithOptions,
  BiltyPrintOptions,
} from "./shipmentPrintTemplate";
import { openPrintWindow } from "./printHeader";
import { toast } from "@/context/ToastContext";
import { Shipment } from "@/types/shipment";
import { loadBiltyPrintPrefs } from "./printPreferences";
import { cacheActiveStations, readCachedActiveStations } from "./tenantProfile";

const STATIONS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const STATIONS_CACHE_META_KEY = "kt.print_stations_cache";

function stationsCacheIsFresh(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(STATIONS_CACHE_META_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { at?: number; names?: string[] };
    if (!Array.isArray(parsed.names) || parsed.names.length === 0) return false;
    const age = Date.now() - (parsed.at || 0);
    return age < STATIONS_CACHE_TTL_MS;
  } catch {
    return false;
  }
}

async function ensureStationsCache(): Promise<void> {
  if (stationsCacheIsFresh()) return;
  try {
    const locations = await fleetService.getLocations();
    const names = (locations || [])
      .filter((l) => l && l.isActive !== false && l.name)
      .map((l) => (l.code ? `${l.code} · ${l.name}` : l.name));
    cacheActiveStations(names);
  } catch {
    // Non-fatal: printing still works without the station strip if the fetch fails.
    // Keep whatever we already cached (if anything).
    if (readCachedActiveStations().length === 0) cacheActiveStations([]);
  }
}

export async function printShipment(
  shipmentOrId: Shipment | number,
  options?: BiltyPrintOptions,
): Promise<void> {
  try {
    let shipmentData: Shipment;

    if (typeof shipmentOrId === "number") {
      const res = await shipmentService.getShipmentById(shipmentOrId);
      if (!res.success || !res.data) {
        toast.error("Failed to load shipment details for printing.");
        return;
      }
      shipmentData = res.data;
    } else {
      shipmentData = shipmentOrId;
    }

    await ensureStationsCache();

    const effectiveOpts = options ?? loadBiltyPrintPrefs();
    const htmlContent = effectiveOpts
      ? generateShipmentPrintTemplateWithOptions(shipmentData, effectiveOpts)
      : generateShipmentPrintTemplate(shipmentData);
    openPrintWindow(htmlContent);
  } catch (err: any) {
    console.error("Print shipment error:", err);
    toast.error(err?.message || "Failed to generate the print document.");
  }
}
