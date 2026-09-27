import { apiService } from "../../../services/apiservice";
import { generateGRPrintTemplate } from "./grPrintTemplate";
import { openPrintWindow } from "./printHeader";
import { toast } from "@/context/ToastContext";

export async function printGREntry(id: number): Promise<void> {
  try {
    // Fetch full details from API
    const response: any = await apiService.getGstBillById(id);
    
    if (!response.success || !response.data) {
      toast.error("Failed to fetch GR details for printing.");
      return;
    }

    const entry = response.data;

    // Generate HTML from template and open a load-gated print window (waits for the logo to load).
    const htmlContent = generateGRPrintTemplate(entry);
    openPrintWindow(htmlContent);
  } catch (err: any) {
    toast.error(err.message || "Failed to generate the print document.");
    console.error("Error printing GR entry:", err);
  }
}
