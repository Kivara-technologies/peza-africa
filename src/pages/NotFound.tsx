import { useNavigate } from "react-router";
import { Home } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <img src="/peza-icon.png" alt="PEZA" className="w-20 h-20 mb-6 opacity-50" />
      <h1 className="text-4xl font-extrabold text-peza-brown mb-2">404</h1>
      <h2 className="text-lg font-bold text-peza-brown mb-2">Page Not Found</h2>
      <p className="text-sm text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 bg-peza-orange text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-peza-orange-dark transition-colors"
      >
        <Home className="w-4 h-4" />
        Back to Home
      </button>
    </div>
  );
}
