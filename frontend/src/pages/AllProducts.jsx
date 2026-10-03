import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import * as api from "../api";
import ProductCard from "../components/ProductCard";

export default function AllProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api
      .getProducts({ page, size: 12 })
      .then((data) => {
        if (cancelled) return;
        setProducts(Array.isArray(data) ? data : data?.content || []);
        setTotalPages(Array.isArray(data) ? 1 : Math.max(data?.totalPages || 1, 1));
      })
      .catch((err) => !cancelled && setError(err.body?.message || "Couldn't load products."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page]);

  if (loading) {
    return <main className="max-w-7xl mx-auto px-6 py-10 text-motolink-slate">Loading products…</main>;
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm font-display font-semibold text-motolink-blue hover:underline mb-4"
      >
        <ArrowLeft size={16} /> Back to home
      </Link>

      <h1 className="font-display font-bold text-2xl sm:text-3xl text-motolink-blue-dark mb-8">
        All products
      </h1>

      {error && <p className="text-red-600 text-sm mb-4" role="alert">{error}</p>}

      {products.length === 0 ? (
        <p className="text-motolink-slate text-center py-16">No products available right now.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0}
                className="px-4 py-2 border border-motolink-blue-light rounded-lg text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-motolink-slate">Page {page + 1} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                disabled={page + 1 >= totalPages}
                className="px-4 py-2 border border-motolink-blue-light rounded-lg text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
