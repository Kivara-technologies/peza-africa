import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import { trpc } from "@/providers/trpc";

// Codes match db/schema.ts's `preferredLanguage` column and the enum in
// server/routers/auth.ts's updateProfile — en | bem | nya. Don't change
// these without updating both.
export type LanguageCode = "en" | "bem" | "nya";

export const LANGUAGES: { code: LanguageCode; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "bem", label: "Bemba", nativeLabel: "Icibemba" },
  { code: "nya", label: "Nyanja", nativeLabel: "Chinyanja" },
];

// Central translation dictionary. Keys are dot-namespaced by feature area.
// Add a new UI string here, then reference it with t("namespace.key") anywhere
// in the app — do not hardcode new copy directly in components.
const dictionary = {
  en: {
    "nav.home": "Home",
    "nav.categories": "Categories",
    "nav.cart": "Cart",
    "nav.saved": "Saved",
    "nav.chat": "Chat",
    "nav.search_placeholder": "Search products, jobs...",

    "profile.menu.notifications": "Notifications",
    "profile.menu.language": "Language",
    "profile.menu.market_prices": "Market Prices",
    "profile.menu.shipping_calculator": "Shipping Calculator",
    "profile.menu.settings": "Settings",
    "profile.menu.rider_dashboard": "Rider Dashboard",
    "profile.logout": "Log out",

    "settings.title": "Settings",
    "settings.profile": "Profile",
    "settings.name": "Name",
    "settings.phone": "Phone",
    "settings.email": "Email",
    "settings.email_locked": "Email is tied to your login and can't be changed here.",
    "settings.save": "Save Changes",
    "settings.back": "Back",

    "language.title": "Language",
    "language.subtitle": "Choose the language PEZA is displayed in.",
    "language.saved": "Language updated",

    "landing.tag.chat_commerce": "Chat Commerce",
    "landing.tag.mobile_money": "Mobile Money",
    "landing.tag.fast_delivery": "Fast Delivery",
    "landing.tag.online_maliketi": "Online Maliketi",
    "landing.tag.chilimba_chathu": "Chilimba Chathu",
  },
  bem: {
    "nav.home": "Kwa Ng'anda",
    "nav.categories": "Ifipuupu",
    "nav.cart": "Ing'anda ya Kushita",
    "nav.saved": "Ifyabikwa",
    "nav.chat": "Ukulanshanya",
    "nav.search_placeholder": "Fwayeni ifintu, imilimo...",

    "profile.menu.notifications": "Ubwishibisho",
    "profile.menu.language": "Ululimi",
    "profile.menu.market_prices": "Imitengo ya Musika",
    "profile.menu.shipping_calculator": "Ukubalilako Ukutwala",
    "profile.menu.settings": "Ifyakulingulula",
    "profile.menu.rider_dashboard": "Bolodi ya Katwala",
    "profile.logout": "Fumapo",

    "settings.title": "Ifyakulingulula",
    "settings.profile": "Ifyandume",
    "settings.name": "Ishina",
    "settings.phone": "Foni",
    "settings.email": "Imeyili",
    "settings.email_locked": "Imeyili yalikwatana no kwingila kwenu, tamwakwensha apa.",
    "settings.save": "Bikeni Ifyapya",
    "settings.back": "Bwelela",

    "language.title": "Ululimi",
    "language.subtitle": "Saleni ululimi ulo PEZA ilelangwa.",
    "language.saved": "Ululimi lwaalushiwa",

    "landing.tag.chat_commerce": "Ubukwebo bwa Kulanshanya",
    "landing.tag.mobile_money": "Indalama sha Foni",
    "landing.tag.fast_delivery": "Ukutwala Bwangu",
    "landing.tag.online_maliketi": "Maliketi pa Intaneti",
    "landing.tag.chilimba_chathu": "Chilimba Chesu",
  },
  nya: {
    "nav.home": "Kunyumba",
    "nav.categories": "Magulu",
    "nav.cart": "Ngolo",
    "nav.saved": "Zosungidwa",
    "nav.chat": "Kuyankhula",
    "nav.search_placeholder": "Funani zinthu, ntchito...",

    "profile.menu.notifications": "Zidziwitso",
    "profile.menu.language": "Chilankhulo",
    "profile.menu.market_prices": "Mitengo ya Msika",
    "profile.menu.shipping_calculator": "Wowerengera Kutumiza",
    "profile.menu.settings": "Zokonzekera",
    "profile.menu.rider_dashboard": "Bolodi la Otumiza",
    "profile.logout": "Tulukani",

    "settings.title": "Zokonzekera",
    "settings.profile": "Mbiri Yanga",
    "settings.name": "Dzina",
    "settings.phone": "Foni",
    "settings.email": "Imelo",
    "settings.email_locked": "Imelo yagwirizana ndi kulowa kwanu, simungasinthe pano.",
    "settings.save": "Sungani Zosintha",
    "settings.back": "Bwerera",

    "language.title": "Chilankhulo",
    "language.subtitle": "Sankhani chilankhulo chomwe PEZA ikuwonetsedwe.",
    "language.saved": "Chilankhulo chasinthidwa",

    "landing.tag.chat_commerce": "Malonda a Kuyankhula",
    "landing.tag.mobile_money": "Ndalama za Foni",
    "landing.tag.fast_delivery": "Kutumiza Msanga",
    "landing.tag.online_maliketi": "Maliketi pa Intaneti",
    "landing.tag.chilimba_chathu": "Chilimba Chathu",
  },
} satisfies Record<LanguageCode, Record<string, string>>;

export type TranslationKey = keyof typeof dictionary["en"];

const STORAGE_KEY = "peza_language";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => dictionary.en[key] ?? key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    return saved && LANGUAGES.some((l) => l.code === saved) ? saved : "en";
  });

  // The account-level preference (src/pages/Language.tsx, saved via
  // auth.updateProfile) is the source of truth once someone's logged in and
  // it's loaded — this makes the choice follow them across devices. Local
  // state + localStorage just covers the gap before that query resolves,
  // and covers guests who aren't logged in at all.
  const { data: user } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    if (user?.preferredLanguage && user.preferredLanguage !== language) {
      setLanguageState(user.preferredLanguage as LanguageCode);
    }
    // Only react to the account value changing (e.g. on login, or after
    // saving a new preference elsewhere) — not to every local change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.preferredLanguage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  // Changes the UI immediately. Persisting the choice to the account (so it
  // survives across devices) still happens where it already did, in
  // src/pages/Language.tsx's mutation — this just makes the switch actually
  // take visible effect, which was the missing half.
  const setLanguage = (lang: LanguageCode) => setLanguageState(lang);

  const t = useMemo(() => {
    return (key: TranslationKey) => {
      const table = dictionary[language] as Record<string, string>;
      return table[key] ?? dictionary.en[key] ?? key;
    };
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
