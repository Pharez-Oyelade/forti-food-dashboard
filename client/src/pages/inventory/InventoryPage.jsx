import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { get, post, put, del } from "@/services/api";
import { Card, Button, StatusBadge, LoadingSpinner } from "@/components/common";
import { INVENTORY_STATUS, SECTIONS } from "../../../../shared/constants";
import {
  Plus,
  Edit2,
  Trash2,
  Upload,
  Activity,
  PackagePlus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";

export default function InventoryPage() {
  const { hasPermission, canWrite, canDelete } = useAuth();

  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    product_name: "",
    sku: "",
    category: "",
    unit_cost: "",
    unit_price: "",
    units_on_hand: "",
    units_received: "",
    shelf_life_months: 12,
    reorder_point: "",
    expiry_date: "",
    meal_type: "Single-SKU",
  });

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementFormData, setMovementFormData] = useState({
    product: "",
    quantity: "",
    type: "SALE",
    person: "",
    batch_number: "",
    notes: "",
  });

  // Restock modal state
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockProductId, setRestockProductId] = useState(null);
  const [restockFormData, setRestockFormData] = useState({
    batch_number: "",
    units_received: "",
    expiry_date: "",
  });

  // Expanded batch rows
  const [expandedProduct, setExpandedProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [productsRes, summaryRes, movementsRes] = await Promise.all([
        get("/products"),
        get("/products/summary"),
        get("/products/movements"),
      ]);
      setProducts(productsRes.data || []);
      setSummary(summaryRes.data || null);
      setMovements(movementsRes.data || []);
    } catch (err) {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        product_name: product.product_name,
        sku: product.sku,
        category: product.category || "",
        unit_cost: product.unit_cost || 0,
        unit_price: product.unit_price || 0,
        units_on_hand: product.units_on_hand || 0,
        units_received: product.units_received || 0,
        shelf_life_months: product.shelf_life_months || 12,
        reorder_point: product.reorder_point || 0,
        expiry_date: product.expiry_date
          ? product.expiry_date.split("T")[0]
          : "",
        meal_type: product.meal_type || "Single-SKU",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        product_name: "",
        sku: "",
        category: "",
        unit_cost: "",
        unit_price: "",
        units_on_hand: "",
        units_received: "",
        shelf_life_months: 12,
        reorder_point: "",
        expiry_date: "",
        meal_type: "Single-SKU",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.expiry_date) {
        payload.expiry_date = null; // Send null or ignore if empty
      } else {
        payload.expiry_date = new Date(payload.expiry_date).toISOString();
      }

      if (editingProduct) {
        await put(`/products/${editingProduct._id}`, payload);
        toast.success("Product updated");
      } else {
        await post("/products", payload);
        toast.success("Product created");
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save product");
    }
  };

  const handleMovementSubmit = async (e) => {
    e.preventDefault();
    try {
      await post("/products/movements", movementFormData);
      toast.success("Movement logged successfully");
      setIsMovementModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to log movement");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this product?")) {
      try {
        await del(`/products/${id}`);
        toast.success("Product deleted");
        fetchProducts();
      } catch (err) {
        toast.error("Failed to delete product");
      }
    }
  };

  const handleOpenRestock = (productId) => {
    setRestockProductId(productId);
    setRestockFormData({
      batch_number: "",
      units_received: "",
      expiry_date: "",
    });
    setIsRestockModalOpen(true);
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...restockFormData };
      if (payload.units_received)
        payload.units_received = Number(payload.units_received);
      if (payload.expiry_date)
        payload.expiry_date = new Date(payload.expiry_date).toISOString();
      else payload.expiry_date = null;

      await post(`/products/${restockProductId}/receive-stock`, payload);
      toast.success("Stock received successfully!");
      setIsRestockModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to receive stock");
    }
  };

  const formatCurrency = (val) =>
    val != null ? `₦${val.toLocaleString()}` : "-";
  const formatPercent = (val) => (val != null ? `${val.toFixed(1)}%` : "-");

  // Can they see monetary values? If summary total_stock_value is present, yes.
  const canSeeMoney = summary?.total_stock_value !== undefined;

  if (loading)
    return (
      <div className="flex justify-center p-10">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <h1 className="text-2xl font-semibold text-slate-100">
          Inventory Management
        </h1>
        {canWrite(SECTIONS.INVENTORY) && (
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              variant="secondary"
              icon={Activity}
              onClick={() => {
                setMovementFormData({
                  product: products[0]?._id || "",
                  quantity: "",
                  type: "SALE",
                  person: "",
                  batch_number: "",
                  notes: "",
                });
                setIsMovementModalOpen(true);
              }}
            >
              Log Movement
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => handleOpenModal()}
            >
              Add Product
            </Button>
          </div>
        )}
      </div>

      {/* Priority Alerts */}
      {summary?.expiry_risks > 0 && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
          <h3 className="text-red-400 font-semibold mb-2">PRIORITY ALERTS</h3>
          <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4 text-sm">
            {products
              .filter(
                (p) =>
                  p.status === INVENTORY_STATUS.AT_RISK ||
                  p.status === INVENTORY_STATUS.EXPIRED
              )
              .map((p) => (
                <li key={p._id}>
                  <strong>SHELF-LIFE RISK — {p.product_name}</strong> (
                  {p.units_on_hand} packs) expires soon. At the current sales
                  rate it will NOT clear in time - projected spoilage is
                  significant.
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card title="Total SKUs">
          <div className="text-3xl font-bold text-brand-lime">
            {summary?.total_skus || 0}
          </div>
        </Card>
        {canSeeMoney && (
          <Card title="Stock Value (Cost)">
            <div className="text-3xl font-bold text-slate-100">
              {formatCurrency(summary?.total_stock_value)}
            </div>
          </Card>
        )}
        <Card title="Avg Sell-Through">
          <div className="text-3xl font-bold text-emerald-400">
            {formatPercent(summary?.avg_sell_through)}
          </div>
        </Card>
        <Card title="Depleted Items">
          <div className="text-3xl font-bold text-red-500">
            {summary?.depleted_count || 0}
          </div>
        </Card>
        <Card title="Expiry Risks">
          <div className="text-3xl font-bold text-amber-500">
            {summary?.expiry_risks || 0}
          </div>
        </Card>
      </div>

      {/* Product Table */}
      <Card title="Product List">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="p-3">Product Name</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">On Hand</th>
                {canSeeMoney && <th className="p-3 text-right">Unit Cost</th>}
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right">Sell Through</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={canSeeMoney ? "9" : "8"}
                    className="p-4 text-center text-slate-500"
                  >
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <React.Fragment key={product._id}>
                    <tr className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-medium text-slate-200">
                        {product.product_name}
                      </td>
                      <td className="p-3 text-slate-400">{product.sku}</td>
                      <td className="p-3 text-slate-400">
                        {product.category || "-"}
                      </td>
                      <td className="p-3 text-right">
                        {product.units_on_hand}
                      </td>
                      {canSeeMoney && (
                        <td className="p-3 text-right">
                          {formatCurrency(product.unit_cost)}
                        </td>
                      )}
                      <td className="p-3 text-right">
                        {formatCurrency(product.unit_price)}
                      </td>
                      <td className="p-3 text-right">
                        {formatPercent(product.sell_through_rate)}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={product.status} type="status" />
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {canWrite(SECTIONS.INVENTORY) && (
                          <button
                            onClick={() => handleOpenRestock(product._id)}
                            title="Receive Stock"
                            className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                          >
                            <PackagePlus size={16} />
                          </button>
                        )}
                        {canWrite(SECTIONS.INVENTORY) && (
                          <button
                            onClick={() => handleOpenModal(product)}
                            className="text-slate-400 hover:text-brand-lime transition-colors cursor-pointer"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {canDelete(SECTIONS.INVENTORY) && (
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                    {/* Expandable batch rows */}
                    {product.batches && product.batches.length > 0 && (
                      <tr className="border-b border-slate-800">
                        <td colSpan={canSeeMoney ? "9" : "8"} className="p-0">
                          <button
                            onClick={() =>
                              setExpandedProduct(
                                expandedProduct === product._id
                                  ? null
                                  : product._id,
                              )
                            }
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 transition-colors w-full"
                          >
                            {expandedProduct === product._id ? (
                              <ChevronDown size={12} />
                            ) : (
                              <ChevronRight size={12} />
                            )}
                            {product.batches.length} batch
                            {product.batches.length > 1 ? "es" : ""}
                          </button>
                          {expandedProduct === product._id && (
                            <div className="px-6 pb-3">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-slate-500">
                                    <th className="text-left py-1">Batch</th>
                                    <th className="text-right py-1">
                                      Received
                                    </th>
                                    <th className="text-right py-1">On Hand</th>
                                    <th className="text-left py-1 pl-4">
                                      Expiry
                                    </th>
                                    <th className="text-left py-1">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {product.batches.map((batch, idx) => {
                                    const daysToExpiry = batch.expiry_date
                                      ? Math.ceil(
                                          (new Date(batch.expiry_date) -
                                            new Date()) /
                                            (1000 * 60 * 60 * 24),
                                        )
                                      : null;
                                    const isRisk =
                                      daysToExpiry !== null &&
                                      daysToExpiry > 0 &&
                                      daysToExpiry < 90;
                                    const isExpired =
                                      daysToExpiry !== null &&
                                      daysToExpiry <= 0;
                                    return (
                                      <tr
                                        key={idx}
                                        className="border-t border-slate-800/50"
                                      >
                                        <td className="py-1 text-slate-300">
                                          {batch.batch_number ||
                                            `Batch ${idx + 1}`}
                                        </td>
                                        <td className="py-1 text-right text-slate-400">
                                          {batch.units_received}
                                        </td>
                                        <td className="py-1 text-right text-slate-200 font-medium">
                                          {batch.units_on_hand}
                                        </td>
                                        <td
                                          className={`py-1 pl-4 ${isExpired ? "text-red-400" : isRisk ? "text-amber-400" : "text-slate-400"}`}
                                        >
                                          {batch.expiry_date
                                            ? new Date(
                                                batch.expiry_date,
                                              ).toLocaleDateString()
                                            : "-"}
                                          {daysToExpiry !== null && (
                                            <span className="ml-1">
                                              (
                                              {isExpired
                                                ? "EXPIRED"
                                                : `${daysToExpiry}d left`}
                                              )
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-1">
                                          {isExpired ? (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-400">
                                              EXPIRED
                                            </span>
                                          ) : isRisk ? (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400">
                                              AT RISK
                                            </span>
                                          ) : batch.units_on_hand === 0 ? (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-400">
                                              DEPLETED
                                            </span>
                                          ) : (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                                              OK
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Movement Ledger */}
      <Card title="Recent Movements Ledger">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="p-3">Date</th>
                <th className="p-3">Product</th>
                <th className="p-3">Type</th>
                <th className="p-3 text-right">Quantity</th>
                <th className="p-3">Person/Entity</th>
                <th className="p-3">Batch</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-slate-500">
                    No movements recorded yet
                  </td>
                </tr>
              ) : (
                movements.slice(0, 10).map((movement) => (
                  <tr
                    key={movement._id}
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 text-slate-400">
                      {new Date(movement.date).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-medium text-slate-200">
                      {movement.product?.product_name || "Unknown Product"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${movement.type === "SALE" ? "bg-emerald-500/20 text-emerald-400" : movement.type === "RETURN" ? "bg-amber-500/20 text-amber-400" : "bg-slate-700 text-slate-300"}`}
                      >
                        {movement.type}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-200">
                      {movement.quantity}
                    </td>
                    <td className="p-3 text-slate-400">
                      {movement.person || "-"}
                    </td>
                    <td className="p-3 text-slate-400">
                      {movement.batch_number || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl relative">
            <h2 className="text-xl font-semibold mb-4 text-slate-100">
              {editingProduct ? "Edit Product" : "New Product"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">
                    Product Name
                  </label>
                  <input
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.product_name}
                    onChange={(e) =>
                      setFormData({ ...formData, product_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    SKU
                  </label>
                  <input
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Meal Type
                  </label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.meal_type}
                    onChange={(e) =>
                      setFormData({ ...formData, meal_type: e.target.value })
                    }
                  >
                    <option value="Single-SKU">Single-SKU (Min ₦2,800)</option>
                    <option value="Two-Component">Two-Component (Min ₦5,600)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Category
                  </label>
                  <input
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  />
                </div>
                {canSeeMoney && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Unit Cost (₦)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                      value={formData.unit_cost}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          unit_cost:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Unit Price (₦)
                  </label>
                  <input
                    type="number"
                    min={formData.meal_type === "Two-Component" ? 5600 : formData.meal_type === "Single-SKU" ? 2800 : 0}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.unit_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unit_price:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Units On Hand
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.units_on_hand}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        units_on_hand:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Units Received
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.units_received}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        units_received:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Shelf Life (Months)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.shelf_life_months}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shelf_life_months:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none [color-scheme:dark]"
                    value={formData.expiry_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expiry_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Reorder Point
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.reorder_point}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reorder_point:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Product
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl relative">
            <h2 className="text-xl font-semibold mb-4 text-slate-100">
              Log Inventory Movement
            </h2>
            <form onSubmit={handleMovementSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">
                    Product
                  </label>
                  <select
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={movementFormData.product}
                    onChange={(e) =>
                      setMovementFormData({
                        ...movementFormData,
                        product: e.target.value,
                      })
                    }
                  >
                    <option value="" disabled>
                      Select a product...
                    </option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.product_name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Movement Type
                  </label>
                  <select
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={movementFormData.type}
                    onChange={(e) =>
                      setMovementFormData({
                        ...movementFormData,
                        type: e.target.value,
                      })
                    }
                  >
                    <option value="SALE">SALE</option>
                    <option value="DEMO">DEMO</option>
                    <option value="MARKETING">MARKETING</option>
                    <option value="REGULATORY">REGULATORY</option>
                    <option value="RETURN">RETURN</option>
                    <option value="RECEIVE">RECEIVE (Restock)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Quantity
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={movementFormData.quantity}
                    onChange={(e) =>
                      setMovementFormData({
                        ...movementFormData,
                        quantity:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Person/Entity
                  </label>
                  <input
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    placeholder="e.g. Abuja Rep"
                    value={movementFormData.person}
                    onChange={(e) =>
                      setMovementFormData({
                        ...movementFormData,
                        person: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Batch Number
                  </label>
                  <input
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    placeholder="e.g. Batch 2"
                    value={movementFormData.batch_number}
                    onChange={(e) =>
                      setMovementFormData({
                        ...movementFormData,
                        batch_number: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">
                    Notes
                  </label>
                  <textarea
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    rows="2"
                    value={movementFormData.notes}
                    onChange={(e) =>
                      setMovementFormData({
                        ...movementFormData,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsMovementModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Log Movement
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Stock Modal */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-semibold mb-4 text-slate-100">
              Receive New Stock
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Add a new batch to this product. Each batch tracks its own expiry
              date independently.
            </p>
            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Batch Number / Label
                </label>
                <input
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                  placeholder="e.g. Batch 2, Container SO-01481"
                  value={restockFormData.batch_number}
                  onChange={(e) =>
                    setRestockFormData({
                      ...restockFormData,
                      batch_number: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Units Received
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                  value={restockFormData.units_received}
                  onChange={(e) =>
                    setRestockFormData({
                      ...restockFormData,
                      units_received:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none [color-scheme:dark]"
                  value={restockFormData.expiry_date}
                  onChange={(e) =>
                    setRestockFormData({
                      ...restockFormData,
                      expiry_date: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsRestockModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Receive Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
