import { useEffect, useState } from "react"
import { productApi } from "../api/products"
import type { Product } from "../types"
import ProductCard from "../components/product/ProductCard"

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    productApi.getAll()
      .then((data) => {
        setProducts(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        console.error("Failed to load products:", err)
        setError("Unable to load products. Please make sure the server is running.")
        setProducts([])
      })
      .finally(() => setLoading(false))
  }, [])

  // Defensive: always ensure products is an array (protects against HMR state corruption)
  const safeProducts = Array.isArray(products) ? products : []

  return (
    <div className="bg-surface-50 dark:bg-surface-900 min-h-screen p-6">
      <section className="text-center mb-12">
        <h1 className="font-display text-5xl font-bold mb-4">
          Welcome to ShopNow
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Discover curated products, enjoy fast delivery, and shop securely.
        </p>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-surface-100 h-64" />
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
      ) : safeProducts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No products available yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {safeProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
