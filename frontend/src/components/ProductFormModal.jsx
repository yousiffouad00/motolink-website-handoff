import { useEffect, useState } from "react";
import { X } from "lucide-react";
import * as api from "../api";

// Same modal handles both "create" (product = null) and "edit" (product = existing product)
export default function ProductFormModal({ product, onClose, onSaved }) {
  const isEditing = Boolean(product);

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price ?? "");
  const [salePrice, setSalePrice] = useState(product?.salePrice ?? "");
  const [brand, setBrand] = useState(product?.brand || "");
  const [categoryId, setCategoryId] = useState(product?.category?.id || "");
  const [stockQuantity, setStockQuantity] = useState(product?.stockQuantity ?? "");
  const [imageFiles, setImageFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const salePriceValid =
    salePrice === "" || (Number(salePrice) >= 0 && Number(salePrice) < Number(price || 0));

  const valid =
    name.trim() !== "" &&
    price !== "" &&
    Number(price) >= 0 &&
    categoryId !== "" &&
    stockQuantity !== "" &&
    Number(stockQuantity) >= 0 &&
    salePriceValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;

    setSaving(true);
    setError("");

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      price: Number(price),
      salePrice: salePrice === "" ? null : Number(salePrice),
      brand: brand.trim() || null,
      categoryId: Number(categoryId),
      stockQuantity: Number(stockQuantity),
    };

    try {
      if (isEditing) {
        await api.updateProduct(product.id, payload, imageFiles);
      } else {
        await api.createProduct(payload, imageFiles);
      }
      onSaved();
    } catch (err) {
      setError(err.body?.message || "Couldn't save the product. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative my-auto">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-motolink-slate hover:text-motolink-blue-dark cursor-pointer"
        >
          <X size={20} />
        </button>

        <h2 className="font-display font-bold text-xl text-motolink-blue-dark mb-6">
          {isEditing ? "Edit product" : "Add product"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-motolink-blue-dark mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-motolink-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-motolink-blue-dark mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-motolink-blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-motolink-blue-dark mb-1">
                Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-motolink-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-motolink-blue-dark mb-1">
                Stock quantity
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-motolink-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-motolink-blue-dark mb-1">
              Sale price (optional)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="Leave empty for no discount"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-motolink-blue"
            />
            {salePrice !== "" && !salePriceValid && (
              <p className="text-red-600 text-xs mt-1">
                Sale price must be lower than the regular price.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-motolink-blue-dark mb-1">
                Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-motolink-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-motolink-blue-dark mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-motolink-blue"
              >
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-motolink-blue-dark mb-1">
              {isEditing ? "Replace images (optional)" : "Images (optional)"}
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files || []).slice(0, 5))}
              className="w-full text-sm text-motolink-slate file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-motolink-blue-light file:text-motolink-blue file:text-sm file:font-medium file:cursor-pointer cursor-pointer"
            />
            <p className="text-motolink-slate text-xs mt-1">
              JPEG, PNG, or WebP. Up to 5 images; the first is the main image.
              {isEditing && " Selecting files replaces the current set."}
            </p>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!valid || saving}
            className="mt-2 bg-motolink-blue hover:bg-blue-700 disabled:opacity-50 transition-colors text-white font-display font-semibold py-2.5 rounded-lg cursor-pointer disabled:cursor-default"
          >
            {saving ? "Saving…" : isEditing ? "Save changes" : "Create product"}
          </button>
        </form>
      </div>
    </div>
  );
}
