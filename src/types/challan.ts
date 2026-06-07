export type ChallanDetailRow = {
  billNo: string;
  quantity: number;
  destination: string;
  freightAmount: number;
  billTypeId: number;
  consigneeName: string;
  remarks: string;
};

export type BillType = {
  id: number;
  name: string;
};

export const billTypes: BillType[] = [
  { id: 1, name: "TBB" },
  { id: 2, name: "Paid" },
  { id: 3, name: "To Pay" },
];
