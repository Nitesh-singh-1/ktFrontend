import { apiService } from "../../../services/apiservice";
import { generateChallanPrintTemplate } from "./challanPrintTemplate";

export async function printChallan(id: number): Promise<void> {
  try {
    // Fetch full details from API
    const response: any = await apiService.getChallanById(id);
    
    if (!response.success || !response.data) {
      alert("Failed to fetch challan details for printing");
      return;
    }

    const challan = response.data;

    // Generate HTML from template
    const htmlContent = generateChallanPrintTemplate(challan);

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
    console.error("Error printing challan:", err);
  }
}
