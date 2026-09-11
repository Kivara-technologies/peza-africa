import { MessageCircle, Smartphone, Truck, Store, Globe2 } from "lucide-react";
import { useLanguage, type TranslationKey } from "@/lib/i18n";

const PILLARS: {
  key?: TranslationKey;
  label?: string;
  icon: typeof MessageCircle;
  gradient: string;
  shadow: string;
  rest: string;
  float: string;
}[] = [
  { key: "landing.tag.chat_commerce", icon: MessageCircle, gradient: "from-green-600 to-peza-green", shadow: "shadow-[0_18px_30px_-12px_rgba(46,125,50,0.55)]", rest: "-2deg", float: "-4deg" },
  { key: "landing.tag.mobile_money", icon: Smartphone, gradient: "from-peza-gold-light to-peza-gold", shadow: "shadow-[0_18px_30px_-12px_rgba(255,193,7,0.55)]", rest: "2deg", float: "4deg" },
  { key: "landing.tag.fast_delivery", icon: Truck, gradient: "from-peza-orange to-red-500", shadow: "shadow-[0_18px_30px_-12px_rgba(249,115,22,0.55)]", rest: "-1.5deg", float: "1deg" },
  { key: "landing.tag.online_maliketi", icon: Store, gradient: "from-peza-brown-light to-peza-brown", shadow: "shadow-[0_18px_30px_-12px_rgba(62,39,35,0.5)]", rest: "2.5deg", float: "-1deg" },
  { label: "About Us", icon: Globe2, gradient: "from-peza-brown to-peza-orange", shadow: "shadow-[0_18px_30px_-12px_rgba(62,39,35,0.5)]", rest: "-2deg", float: "3deg" },
];

const BRAND_GROUPS = [
  {
    label: "Technology",
    brands: [
      ["Samsung", "samsung", "1428A0"],
      ["Apple", "apple", "000000"],
      ["Sony", "sony", "000000"],
      ["LG", "lg", "A50034"],
      ["Huawei", "huawei", "FF0000"],
      ["Tecno", "tecno", "000000"],
      ["Dell", "dell", "007DB8"],
      ["HP", "hp", "0096D6"],
      ["Lenovo", "lenovo", "E2231A"],
      ["Xiaomi", "xiaomi", "FF6900"],
    ],
  },
  {
    label: "Fashion & Lifestyle",
    brands: [
      ["Nike", "nike", "111111"],
      ["Adidas", "adidas", "000000"],
      ["Puma", "puma", "000000"],
      ["Under Armour", "underarmour", "000000"],
      ["Levi's", "levis", "D52B1E"],
      ["Ray-Ban", "ray-ban", "000000"],
    ],
  },
  {
    label: "Home, Beauty & Everyday",
    brands: [
      ["Bosch", "bosch", "E20015"],
      ["Philips", "philips", "0A1E8C"],
      ["Unilever", "unilever", "1F36C7"],
      ["Nestlé", "nestle", "007A33"],
      ["Coca-Cola", "cocacola", "F40009"],
      ["Pepsi", "pepsi", "004B93"],
    ],
  },
  {
    label: "Zambia & Connectivity",
    brands: [
      ["MTN", "mtn", "FFCC00"],
      ["Airtel", "airtel", "E40046"],
      ["Zamtel", "zamtel", "009B3A"],
    ],
  },
] as const;

function BrandLogo({ name, slug, color }: { name: string; slug: string; color: string }) {
  return (
    <div className="group flex h-[72px] min-w-[128px] flex-shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-white px-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-peza-orange/30 hover:shadow-md" title={name}>
      <img
        src={`https://cdn.simpleicons.org/${slug}/${color}`}
        alt={`${name} logo`}
        loading="lazy"
        className="max-h-9 max-w-[92px] object-contain transition-transform duration-200 group-hover:scale-105"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      <span className="sr-only">{name}</span>
    </div>
  );
}

export default function FeatureShowcase() {
  const { t } = useLanguage();

  return (
    <>
      <section className="mt-6 px-4" style={{ perspective: "1000px" }}>
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pt-1 no-scrollbar">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            const label = p.label ?? (p.key ? t(p.key) : "");
            return (
              <div key={label} className="tile-enter flex-shrink-0 snap-start" style={{ animationDelay: `${i * 90}ms`, "--tile-rest-rot": p.rest } as React.CSSProperties}>
                <div className="tile-float" style={{ animationDelay: `${i * 220}ms`, "--tile-rest-rot": p.rest, "--tile-float-rot": p.float } as React.CSSProperties}>
                  <div className={`relative flex h-[104px] w-[132px] flex-col items-start justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${p.gradient} ${p.shadow} p-3`}>
                    <div className="tile-glare pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/25 blur-md" style={{ animationDelay: `${i * 400 + 900}ms` }} />
                    <Icon className="h-6 w-6 text-white drop-shadow-sm" strokeWidth={2.25} />
                    <span className="text-xs font-bold leading-tight text-white drop-shadow-sm">{label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-5 px-4">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-peza-orange">Shop with confidence</p>
              <h2 className="mt-1 text-lg font-black text-peza-brown">Top brands on PEZA</h2>
              <p className="mt-1 text-xs text-gray-500">Recognizable brands across technology, fashion, home and everyday essentials.</p>
            </div>
          </div>

          <div className="space-y-4">
            {BRAND_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-peza-orange" />
                  <p className="text-xs font-extrabold text-peza-brown">{group.label}</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {group.brands.map(([name, slug, color]) => <BrandLogo key={name} name={name} slug={slug} color={color} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
