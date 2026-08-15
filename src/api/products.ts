import api from "./client";
import type { Product, PageResponse } from "../types";

export const productApi = {
  getAll: (params?: { search?: string; category?: string; page?: number; size?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    query.set("page", String(params?.page ?? 0));
    query.set("size", String(params?.size ?? 50));
    const q = query.toString();
    return api.get<PageResponse<Product>>("/products?" + q).then((res) => res.content);
  },

  getById: (id: number) => api.get<Product>("/products/" + id),

  // Admin: create product (JSON body, then separately upload image)
  create: (data: {
    name: string;
    description: string;
    price: number;
    stock: number;
    cargoPrice: number;
  }) => api.post<Product>("/admin/products", data),

  update: (
    id: number,
    data: {
      name: string;
      description: string;
      price: number;
      stock: number;
      cargoPrice: number;
    }
  ) => api.put<Product>("/admin/products/" + id, data),

  uploadImage: (id: number, formData: FormData) =>
    api.upload<Product>("/admin/products/" + id + "/image", formData),

  delete: (id: number) => api.delete<void>("/admin/products/" + id),
};