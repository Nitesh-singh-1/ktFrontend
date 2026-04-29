import { apiService } from "../../../services/apiservice";
import { generateGRPrintTemplate } from "./grPrintTemplate";

export async function printGREntry(id: number): Promise<void> {
  try {
    // Fetch full details from API
    const response: any = await apiService.getGstBillById(id);
    
    if (!response.success || !response.data) {
      alert("Failed to fetch GR details for printing");
      return;
    }

    const entry = response.data;

    // Generate HTML from template
    const htmlContent = generateGRPrintTemplate(entry);

    // Open print window
    const printWindow = window.open("", "_blank");
    
    if (!printWindow) {
      alert("Please allow popups to print");
      return;
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (err: any) {
    alert(err.message || "Failed to generate print document");
    console.error("Error printing GR entry:", err);
  }
}
