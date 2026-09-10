export interface PremiumBanner {
  image: string;
  title: string;
  subtitle: string;
  accent: string;
  cta: string;
  eyebrow?: string;
}

export const premiumBanners: PremiumBanner[] = [
  {
    image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=2000&q=90",
    title: "Tech Worth Bringing Home",
    subtitle: "Phones, laptops, audio and smart essentials from brands people know and trust.",
    accent: "from-slate-950 via-slate-900/55 to-orange-700/30",
    cta: "Shop technology",
    eyebrow: "Top picks in technology",
  },
  {
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=2000&q=90",
    title: "Make Home Feel Better",
    subtitle: "Kitchen, décor, appliances and everyday upgrades selected for modern Zambian homes.",
    accent: "from-emerald-950 via-emerald-900/50 to-amber-700/30",
    cta: "Shop home essentials",
    eyebrow: "Home & living",
  },
  {
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=2000&q=90",
    title: "Style For Every Day",
    subtitle: "Fresh fashion, footwear and lifestyle picks from African and international labels.",
    accent: "from-fuchsia-950 via-purple-900/50 to-rose-700/25",
    cta: "Explore fashion",
    eyebrow: "New season styles",
  },
  {
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2000&q=90",
    title: "Fresh Deals, Every Day",
    subtitle: "Groceries, food and household essentials at prices made for the local market.",
    accent: "from-green-950 via-green-900/50 to-lime-700/25",
    cta: "Shop groceries",
    eyebrow: "Fresh market picks",
  },
  {
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=2000&q=90",
    title: "Upgrade Your Everyday",
    subtitle: "Smartphones, accessories and connected essentials with convenient local delivery.",
    accent: "from-blue-950 via-blue-900/50 to-cyan-700/25",
    cta: "Shop electronics",
    eyebrow: "PEZA picks",
  },
  {
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=2000&q=90",
    title: "Shop More. Pay Your Way.",
    subtitle: "Discover great local deals and checkout with convenient payment options built for Zambia.",
    accent: "from-peza-brown via-amber-950/70 to-peza-orange/30",
    cta: "Start shopping",
    eyebrow: "The PEZA marketplace",
  },
];
