import api from "./client";
import type { Order, OrderRequest } from "../types";

export interface DeliveryZoneApi {
  id: number;
  townName: string;
  fee: number;
  isActive: boolean;
  createdAt: string;
}

export const orderApi = {
  getAll: () => api.get<Order[]>("/orders"),

  getById: (id: number) => api.get<Order>("/orders/" + id),

  create: (data: OrderRequest) => api.post<Order>("/orders", data),

  // Delivery zones — fetched from backend API
  getActiveDeliveryZones: () => api.get<DeliveryZoneApi[]>("/delivery-zones"),

  // Admin endpoints
  getAllAdmin: () => api.get<Order[]>("/admin/orders"),

  getAdminById: (id: number) => api.get<Order>("/admin/orders/" + id),

  updateStatus: (id: number, status: string) =>
    api.put<Order>("/admin/orders/" + id + "/status", { status }),
};
