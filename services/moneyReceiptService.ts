import { baseService } from "./baseservice";
import { MoneyReceiptDto, MoneyReceiptFilterRequest } from "@/types/moneyReceipt";

export const moneyReceiptService = {
  getReceipts: (filter: MoneyReceiptFilterRequest = {}) => {
    const params = new URLSearchParams();
    if (filter.startDate) params.append("startDate", filter.startDate);
    if (filter.endDate) params.append("endDate", filter.endDate);
    if (filter.search) params.append("search", filter.search);
    if (filter.paymentMode) params.append("paymentMode", filter.paymentMode);

    const query = params.toString() ? `?${params.toString()}` : "";
    return baseService.get<MoneyReceiptDto[]>(`/moneyreceipt${query}`);
  },

  getReceiptById: (id: number) => {
    return baseService.get<MoneyReceiptDto>(`/moneyreceipt/${id}`);
  },

  getReceiptByShipmentId: (shipmentId: number) => {
    return baseService.get<MoneyReceiptDto>(`/moneyreceipt/shipment/${shipmentId}`);
  },
};
