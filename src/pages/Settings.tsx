import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { LogIn, ChevronLeft } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  const updateMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated");
      utils.auth.me.invalidate();
    },
    onError: (err) => toast.error(err.message || "Couldn't update profile"),
  });

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <LogIn className="w-10 h-10 text-peza-orange mx-auto mb-3" />
        <h1 className="text-xl font-extrabold text-peza-brown mb-2">Sign in to view settings</h1>
        <button onClick={() => navigate("/login")} className="bg-peza-orange text-white font-bold px-6 py-3 rounded-xl">
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-10">
      <button onClick={() => navigate("/profile")} className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-2xl font-extrabold text-peza-brown mb-4">Settings</h1>

      <div className="bg-white rounded-xl border border-peza-cream-dark p-4 space-y-3">
        <h2 className="font-bold text-peza-brown text-sm">Profile</h2>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Email</label>
          <input
            value={user?.email ?? ""}
            disabled
            className="w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400"
          />
          <p className="text-[11px] text-gray-400 mt-1">Email is tied to your login and can't be changed here.</p>
        </div>
        <button
          onClick={() => updateMutation.mutate({ name, phone })}
          disabled={updateMutation.isPending || !name.trim()}
          className="w-full bg-peza-orange text-white font-bold py-2.5 rounded-xl disabled:opacity-60"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
