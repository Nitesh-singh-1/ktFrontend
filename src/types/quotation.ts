export enum QuotationStatus {
  Draft = 0,
  Sent = 1,
  Accepted = 2,
  Rejected = 3,
  Expired = 4,
  Converted = 5,
}

export interface Quotation {
  id: number;
  tenantId?: string;
  quoteNo: string;
  quoteDate: string;
  validUntil?: string;
  partyId?: number;
  partyName?: string;
  partyMobile?: string;
  partyGstNo?: string;
  fromLocation?: string;
  toLocation?: string;
  vehicleType?: string;
  goodsDescription?: string;
  weightKg?: number;
  ratePerUnit?: number;
  rateBasis?: string;
  estimatedFreight: number;
  status: QuotationStatus;
  statusName: string;
  convertedRef?: string;
  terms?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
