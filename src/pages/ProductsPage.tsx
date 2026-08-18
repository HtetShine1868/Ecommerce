import { useEffect, useState, useMemo } from "react";
import { productApi } from "../api/products";
import { orderApi } from "../api/orders";
import { getCategories } from "../utils/localStorage";
import type { Product, Order, OrderItem } from "../types";
import ProductCard from "../components/product/ProductCard";

type SortOption = "newest" | "price-asc" | "price-desc" | "popular";

// ─── Compute salesCount map from all orders ───────────────────────────────────
function buildSalesMap(orders: Order[]): Map<number, number> {
  const map = new Map<number, number>();
  orders.forEach((order) => {
    order.items.forEach((item: OrderItem) => {
      if (item.productId !== null) {
        map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity);
      }
    });
  });
  return map;
}

// Top-N product IDs by units sold
function getPopularIds(salesMap: Map<number, number>, topN = 5): Set<number> {
  return new Set(
    [...salesMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([id]) => id)
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & sort
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Orders data for popularity
  const [salesMap, setSalesMap] = useState<Map<number, number>>(new Map());

  // Categories from localStorage (admin-defined)
  const predefinedCategories = useMemo(() => getCategories(), []);

  // ── Load products ──────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError("");
    productApi
      .getAll({ search: search || undefined, category: category || undefined })
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Failed to load products:", err);
        setError("Unable to load products. The server may be waking up — please wait a moment and retry.");
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [search, category]);

  // ── Load orders for popularity (non-blocking, best-effort) ────────────────
  useEffect(() => {
    orderApi
      .getAll()
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setSalesMap(buildSalesMap(arr));
      })
      .catch(() => {
        // non-fatal — popularity just won't show
      });
  }, []);

  // ── Derived state ──────────────────────────────────────────────────────────
  const popularIds = useMemo(() => getPopularIds(salesMap, 5), [salesMap]);

  // Build the display category list: union of predefined + any extras from products
  const displayCategories = useMemo(() => {
    const fromProducts = products.map((p) => p.category).filter(Boolean) as string[];
    const predefined = predefinedCategories.map((c) => c.name);
    return [...new Set([...predefined, ...fromProducts])];
  }, [predefinedCategories, products]);

  // Apply client-side price filter + sort
  const displayProducts = useMemo(() => {
    let list = [...products];

    // Price filter
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (!isNaN(min) && min >= 0) list = list.filter((p) => p.price >= min);
    if (!isNaN(max) && max >= 0) list = list.filter((p) => p.price <= max);

    // Sort
    switch (sortBy) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        list.sort((a, b) => (salesMap.get(b.id) ?? 0) - (salesMap.get(a.id) ?? 0));
        break;
      case "newest":
      default:
        list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }
    return list;
  }, [products, minPrice, maxPrice, sortBy, salesMap]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="bg-surface-50 dark:bg-surface-900 min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="font-display text-4xl font-bold mb-6">All Products</h1>

        {/* ── Filters bar ────────────────────────────────────────────────── */}
        <div className="mb-8 space-y-3">
          {/* Row 1: search + category + sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-800 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-shadow"
              />
            </div>

            {/* Category */}
            {displayCategories.length > 0 && (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              >
                <option value="">All Categories</option>
                {displayCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="popular">🔥 Most Popular</option>
            </select>
          </div>

          {/* Row 2: price range */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-500 flex-shrink-0">Price (MMK):</span>
            <div className="relative flex-shrink-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">min</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-32 rounded-xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-800 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              />
            </div>
            <span className="text-gray-400">—</span>
            <div className="relative flex-shrink-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">max</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="any"
                className="w-32 rounded-xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-800 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              />
            </div>
            {(minPrice || maxPrice || category || sortBy !== "newest" || search) && (
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setMinPrice("");
                  setMaxPrice("");
                  setSortBy("newest");
                }}
                className="text-xs text-primary-500 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── Results summary ─────────────────────────────────────────────── */}
        {!loading && !error && displayProducts.length > 0 && (
          <p className="text-sm text-gray-400 mb-4">
            {displayProducts.length} product{displayProducts.length !== 1 ? "s" : ""} found
            {sortBy === "popular" && (
              <span className="ml-2 text-orange-500 font-medium">• sorted by popularity</span>
            )}
          </p>
        )}

        {/* ── Grid ───────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-surface-100 dark:bg-surface-800 h-72" />
            ))}
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-8">
              <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl bg-primary-500 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">No products found</p>
            <p className="mt-1 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isPopular={popularIds.has(p.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
