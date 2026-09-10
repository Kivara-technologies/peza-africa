import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { ChevronRight, Zap, TrendingUp, Briefcase, Factory, ArrowRight } from "lucide-react";
import { trpc } from "@/providers/trpc";
import PremiumProductCard from "@/components/PremiumProductCard";
import { getShopDestination } from "@/lib/shopNavigation";
import { premiumBanners } from "@/data/premiumBanners";
import FeatureShowcase from "@/components/FeatureShowcase";

const BRANDS = ["Samsung", "Apple", "Nike", "Adidas", "Sony", "LG", "Huawei", "Tecno", "Zamtel", "Airtel", "MTN", "Unilever"];

export default function Home() {
  const navigate = useNavigate();
  const [bannerIdx, setBannerIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ h: 7, m: 34, s: 22 });

  const goToShop = () => {
    const destination = getShopDestination();
    if (destination.startsWith("http")) {
      window.location.assign(destination);
      return;
    }
    navigate(destination);
  };

  const { data: categories } = trpc.category.list.useQuery();
  const { data: featured } = trpc.product.featured.useQuery();
  const { data: deals } = trpc.product.deals.useQuery();
  const { data: marketData } = trpc.market.list.useQuery({ category: "commodities" });

  useEffect(() => {
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % 2), 5000);
    return () => clearInterval(t);
  }, []);

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

  const banners = premiumBanners;
  const featuredBrands = ["Samsung", "Apple", "Nike", "Sony", "Bosch", "Dell", "HP", "Adidas", "Unilever", "Airtel", "MTN", "Zamtel"];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Brand Ticker */}
      <div className="bg-peza-brown overflow-hidden py-2">
        <div className="flex animate-ticker whitespace-nowrap">
          {[...BRANDS, ...BRANDS].map((b, i) => (
            <span key={i} className="text-peza-gold text-xs font-semibold px-6">● {b}</span>
          ))}
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative mx-4 mt-4 rounded-2xl overflow-hidden h-[220px] sm:h-[330px] cursor-pointer transition-transform duration-200 hover:scale-[1.01]" onClick={goToShop}>
        <img src={banners[bannerIdx].image} alt={banners[bannerIdx].title} className="w-full h-full object-cover transition-all duration-700" />
        <div className={`absolute inset-0 bg-gradient-to-r ${banners[bannerIdx].accent} opacity-85`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6">
          <p className="text-[10px] uppercase tracking-[0.28em] text-amber-200 font-bold">Curated selection</p>
          <h2 className="text-white text-2xl sm:text-4xl font-extrabold mt-2">{banners[bannerIdx].title}</h2>
          <p className="text-white/85 text-sm sm:text-base mt-1 max-w-lg">{banners[bannerIdx].subtitle}</p>
          <span className="inline-flex items-center gap-1 bg-white text-peza-brown text-xs font-bold px-4 py-2 rounded-full mt-4 w-fit shadow-lg">
            {banners[bannerIdx].cta} <ArrowRight className="w-3 h-3" />
          </span>
        </div>
        <div className="absolute bottom-3 right-4 flex gap-2">
          {banners.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${i === bannerIdx ? "w-6 bg-white" : "w-2 bg-white/45"}`} />
          ))}
        </div>
      </div>

      {/* Feature Showcase */}
      <FeatureShowcase />

      <div className="px-4 mt-5">
        <div className="rounded-2xl border border-peza-cream-dark bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-peza-brown-light">World brands</p>
            <button onClick={goToShop} className="text-peza-orange text-xs font-semibold">View all</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {featuredBrands.map((brand) => (
              <span key={brand} className="rounded-full border border-peza-cream-dark bg-peza-cream px-3 py-1.5 text-[11px] font-semibold text-peza-brown">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-peza-brown">Shop by Category</h3>
          <button onClick={goToShop} className="text-peza-orange text-sm font-semibold flex items-center gap-1">
            See all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {categories?.slice(0, 8).map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/shop?cat=${cat.slug}`)}
              className="flex flex-col items-center gap-2 flex-shrink-0 group"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-peza-gold-light to-peza-gold flex items-center justify-center border-2 border-transparent group-hover:border-peza-orange transition-all shadow-md">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-10 h-10 object-cover rounded-full" />
                ) : (
                  <span className="text-xl">🛍️</span>
                )}
              </div>
              <span className="text-xs font-medium text-peza-brown whitespace-nowrap">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Flash Deals - with Premium Cards */}
      <section className="px-4 mt-6">
        <div className="flex items-center gap-3 mb-3">
          <Zap className="w-5 h-5 text-peza-orange" />
          <h3 className="text-lg font-bold text-peza-brown">Flash Deals</h3>
          <div className="ml-auto flex gap-1">
            {Object.entries(timeLeft).map(([k, v], i) => (
              <span key={k} className="bg-peza-orange text-white text-xs font-bold px-2 py-1 rounded">
                {String(v).padStart(2, "0")}{i < 2 ? ":" : ""}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {deals?.slice(0, 4).map((p) => (
            <PremiumProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Trending Now - with Premium Cards */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-peza-orange" />
            <h3 className="text-lg font-bold text-peza-brown">Trending Now</h3>
          </div>
          <button onClick={goToShop} className="text-peza-orange text-sm font-semibold flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {featured?.slice(0, 8).map((p) => (
            <PremiumProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Jobs CTA */}
      <section className="px-4 mt-6">
        <div
          className="bg-gradient-to-br from-peza-green to-green-700 rounded-2xl p-6 text-white cursor-pointer hover:shadow-peza-lg transition-shadow"
          onClick={() => navigate("/jobs")}
        >
          <Briefcase className="w-10 h-10 mb-3" />
          <h3 className="text-xl font-bold">Find Work in Africa</h3>
          <p className="text-white/80 text-sm mt-1 mb-4">8,000+ job listings across Kenya, Nigeria, Zambia & more</p>
          <span className="inline-flex items-center gap-1 bg-peza-gold text-peza-brown text-xs font-bold px-4 py-2 rounded-lg">
            Browse Jobs <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </section>

      {/* Just For You - with Premium Cards */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-peza-brown">Just For You</h3>
          <button onClick={goToShop} className="text-peza-orange text-sm font-semibold flex items-center gap-1">
            See more <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {featured?.slice(4, 12).map((p) => (
            <PremiumProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Suppliers CTA */}
      <section className="px-4 mt-6">
        <div
          className="bg-gradient-to-br from-peza-brown to-peza-brown-light rounded-2xl p-6 text-white cursor-pointer hover:shadow-peza-lg transition-shadow"
          onClick={() => navigate("/suppliers")}
        >
          <Factory className="w-10 h-10 mb-3" />
          <h3 className="text-xl font-bold">B2B Suppliers Hub</h3>
          <p className="text-white/80 text-sm mt-1 mb-4">Source direct from China, India, UAE & more</p>
          <span className="inline-flex items-center gap-1 bg-peza-gold text-peza-brown text-xs font-bold px-4 py-2 rounded-lg">
            Explore Suppliers <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </section>

      {/* Market Prices */}
      <section className="px-4 mt-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-peza-brown">Market Prices</h3>
          <button onClick={() => navigate("/market-prices")} className="text-peza-orange text-sm font-semibold flex items-center gap-1">
            All prices <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-white rounded-xl border border-peza-cream-dark overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-peza-cream-dark">
                <th className="text-left text-[10px] text-gray-400 font-bold uppercase tracking-wider px-4 py-2">Item</th>
                <th className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider px-4 py-2">Price</th>
                <th className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider px-4 py-2">Change</th>
              </tr>
            </thead>
            <tbody>
              {marketData?.slice(0, 4).map((m) => (
                <tr key={m.id} className="border-b border-peza-cream-dark last:border-0">
                  <td className="text-xs font-medium text-peza-brown px-4 py-2.5">{m.item}</td>
                  <td className="text-xs font-bold text-peza-brown text-right px-4 py-2.5">{m.price}</td>
                  <td className={`text-xs font-bold text-right px-4 py-2.5 ${m.isUp === true ? "text-peza-green" : m.isUp === false ? "text-peza-red" : "text-gray-500"}`}>
                    {m.change}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
