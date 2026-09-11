import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight, Baby, Car, ChevronLeft, ChevronRight, Leaf, Laptop, Flame,
  ShoppingBag, ShoppingBasket, Shirt, Sofa, Sparkles, Smartphone, Target,
  Zap, Briefcase, Factory,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import PremiumProductCard from "@/components/PremiumProductCard";
import { getShopDestination } from "@/lib/shopNavigation";
import { premiumBanners } from "@/data/premiumBanners";
import { FALLBACK_CATEGORIES, FALLBACK_PRODUCTS } from "@/data/fallbackCatalog";

const BRANDS = [
  ["Samsung", "samsung", "1428A0"], ["Apple", "apple", "000000"], ["Nike", "nike", "111111"],
  ["Adidas", "adidas", "000000"], ["Sony", "sony", "000000"], ["LG", "lg", "A50034"],
  ["Huawei", "huawei", "FF0000"], ["Tecno", "tecno", "000000"], ["Bosch", "bosch", "E20015"],
  ["Philips", "philips", "0066A1"], ["Unilever", "unilever", "1F36C7"], ["MTN", "mtn", "FFCC00"],
  ["Airtel", "airtel", "E4002B"], ["Zamtel", "zamtel", "00A651"],
] as const;

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

const categoryIcon = (slug: string) => {
  const cls = "w-6 h-6 text-peza-orange";
  if (slug === "electronics") return <Smartphone className={cls} />;
  if (slug === "fashion") return <Shirt className={cls} />;
  if (slug === "beauty") return <Sparkles className={cls} />;
  if (slug === "home") return <Sofa className={cls} />;
  if (slug === "groceries") return <ShoppingBasket className={cls} />;
  if (slug === "baby-kids") return <Baby className={cls} />;
  if (slug === "agro") return <Leaf className={cls} />;
  if (slug === "auto") return <Car className={cls} />;
  return <Laptop className={cls} />;
};

function ProductRail({ title, products, onViewAll, icon }: { title: string; products: any[]; onViewAll: () => void; icon?: "flame" | "target" }) {
  return (
    <section className="mt-5">
      <div className="flex items-center justify-between mb-2.5 px-3 sm:px-4">
        <div className="flex items-center gap-2 min-w-0">
          {icon === "flame" && <Flame className="w-5 h-5 text-red-500 fill-red-500 shrink-0" />}
          {icon === "target" && <Target className="w-5 h-5 text-red-500 shrink-0" />}
          <h2 className="text-lg font-extrabold text-slate-800 truncate">{title}</h2>
        </div>
        <button onClick={onViewAll} className="text-peza-orange text-sm font-bold flex items-center gap-0.5 whitespace-nowrap ml-3 shrink-0">
          View all <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar px-3 sm:px-4 pb-1 snap-x snap-mandatory">
        {products.slice(0, 10).map((p) => (
          <div key={p.id} className="w-[172px] xs:w-[190px] sm:w-[210px] lg:w-[225px] flex-shrink-0 snap-start">
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
    <section className="px-3 sm:px-4 mt-5">
      <div className="relative overflow-hidden rounded-xl min-h-[150px] sm:min-h-[190px] lg:min-h-[220px] bg-peza-brown cursor-pointer" onClick={onShop}>
        <img src={banner.image} alt={banner.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className={`absolute inset-0 bg-gradient-to-r ${banner.accent} opacity-85`} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/15 to-transparent" />
        <div className="relative min-h-[150px] sm:min-h-[190px] lg:min-h-[220px] flex items-center px-5 sm:px-8 py-5">
          <div className="max-w-lg text-white">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-amber-200 font-extrabold">{banner.eyebrow || "PEZA special offer"}</p>
            <h3 className="text-xl sm:text-3xl font-black leading-tight mt-1.5">{banner.title}</h3>
            <p className="text-[11px] sm:text-sm text-white/85 mt-1 max-w-md">{banner.subtitle}</p>
            <span className="inline-flex items-center gap-1 bg-white text-peza-brown text-[11px] sm:text-xs font-extrabold px-4 py-2 rounded-lg mt-3 shadow-lg">
              {banner.cta} <ArrowRight className="w-3.5 h-3.5" />
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
  const [timeLeft, setTimeLeft] = useState({ h: 1, m: 23, s: 45 });
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
    const timer = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((p) => {
        let { h, m, s } = p;
        s -= 1;
        if (s < 0) { s = 59; m -= 1; }
        if (m < 0) { m = 59; h -= 1; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const categoryList = categories?.length ? categories : FALLBACK_CATEGORIES;
  const productFor = (data: any[] | undefined, slug?: string) => {
    if (data?.length) return data;
    return slug ? FALLBACK_PRODUCTS.filter((p) => p.categorySlug === slug) : FALLBACK_PRODUCTS;
  };
  const dealProducts = productFor(deals);
  const featuredProducts = productFor(featured);
  const electronicsProducts = productFor(electronics, "electronics");
  const fashionProducts = productFor(fashion, "fashion");
  const beautyProducts = productFor(beauty, "beauty");
  const homeProducts = productFor(home, "home");
  const groceryProducts = productFor(groceries, "groceries");
  const babyProducts = productFor(babyKids, "baby-kids");
  const agroProducts = productFor(agro, "agro");
  const autoProducts = productFor(auto, "auto");

  return (
    <div className="max-w-7xl mx-auto pb-8 bg-slate-50/60 overflow-hidden">
      <section className="px-3 sm:px-4 pt-1.5">
        <div className="flex gap-3 sm:gap-5 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
          {categoryList.slice(0, 9).map((cat) => (
            <button key={cat.id} onClick={() => navigate(`/shop?cat=${cat.slug}`)} className="flex flex-col items-center gap-1.5 flex-shrink-0 snap-start min-w-[72px] sm:min-w-[82px] active:scale-95 transition-transform">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                {cat.image ? <img src={cat.image} alt={cat.name} className="w-10 h-10 sm:w-11 sm:h-11 object-cover rounded-full" /> : categoryIcon(cat.slug)}
              </div>
              <span className="text-[10px] sm:text-xs leading-tight text-slate-700 font-medium text-center max-w-[88px]">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-1 border-y border-slate-200 bg-white overflow-hidden h-9 sm:h-11">
        <div className="flex animate-ticker whitespace-nowrap w-max h-full items-center">
          {[...BRANDS, ...BRANDS].map(([brand, slug, color], i) => (
            <span key={`${brand}-${i}`} className="inline-flex items-center justify-center h-full min-w-[68px] sm:min-w-[78px] px-2">
              <img src={`https://cdn.simpleicons.org/${slug}/${color}`} alt={brand} title={brand} className="max-h-[17px] sm:max-h-5 max-w-[62px] sm:max-w-[70px] w-auto object-contain" loading="lazy" />
            </span>
          ))}
        </div>
      </div>

      <section className="relative mx-3 sm:mx-4 mt-3 rounded-xl overflow-hidden h-[210px] sm:h-[300px] lg:h-[340px] cursor-pointer" onClick={goToShop}>
        <img src={banners[bannerIdx].image} alt={banners[bannerIdx].title} className="w-full h-full object-cover" />
        <div className={`absolute inset-0 bg-gradient-to-r ${banners[bannerIdx].accent} opacity-75`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-5 sm:p-7">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-amber-200 font-bold">{banners[bannerIdx].eyebrow || "PEZA marketplace"}</p>
          <h1 className="text-white text-2xl sm:text-4xl font-extrabold mt-1.5 max-w-[90%]">{banners[bannerIdx].title}</h1>
          <p className="text-white/90 text-xs sm:text-base mt-1 max-w-lg">{banners[bannerIdx].subtitle}</p>
          <span className="inline-flex items-center gap-1 bg-white text-peza-brown text-xs font-bold px-4 py-2 rounded-lg mt-3 w-fit shadow-lg">{banners[bannerIdx].cta} <ArrowRight className="w-3.5 h-3.5" /></span>
        </div>
        <button aria-label="Previous banner" onClick={(e) => { e.stopPropagation(); setBannerIdx((i) => (i - 1 + banners.length) % banners.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-peza-brown shadow flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
        <button aria-label="Next banner" onClick={(e) => { e.stopPropagation(); setBannerIdx((i) => (i + 1) % banners.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-peza-brown shadow flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">{banners.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? "w-5 bg-peza-orange" : "w-1.5 bg-white/80"}`} />)}</div>
      </section>

      <section className="mt-4 px-3 sm:px-4">
        <div className="flex items-center gap-2 mb-2.5">
          <Zap className="w-5 h-5 text-peza-orange fill-peza-orange shrink-0" />
          <h2 className="text-lg font-extrabold text-slate-800">Flash Deals</h2>
          <div className="ml-auto flex items-center gap-1 shrink-0">
            {Object.entries(timeLeft).map(([k, v], i) => <span key={k} className="bg-orange-50 text-peza-orange text-xs font-extrabold px-1.5 sm:px-2 py-1 rounded-md border border-orange-100">{String(v).padStart(2, "0")}{i < 2 ? ":" : ""}</span>)}
          </div>
          <button onClick={goToShop} className="hidden sm:flex text-peza-orange text-sm font-bold items-center gap-0.5 ml-1">View all <ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
          {dealProducts.slice(0, 10).map((p) => <div key={p.id} className="w-[172px] xs:w-[190px] sm:w-[210px] lg:w-[225px] flex-shrink-0 snap-start"><PremiumProductCard product={p} /></div>)}
        </div>
        <button onClick={goToShop} className="sm:hidden mt-2 w-full text-center text-peza-orange text-sm font-bold">View all deals →</button>
      </section>

      {/* Use a different creative here; the hero itself is the technology banner, so never repeat it immediately below Flash Deals. */}
      <AdBanner index={2} onShop={() => navigate("/shop?cat=fashion")} />
      <ProductRail title="Trending Now" products={featuredProducts} onViewAll={goToShop} icon="flame" />
      <ProductRail title="Recommended for You" products={electronicsProducts.length ? electronicsProducts : featuredProducts} onViewAll={goToShop} icon="target" />

      <AdBanner index={1} onShop={() => navigate("/shop?cat=home")} />
      <ProductRail title={CATEGORY_ROWS[0].title} products={electronicsProducts} onViewAll={() => navigate("/shop?cat=electronics")} />
      <ProductRail title={CATEGORY_ROWS[1].title} products={fashionProducts} onViewAll={() => navigate("/shop?cat=fashion")} />
      <AdBanner index={3} onShop={() => navigate("/shop?cat=groceries")} />
      <ProductRail title={CATEGORY_ROWS[2].title} products={beautyProducts} onViewAll={() => navigate("/shop?cat=beauty")} />
      <ProductRail title={CATEGORY_ROWS[3].title} products={homeProducts} onViewAll={() => navigate("/shop?cat=home")} />
      <AdBanner index={4} onShop={() => navigate("/shop?cat=electronics")} />
      <ProductRail title={CATEGORY_ROWS[4].title} products={groceryProducts} onViewAll={() => navigate("/shop?cat=groceries")} />
      <ProductRail title={CATEGORY_ROWS[5].title} products={babyProducts} onViewAll={() => navigate("/shop?cat=baby-kids")} />
      <ProductRail title={CATEGORY_ROWS[6].title} products={agroProducts} onViewAll={() => navigate("/shop?cat=agro")} />
      <ProductRail title={CATEGORY_ROWS[7].title} products={autoProducts} onViewAll={() => navigate("/shop?cat=auto")} />

      <section className="px-3 sm:px-4 mt-6">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-peza-green to-green-700 rounded-xl p-5 text-white cursor-pointer" onClick={() => navigate("/jobs")}>
            <Briefcase className="w-8 h-8 mb-2" /><h3 className="text-lg font-bold">Find Work in Africa</h3>
            <p className="text-white/80 text-sm mt-1 mb-3">Jobs, gigs and opportunities across Zambia and beyond.</p>
            <span className="inline-flex items-center gap-1 bg-peza-gold text-peza-brown text-xs font-bold px-3 py-2 rounded-lg">Browse Jobs <ArrowRight className="w-3 h-3" /></span>
          </div>
          <div className="bg-gradient-to-br from-peza-brown to-peza-brown-light rounded-xl p-5 text-white cursor-pointer" onClick={() => navigate("/suppliers")}>
            <Factory className="w-8 h-8 mb-2" /><h3 className="text-lg font-bold">B2B Suppliers Hub</h3>
            <p className="text-white/80 text-sm mt-1 mb-3">Source direct from China, India, UAE and more.</p>
            <span className="inline-flex items-center gap-1 bg-peza-gold text-peza-brown text-xs font-bold px-3 py-2 rounded-lg">Explore Suppliers <ArrowRight className="w-3 h-3" /></span>
          </div>
        </div>
      </section>

      <section className="px-3 sm:px-4 mt-6 mb-8">
        <div className="flex items-center justify-between mb-2.5"><h3 className="text-lg font-extrabold text-slate-800">Market Prices</h3><button onClick={() => navigate("/market-prices")} className="text-peza-orange text-sm font-bold flex items-center gap-1">All prices <ChevronRight className="w-4 h-4" /></button></div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full"><thead><tr className="border-b border-slate-200"><th className="text-left text-[10px] text-slate-400 font-bold uppercase tracking-wider px-4 py-2">Item</th><th className="text-right text-[10px] text-slate-400 font-bold uppercase tracking-wider px-4 py-2">Price</th><th className="text-right text-[10px] text-slate-400 font-bold uppercase tracking-wider px-4 py-2">Change</th></tr></thead>
            <tbody>{marketData?.slice(0, 4).map((m) => <tr key={m.id} className="border-b border-slate-200 last:border-0"><td className="text-xs font-medium text-slate-700 px-4 py-2.5">{m.item}</td><td className="text-xs font-bold text-slate-800 text-right px-4 py-2.5">{m.price}</td><td className={`text-xs font-bold text-right px-4 py-2.5 ${m.isUp === true ? "text-peza-green" : m.isUp === false ? "text-peza-red" : "text-slate-500"}`}>{m.change}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
