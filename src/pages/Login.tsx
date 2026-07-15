import { useState } from "react";
import { useNavigate } from "react-router";
import { LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      toast.error("Please fill all fields");
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
          options: { data: { name: form.name || undefined } },
        });
        if (error) throw error;
        toast.success("Account created! Check your email if confirmation is required.");
      }
      navigate("/");
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
    <div className="max-w-md mx-auto px-4 pt-8">
      {/* Logo */}
      <div className="text-center mb-8">
        <img src="/peza-icon.png" alt="PEZA" className="w-20 h-20 rounded-2xl mx-auto mb-4" />
        <p className="text-sm text-gray-500">
          {mode === "login" ? "Welcome back to Peza" : "Join millions across Africa"}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-peza-cream-dark p-6">
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
          className="w-full py-3.5 bg-peza-orange text-white rounded-xl font-bold text-sm hover:bg-peza-orange-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {mode === "login" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>

        {/* OAuth */}
        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-peza-cream-dark" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-gray-500">or</span>
            </div>
          </div>
          <button
            onClick={handleGoogle}
            className="w-full mt-4 py-3 bg-peza-brown text-white rounded-xl font-bold text-sm hover:bg-peza-brown-light transition-colors"
          >
            Sign in with Google
          </button>
        </div>

        {/* Toggle Mode */}
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
  );
}
