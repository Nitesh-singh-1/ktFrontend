import { apiService } from "../../../services/apiservice";
import { generateChallanPrintTemplate } from "./challanPrintTemplate";
import { openPrintWindow } from "./printHeader";

export async function printChallan(id: number): Promise<void> {
  try {
    // Fetch full details from API
    const response: any = await apiService.getChallanById(id);
    
    if (!response.success || !response.data) {
      alert("Failed to fetch challan details for printing");
      return;
    }

    const challan = response.data;

    // Generate HTML from template and open a load-gated print window (waits for the logo to load).
    const htmlContent = generateChallanPrintTemplate(challan);
    openPrintWindow(htmlContent);
  } catch (err: any) {
    alert(err.message || "Failed to generate print document");
    console.error("Error printing challan:", err);
  }
}
