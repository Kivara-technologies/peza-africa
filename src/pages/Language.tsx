import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { LogIn, ChevronLeft, Check } from "lucide-react";
import { useLanguage, LANGUAGES } from "@/lib/i18n";

export default function Language() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const { language, setLanguage, t } = useLanguage();

  const updateMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success(t("language.saved"));
      utils.auth.me.invalidate();
    },
    onError: (err) => toast.error(err.message || "Couldn't save preference"),
  });

  const handleSelect = (code: typeof language) => {
    // Apply immediately so the UI actually changes right now, then persist
    // to the account so it follows the user across devices/sessions.
    setLanguage(code);
    updateMutation.mutate({ preferredLanguage: code });
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <LogIn className="w-10 h-10 text-peza-orange mx-auto mb-3" />
        <h1 className="text-xl font-extrabold text-peza-brown mb-2">Sign in to set your language</h1>
        <button onClick={() => navigate("/login")} className="bg-peza-orange text-white font-bold px-6 py-3 rounded-xl">
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-10">
      <button onClick={() => navigate("/profile")} className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <ChevronLeft className="w-4 h-4" /> {t("settings.back")}
      </button>
      <h1 className="text-2xl font-extrabold text-peza-brown mb-1">{t("language.title")}</h1>
      <p className="text-xs text-gray-500 mb-4">{t("language.subtitle")}</p>

      <div className="bg-white rounded-xl border border-peza-cream-dark divide-y divide-peza-cream-dark">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            disabled={updateMutation.isPending}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left disabled:opacity-60"
          >
            <div>
              <span className="text-sm font-medium text-peza-brown block">{lang.nativeLabel}</span>
              <span className="text-xs text-gray-400">{lang.label}</span>
            </div>
            {(user?.preferredLanguage === lang.code || (!user?.preferredLanguage && language === lang.code)) && (
              <Check className="w-4 h-4 text-peza-orange" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
