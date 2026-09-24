import { PaymentTerm, ShipmentStatus } from './shipment';

export enum ManifestStatus {
  Draft = 0,
  Finalized = 1,
  Loaded = 2,
  Dispatched = 3,
  InTransit = 4,
  ArrivedAtHub = 5,
  Unloaded = 6,
  Closed = 7,
  Cancelled = 8,
}

export enum ManifestItemStatus {
  Loaded = 0,
  ReceivedIntact = 1,
  ShortageReported = 2,
  ExcessReported = 3,
  DamagedReported = 4,
}

export interface ManifestItem {
  id: number;
  manifestId: number;
  shipmentId: number;
  shipmentNo: string;
  consignorName?: string;
  consigneeName?: string;
  fromLocation?: string;
  toLocation?: string;
  targetDestinationHubId?: number;
  targetDestinationHubName?: string;
  loadedPackages: number;
  loadedWeightKg: number;
  unloadingStatus: ManifestItemStatus;
  receivedPackages?: number;
  shortagePackages?: number;
  damagedPackages?: number;
  unloadedAtHubId?: number;
  unloadedAtHubName?: string;
  unloadedDate?: string;
  discrepancyRemarks?: string;
  totalFreight: number;
  paymentTerm: PaymentTerm;
  ewayBillNo?: string;
}

export interface Manifest {
  id: number;
  tenantId: string;
  manifestNo: string;
  manifestDate: string;
  originHubId?: number;
  originHubName?: string;
  destinationHubId?: number;
  destinationHubName?: string;
  tripId?: number;
  tripNo?: string;
  vehicleNo?: string;
  driverName?: string;
  consolidatedEwayBillNo?: string;
  consolidatedEwayBillDate?: string;
  sealNo?: string;
  loadingSupervisorName?: string;
  remarks?: string;
  status: ManifestStatus;
  totalConsignments: number;
  totalPackages: number;
  totalWeightKg: number;
  isActive: boolean;
  createdAt: string;
  createdByName?: string;
  items: ManifestItem[];
}

export interface CreateManifestItemRequest {
  shipmentId: number;
  targetDestinationHubId?: number;
  loadedPackages?: number;
  loadedWeightKg?: number;
}

export interface CreateManifestRequest {
  manifestNo?: string;
  manifestDate?: string;
  originHubId?: number;
  destinationHubId?: number;
  tripId?: number;
  consolidatedEwayBillNo?: string;
  sealNo?: string;
  loadingSupervisorName?: string;
  remarks?: string;
  items: CreateManifestItemRequest[];
}

export interface UpdateManifestRequest {
  manifestDate?: string;
  originHubId?: number;
  destinationHubId?: number;
  tripId?: number;
  consolidatedEwayBillNo?: string;
  sealNo?: string;
  loadingSupervisorName?: string;
  remarks?: string;
  status?: ManifestStatus;
  items?: CreateManifestItemRequest[];
}

export interface UnloadManifestItemDiscrepancyRequest {
  manifestItemId: number;
  unloadingStatus: ManifestItemStatus;
  receivedPackages: number;
  shortagePackages?: number;
  damagedPackages?: number;
  discrepancyRemarks?: string;
}

export interface UnloadManifestRequest {
  unloadedAtHubId: number;
  unloadedDate?: string;
  remarks?: string;
  items?: UnloadManifestItemDiscrepancyRequest[];
}

export interface ManifestFilterRequest {
  search?: string;
  status?: ManifestStatus;
  originHubId?: number;
  destinationHubId?: number;
  tripId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}
