export interface PremiumBanner {
    image: string;
    title: string;
    subtitle: string;
    accent: string;
    cta: string;
}

export const premiumBanners: PremiumBanner[] = [
    {
        image: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1400&q=80",
        title: "Premium Tech Deals",
        subtitle: "Samsung, Apple, Sony and more — built for modern African homes.",
        accent: "from-amber-400 via-orange-500 to-red-600",
        cta: "Shop premium devices",
    },
    {
        image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80",
        title: "Home Upgrade Essentials",
        subtitle: "Smart lighting, cookware, décor and everyday living upgrades.",
        accent: "from-sky-500 via-cyan-500 to-emerald-500",
        cta: "Upgrade the home",
    },
    {
        image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1400&q=80",
        title: "Fashion & Lifestyle",
        subtitle: "Trend-led wardrobe picks from African and global brands.",
        accent: "from-pink-500 via-violet-500 to-purple-700",
        cta: "Browse latest styles",
    },
    {
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80",
        title: "Daily Groceries & Essentials",
        subtitle: "Household staples, food and family essentials at market-friendly prices.",
        accent: "from-green-500 via-lime-500 to-emerald-700",
        cta: "Save on essentials",
    },
];
