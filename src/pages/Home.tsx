import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { ChevronRight, Zap, TrendingUp, Briefcase, Factory, ArrowRight, ChevronLeft, Truck, Wallet, Smartphone, ShoppingBag, Wrench, Sprout, Car, Home as HomeIcon, Sparkles } from "lucide-react";
import { trpc } from "@/providers/trpc";
import PremiumProductCard from "@/components/PremiumProductCard";
import { getShopDestination } from "@/lib/shopNavigation";
import { premiumBanners } from "@/data/premiumBanners";

const BRANDS = [
  ["Samsung", "samsung", "1428A0"], ["Apple", "apple", "000000"], ["Nike", "nike", "111111"], ["Adidas", "adidas", "000000"],
  ["Sony", "sony", "000000"], ["LG", "lg", "A50034"], ["Huawei", "huawei", "FF0000"], ["TECNO", "tecno", "111111"],
  ["Zamtel", "zamtel", "00A651"], ["Airtel", "airtel", "ED1C24"], ["MTN", "mtn", "FFCC00"], ["Unilever", "unilever", "1F4E79"],
] as const;

const SERVICES = [
  { label: "Delivery", icon: Truck, text: "Send packages across Zambia", path: "/shipping" },
  { label: "Wallet", icon: Wallet, text: "Pay and manage your money", path: "/wallet" },
  { label: "Mobile Money", icon: Smartphone, text: "Fast, secure payments", path: "/wallet" },
  { label: "Jobs", icon: Briefcase, text: "Find work and opportunities", path: "/jobs" },
  { label: "Suppliers", icon: Factory, text: "Source wholesale products", path: "/suppliers" },
  { label: "Market Prices", icon: TrendingUp, text: "Track local commodity prices", path: "/market-prices" },
  { label: "AgriMarket", icon: Sprout, text: "Buy and sell farm produce", path: "/shop?cat=agro" },
  { label: "Auto", icon: Car, text: "Parts, accessories and more", path: "/shop?cat=auto" },
];

export default function Home() {
  const navigate = useNavigate();
  const [bannerIdx, setBannerIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ h: 7, m: 34, s: 22 });
  const banners = premiumBanners;
  const currentBanner = banners[bannerIdx];
  const goToShop = () => { const destination = getShopDestination(); if (destination.startsWith("http")) window.location.assign(destination); else navigate(destination); };
  const { data: categories } = trpc.category.list.useQuery();
  const { data: featured } = trpc.product.featured.useQuery();
  const { data: deals } = trpc.product.deals.useQuery();
  const { data: marketData } = trpc.market.list.useQuery({ category: "commodities" });

  useEffect(() => { const t = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 5000); return () => clearInterval(t); }, [banners.length]);
  useEffect(() => { const t = setInterval(() => setTimeLeft((p) => { let { h, m, s } = p; s--; if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) { h = 23; m = 59; s = 59; } return { h, m, s }; }), 1000); return () => clearInterval(t); }, []);

  return (
    <div className="max-w-7xl mx-auto pb-8">
      <div className="bg-peza-brown overflow-hidden py-3 shadow-sm">
        <div className="flex animate-ticker whitespace-nowrap w-max">{[...BRANDS, ...BRANDS].map(([name, slug, color], i) => <div key={`${slug}-${i}`} className="inline-flex items-center gap-3 mx-2 px-4 sm:px-5 py-2.5 rounded-xl bg-white shadow-sm min-w-[125px] sm:min-w-[150px] justify-center"><img src={`https://cdn.simpleicons.org/${slug}/${color}`} alt={`${name} logo`} className="h-7 w-auto max-w-[80px] object-contain sm:h-8 sm:max-w-[94px]" loading="lazy" /><span className="text-[11px] font-bold tracking-wide text-peza-brown">{name}</span></div>)}</div>
      </div>

      <section className="px-3 sm:px-4 mt-4">
        <div className="relative rounded-3xl overflow-hidden h-[280px] sm:h-[390px] lg:h-[430px] bg-peza-brown shadow-xl group">
          <img key={currentBanner.image} src={currentBanner.image} alt={currentBanner.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-r ${currentBanner.accent} opacity-90`} /><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          <div className="absolute inset-0 flex items-end p-6 sm:p-9 lg:p-12"><div className="max-w-2xl text-white"><p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-amber-200 font-extrabold">{currentBanner.eyebrow || "PEZA marketplace"}</p><h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mt-2 leading-[0.95]">{currentBanner.title}</h1><p className="text-sm sm:text-base lg:text-lg text-white/85 mt-4 max-w-xl">{currentBanner.subtitle}</p><button onClick={goToShop} className="inline-flex items-center gap-2 bg-white text-peza-brown text-sm font-extrabold px-5 py-3 rounded-full mt-5 shadow-lg hover:scale-[1.02] transition-transform">{currentBanner.cta} <ArrowRight className="w-4 h-4" /></button></div></div>
          <button aria-label="Previous banner" onClick={() => setBannerIdx((i) => (i - 1 + banners.length) % banners.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-peza-brown shadow-lg flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"><ChevronLeft className="w-5 h-5" /></button>
          <button aria-label="Next banner" onClick={() => setBannerIdx((i) => (i + 1) % banners.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-peza-brown shadow-lg flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"><ChevronRight className="w-5 h-5" /></button>
          <div className="absolute bottom-4 right-5 flex items-center gap-1.5 bg-black/25 rounded-full px-2 py-1.5 backdrop-blur-sm">{banners.map((_, i) => <button key={i} aria-label={`Go to banner ${i + 1}`} onClick={() => setBannerIdx(i)} className={`h-2 rounded-full transition-all ${i === bannerIdx ? "w-7 bg-white" : "w-2 bg-white/50"}`} />)}</div>
        </div>
      </section>

      <section className="px-3 sm:px-4 mt-5">
        <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-extrabold text-peza-brown">Shop by Category</h2><button onClick={goToShop} className="text-peza-orange text-sm font-bold flex items-center gap-1">View all <ChevronRight className="w-4 h-4" /></button></div>
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-4">
          {(categories || []).slice(0, 8).map((cat) => <button key={cat.id} onClick={() => navigate(`/shop?cat=${cat.slug}`)} className="bg-white rounded-xl border border-peza-cream-dark p-2.5 sm:p-3 flex flex-col items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"><div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-peza-cream flex items-center justify-center overflow-hidden">{cat.image ? <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" /> : <ShoppingBag className="w-6 h-6 text-peza-orange" />}</div><span className="text-[10px] sm:text-xs font-bold text-peza-brown text-center line-clamp-2">{cat.name}</span></button>)}
        </div>
      </section>

      <section className="px-3 sm:px-4 mt-6">
        <div className="flex items-center justify-between mb-3"><div><h2 className="text-lg font-extrabold text-peza-brown">PEZA Services</h2><p className="text-xs text-gray-500">More than shopping — everything you need in one place.</p></div><Sparkles className="w-5 h-5 text-peza-orange" /></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{SERVICES.map(({ label, icon: Icon, text, path }) => <button key={label} onClick={() => navigate(path)} className="text-left bg-white border border-peza-cream-dark rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"><div className="w-10 h-10 rounded-xl bg-peza-orange/10 flex items-center justify-center text-peza-orange mb-3"><Icon className="w-5 h-5" /></div><p className="font-extrabold text-sm text-peza-brown">{label}</p><p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{text}</p></button>)}</div>
      </section>

      <section className="px-3 sm:px-4 mt-7"><div className="flex items-center gap-3 mb-3"><Zap className="w-5 h-5 text-peza-orange" /><div><h2 className="text-lg font-extrabold text-peza-brown">Flash Deals</h2><p className="text-[11px] text-gray-500">Limited-time prices. Grab them before they are gone.</p></div><div className="ml-auto flex gap-1">{Object.entries(timeLeft).map(([k, v], i) => <span key={k} className="bg-peza-orange text-white text-xs font-bold px-2 py-1 rounded">{String(v).padStart(2, "0")}{i < 2 ? ":" : ""}</span>)}</div></div><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">{deals?.slice(0, 8).map((p) => <PremiumProductCard key={p.id} product={p} />)}</div></section>

      <section className="px-3 sm:px-4 mt-7"><div className="flex items-center justify-between mb-3"><div><h2 className="text-lg font-extrabold text-peza-brown">Trending Now</h2><p className="text-[11px] text-gray-500">Popular picks shoppers are viewing right now.</p></div><button onClick={goToShop} className="text-peza-orange text-sm font-bold flex items-center gap-1">View all <ChevronRight className="w-4 h-4" /></button></div><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">{featured?.slice(0, 8).map((p) => <PremiumProductCard key={p.id} product={p} />)}</div></section>

      <section className="px-3 sm:px-4 mt-7"><div className="grid md:grid-cols-2 gap-4"><div className="bg-gradient-to-br from-peza-green to-green-700 rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/jobs")}><Briefcase className="w-9 h-9 mb-3" /><h3 className="text-xl font-extrabold">Find Work</h3><p className="text-white/80 text-sm mt-1 mb-4">Discover jobs, gigs and opportunities across Africa.</p><span className="inline-flex items-center gap-1 bg-peza-gold text-peza-brown text-xs font-bold px-4 py-2 rounded-lg">Browse Jobs <ArrowRight className="w-3 h-3" /></span></div><div className="bg-gradient-to-br from-peza-brown to-peza-brown-light rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/suppliers")}><Factory className="w-9 h-9 mb-3" /><h3 className="text-xl font-extrabold">B2B Suppliers</h3><p className="text-white/80 text-sm mt-1 mb-4">Source products wholesale from China, India, UAE and beyond.</p><span className="inline-flex items-center gap-1 bg-peza-gold text-peza-brown text-xs font-bold px-4 py-2 rounded-lg">Explore Suppliers <ArrowRight className="w-3 h-3" /></span></div></div></section>

      <section className="px-3 sm:px-4 mt-7"><div className="flex items-center justify-between mb-3"><div><h2 className="text-lg font-extrabold text-peza-brown">Recommended for You</h2><p className="text-[11px] text-gray-500">More products worth discovering.</p></div><button onClick={goToShop} className="text-peza-orange text-sm font-bold">See more</button></div><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">{featured?.slice(8, 16).map((p) => <PremiumProductCard key={p.id} product={p} />)}</div></section>

      <section className="px-3 sm:px-4 mt-7"><div className="flex items-center justify-between mb-3"><h2 className="text-lg font-extrabold text-peza-brown">Market Prices</h2><button onClick={() => navigate("/market-prices")} className="text-peza-orange text-sm font-bold flex items-center gap-1">All prices <ChevronRight className="w-4 h-4" /></button></div><div className="bg-white rounded-xl border border-peza-cream-dark overflow-hidden"><table className="w-full"><thead><tr className="border-b border-peza-cream-dark"><th className="text-left text-[10px] text-gray-400 font-bold uppercase tracking-wider px-4 py-2">Item</th><th className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider px-4 py-2">Price</th><th className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider px-4 py-2">Change</th></tr></thead><tbody>{marketData?.slice(0, 5).map((m) => <tr key={m.id} className="border-b border-peza-cream-dark last:border-0"><td className="text-xs font-medium text-peza-brown px-4 py-2.5">{m.item}</td><td className="text-xs font-bold text-peza-brown text-right px-4 py-2.5">{m.price}</td><td className={`text-xs font-bold text-right px-4 py-2.5 ${m.isUp === true ? "text-peza-green" : m.isUp === false ? "text-peza-red" : "text-gray-500"}`}>{m.change}</td></tr>)}</tbody></table></div></section>
    </div>
  );
}
