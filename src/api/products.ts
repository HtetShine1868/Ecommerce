import api from "./client";
import type { Product, PageResponse } from "../types";

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

export const productApi = {
  getAll: (params?: {
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    size?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.categoryId != null) query.set("categoryId", String(params.categoryId));
    if (params?.minPrice != null) query.set("minPrice", String(params.minPrice));
    if (params?.maxPrice != null) query.set("maxPrice", String(params.maxPrice));
    query.set("page", String(params?.page ?? 0));
    query.set("size", String(params?.size ?? 50));
    const q = query.toString();
    return api.get<PageResponse<Product>>("/products?" + q).then((res) => res.content);
  },

  getById: (id: number) => api.get<Product>("/products/" + id),

  // Categories — fetched from backend API, not localStorage
  getCategories: () => api.get<Category[]>("/categories"),

  // Admin: create product (JSON body, then separately upload image)
  create: (data: {
    name: string;
    description: string;
    price: number;
    stock: number;
    cargoPrice: number;
    categoryId?: number | null;
  }) => api.post<Product>("/admin/products", data),

  update: (
    id: number,
    data: {
      name: string;
      description: string;
      price: number;
      stock: number;
      cargoPrice: number;
      categoryId?: number | null;
    }
  ) => api.put<Product>("/admin/products/" + id, data),

  uploadImage: (id: number, formData: FormData) =>
    api.upload<Product>("/admin/products/" + id + "/image", formData),

  delete: (id: number) => api.delete<void>("/admin/products/" + id),
};
