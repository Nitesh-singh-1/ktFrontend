import { shipmentService } from "services/shipmentService";
import { generateShipmentPrintTemplate } from "./shipmentPrintTemplate";
import { Shipment } from "@/types/shipment";

export async function printShipment(shipmentOrId: Shipment | number): Promise<void> {
  try {
    let shipmentData: Shipment;

    if (typeof shipmentOrId === "number") {
      const res = await shipmentService.getShipmentById(shipmentOrId);
      if (!res.success || !res.data) {
        alert("Failed to load shipment details for printing.");
        return;
      }
      shipmentData = res.data;
    } else {
      shipmentData = shipmentOrId;
    }

    const htmlContent = generateShipmentPrintTemplate(shipmentData);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the consignment note.");
      return;
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (err: any) {
    console.error("Print shipment error:", err);
    alert(err?.message || "Failed to generate print document.");
  }
}
