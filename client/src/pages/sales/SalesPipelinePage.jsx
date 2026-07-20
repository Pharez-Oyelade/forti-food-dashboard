import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { get, post, put, del } from "@/services/api";
import { Card, Button, StatusBadge, LoadingSpinner } from "@/components/common";
import {
  DEAL_STAGES,
  RAG_STATUS,
  SECTIONS,
} from "../../../../shared/constants";
import { Plus, Edit2, Trash2, Upload } from "lucide-react";
import { toast } from "react-toastify";

export default function SalesPipelinePage() {
  const { hasPermission, canWrite, canDelete } = useAuth();

  const [deals, setDeals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [formData, setFormData] = useState({
    deal_name: "",
    company: "",
    deal_stage: DEAL_STAGES.PROSPECTING,
    value_naira: 0,
    probability_pct: 0,
    rag_status: RAG_STATUS.AMBER,
  });

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const [dealsRes, summaryRes] = await Promise.all([
        get("/deals"),
        get("/deals/summary"),
      ]);
      setDeals(dealsRes.data || []);
      setSummary(summaryRes.data?.summary || null);
    } catch (err) {
      toast.error("Failed to load deals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleOpenModal = (deal = null) => {
    if (deal) {
      setEditingDeal(deal);
      setFormData({
        deal_name: deal.deal_name,
        company: deal.company,
        deal_stage: deal.deal_stage,
        value_naira: deal.value_naira || 0,
        probability_pct: deal.probability_pct || 0,
        rag_status: deal.rag_status,
      });
    } else {
      setEditingDeal(null);
      setFormData({
        deal_name: "",
        company: "",
        deal_stage: DEAL_STAGES.PROSPECTING,
        value_naira: 0,
        probability_pct: 0,
        rag_status: RAG_STATUS.AMBER,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDeal) {
        await put(`/deals/${editingDeal._id}`, formData);
        toast.success("Deal updated successfully");
      } else {
        await post("/deals", formData);
        toast.success("Deal created successfully");
      }
      setIsModalOpen(false);
      fetchDeals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save deal");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this deal?")) {
      try {
        await del(`/deals/${id}`);
        toast.success("Deal deleted");
        fetchDeals();
      } catch (err) {
        toast.error("Failed to delete deal");
      }
    }
  };

  const formatCurrency = (val) =>
    val != null ? `₦${val.toLocaleString()}` : "-";
  const showMonetary = !hasPermission(
    SECTIONS.PIPELINE,
    "view_restricted",
    true,
  );
  const canSeeMoney = summary?.total_value !== undefined;

  if (loading)
    return (
      <div className="flex justify-center p-10">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-3 md:items-center">
        <h1 className="text-2xl font-semibold text-slate-100">
          Sales Pipeline
        </h1>
        {canWrite(SECTIONS.PIPELINE) && (
          <div className="flex space-x-3">
            <Button variant="secondary" icon={Upload}>
              Import CSV
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => handleOpenModal()}
            >
              Add Deal
            </Button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Deals">
          <div className="text-3xl font-bold text-brand-lime">
            {summary?.total_deals || 0}
          </div>
        </Card>
        {canSeeMoney && (
          <>
            <Card title="Total Pipeline Value">
              <div className="text-3xl font-bold text-slate-100">
                {formatCurrency(summary?.total_value)}
              </div>
            </Card>
            <Card title="Weighted Pipeline">
              <div className="text-3xl font-bold text-emerald-400">
                {formatCurrency(summary?.weighted_value)}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Deals Table */}
      <Card title="All Deals">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="p-3">Deal Name</th>
                <th className="p-3">Company</th>
                <th className="p-3">Stage</th>
                {canSeeMoney && <th className="p-3">Value</th>}
                <th className="p-3">Probability</th>
                <th className="p-3">Status</th>
                <th className="p-3">Rep</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deals.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-slate-500">
                    No deals found
                  </td>
                </tr>
              ) : (
                deals.map((deal) => (
                  <tr
                    key={deal._id}
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-medium text-slate-200">
                      {deal.deal_name}
                    </td>
                    <td className="p-3 text-slate-400">{deal.company}</td>
                    <td className="p-3">{deal.deal_stage}</td>
                    {canSeeMoney && (
                      <td className="p-3">
                        {formatCurrency(deal.value_naira)}
                      </td>
                    )}
                    <td className="p-3">{deal.probability_pct}%</td>
                    <td className="p-3">
                      <StatusBadge status={deal.rag_status} type="rag" />
                    </td>
                    <td className="p-3 text-slate-400">
                      {deal.assigned_to?.name || "Unassigned"}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {canWrite(SECTIONS.PIPELINE) && (
                        <button
                          onClick={() => handleOpenModal(deal)}
                          className="text-slate-400 hover:text-brand-lime transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {canDelete(SECTIONS.PIPELINE) && (
                        <button
                          onClick={() => handleDelete(deal._id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
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
              {editingDeal ? "Edit Deal" : "New Deal"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Deal Name
                </label>
                <input
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                  value={formData.deal_name}
                  onChange={(e) =>
                    setFormData({ ...formData, deal_name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Company
                </label>
                <input
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Stage
                  </label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.deal_stage}
                    onChange={(e) =>
                      setFormData({ ...formData, deal_stage: e.target.value })
                    }
                  >
                    {Object.values(DEAL_STAGES).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    RAG Status
                  </label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.rag_status}
                    onChange={(e) =>
                      setFormData({ ...formData, rag_status: e.target.value })
                    }
                  >
                    {Object.values(RAG_STATUS).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Value (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.value_naira}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        value_naira: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Probability (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.probability_pct}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        probability_pct: Number(e.target.value),
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
                  Save Deal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
