import { apiService } from "../../../services/apiservice";
import { generateGRPrintTemplate } from "./grPrintTemplate";
import { openPrintWindow } from "./printHeader";

export async function printGREntry(id: number): Promise<void> {
  try {
    // Fetch full details from API
    const response: any = await apiService.getGstBillById(id);
    
    if (!response.success || !response.data) {
      alert("Failed to fetch GR details for printing");
      return;
    }

    const entry = response.data;

    // Generate HTML from template and open a load-gated print window (waits for the logo to load).
    const htmlContent = generateGRPrintTemplate(entry);
    openPrintWindow(htmlContent);
  } catch (err: any) {
    alert(err.message || "Failed to generate print document");
    console.error("Error printing GR entry:", err);
  }
}
