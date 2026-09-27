import { apiService } from "../../../services/apiservice";
import { generateChallanPrintTemplate } from "./challanPrintTemplate";
import { openPrintWindow } from "./printHeader";
import { toast } from "@/context/ToastContext";

export async function printChallan(id: number): Promise<void> {
  try {
    // Fetch full details from API
    const response: any = await apiService.getChallanById(id);
    
    if (!response.success || !response.data) {
      toast.error("Failed to fetch challan details for printing.");
      return;
    }

    const challan = response.data;

    // Generate HTML from template and open a load-gated print window (waits for the logo to load).
    const htmlContent = generateChallanPrintTemplate(challan);
    openPrintWindow(htmlContent);
  } catch (err: any) {
    toast.error(err.message || "Failed to generate the print document.");
    console.error("Error printing challan:", err);
  }
}
