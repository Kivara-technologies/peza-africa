import { MessageCircle, Smartphone, Truck, Store, Users } from "lucide-react";
import { useLanguage, type TranslationKey } from "@/lib/i18n";

// Each pillar gets its own color identity instead of one repeated card style —
// tied to what it represents, not a generic palette rotation.
const PILLARS: {
  key: TranslationKey;
  icon: typeof MessageCircle;
  gradient: string;
  shadow: string;
  rest: string; // resting tilt, alternated for a loose hand-placed feel
  float: string; // slightly different tilt at the top of the float, for a subtle wobble
}[] = [
  {
    key: "landing.tag.chat_commerce",
    icon: MessageCircle,
    gradient: "from-green-600 to-peza-green",
    shadow: "shadow-[0_18px_30px_-12px_rgba(46,125,50,0.55)]",
    rest: "-2deg",
    float: "-4deg",
  },
  {
    key: "landing.tag.mobile_money",
    icon: Smartphone,
    gradient: "from-peza-gold-light to-peza-gold",
    shadow: "shadow-[0_18px_30px_-12px_rgba(255,193,7,0.55)]",
    rest: "2deg",
    float: "4deg",
  },
  {
    key: "landing.tag.fast_delivery",
    icon: Truck,
    gradient: "from-peza-orange to-red-500",
    shadow: "shadow-[0_18px_30px_-12px_rgba(249,115,22,0.55)]",
    rest: "-1.5deg",
    float: "1deg",
  },
  {
    key: "landing.tag.online_maliketi",
    icon: Store,
    gradient: "from-peza-brown-light to-peza-brown",
    shadow: "shadow-[0_18px_30px_-12px_rgba(62,39,35,0.5)]",
    rest: "2.5deg",
    float: "-1deg",
  },
  {
    key: "landing.tag.chilimba_chathu",
    icon: Users,
    gradient: "from-peza-green to-peza-gold",
    shadow: "shadow-[0_18px_30px_-12px_rgba(46,125,50,0.5)]",
    rest: "-2deg",
    float: "3deg",
  },
];

export default function FeatureShowcase() {
  const { t } = useLanguage();

  return (
    <section className="px-4 mt-6" style={{ perspective: "1000px" }}>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 snap-x snap-mandatory">
        {PILLARS.map((p, i) => {
          const Icon = p.icon;
          return (
            <div
              key={p.key}
              className="tile-enter flex-shrink-0 snap-start"
              style={{
                animationDelay: `${i * 90}ms`,
                // @ts-expect-error custom properties consumed by the tileIn keyframe
                "--tile-rest-rot": p.rest,
              }}
            >
              <div
                className="tile-float"
                style={{
                  animationDelay: `${i * 220}ms`,
                  // @ts-expect-error custom properties consumed by the tileFloat keyframe
                  "--tile-rest-rot": p.rest,
                  "--tile-float-rot": p.float,
                }}
              >
                <div
                  className={`relative overflow-hidden w-[132px] h-[104px] rounded-2xl bg-gradient-to-br ${p.gradient} ${p.shadow} flex flex-col items-start justify-between p-3`}
                >
                  {/* one-shot glare sweep gives the tile a glassy, alive sheen */}
                  <div
                    className="tile-glare pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/25 blur-md"
                    style={{ animationDelay: `${i * 400 + 900}ms` }}
                  />
                  <Icon className="w-6 h-6 text-white drop-shadow-sm" strokeWidth={2.25} />
                  <span className="text-white text-xs font-bold leading-tight drop-shadow-sm">
                    {t(p.key)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
