import { Quotation } from "@/types/quotation";
import { generateQuotationPrintTemplate } from "./quotationPrintTemplate";
import { openPrintWindow } from "./printHeader";
import { toast } from "@/context/ToastContext";

export function printQuotation(quote: Quotation): void {
  try {
    const html = generateQuotationPrintTemplate(quote);
    openPrintWindow(html);
  } catch (err: any) {
    console.error("Print quotation error:", err);
    toast.error(err?.message || "Failed to generate the quotation document.");
  }
}
