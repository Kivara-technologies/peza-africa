import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Package, Plus, Pencil, Trash2, LogIn, TrendingUp } from "lucide-react";

type ProductForm = {
  name: string;
  description: string;
  price: string;
  comparePrice: string;
  image: string;
  categorySlug: string;
  whatsappNumber: string;
  laybyMonths: string;
  stock: string;
};

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  comparePrice: "",
  image: "",
  categorySlug: "",
  whatsappNumber: "",
  laybyMonths: "",
  stock: "10",
};

export default function Vendor() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const utils = trpc.useUtils();
  const { data: categories } = trpc.category.list.useQuery();
  const { data: myProducts } = trpc.vendor.myProducts.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: summary } = trpc.vendor.salesSummary.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const addMutation = trpc.vendor.addProduct.useMutation({
    onSuccess: () => {
      toast.success("Product listed");
      utils.vendor.myProducts.invalidate();
      utils.vendor.salesSummary.invalidate();
      setShowForm(false);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(err.message || "Couldn't save product"),
  });

  const updateMutation = trpc.vendor.updateProduct.useMutation({
    onSuccess: () => {
      toast.success("Product updated");
      utils.vendor.myProducts.invalidate();
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(err.message || "Couldn't update product"),
  });

  const deleteMutation = trpc.vendor.deleteProduct.useMutation({
    onSuccess: () => {
      toast.success("Product removed");
      utils.vendor.myProducts.invalidate();
      utils.vendor.salesSummary.invalidate();
    },
    onError: (err) => toast.error(err.message || "Couldn't remove product"),
  });

  const fmtK = (n: number) => `K${n.toLocaleString()}`;

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <LogIn className="w-10 h-10 text-peza-orange mx-auto mb-3" />
        <h1 className="text-xl font-extrabold text-peza-brown mb-2">Sign in to sell on PEZA</h1>
        <p className="text-sm text-gray-500 mb-5">
          Log in to list products, manage your storefront, and track sales.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="bg-peza-orange text-white font-bold px-6 py-3 rounded-xl"
        >
          Log In
        </button>
      </div>
    );
  }

  function startEdit(p: NonNullable<typeof myProducts>[number]) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: p.price,
      comparePrice: p.comparePrice ?? "",
      image: p.image,
      categorySlug: p.categorySlug ?? "",
      whatsappNumber: p.whatsappNumber ?? "",
      laybyMonths: p.laybyMonths?.toString() ?? "",
      stock: p.stock.toString(),
    });
    setShowForm(true);
  }

  function submit() {
    if (!form.name.trim() || !form.price || !form.image.trim() || !form.categorySlug) {
      toast.error("Name, price, image, and category are required");
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      image: form.image.trim(),
      categorySlug: form.categorySlug,
      whatsappNumber: form.whatsappNumber.trim() || undefined,
      laybyMonths: form.laybyMonths ? Number(form.laybyMonths) : undefined,
      stock: Number(form.stock) || 0,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      addMutation.mutate(payload);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold text-peza-brown">Vendor Dashboard</h1>
        <button
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
            setShowForm((s) => !s);
          }}
          className="flex items-center gap-1.5 bg-peza-orange text-white text-sm font-bold px-4 py-2 rounded-xl"
        >
          <Plus className="w-4 h-4" /> List Product
        </button>
      </div>

      {/* Sales summary — real numbers only, honestly zero pre-launch */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-peza-cream-dark p-3 text-center">
          <p className="text-lg font-extrabold text-peza-orange">{fmtK(summary?.totalRevenue ?? 0)}</p>
          <p className="text-xs text-gray-500">Revenue</p>
        </div>
        <div className="bg-white rounded-xl border border-peza-cream-dark p-3 text-center">
          <p className="text-lg font-extrabold text-peza-brown">{summary?.unitsSold ?? 0}</p>
          <p className="text-xs text-gray-500">Units Sold</p>
        </div>
        <div className="bg-white rounded-xl border border-peza-cream-dark p-3 text-center">
          <p className="text-lg font-extrabold text-peza-brown">{summary?.productCount ?? 0}</p>
          <p className="text-xs text-gray-500">Listings</p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-peza-cream-dark p-4 mb-6 space-y-3">
          <h2 className="font-bold text-peza-brown">{editingId ? "Edit Product" : "New Product"}</h2>

          <input
            placeholder="Product name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Price (K)"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="border border-peza-cream-dark rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Compare-at price (optional)"
              type="number"
              value={form.comparePrice}
              onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
              className="border border-peza-cream-dark rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <input
            placeholder="Image URL"
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
            className="w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={form.categorySlug}
            onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}
            className="w-full border border-peza-cream-dark rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select category</option>
            {categories?.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder="WhatsApp number"
              value={form.whatsappNumber}
              onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              className="border border-peza-cream-dark rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Layby months"
              type="number"
              value={form.laybyMonths}
              onChange={(e) => setForm({ ...form, laybyMonths: e.target.value })}
              className="border border-peza-cream-dark rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Stock"
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="border border-peza-cream-dark rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={addMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-peza-orange text-white font-bold py-2.5 rounded-xl disabled:opacity-60"
            >
              {editingId ? "Save Changes" : "List Product"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="px-4 py-2.5 rounded-xl border border-peza-cream-dark text-peza-brown font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <h2 className="font-bold text-peza-brown mb-3 flex items-center gap-2">
        <Package className="w-4 h-4" /> My Products
      </h2>

      {myProducts && myProducts.length > 0 ? (
        <div className="space-y-3">
          {myProducts.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-peza-cream-dark p-3 flex gap-3">
              <img src={p.image} alt={p.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-peza-brown truncate">{p.name}</p>
                <p className="text-xs text-gray-500">K{Number(p.price).toLocaleString()} · Stock: {p.stock}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg border border-peza-cream-dark">
                  <Pencil className="w-3.5 h-3.5 text-peza-brown" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Remove "${p.name}"?`)) deleteMutation.mutate({ id: p.id });
                  }}
                  className="p-1.5 rounded-lg border border-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400">
          <TrendingUp className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No products listed yet. Tap "List Product" to get started.</p>
        </div>
      )}
    </div>
  );
}
