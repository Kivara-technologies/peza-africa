import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { trpc } from "@/providers/trpc";
import PremiumProductCard from "@/components/PremiumProductCard";

export default function Shop() {
  const [searchParams] = useSearchParams();
  const [activeCat, setActiveCat] = useState(searchParams.get("cat") || "all");
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc" | "rating">("newest");
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories } = trpc.category.list.useQuery();
  const { data: products, refetch } = trpc.product.list.useQuery({
    category: activeCat === "all" ? undefined : activeCat,
    search: search || undefined,
    sort,
  });

  useEffect(() => {
    refetch();
  }, [activeCat, search, sort, refetch]);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-extrabold text-peza-brown">Shop</h1>
        <span className="text-sm text-gray-500">{products?.length || 0} products</span>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white border border-peza-cream-dark rounded-xl px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-peza-brown placeholder:text-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 transition-colors ${showFilters ? "bg-peza-orange text-white border-peza-orange" : "bg-white text-peza-brown border-peza-cream-dark"}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:block">Sort</span>
        </button>
      </div>

      {/* Sort Options */}
      {showFilters && (
        <div className="flex gap-2 mb-4 flex-wrap animate-fade-in-up">
          {[
            { key: "newest" as const, label: "Newest" },
            { key: "price-asc" as const, label: "Price: Low to High" },
            { key: "price-desc" as const, label: "Price: High to Low" },
            { key: "rating" as const, label: "Top Rated" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${sort === s.key ? "bg-peza-orange text-white" : "bg-white text-peza-brown border border-peza-cream-dark hover:border-peza-orange"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
        <button
          onClick={() => setActiveCat("all")}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${activeCat === "all" ? "bg-peza-orange text-white border-peza-orange" : "bg-white text-peza-brown border-peza-cream-dark"}`}
        >
          All
        </button>
        {categories?.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCat(c.slug)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all flex items-center gap-2 ${activeCat === c.slug ? "bg-peza-orange text-white border-peza-orange" : "bg-white text-peza-brown border-peza-cream-dark"}`}
          >
            {c.image && <img src={c.image} alt="" className="w-5 h-5 rounded-full object-cover" />}
            {c.name}
          </button>
        ))}
      </div>

      {/* Product Grid with Premium Cards */}
      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <PremiumProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4 opacity-50">🔍</div>
          <h3 className="text-lg font-bold text-peza-brown">No products found</h3>
          <p className="text-sm text-gray-500 mt-1">Try a different search or category</p>
        </div>
      )}
    </div>
  );
}
