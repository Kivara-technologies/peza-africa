import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Search, SlidersHorizontal, ShieldCheck, Truck, Star, Sparkles, X, Tag } from "lucide-react";
import { trpc } from "@/providers/trpc";
import PremiumProductCard from "@/components/PremiumProductCard";

type Sort = "newest" | "price-asc" | "price-desc" | "rating";

export default function Shop() {
  const [searchParams] = useSearchParams();
  const [activeCat, setActiveCat] = useState(searchParams.get("cat") || "all");
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState<Sort>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [dealsOnly, setDealsOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data: categories } = trpc.category.list.useQuery();
  const { data: products } = trpc.product.list.useQuery({
    category: activeCat === "all" ? undefined : activeCat,
    search: search || undefined,
    sort,
    limit: 100,
    offset: 0,
  });

  useEffect(() => setPage(1), [activeCat, search, sort, minPrice, maxPrice, minRating, dealsOnly, inStockOnly]);

  const filteredProducts = useMemo(() => {
    const min = minPrice ? Number(minPrice) : 0;
    const max = maxPrice ? Number(maxPrice) : Infinity;
    return (products || []).filter((p) => {
      const price = Number(p.price);
      const rating = Number(p.rating || 0);
      const stock = Number(p.stock ?? 0);
      return price >= min && price <= max && rating >= minRating && (!dealsOnly || p.isDeal) && (!inStockOnly || stock > 0);
    });
  }, [products, minPrice, maxPrice, minRating, dealsOnly, inStockOnly]);

  const perPage = 40;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  const visibleProducts = filteredProducts.slice((page - 1) * perPage, page * perPage);
  const activeFilterCount = [minPrice, maxPrice, minRating > 0 ? minRating : "", dealsOnly, inStockOnly].filter(Boolean).length;

  const clearFilters = () => {
    setMinPrice(""); setMaxPrice(""); setMinRating(0); setDealsOnly(false); setInStockOnly(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-10">
      <div className="rounded-2xl bg-gradient-to-r from-peza-brown via-peza-brown-light to-peza-brown p-4 sm:p-5 text-white shadow-lg mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div><p className="text-[10px] uppercase tracking-[0.25em] text-peza-gold font-bold">Marketplace</p><h1 className="text-xl sm:text-2xl font-extrabold mt-1">Shop the best deals</h1></div>
          <div className="rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-semibold text-peza-gold">{filteredProducts.length} products</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
        {[{ icon: ShieldCheck, label: "Verified sellers" }, { icon: Truck, label: "Fast Zambian delivery" }, { icon: Star, label: "Top-rated picks" }].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 sm:gap-3 rounded-xl border border-peza-cream-dark bg-white px-2 sm:px-4 py-2.5 shadow-sm">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-peza-orange/10 flex items-center justify-center text-peza-orange flex-shrink-0"><Icon className="w-4 h-4" /></div>
            <span className="text-[10px] sm:text-sm font-semibold text-peza-brown">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-peza-cream-dark rounded-xl px-3 sm:px-4 py-2.5 shadow-sm">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Search products, brands..." className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-peza-brown placeholder:text-gray-400" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`px-3 sm:px-4 py-2.5 rounded-xl border flex items-center gap-2 shadow-sm ${showFilters ? "bg-peza-orange text-white border-peza-orange" : "bg-white text-peza-brown border-peza-cream-dark"}`}>
          <SlidersHorizontal className="w-4 h-4" /><span className="text-sm font-medium hidden sm:block">Filters</span>{activeFilterCount > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-white text-peza-orange text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>}
        </button>
      </div>

      {showFilters && (
        <div className="rounded-2xl border border-peza-cream-dark bg-white p-4 mb-4 shadow-sm animate-fade-in-up">
          <div className="flex items-center justify-between mb-3"><h2 className="font-bold text-peza-brown">Filter products</h2><button onClick={clearFilters} className="text-xs font-semibold text-peza-orange">Clear all</button></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div><label className="text-xs font-semibold text-gray-500">Price range (Kwacha)</label><div className="flex gap-2 mt-1"><input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} type="number" placeholder="Min" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" /><input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="number" placeholder="Max" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" /></div></div>
            <div><label className="text-xs font-semibold text-gray-500">Minimum rating</label><div className="flex gap-1 mt-1">{[4, 3, 2, 1].map((r) => <button key={r} onClick={() => setMinRating(minRating === r ? 0 : r)} className={`px-2.5 py-2 rounded-lg border text-xs font-semibold ${minRating === r ? "bg-peza-orange text-white border-peza-orange" : "text-peza-brown"}`}><Star className="w-3 h-3 inline fill-peza-gold text-peza-gold" /> {r}+</button>)}</div></div>
            <label className="flex items-center gap-2 text-sm font-semibold text-peza-brown cursor-pointer"><input type="checkbox" checked={dealsOnly} onChange={(e) => setDealsOnly(e.target.checked)} className="accent-orange-500" /> Deals only <Tag className="w-4 h-4 text-peza-orange" /></label>
            <label className="flex items-center gap-2 text-sm font-semibold text-peza-brown cursor-pointer"><input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="accent-orange-500" /> In-stock only</label>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2"><span className="text-sm font-bold text-peza-brown">Browse by category</span><span className="inline-flex items-center gap-1 text-xs font-semibold text-peza-orange"><Sparkles className="w-3 h-3" /> Curated</span></div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button onClick={() => setActiveCat("all")} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 ${activeCat === "all" ? "bg-peza-orange text-white border-peza-orange" : "bg-white text-peza-brown border-peza-cream-dark"}`}>All</button>
          {categories?.map((c) => <button key={c.id} onClick={() => setActiveCat(c.slug)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 flex items-center gap-2 ${activeCat === c.slug ? "bg-peza-orange text-white border-peza-orange" : "bg-white text-peza-brown border-peza-cream-dark"}`}>{c.image && <img src={c.image} alt="" className="w-5 h-5 rounded-full object-cover" />}{c.name}</button>)}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-xs sm:text-sm text-gray-500">Showing <strong>{visibleProducts.length}</strong> of <strong>{filteredProducts.length}</strong></p>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="bg-white border border-peza-cream-dark rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-peza-brown outline-none">
          <option value="newest">Newest</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="rating">Top Rated</option>
        </select>
      </div>

      {visibleProducts.length > 0 ? <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">{visibleProducts.map((p) => <PremiumProductCard key={p.id} product={p} />)}</div> : <div className="flex flex-col items-center justify-center py-20 text-center"><div className="text-5xl mb-4">🔍</div><h3 className="text-lg font-bold text-peza-brown">No products found</h3><p className="text-sm text-gray-500 mt-1">Try changing your filters or search.</p>{activeFilterCount > 0 && <button onClick={clearFilters} className="mt-4 px-4 py-2 rounded-lg bg-peza-orange text-white text-sm font-bold">Clear filters</button>}</div>}

      {totalPages > 1 && <div className="flex items-center justify-center gap-2 mt-7">
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-lg border bg-white text-sm font-semibold disabled:opacity-40">Previous</button>
        <span className="px-3 py-2 text-sm font-bold text-peza-brown">Page {page} of {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-lg bg-peza-orange text-white text-sm font-semibold disabled:opacity-40">Next</button>
      </div>}

      {showFilters && <button onClick={() => setShowFilters(false)} className="fixed bottom-4 right-4 md:hidden rounded-full bg-peza-brown text-white p-3 shadow-xl" aria-label="Close filters"><X className="w-5 h-5" /></button>}
    </div>
  );
}
