import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { ChevronRight, Zap, TrendingUp, Briefcase, Factory, ArrowRight, ChevronLeft, ShoppingBag } from "lucide-react";
import { trpc } from "@/providers/trpc";
import PremiumProductCard from "@/components/PremiumProductCard";
import { getShopDestination } from "@/lib/shopNavigation";
import { premiumBanners } from "@/data/premiumBanners";
import FeatureShowcase from "@/components/FeatureShowcase";

const BRANDS = ["Samsung", "Apple", "Nike", "Adidas", "Sony", "LG", "Huawei", "Tecno", "Zamtel", "Airtel", "MTN", "Unilever"];

const CATEGORY_ROWS = [
  { slug: "electronics", title: "Trending in Electronics" },
  { slug: "fashion", title: "Trending in Fashion" },
  { slug: "beauty", title: "Beauty & Personal Care" },
  { slug: "home", title: "Home & Living" },
  { slug: "groceries", title: "Groceries & Essentials" },
  { slug: "baby-kids", title: "Baby & Toddler" },
  { slug: "agro", title: "Agriculture & Farm Supplies" },
  { slug: "auto", title: "Auto & Accessories" },
] as const;

function ProductRail({ title, products, onViewAll, accent = "" }: { title: string; products: any[] | undefined; onViewAll: () => void; accent?: string }) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-3 px-4">
        <div className="flex items-center gap-2">
          {accent ? <span className="w-1.5 h-6 rounded-full bg-peza-orange" /> : null}
          <h3 className="text-lg font-extrabold text-peza-brown">{title}</h3>
        </div>
        <button onClick={onViewAll} className="text-peza-orange text-sm font-bold flex items-center gap-1 whitespace-nowrap">
          View all <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar px-4 pb-2 snap-x snap-mandatory">
        {(products || []).slice(0, 10).map((p) => (
          <div key={p.id} className="w-[190px] sm:w-[225px] lg:w-[245px] flex-shrink-0 snap-start">
            <PremiumProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

function AdBanner({ index, onShop }: { index: number; onShop: () => void }) {
  const banner = premiumBanners[index % premiumBanners.length];
  return (
    <section className="px-0 sm:px-4 mt-7">
      <div className="relative overflow-hidden min-h-[180px] sm:min-h-[230px] lg:min-h-[260px] bg-peza-brown group cursor-pointer" onClick={onShop}>
        <img src={banner.image} alt={banner.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className={`absolute inset-0 bg-gradient-to-r ${banner.accent} opacity-90`} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent" />
        <div className="relative min-h-[180px] sm:min-h-[230px] lg:min-h-[260px] flex items-center px-5 sm:px-8 lg:px-12 py-6">
          <div className="max-w-xl text-white">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-amber-200 font-extrabold">{banner.eyebrow || "PEZA special offer"}</p>
            <h3 className="text-2xl sm:text-4xl font-black leading-tight mt-2">{banner.title}</h3>
            <p className="text-xs sm:text-sm text-white/85 mt-2 max-w-lg">{banner.subtitle}</p>
            <span className="inline-flex items-center gap-2 bg-peza-orange text-white text-xs sm:text-sm font-extrabold px-5 py-2.5 rounded-lg mt-4 shadow-lg">
              {banner.cta} <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [bannerIdx, setBannerIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ h: 7, m: 34, s: 22 });
  const banners = premiumBanners;
  const goToShop = () => {
    const destination = getShopDestination();
    if (destination.startsWith("http")) window.location.assign(destination);
    else navigate(destination);
  };

  const { data: categories } = trpc.category.list.useQuery();
  const { data: featured } = trpc.product.featured.useQuery();
  const { data: deals } = trpc.product.deals.useQuery();
  const { data: electronics } = trpc.product.list.useQuery({ category: "electronics", sort: "rating", limit: 12 });
  const { data: fashion } = trpc.product.list.useQuery({ category: "fashion", sort: "rating", limit: 12 });
  const { data: beauty } = trpc.product.list.useQuery({ category: "beauty", sort: "rating", limit: 12 });
  const { data: home } = trpc.product.list.useQuery({ category: "home", sort: "rating", limit: 12 });
  const { data: groceries } = trpc.product.list.useQuery({ category: "groceries", sort: "newest", limit: 12 });
  const { data: babyKids } = trpc.product.list.useQuery({ category: "baby-kids", sort: "rating", limit: 12 });
  const { data: agro } = trpc.product.list.useQuery({ category: "agro", sort: "newest", limit: 12 });
  const { data: auto } = trpc.product.list.useQuery({ category: "auto", sort: "rating", limit: 12 });
  const { data: marketData } = trpc.market.list.useQuery({ category: "commodities" });

  useEffect(() => {
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((p) => {
        let { h, m, s } = p;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const rowProducts = [electronics, fashion, beauty, home, groceries, babyKids, agro, auto];

  return (
    <div className="max-w-7xl mx-auto pb-8">
      <div className="bg-peza-brown overflow-hidden py-2 shadow-sm">
        <div className="flex animate-ticker whitespace-nowrap w-max">
          {[...BRANDS, ...BRANDS].map((brand, i) => (
            <span key={`${brand}-${i}`} className="text-peza-gold text-xs font-semibold px-6">● {brand}</span>
          ))}
        </div>
      </div>

      <section className="relative mx-0 sm:mx-4 mt-4 rounded-none sm:rounded-2xl overflow-hidden h-[220px] sm:h-[330px] cursor-pointer" onClick={goToShop}>
        <img src={banners[bannerIdx].image} alt={banners[bannerIdx].title} className="w-full h-full object-cover" />
        <div className={`absolute inset-0 bg-gradient-to-r ${banners[bannerIdx].accent} opacity-85`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5 sm:p-7">
          <p className="text-[10px] uppercase tracking-[0.28em] text-amber-200 font-bold">{banners[bannerIdx].eyebrow || "PEZA marketplace"}</p>
          <h1 className="text-white text-2xl sm:text-4xl font-extrabold mt-2">{banners[bannerIdx].title}</h1>
          <p className="text-white/85 text-sm sm:text-base mt-1 max-w-lg">{banners[bannerIdx].subtitle}</p>
          <span className="inline-flex items-center gap-1 bg-white text-peza-brown text-xs font-bold px-4 py-2 rounded-full mt-4 w-fit shadow-lg">
            {banners[bannerIdx].cta} <ArrowRight className="w-3 h-3" />
          </span>
        </div>
        <button aria-label="Previous banner" onClick={(e) => { e.stopPropagation(); setBannerIdx((i) => (i - 1 + banners.length) % banners.length); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-peza-brown shadow flex items-center justify-center">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button aria-label="Next banner" onClick={(e) => { e.stopPropagation(); setBannerIdx((i) => (i + 1) % banners.length); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-peza-brown shadow flex items-center justify-center">
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="absolute bottom-3 right-4 flex gap-2">{banners.map((_, i) => <span key={i} className={`h-2 rounded-full transition-all ${i === bannerIdx ? "w-6 bg-white" : "w-2 bg-white/45"}`} />)}</div>
      </section>

      <FeatureShowcase />

      <section className="px-4 mt-5">
        <div className="rounded-2xl border border-peza-cream-dark bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-peza-brown-light">World brands</p>
            <button onClick={goToShop} className="text-peza-orange text-xs font-semibold">View all</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Samsung", "Apple", "Nike", "Sony", "Bosch", "Dell", "HP", "Adidas", "Unilever", "Airtel", "MTN", "Zamtel"].map((brand) => (
              <span key={brand} className="rounded-full border border-peza-cream-dark bg-peza-cream px-3 py-1.5 text-[11px] font-semibold text-peza-brown">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-extrabold text-peza-brown">Shop by Category</h2>
          <button onClick={goToShop} className="text-peza-orange text-sm font-semibold flex items-center gap-1">See all <ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {categories?.slice(0, 8).map((cat) => (
            <button key={cat.id} onClick={() => navigate(`/shop?cat=${cat.slug}`)} className="flex flex-col items-center gap-2 flex-shrink-0 group">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-peza-gold-light to-peza-gold flex items-center justify-center border-2 border-transparent group-hover:border-peza-orange transition-all shadow-md">
                {cat.image ? <img src={cat.image} alt={cat.name} className="w-10 h-10 object-cover rounded-full" /> : <ShoppingBag className="w-6 h-6 text-peza-orange" />}
              </div>
              <span className="text-xs font-medium text-peza-brown whitespace-nowrap">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 px-4">
        <div className="flex items-center gap-3 mb-3">
          <Zap className="w-5 h-5 text-peza-orange" />
          <h2 className="text-lg font-extrabold text-peza-brown">Flash Deals</h2>
          <div className="ml-auto flex gap-1">{Object.entries(timeLeft).map(([k, v], i) => <span key={k} className="bg-peza-orange text-white text-xs font-bold px-2 py-1 rounded">{String(v).padStart(2, "0")}{i < 2 ? ":" : ""}</span>)}</div>
        </div>
        <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
          {(deals || []).slice(0, 10).map((p) => <div key={p.id} className="w-[190px] sm:w-[225px] lg:w-[245px] flex-shrink-0 snap-start"><PremiumProductCard product={p} /></div>)}
        </div>
      </section>

      <AdBanner index={0} onShop={goToShop} />

      <ProductRail title={CATEGORY_ROWS[0].title} products={electronics} onViewAll={() => navigate("/shop?cat=electronics")} accent />
      <AdBanner index={1} onShop={() => navigate("/shop?cat=home")} />

      <ProductRail title={CATEGORY_ROWS[1].title} products={fashion} onViewAll={() => navigate("/shop?cat=fashion")} accent />
      <ProductRail title={CATEGORY_ROWS[2].title} products={beauty} onViewAll={() => navigate("/shop?cat=beauty")} />
      <AdBanner index={2} onShop={() => navigate("/shop?cat=fashion")} />

      <ProductRail title={CATEGORY_ROWS[3].title} products={home} onViewAll={() => navigate("/shop?cat=home")} />
      <ProductRail title={CATEGORY_ROWS[4].title} products={groceries} onViewAll={() => navigate("/shop?cat=groceries")} />
      <AdBanner index={3} onShop={() => navigate("/shop?cat=groceries")} />

      <ProductRail title={CATEGORY_ROWS[5].title} products={babyKids} onViewAll={() => navigate("/shop?cat=baby-kids")} />
      <ProductRail title={CATEGORY_ROWS[6].title} products={agro} onViewAll={() => navigate("/shop?cat=agro")} />
      <AdBanner index={4} onShop={() => navigate("/shop?cat=electronics")} />

      <ProductRail title={CATEGORY_ROWS[7].title} products={auto} onViewAll={() => navigate("/shop?cat=auto")} />

      <section className="px-4 mt-7">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-peza-green to-green-700 rounded-2xl p-6 text-white cursor-pointer hover:shadow-peza-lg transition-shadow" onClick={() => navigate("/jobs")}>
            <Briefcase className="w-10 h-10 mb-3" />
            <h3 className="text-xl font-bold">Find Work in Africa</h3>
            <p className="text-white/80 text-sm mt-1 mb-4">Discover jobs, gigs and opportunities across Zambia and beyond.</p>
            <span className="inline-flex items-center gap-1 bg-peza-gold text-peza-brown text-xs font-bold px-4 py-2 rounded-lg">Browse Jobs <ArrowRight className="w-3 h-3" /></span>
          </div>
          <div className="bg-gradient-to-br from-peza-brown to-peza-brown-light rounded-2xl p-6 text-white cursor-pointer hover:shadow-peza-lg transition-shadow" onClick={() => navigate("/suppliers")}>
            <Factory className="w-10 h-10 mb-3" />
            <h3 className="text-xl font-bold">B2B Suppliers Hub</h3>
            <p className="text-white/80 text-sm mt-1 mb-4">Source direct from China, India, UAE and more.</p>
            <span className="inline-flex items-center gap-1 bg-peza-gold text-peza-brown text-xs font-bold px-4 py-2 rounded-lg">Explore Suppliers <ArrowRight className="w-3 h-3" /></span>
          </div>
        </div>
      </section>

      <ProductRail title="Just For You" products={featured} onViewAll={goToShop} accent />

      <section className="px-4 mt-7 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-peza-brown">Market Prices</h3>
          <button onClick={() => navigate("/market-prices")} className="text-peza-orange text-sm font-semibold flex items-center gap-1">All prices <ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="bg-white rounded-xl border border-peza-cream-dark overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-peza-cream-dark"><th className="text-left text-[10px] text-gray-400 font-bold uppercase tracking-wider px-4 py-2">Item</th><th className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider px-4 py-2">Price</th><th className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider px-4 py-2">Change</th></tr></thead>
            <tbody>{marketData?.slice(0, 4).map((m) => <tr key={m.id} className="border-b border-peza-cream-dark last:border-0"><td className="text-xs font-medium text-peza-brown px-4 py-2.5">{m.item}</td><td className="text-xs font-bold text-peza-brown text-right px-4 py-2.5">{m.price}</td><td className={`text-xs font-bold text-right px-4 py-2.5 ${m.isUp === true ? "text-peza-green" : m.isUp === false ? "text-peza-red" : "text-gray-500"}`}>{m.change}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
