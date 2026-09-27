import { shipmentService } from "services/shipmentService";
import { generateShipmentPrintTemplate } from "./shipmentPrintTemplate";
import { openPrintWindow } from "./printHeader";
import { toast } from "@/context/ToastContext";
import { Shipment } from "@/types/shipment";

export async function printShipment(shipmentOrId: Shipment | number): Promise<void> {
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

    // Load-gated print so the logo (a base64 data URL) is fully loaded before the print dialog fires.
    const htmlContent = generateShipmentPrintTemplate(shipmentData);
    openPrintWindow(htmlContent);
  } catch (err: any) {
    console.error("Print shipment error:", err);
    toast.error(err?.message || "Failed to generate the print document.");
  }
}
