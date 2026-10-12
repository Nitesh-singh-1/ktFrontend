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
  moneyReceiptCharge?: number;
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
  isCollected?: boolean;
  paidAmount?: number;
  dueAmount?: number;
}

export interface MoneyReceiptFilterRequest {
  startDate?: string;
  endDate?: string;
  search?: string;
  paymentMode?: string;
  status?: string;
}

export interface CollectMoneyReceiptRequest {
  paymentDate: string;
  paymentMode: string;
  referenceNo?: string;
  receivedAmount?: number;
  remarks?: string;
}
