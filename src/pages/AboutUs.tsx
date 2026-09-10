import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Building2, Globe2, HeartHandshake, Lightbulb, ShieldCheck, Sparkles, Truck, Users, Wheat } from "lucide-react";

const values = [
  { icon: Lightbulb, title: "Innovation", text: "Building dynamic systems inspired by leaders like Yango and Takealot, but tailored for Zambia." },
  { icon: ShieldCheck, title: "Trust", text: "Secure dashboards and dependable tools for riders, vendors, and customers." },
  { icon: Users, title: "Local Empowerment", text: "Daily updated Zambian commodity prices, local shipping calculators, and Kwacha-based transactions." },
  { icon: Sparkles, title: "Excellence", text: "Professional design, world-renowned brand logos, and banners that reflect global standards." },
];

const impact = [
  { icon: Wheat, text: "Supporting local farmers and vendors with live commodity pricing." },
  { icon: Truck, text: "Empowering riders with professional dashboards and fair earnings." },
  { icon: HeartHandshake, text: "Connecting customers to trusted products, cars, bikes, and services." },
  { icon: Globe2, text: "Driving economic growth through cross-country logistics and digital commerce." },
];

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-peza-cream">
      <section className="bg-gradient-to-br from-peza-brown via-[#5d4037] to-peza-orange text-white">
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-white/75 hover:text-white mb-8">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
              <Globe2 className="w-3.5 h-3.5" /> About Peza Africa
            </span>
            <h1 className="mt-5 text-3xl sm:text-5xl font-black tracking-tight">Building Africa's marketplace, starting in Zambia.</h1>
            <p className="mt-5 text-base sm:text-lg leading-7 text-white/80">A next-generation e-commerce and logistics platform proudly powered by Kivara Technologies — connecting vendors, riders, and customers through a seamless digital marketplace built for trust, speed, and growth.</p>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        <section className="grid md:grid-cols-2 gap-5">
          <article className="rounded-3xl bg-white border border-peza-cream-dark p-6 sm:p-8 shadow-sm">
            <div className="w-11 h-11 rounded-2xl bg-peza-orange/10 text-peza-orange flex items-center justify-center"><HeartHandshake className="w-5 h-5" /></div>
            <h2 className="mt-5 text-2xl font-black text-peza-brown">Who We Are</h2>
            <p className="mt-3 text-sm sm:text-base leading-7 text-gray-600">Peza Africa is a next-generation e-commerce and logistics platform proudly powered by Kivara Technologies, a diversified Zambian holding company. We connect vendors, riders, and customers through a seamless digital marketplace designed for trust, speed, and growth.</p>
          </article>
          <article className="rounded-3xl bg-white border border-peza-cream-dark p-6 sm:p-8 shadow-sm">
            <div className="w-11 h-11 rounded-2xl bg-peza-green/10 text-peza-green flex items-center justify-center"><Sparkles className="w-5 h-5" /></div>
            <h2 className="mt-5 text-2xl font-black text-peza-brown">Our Mission</h2>
            <p className="mt-3 text-sm sm:text-base leading-7 text-gray-600">To empower Zambian businesses and individuals by providing world-class digital tools, reliable logistics, and transparent market access — all priced in Kwacha and rooted in local realities.</p>
          </article>
        </section>

        <section className="rounded-3xl bg-peza-brown text-white p-6 sm:p-9">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-widest text-peza-gold">Our Vision</span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-black">A thriving African marketplace where technology bridges communities, commerce flows effortlessly, and local businesses compete on a global stage.</h2>
          </div>
        </section>

        <section>
          <div className="mb-5"><span className="text-xs font-bold uppercase tracking-widest text-peza-orange">What guides us</span><h2 className="mt-1 text-2xl sm:text-3xl font-black text-peza-brown">Our Values</h2></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl bg-white border border-peza-cream-dark p-5 shadow-sm">
                <Icon className="w-6 h-6 text-peza-orange" />
                <h3 className="mt-4 font-extrabold text-peza-brown">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white border border-peza-cream-dark p-6 sm:p-9 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-peza-brown text-white flex items-center justify-center"><Building2 className="w-6 h-6" /></div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-peza-orange">The company behind Peza</span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-black text-peza-brown">Our Parent Company — Kivara Technologies</h2>
              <p className="mt-3 text-sm sm:text-base leading-7 text-gray-600">Kivara Technologies is a diversified holding company operating across technology, creative media, logistics, agriculture, and energy. With Peza Africa, Kivara extends its vision of sustainable growth and digital transformation into the e-commerce space, ensuring vendors and customers benefit from innovation backed by strong infrastructure.</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5"><span className="text-xs font-bold uppercase tracking-widest text-peza-green">Making a difference</span><h2 className="mt-1 text-2xl sm:text-3xl font-black text-peza-brown">Our Impact</h2></div>
          <div className="grid sm:grid-cols-2 gap-4">
            {impact.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-4 rounded-2xl bg-white border border-peza-cream-dark p-5 shadow-sm">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-peza-green/10 text-peza-green flex items-center justify-center"><Icon className="w-5 h-5" /></div>
                <p className="text-sm sm:text-base leading-6 text-gray-700">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-gradient-to-r from-peza-orange to-peza-brown text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div><h2 className="text-xl sm:text-2xl font-black">Ready to explore Peza Africa?</h2><p className="mt-1 text-sm text-white/75">Shop, sell, deliver, and grow with a marketplace built for Zambia.</p></div>
          <button onClick={() => navigate("/shop")} className="inline-flex items-center gap-2 rounded-full bg-white text-peza-brown px-5 py-3 text-sm font-extrabold hover:bg-peza-cream transition-colors">Explore marketplace <ArrowRight className="w-4 h-4" /></button>
        </section>
      </main>
    </div>
  );
}
