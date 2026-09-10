import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { LogIn, ChevronLeft, UserRound, Store, Camera } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export default function Settings() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", phone: "", avatarUrl: "", address: "", city: "Lusaka", country: "Zambia", businessName: "", businessType: "", businessDescription: "", website: "" });

  useEffect(() => {
    if (user) setForm({
      name: user.name ?? "", phone: user.phone ?? "", avatarUrl: user.avatarUrl ?? "", address: user.address ?? "", city: user.city ?? "Lusaka", country: user.country ?? "Zambia",
      businessName: user.businessName ?? "", businessType: user.businessType ?? "", businessDescription: user.businessDescription ?? "", website: user.website ?? "",
    });
  }, [user]);

  const updateMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => { toast.success("Profile updated successfully"); utils.auth.me.invalidate(); },
    onError: (err) => toast.error(err.message || "Couldn't update profile"),
  });
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  if (!authLoading && !isAuthenticated) return <div className="max-w-md mx-auto px-4 py-16 text-center"><LogIn className="w-10 h-10 text-peza-orange mx-auto mb-3" /><h1 className="text-xl font-extrabold text-peza-brown mb-2">Sign in to view settings</h1><button onClick={() => navigate("/login")} className="bg-peza-orange text-white font-bold px-6 py-3 rounded-xl">Log In</button></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 pb-10">
      <button onClick={() => navigate("/profile")} className="flex items-center gap-1 text-sm text-gray-500 mb-4"><ChevronLeft className="w-4 h-4" /> {t("settings.back")}</button>
      <h1 className="text-2xl font-extrabold text-peza-brown mb-1">Profile & business settings</h1>
      <p className="text-sm text-gray-500 mb-4">Keep your customer, seller and delivery details up to date.</p>

      <div className="bg-white rounded-2xl border border-peza-cream-dark p-4 space-y-4">
        <div className="flex items-center gap-2 font-bold text-peza-brown"><UserRound className="w-5 h-5 text-peza-orange" /> Personal profile</div>
        <div className="flex items-center gap-4 rounded-2xl bg-peza-cream/60 p-4">
          <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden bg-white border-2 border-peza-cream-dark flex items-center justify-center text-2xl font-extrabold text-peza-orange">
            {form.avatarUrl ? <img src={form.avatarUrl} alt="Profile preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <Camera className="w-7 h-7" />}
          </div>
          <div className="min-w-0"><p className="text-sm font-bold text-peza-brown">Profile photo</p><p className="text-xs text-gray-500 mt-1">Use a secure image URL. For production uploads, store images in Supabase Storage and paste the public object URL here.</p></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs text-gray-500">Full name<input value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1 w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm" /></label>
          <label className="text-xs text-gray-500">Phone<input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="097..." className="mt-1 w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm" /></label>
          <label className="text-xs text-gray-500 sm:col-span-2">Profile photo URL<input value={form.avatarUrl} onChange={(e) => set("avatarUrl", e.target.value)} placeholder="https://..." className="mt-1 w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm" /></label>
          <label className="text-xs text-gray-500">Address<input value={form.address} onChange={(e) => set("address", e.target.value)} className="mt-1 w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm" /></label>
          <label className="text-xs text-gray-500">City<input value={form.city} onChange={(e) => set("city", e.target.value)} className="mt-1 w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm" /></label>
          <label className="text-xs text-gray-500">Country<input value={form.country} onChange={(e) => set("country", e.target.value)} className="mt-1 w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm" /></label>
          <label className="text-xs text-gray-500">Email<input value={user?.email ?? ""} disabled className="mt-1 w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400" /></label>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-peza-cream-dark p-4 space-y-4 mt-4">
        <div className="flex items-center gap-2 font-bold text-peza-brown"><Store className="w-5 h-5 text-peza-orange" /> Business profile</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs text-gray-500">Business name<input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} className="mt-1 w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm" /></label>
          <label className="text-xs text-gray-500">Business type<input value={form.businessType} onChange={(e) => set("businessType", e.target.value)} placeholder="Retail, farm, services..." className="mt-1 w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm" /></label>
          <label className="text-xs text-gray-500 sm:col-span-2">Website<input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." className="mt-1 w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm" /></label>
          <label className="text-xs text-gray-500 sm:col-span-2">Business description<textarea value={form.businessDescription} onChange={(e) => set("businessDescription", e.target.value)} rows={3} className="mt-1 w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm" /></label>
        </div>
        <button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending || !form.name.trim()} className="w-full bg-peza-orange text-white font-bold py-3 rounded-xl disabled:opacity-60">{updateMutation.isPending ? "Saving…" : "Save profile"}</button>
      </div>
    </div>
  );
}
