export interface MoneyReceiptDto {
  id: number;
  receiptNo: string;
  receiptDate: string;
  shipmentId: number;
  shipmentNo: string;
  payerName: string;
  payerGstNo?: string;
  payerMobile?: string;
  fromLocation?: string;
  toLocation?: string;
  totalPackages: number;
  totalWeightKg: number;

  baseFreight: number;
  hamaliCharges: number;
  doorDeliveryCharges: number;
  stationeryCharges: number;
  surcharges: number;
  otherCharges: number;
  gstAmount: number;
  totalAmount: number;

  paymentMode: string;
  transactionRef?: string;
  collectedBy?: string;
  remarks?: string;
  createdAt: string;
}

export interface MoneyReceiptFilterRequest {
  startDate?: string;
  endDate?: string;
  search?: string;
  paymentMode?: string;
}
