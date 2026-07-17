import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { get, post, put, del } from '@/services/api';
import { Card, Button, StatusBadge, LoadingSpinner } from '@/components/common';
import { INVENTORY_STATUS, SECTIONS } from '../../../../shared/constants';
import { Plus, Edit2, Trash2, Upload } from 'lucide-react';
import { toast } from 'react-toastify';

export default function InventoryPage() {
  const { hasPermission, canWrite, canDelete } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    product_name: '', sku: '', category: '',
    unit_cost: 0, unit_price: 0, units_on_hand: 0, reorder_point: 0
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [productsRes, summaryRes] = await Promise.all([
        get('/products'),
        get('/products/summary')
      ]);
      setProducts(productsRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (err) {
      toast.error('Failed to load inventory');
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
        category: product.category || '',
        unit_cost: product.unit_cost || 0,
        unit_price: product.unit_price || 0,
        units_on_hand: product.units_on_hand || 0,
        reorder_point: product.reorder_point || 0,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        product_name: '', sku: '', category: '',
        unit_cost: 0, unit_price: 0, units_on_hand: 0, reorder_point: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await put(`/products/${editingProduct._id}`, formData);
        toast.success('Product updated');
      } else {
        await post('/products', formData);
        toast.success('Product created');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      try {
        await del(`/products/${id}`);
        toast.success('Product deleted');
        fetchProducts();
      } catch (err) {
        toast.error('Failed to delete product');
      }
    }
  };

  const formatCurrency = (val) => val != null ? `₦${val.toLocaleString()}` : '-';
  const formatPercent = (val) => val != null ? `${val.toFixed(1)}%` : '-';
  
  // Can they see monetary values? If summary total_stock_value is present, yes.
  const canSeeMoney = summary?.total_stock_value !== undefined;

  if (loading) return <div className="flex justify-center p-10"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-100">Inventory Management</h1>
        {canWrite(SECTIONS.INVENTORY) && (
          <div className="flex space-x-3">
            <Button variant="secondary" icon={Upload}>Import CSV</Button>
            <Button variant="primary" icon={Plus} onClick={() => handleOpenModal()}>Add Product</Button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total SKUs">
          <div className="text-3xl font-bold text-brand-lime">{summary?.total_skus || 0}</div>
        </Card>
        {canSeeMoney && (
          <Card title="Stock Value (Cost)">
            <div className="text-3xl font-bold text-slate-100">{formatCurrency(summary?.total_stock_value)}</div>
          </Card>
        )}
        <Card title="Depleted Items">
          <div className="text-3xl font-bold text-red-500">{summary?.depleted_count || 0}</div>
        </Card>
        <Card title="Expiry Risks">
          <div className="text-3xl font-bold text-amber-500">{summary?.expiry_risks || 0}</div>
        </Card>
      </div>

      {/* Product Table */}
      <Card title="Product List" className="overflow-x-auto">
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
              <tr><td colSpan={canSeeMoney ? "9" : "8"} className="p-4 text-center text-slate-500">No products found</td></tr>
            ) : (
              products.map(product => (
                <tr key={product._id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 font-medium text-slate-200">{product.product_name}</td>
                  <td className="p-3 text-slate-400">{product.sku}</td>
                  <td className="p-3 text-slate-400">{product.category || '-'}</td>
                  <td className="p-3 text-right">{product.units_on_hand}</td>
                  {canSeeMoney && <td className="p-3 text-right">{formatCurrency(product.unit_cost)}</td>}
                  <td className="p-3 text-right">{formatCurrency(product.unit_price)}</td>
                  <td className="p-3 text-right">{formatPercent(product.sell_through_rate)}</td>
                  <td className="p-3"><StatusBadge status={product.status} type="status" /></td>
                  <td className="p-3 text-right space-x-2">
                    {canWrite(SECTIONS.INVENTORY) && (
                      <button onClick={() => handleOpenModal(product)} className="text-slate-400 hover:text-brand-lime transition-colors">
                        <Edit2 size={16} />
                      </button>
                    )}
                    {canDelete(SECTIONS.INVENTORY) && (
                      <button onClick={() => handleDelete(product._id)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl relative">
            <h2 className="text-xl font-semibold mb-4 text-slate-100">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">Product Name</label>
                  <input required className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none" value={formData.product_name} onChange={e => setFormData({...formData, product_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">SKU</label>
                  <input required className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Category</label>
                  <input className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                {canSeeMoney && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Unit Cost (₦)</label>
                    <input type="number" min="0" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none" value={formData.unit_cost} onChange={e => setFormData({...formData, unit_cost: Number(e.target.value)})} />
                  </div>
                )}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Unit Price (₦)</label>
                  <input type="number" min="0" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Units On Hand</label>
                  <input type="number" min="0" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none" value={formData.units_on_hand} onChange={e => setFormData({...formData, units_on_hand: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Reorder Point</label>
                  <input type="number" min="0" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none" value={formData.reorder_point} onChange={e => setFormData({...formData, reorder_point: Number(e.target.value)})} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Save Product</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
