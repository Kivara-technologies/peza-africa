import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { LogIn, UserPlus, ShieldCheck, WalletCards, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Honor RequireAuth's ?redirect=<path> so a signed-out visit to a
  // protected route lands back where the person meant to go, instead of
  // always bouncing to the home page.
  const redirectPath = searchParams.get("redirect") || "/";
  const isDemoMode = Boolean((supabase as any)?.isDemoMode);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      toast.error("Please fill all fields");
      return;
    }

    if (mode === "register" && !form.name.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { name: form.name.trim() || undefined } },
        });
        if (error) throw error;
        toast.success("Account created! Check your email if confirmation is required.");
      }
      navigate(redirectPath, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-stretch">
        <div className="rounded-[28px] bg-gradient-to-br from-peza-brown via-peza-brown-light to-peza-brown text-white p-6 md:p-8 shadow-lg flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-peza-gold">
              <Sparkles className="w-3 h-3" />
              PEZA
            </div>
            <h1 className="mt-5 text-3xl md:text-4xl font-extrabold leading-tight">
              Shop smarter across Africa.
            </h1>
            <p className="mt-3 text-sm text-white/70 max-w-md">
              Buy trusted products, manage wallet payments, and enjoy fast delivery with a marketplace built for everyday life.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {[
              { icon: ShieldCheck, label: "Secure checkout" },
              { icon: WalletCards, label: "Wallet + mobile payments" },
              { icon: Check, label: "Verified sellers & fast delivery" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-peza-gold" />
                </div>
                <span className="text-sm font-medium text-white/90">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[28px] border border-peza-cream-dark p-5 md:p-6 shadow-sm">
          <div className="flex justify-center mb-6">
            <img src="/peza-icon.png" alt="PEZA" className="w-18 h-18 rounded-2xl" />
          </div>

          <div className="grid grid-cols-2 rounded-xl bg-peza-cream p-1 mb-5">
            {[
              { key: "login", label: "Sign in", icon: LogIn },
              { key: "register", label: "Create account", icon: UserPlus },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMode(key as "login" | "register")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors ${mode === key ? "bg-white text-peza-brown shadow-sm" : "text-gray-500"}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {isDemoMode && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Preview mode: use <span className="font-bold">demo@peza.africa</span> / <span className="font-bold">demo123</span>
            </div>
          )}

          {mode === "register" && (

            <div className="mb-4">
              <label className="block text-xs font-semibold text-peza-brown-light mb-2">Full Name</label>
              <input
                type="text"
                placeholder="Amara Okafor"
                className="w-full border-2 border-peza-cream-dark rounded-xl px-4 py-3 text-sm outline-none focus:border-peza-orange transition-colors"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-semibold text-peza-brown-light mb-2">Email</label>
            <input
              type="email"
              placeholder="you@email.com"
              className="w-full border-2 border-peza-cream-dark rounded-xl px-4 py-3 text-sm outline-none focus:border-peza-orange transition-colors"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-peza-brown-light mb-2">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full border-2 border-peza-cream-dark rounded-xl px-4 py-3 text-sm outline-none focus:border-peza-orange transition-colors"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 bg-peza-orange text-white rounded-xl font-bold text-sm hover:bg-peza-orange-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(249,115,22,0.24)]"
          >
            {mode === "login" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>

          <div className="mt-5">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-peza-cream-dark" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-gray-500">or continue with</span>
              </div>
            </div>
            <button
              onClick={handleGoogle}
              className="w-full mt-4 py-3 bg-peza-brown text-white rounded-xl font-bold text-sm hover:bg-peza-brown-light transition-colors"
            >
              Google
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-peza-orange font-semibold"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
