import { useState, useEffect } from "react";
import { useParams, useLoaderData, useNavigate } from "react-router-dom";
import * as api from "../api";
import ProductCard from "../components/ProductCard";

export default function CategoryProducts() {
  const { categoryId } = useParams();
  const { category } = useLoaderData();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getProducts({ categoryId, sort: sort || undefined, page, size: 12 })
      .then((data) => {
        if (!cancelled) {
          setProducts(data?.content || []);
          setTotalPages(Math.max(data?.totalPages || 1, 1));
        }
      })
      .catch((err) => console.warn("Failed to load products:", err.message))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId, sort, page]);

  const handleSortChange = (event) => {
    setSort(event.target.value);
    setPage(0);
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <button
        onClick={() => navigate("/")}
        className="text-sm text-motolink-blue font-medium mb-4"
      >
        ← Back to home
      </button>

      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <h1 className="font-display font-bold text-3xl text-motolink-blue-dark">
          {category?.name || "Products"}
        </h1>

        <select
          value={sort}
          onChange={handleSortChange}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-motolink-blue-dark"
        >
          <option value="">Sort by</option>
          <option value="price,asc">Price: low to high</option>
          <option value="price,desc">Price: high to low</option>
        </select>
      </div>

      {loading ? (
        <p className="text-motolink-slate">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="text-motolink-slate">No products found in this category yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
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
