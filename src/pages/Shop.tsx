import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Search, SlidersHorizontal, ShieldCheck, Truck, Star, Sparkles, X, Tag } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { supabase } from "@/lib/supabaseClient";
import PremiumProductCard from "@/components/PremiumProductCard";

type Sort = "newest" | "price-asc" | "price-desc" | "rating";
type Product = {
  id: number; name: string; price: string; comparePrice: string | null; image: string;
  realPhoto: string | null; rating: string; reviewCount: number; vendor: string;
  whatsappNumber: string | null; laybyMonths: number | null; stock?: number | null; isDeal?: boolean;
};

function mapProduct(p: any): Product {
  return {
    id: Number(p.id), name: p.name, price: String(p.price), comparePrice: p.compare_price ?? p.comparePrice ?? null,
    image: p.image || p.real_photo || p.realPhoto || "", realPhoto: p.real_photo ?? p.realPhoto ?? null,
    rating: String(p.rating ?? "0"), reviewCount: Number(p.review_count ?? p.reviewCount ?? 0), vendor: p.vendor || "PEZA Seller",
    whatsappNumber: p.whatsapp_number ?? p.whatsappNumber ?? null, laybyMonths: p.layby_months ?? p.laybyMonths ?? null,
    stock: p.stock == null ? null : Number(p.stock), isDeal: Boolean(p.is_deal ?? p.isDeal),
  };
}

export default function Shop() {
  const [searchParams] = useSearchParams();
  const [activeCat, setActiveCat] = useState(searchParams.get("cat") || "all");
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState<Sort>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState(""); const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0); const [dealsOnly, setDealsOnly] = useState(false); const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1); const [fallbackProducts, setFallbackProducts] = useState<Product[] | null>(null); const [fallbackLoading, setFallbackLoading] = useState(false);

  const { data: categories } = trpc.category.list.useQuery();
  const { data: apiProducts, isLoading: apiLoading, isError: apiError } = trpc.product.list.useQuery({
    category: activeCat === "all" ? undefined : activeCat, search: search || undefined, sort, limit: 200, offset: 0,
  }, { retry: 1, staleTime: 30000 });

  useEffect(() => {
    let cancelled = false;
    if (apiProducts) { setFallbackProducts(null); return; }
    setFallbackLoading(true);
    const load = async () => {
      try {
        let query = (supabase as any).from("products").select("*").limit(200);
        if (activeCat !== "all") query = query.eq("category_slug", activeCat);
        if (search.trim()) {
          const q = search.trim().replace(/[,()]/g, " ");
          query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
        }
        const order = sort === "price-asc" ? { column: "price", ascending: true } : sort === "price-desc" ? { column: "price", ascending: false } : sort === "rating" ? { column: "rating", ascending: false } : { column: "created_at", ascending: false };
        query = query.order(order.column, { ascending: order.ascending });
        const { data, error } = await query;
        if (error) throw error;
        if (!cancelled) setFallbackProducts((data || []).map(mapProduct));
      } catch (e) {
        if (!cancelled) setFallbackProducts([]);
        console.error("PEZA product fallback failed", e);
      } finally { if (!cancelled) setFallbackLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [apiProducts, apiError, activeCat, search, sort]);

  useEffect(() => setPage(1), [activeCat, search, sort, minPrice, maxPrice, minRating, dealsOnly, inStockOnly]);

  const products = apiProducts?.map(mapProduct) ?? fallbackProducts ?? [];
  const loading = apiLoading || (!apiProducts && fallbackLoading);
  const filteredProducts = useMemo(() => {
    const min = minPrice ? Number(minPrice) : 0, max = maxPrice ? Number(maxPrice) : Infinity;
    return products.filter((p) => Number(p.price) >= min && Number(p.price) <= max && Number(p.rating || 0) >= minRating && (!dealsOnly || p.isDeal) && (!inStockOnly || Number(p.stock ?? 0) > 0));
  }, [products, minPrice, maxPrice, minRating, dealsOnly, inStockOnly]);
  const perPage = 40, totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  const visibleProducts = filteredProducts.slice((page - 1) * perPage, page * perPage);
  const activeFilterCount = [minPrice, maxPrice, minRating > 0 ? minRating : "", dealsOnly, inStockOnly].filter(Boolean).length;
  const clearFilters = () => { setMinPrice(""); setMaxPrice(""); setMinRating(0); setDealsOnly(false); setInStockOnly(false); };

  return <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-10">
    <div className="rounded-2xl bg-gradient-to-r from-peza-brown via-peza-brown-light to-peza-brown p-4 sm:p-5 text-white shadow-lg mb-4"><div className="flex items-center justify-between gap-3 flex-wrap"><div><p className="text-[10px] uppercase tracking-[0.25em] text-peza-gold font-bold">Marketplace</p><h1 className="text-xl sm:text-2xl font-extrabold mt-1">Shop the best deals</h1></div><div className="rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-semibold text-peza-gold">{filteredProducts.length} products</div></div></div>
    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">{[{ icon: ShieldCheck, label: "Verified sellers" }, { icon: Truck, label: "Fast Zambian delivery" }, { icon: Star, label: "Top-rated picks" }].map(({ icon: Icon, label }) => <div key={label} className="flex items-center gap-2 sm:gap-3 rounded-xl border border-peza-cream-dark bg-white px-2 sm:px-4 py-2.5 shadow-sm"><div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-peza-orange/10 flex items-center justify-center text-peza-orange flex-shrink-0"><Icon className="w-4 h-4" /></div><span className="text-[10px] sm:text-sm font-semibold text-peza-brown">{label}</span></div>)}</div>
    <div className="flex gap-2 mb-3"><div className="flex-1 flex items-center gap-2 bg-white border border-peza-cream-dark rounded-xl px-3 sm:px-4 py-2.5 shadow-sm"><Search className="w-4 h-4 text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products, brands..." className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-peza-brown" /></div><button onClick={() => setShowFilters(!showFilters)} className={`px-3 sm:px-4 py-2.5 rounded-xl border flex items-center gap-2 shadow-sm ${showFilters ? "bg-peza-orange text-white border-peza-orange" : "bg-white text-peza-brown border-peza-cream-dark"}`}><SlidersHorizontal className="w-4 h-4" /><span className="text-sm font-medium hidden sm:block">Filters</span>{activeFilterCount > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-white text-peza-orange text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>}</button></div>
    {showFilters && <div className="rounded-2xl border border-peza-cream-dark bg-white p-4 mb-4 shadow-sm"><div className="flex items-center justify-between mb-3"><h2 className="font-bold text-peza-brown">Filter products</h2><button onClick={clearFilters} className="text-xs font-semibold text-peza-orange">Clear all</button></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><div><label className="text-xs font-semibold text-gray-500">Price range (Kwacha)</label><div className="flex gap-2 mt-1"><input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} type="number" placeholder="Min" className="w-full rounded-lg border px-3 py-2 text-sm" /><input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="number" placeholder="Max" className="w-full rounded-lg border px-3 py-2 text-sm" /></div></div><div><label className="text-xs font-semibold text-gray-500">Minimum rating</label><div className="flex gap-1 mt-1">{[4,3,2,1].map(r => <button key={r} onClick={() => setMinRating(minRating === r ? 0 : r)} className={`px-2.5 py-2 rounded-lg border text-xs font-semibold ${minRating === r ? "bg-peza-orange text-white" : "text-peza-brown"}`}><Star className="w-3 h-3 inline fill-peza-gold text-peza-gold" /> {r}+</button>)}</div></div><label className="flex items-center gap-2 text-sm font-semibold text-peza-brown"><input type="checkbox" checked={dealsOnly} onChange={e => setDealsOnly(e.target.checked)} /> Deals only <Tag className="w-4 h-4 text-peza-orange" /></label><label className="flex items-center gap-2 text-sm font-semibold text-peza-brown"><input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} /> In-stock only</label></div></div>}
    <div className="mb-4"><div className="flex items-center justify-between mb-2"><span className="text-sm font-bold text-peza-brown">Browse by category</span><span className="inline-flex items-center gap-1 text-xs font-semibold text-peza-orange"><Sparkles className="w-3 h-3" /> Curated</span></div><div className="flex gap-2 overflow-x-auto no-scrollbar pb-2"><button onClick={() => setActiveCat("all")} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 ${activeCat === "all" ? "bg-peza-orange text-white border-peza-orange" : "bg-white text-peza-brown border-peza-cream-dark"}`}>All</button>{categories?.map(c => <button key={c.id} onClick={() => setActiveCat(c.slug)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 flex items-center gap-2 ${activeCat === c.slug ? "bg-peza-orange text-white border-peza-orange" : "bg-white text-peza-brown border-peza-cream-dark"}`}>{c.image && <img src={c.image} alt="" className="w-5 h-5 rounded-full object-cover" />}{c.name}</button>)}</div></div>
    <div className="flex items-center justify-between gap-2 mb-3"><p className="text-xs sm:text-sm text-gray-500">Showing <strong>{visibleProducts.length}</strong> of <strong>{filteredProducts.length}</strong></p><select value={sort} onChange={e => setSort(e.target.value as Sort)} className="bg-white border border-peza-cream-dark rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-peza-brown"><option value="newest">Newest</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="rating">Top Rated</option></select></div>
    {loading ? <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">{Array.from({length: 8}).map((_,i) => <div key={i} className="bg-white rounded-2xl border border-peza-cream-dark overflow-hidden animate-pulse"><div className="aspect-square bg-peza-cream" /><div className="p-3 space-y-2"><div className="h-3 bg-peza-cream rounded" /><div className="h-4 bg-peza-cream rounded w-2/3" /><div className="h-8 bg-peza-cream rounded" /></div></div>)}</div> : visibleProducts.length > 0 ? <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">{visibleProducts.map(p => <PremiumProductCard key={p.id} product={p} />)}</div> : <div className="flex flex-col items-center justify-center py-20 text-center"><div className="text-5xl mb-4">🔍</div><h3 className="text-lg font-bold text-peza-brown">No products found</h3><p className="text-sm text-gray-500 mt-1">Try changing your filters or search.</p>{activeFilterCount > 0 && <button onClick={clearFilters} className="mt-4 px-4 py-2 rounded-lg bg-peza-orange text-white text-sm font-bold">Clear filters</button>}</div>}
    {totalPages > 1 && <div className="flex items-center justify-center gap-2 mt-7"><button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-lg border bg-white text-sm font-semibold disabled:opacity-40">Previous</button><span className="px-3 py-2 text-sm font-bold text-peza-brown">Page {page} of {totalPages}</span><button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-lg bg-peza-orange text-white text-sm font-semibold disabled:opacity-40">Next</button></div>}
    {showFilters && <button onClick={() => setShowFilters(false)} className="fixed bottom-4 right-4 md:hidden rounded-full bg-peza-brown text-white p-3 shadow-xl" aria-label="Close filters"><X className="w-5 h-5" /></button>}
  </div>;
}
