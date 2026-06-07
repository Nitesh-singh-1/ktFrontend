import { baseService } from "./baseservice";

// Types (optional but recommended)
export interface GRPayload {
  consignor: string;
  consignee: string;
  from: string;
  to: string;
}
export interface GoodsPayload {
  billId: number;
  article: string;
  description: string;
  weight: number;
  rate: number;
}

export interface ChargePayload {
  billId: number;
  freight: number;
  serviceCharge: number;
  ddCharge: number;
  hamali: number;
  otherCharge: number;
  stCharge: number;
  grandTotal: number;
}
export const apiService = {
    createGstBill: (data: any) => {
    return baseService.post("/GstBill", data);
  },

  // ✅ Get All GST Bills
  getAllGstBills: () => {
    return baseService.get("/GstBill");
  },

  // ✅ Get GST Bill By Id
  getGstBillById: (id: number) => {
    return baseService.get(`/GstBill/${id}`);
  },

  // ✅ Update GST Bill
  updateGstBill: (id: number, data: any) => {
    return baseService.put(`/GstBill/${id}`, data);
  },

  // ✅ Delete GST Bill
  deleteGstBill: (id: number) => {
    return baseService.delete(`/GstBill/${id}`);
  },

  // ✅ Example: Get All GR
  getAllGR: () => {
    return baseService.get("/gr");
  },

  // ✅ Example: Get GR By Id
  getGRById: (id: number) => {
    return baseService.get(`/gr/${id}`);
  },

  // ✅ Example: Update GR
  updateGR: (id: number, data: GRPayload) => {
    return baseService.put(`/gr/${id}`, data);
  },

  // ✅ Example: Delete GR
  deleteGR: (id: number) => {
    return baseService.delete(`/gr/${id}`);
  },
  createGoodsDetail: (data: GoodsPayload) => {
    return baseService.post("/GoodsDetail", data);
  },

  createMultipleGoods: (data: GoodsPayload[]) => {
    // optional helper (parallel calls)
    return Promise.all(
      data.map((item) =>
        baseService.post("/GoodsDetail", item)
      )
    );
  },

  /* ---------- CHARGES ---------- */
  createCharge: (data: ChargePayload) => {
    return baseService.post("/Charge", data);
  },

  /* ---------- DASHBOARD ---------- */
  getDashboardStats: () => {
    return baseService.get("/Dashboard/stats");
  },

  getDashboardRevenue: () => {
    return baseService.get("/Dashboard/revenue");
  },

  /* ---------- CHALLAN ---------- */
  createChallan: (data: any) => {
    return baseService.post("/Challan", data);
  },

  getAllChallans: (page: number = 1, pageSize: number = 10) => {
    return baseService.get(`/Challan?page=${page}&pageSize=${pageSize}`);
  },

  getChallanById: (id: number) => {
    return baseService.get(`/Challan/${id}`);
  },

  updateChallan: (id: number, data: any) => {
    return baseService.put(`/Challan/${id}`, data);
  },

  deleteChallan: (id: number) => {
    return baseService.delete(`/Challan/${id}`);
  },

  searchChallans: (params: {
    searchTerm?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.searchTerm) queryParams.append("searchTerm", params.searchTerm);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString());
    
    return baseService.get(`/Challan/search?${queryParams.toString()}`);
  },
};

