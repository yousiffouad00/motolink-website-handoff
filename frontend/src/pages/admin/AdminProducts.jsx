import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import * as api from "../../api";
import { getPrimaryImage, resolveImageUrl, formatPrice } from "../../api";
import ProductFormModal from "../../components/ProductFormModal";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalProduct, setModalProduct] = useState(undefined);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadProducts = useCallback(() => {
    setLoading(true);
    return api
      .getProducts({ page, size: 20 })
      .then((res) => {
        setProducts(res.content ?? res);
        setTotalPages(Array.isArray(res) ? 1 : Math.max(res.totalPages || 1, 1));
      })
      .catch((err) => setError(err.body?.message || "Couldn't load products."))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleDelete = async (id) => {
    if (!window.confirm("Archive this product? It will leave the store but remain in order history.")) return;
    setDeletingId(id);
    try {
      await api.deleteProduct(id);
      if (products.length === 1 && page > 0) {
        setPage((current) => current - 1);
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      setError(err.body?.message || "Couldn't delete the product.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = () => {
    setModalProduct(undefined);
    loadProducts();
  };

  if (loading) return <p className="text-motolink-slate">Loading products…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-bold text-lg text-motolink-blue-dark">Products</h2>
        <button
          onClick={() => setModalProduct(null)}
          className="flex items-center gap-2 bg-motolink-blue hover:bg-blue-700 transition-colors text-white text-sm font-display font-semibold px-4 py-2 rounded-lg cursor-pointer"
        >
          <Plus size={16} /> Add product
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {products.length === 0 ? (
        <p className="text-motolink-slate text-center py-16">No products yet.</p>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {products.map((p) => {
              const onSale = p.onSale && p.salePrice != null;
              return (
                <div
                  key={p.id}
                  className="bg-white border border-motolink-blue-light rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {getPrimaryImage(p) && (
                      <img
                        src={resolveImageUrl(getPrimaryImage(p))}
                        alt={p.name}
                        className="w-12 h-12 rounded-lg object-cover bg-motolink-blue-light shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display font-semibold text-motolink-blue-dark break-words">
                          {p.name}
                        </p>
                        {onSale && (
                          <span className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 text-[10px] font-display font-bold uppercase tracking-wide px-1.5 py-0.5 rounded">
                            <Tag size={10} /> Sale
                          </span>
                        )}
                      </div>
                      <p className="text-motolink-slate text-xs">{p.category?.name || "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-3">
                    {onSale ? (
                      <span className="flex items-center gap-1.5">
                        <span className="text-red-600 font-medium">{formatPrice(p.salePrice)}</span>
                        <span className="text-motolink-slate line-through text-xs">
                          {formatPrice(p.price)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-motolink-blue-dark font-medium">{formatPrice(p.price)}</span>
                    )}
                    <span className={p.stockQuantity < 10 ? "text-red-600 font-medium" : "text-motolink-slate"}>
                      Stock: {p.stockQuantity}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModalProduct(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-display font-semibold text-motolink-blue border border-motolink-blue-light rounded-lg cursor-pointer"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-display font-semibold text-red-600 border border-red-200 rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 size={14} /> Archive
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block bg-white border border-motolink-blue-light rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-motolink-blue-light/60 text-left text-xs font-display font-semibold uppercase tracking-wide text-motolink-slate">
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const onSale = p.onSale && p.salePrice != null;
                  return (
                    <tr key={p.id} className="border-t border-motolink-blue-light">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {getPrimaryImage(p) && (
                            <img
                              src={resolveImageUrl(getPrimaryImage(p))}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-cover bg-motolink-blue-light shrink-0"
                            />
                          )}
                          <span className="font-medium text-motolink-blue-dark">{p.name}</span>
                          {onSale && (
                            <span className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 text-[10px] font-display font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0">
                              <Tag size={10} /> Sale
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-motolink-slate whitespace-nowrap">
                        {p.category?.name || "—"}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {onSale ? (
                          <span className="flex items-center gap-1.5">
                            <span className="text-red-600 font-medium">{formatPrice(p.salePrice)}</span>
                            <span className="text-motolink-slate line-through text-xs">
                              {formatPrice(p.price)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-motolink-blue-dark">{formatPrice(p.price)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={p.stockQuantity < 10 ? "text-red-600 font-medium" : "text-motolink-slate"}
                        >
                          {p.stockQuantity}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setModalProduct(p)}
                            aria-label="Edit product"
                            className="p-2 text-motolink-slate hover:text-motolink-blue transition-colors cursor-pointer"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deletingId === p.id}
                            aria-label="Archive product"
                            className="p-2 text-motolink-slate hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalProduct !== undefined && (
        <ProductFormModal
          product={modalProduct}
          onClose={() => setModalProduct(undefined)}
          onSaved={handleSaved}
        />
      )}

      {totalPages > 1 && modalProduct === undefined && (
        <div className="flex items-center justify-center gap-4 mt-6">
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
    </div>
  );
}
