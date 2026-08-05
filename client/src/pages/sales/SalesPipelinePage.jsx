import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { get, post, put, del } from "@/services/api";
import { Card, Button, StatusBadge, LoadingSpinner } from "@/components/common";
import {
  DEAL_STAGES,
  RAG_STATUS,
  FORECAST_CATEGORIES,
  SECTIONS,
} from "../../../../shared/constants";
import { Plus, Edit2, Trash2, Upload, Target, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

export default function SalesPipelinePage() {
  const { hasPermission, canWrite, canDelete } = useAuth();

  const [activeTab, setActiveTab] = useState("deals");
  const [deals, setDeals] = useState([]);
  const [summary, setSummary] = useState(null);

  const [leads, setLeads] = useState([]);
  const [leadsSummary, setLeadsSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [formData, setFormData] = useState({
    deal_name: "",
    segment: "",
    deal_stage: DEAL_STAGES.PROSPECTING,
    value_naira: "",
    probability_pct: "",
    contract_term_months: "",
    forecast_category: FORECAST_CATEGORIES.PIPELINE,
    rag_status: RAG_STATUS.AMBER,
    risk_reason: "",
    lost_reason: "",
    vendor_compliance: {
      pencom: false,
      tax_clearance: false,
      cac: false,
    },
  });

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [leadFormData, setLeadFormData] = useState({
    lead_name: "",
    segment: "",
    country: "Nigeria",
    lead_source: "",
    lead_stage: "New",
    rough_deal_size: "",
    decision_maker_identified: false,
    deal_size_known: false,
    use_case_understood: false,
    commercial_trajectory: false,
  });

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const [dealsRes, summaryRes, leadsRes, leadsSummaryRes] =
        await Promise.all([
          get("/deals"),
          get("/deals/summary"),
          get("/leads"),
          get("/leads/summary"),
        ]);
      setDeals(dealsRes.data || []);
      setSummary(summaryRes.data?.summary || null);
      setLeads(leadsRes.data || []);
      setLeadsSummary(leadsSummaryRes.data?.summary || null);
    } catch (err) {
      toast.error("Failed to load pipeline data");
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
        segment: deal.segment || "",
        deal_stage: deal.deal_stage,
        value_naira: deal.value_naira || "",
        probability_pct: deal.probability_pct || "",
        contract_term_months: deal.contract_term_months || "",
        forecast_category: deal.forecast_category || FORECAST_CATEGORIES.PIPELINE,
        rag_status: deal.rag_status,
        risk_reason: deal.risk_reason || "",
        lost_reason: deal.lost_reason || "",
        vendor_compliance: deal.vendor_compliance || { pencom: false, tax_clearance: false, cac: false },
      });
    } else {
      setEditingDeal(null);
      setFormData({
        deal_name: "",
        segment: "",
        deal_stage: DEAL_STAGES.PROSPECTING,
        value_naira: "",
        probability_pct: "",
        contract_term_months: "",
        forecast_category: FORECAST_CATEGORIES.PIPELINE,
        rag_status: RAG_STATUS.AMBER,
        risk_reason: "",
        lost_reason: "",
        vendor_compliance: {
          pencom: false,
          tax_clearance: false,
          cac: false,
        },
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

  // --- Lead Handlers ---
  const handleOpenLeadModal = (lead = null) => {
    if (lead) {
      setEditingLead(lead);
      setLeadFormData({
        lead_name: lead.lead_name,
        segment: lead.segment || "",
        country: lead.country || "Nigeria",
        lead_source: lead.lead_source || "",
        lead_stage: lead.lead_stage,
        rough_deal_size: lead.rough_deal_size || 0,
        decision_maker_identified: lead.decision_maker_identified,
        deal_size_known: lead.deal_size_known,
        use_case_understood: lead.use_case_understood,
        commercial_trajectory: lead.commercial_trajectory,
      });
    } else {
      setEditingLead(null);
      setLeadFormData({
        lead_name: "",
        segment: "",
        country: "Nigeria",
        lead_source: "",
        lead_stage: "New",
        rough_deal_size: "",
        decision_maker_identified: false,
        deal_size_known: false,
        use_case_understood: false,
        commercial_trajectory: false,
      });
    }
    setIsLeadModalOpen(true);
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await put(`/leads/${editingLead._id}`, leadFormData);
        toast.success("Lead updated successfully");
      } else {
        await post("/leads", leadFormData);
        toast.success("Lead created successfully");
      }
      setIsLeadModalOpen(false);
      fetchDeals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save lead");
    }
  };

  const handleDeleteLead = async (id) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      try {
        await del(`/leads/${id}`);
        toast.success("Lead deleted");
        fetchDeals();
      } catch (err) {
        toast.error("Failed to delete lead");
      }
    }
  };

  const handlePromoteLead = async (id) => {
    if (window.confirm("Convert this Lead to a Deal?")) {
      try {
        await post(`/leads/${id}/convert`);
        toast.success("Lead converted to Deal!");
        fetchDeals();
        setActiveTab("deals");
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to promote lead");
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

  const renderDealsTable = (dealsToRender, title) => (
    <Card title={title} className="mb-6">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-sm">
              <th className="p-3">Deal Name</th>
              <th className="p-3">Segment</th>
              <th className="p-3">Stage</th>
              {canSeeMoney && <th className="p-3">Value</th>}
              <th className="p-3">Probability</th>
              <th className="p-3">Status</th>
              <th className="p-3">Rep</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dealsToRender.length === 0 ? (
              <tr>
                <td
                  colSpan={canSeeMoney ? "8" : "7"}
                  className="p-4 text-center text-slate-500"
                >
                  No deals found
                </td>
              </tr>
            ) : (
              dealsToRender.map((deal) => (
                <tr
                  key={deal._id}
                  className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="p-3 font-medium text-slate-200">
                    {deal.deal_name}
                  </td>
                  <td className="p-3 text-slate-400">{deal.segment || "-"}</td>
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
  );

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
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              icon={Target}
              onClick={() => handleOpenLeadModal()}
            >
              Add Lead
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

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-slate-700">
        <button
          className={`pb-2 px-1 font-medium transition-colors ${
            activeTab === "deals"
              ? "text-brand-lime border-b-2 border-brand-lime"
              : "text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("deals")}
        >
          Qualified Deals
        </button>
        <button
          className={`pb-2 px-1 font-medium transition-colors ${
            activeTab === "leads"
              ? "text-brand-lime border-b-2 border-brand-lime"
              : "text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("leads")}
        >
          Leads & Prospecting
        </button>
      </div>

      {activeTab === "deals" ? (
        <>
          {/* KPI Cards for Deals */}
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

          {/* Active Deals Table */}
          {renderDealsTable(
            deals.filter(d => d.deal_stage !== DEAL_STAGES.CLOSED_WON && d.deal_stage !== DEAL_STAGES.CLOSED_LOST && d.deal_stage !== DEAL_STAGES.CANCELLED),
            "Active Pipeline"
          )}
          {/* Closed Deals Table */}
          {renderDealsTable(
            deals.filter(d => d.deal_stage === DEAL_STAGES.CLOSED_WON || d.deal_stage === DEAL_STAGES.CLOSED_LOST || d.deal_stage === DEAL_STAGES.CANCELLED),
            "Closed Deals"
          )}
        </>
      ) : (
        <>
          {/* KPI Cards for Leads */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card title="Total Active Leads">
              <div className="text-3xl font-bold text-brand-lime">
                {leadsSummary?.total_leads || 0}
              </div>
            </Card>
            <Card title="Ready to Promote">
              <div className="text-3xl font-bold text-emerald-400">
                {leadsSummary?.ready_to_promote || 0}
              </div>
            </Card>
          </div>

          {/* Leads Table */}
          <Card title="All Leads">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-sm">
                    <th className="p-3">Lead Name</th>
                    <th className="p-3">Segment</th>
                    <th className="p-3">Stage</th>
                    <th className="p-3 text-center">Gates (4)</th>
                    {canSeeMoney && <th className="p-3">Est. Value</th>}
                    <th className="p-3">Status</th>
                    <th className="p-3">Rep</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="p-4 text-center text-slate-500"
                      >
                        No leads found
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr
                        key={lead._id}
                        className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="p-3 font-medium text-slate-200">
                          {lead.lead_name}
                        </td>
                        <td className="p-3 text-slate-400">{lead.segment || "-"}</td>
                        <td className="p-3">{lead.lead_stage}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${lead.qualification_score === 4 ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-300"}`}
                          >
                            {lead.qualification_score} / 4
                          </span>
                        </td>
                        {canSeeMoney && (
                          <td className="p-3">
                            {formatCurrency(lead.rough_deal_size)}
                          </td>
                        )}
                        <td className="p-3">
                          {lead.is_stalled ? (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400">
                              STALLED
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400">
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-400">
                          {lead.owner?.name || "Unassigned"}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          {canWrite(SECTIONS.PIPELINE) &&
                            lead.is_ready_to_promote && (
                              <button
                                onClick={() => handlePromoteLead(lead._id)}
                                title="Convert to Deal"
                                className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                          {canWrite(SECTIONS.PIPELINE) && (
                            <button
                              onClick={() => handleOpenLeadModal(lead)}
                              className="text-slate-400 hover:text-brand-lime transition-colors cursor-pointer"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {canDelete(SECTIONS.PIPELINE) && (
                            <button
                              onClick={() => handleDeleteLead(lead._id)}
                              className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
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
        </>
      )}

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
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Segment
                  </label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.segment}
                    onChange={(e) =>
                      setFormData({ ...formData, segment: e.target.value })
                    }
                  >
                    <option value="">Select Segment...</option>
                    <option value="Defence">Defence</option>
                    <option value="Humanitarian">Humanitarian</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Government">Government</option>
                    <option value="NGO">NGO</option>
                    <option value="Retail">Retail</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
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
                        value_naira: e.target.value === '' ? '' : Number(e.target.value),
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
                        probability_pct: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Forecast Category
                  </label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.forecast_category}
                    onChange={(e) =>
                      setFormData({ ...formData, forecast_category: e.target.value })
                    }
                  >
                    {Object.values(FORECAST_CATEGORIES).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Contract Term (Months)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.contract_term_months}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contract_term_months: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              {(formData.deal_stage === DEAL_STAGES.CLOSED_LOST || formData.rag_status === RAG_STATUS.RED || formData.rag_status === RAG_STATUS.AMBER) && (
                <div className="grid grid-cols-2 gap-4">
                  {formData.deal_stage === DEAL_STAGES.CLOSED_LOST && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">
                        Lost Reason
                      </label>
                      <input
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                        value={formData.lost_reason}
                        onChange={(e) =>
                          setFormData({ ...formData, lost_reason: e.target.value })
                        }
                      />
                    </div>
                  )}
                  {(formData.rag_status === RAG_STATUS.RED || formData.rag_status === RAG_STATUS.AMBER) && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">
                        Risk Reason
                      </label>
                      <input
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                        value={formData.risk_reason}
                        onChange={(e) =>
                          setFormData({ ...formData, risk_reason: e.target.value })
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Vendor Compliance */}
              <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                  Vendor Compliance
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center space-x-3 text-slate-300">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-brand-lime rounded border-slate-600 bg-slate-800"
                      checked={formData.vendor_compliance?.pencom || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vendor_compliance: {
                            ...formData.vendor_compliance,
                            pencom: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>PENCOM</span>
                  </label>
                  <label className="flex items-center space-x-3 text-slate-300">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-brand-lime rounded border-slate-600 bg-slate-800"
                      checked={formData.vendor_compliance?.tax_clearance || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vendor_compliance: {
                            ...formData.vendor_compliance,
                            tax_clearance: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Tax Clearance</span>
                  </label>
                  <label className="flex items-center space-x-3 text-slate-300">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-brand-lime rounded border-slate-600 bg-slate-800"
                      checked={formData.vendor_compliance?.cac || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vendor_compliance: {
                            ...formData.vendor_compliance,
                            cac: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>CAC</span>
                  </label>
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

      {/* Lead Modal */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-2xl shadow-2xl relative">
            <h2 className="text-xl font-semibold mb-4 text-slate-100">
              {editingLead ? "Edit Lead" : "New Lead"}
            </h2>
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Lead Name
                  </label>
                  <input
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={leadFormData.lead_name}
                    onChange={(e) =>
                      setLeadFormData({
                        ...leadFormData,
                        lead_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Segment
                  </label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={leadFormData.segment}
                    onChange={(e) =>
                      setLeadFormData({
                        ...leadFormData,
                        segment: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Segment...</option>
                    <option value="Defence">Defence</option>
                    <option value="Humanitarian">Humanitarian</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Government">Government</option>
                    <option value="NGO">NGO</option>
                    <option value="Retail">Retail</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Stage
                  </label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={leadFormData.lead_stage}
                    onChange={(e) =>
                      setLeadFormData({
                        ...leadFormData,
                        lead_stage: e.target.value,
                      })
                    }
                  >
                    {[
                      "New",
                      "Contacted",
                      "Discovery",
                      "Qualified",
                      "Disqualified",
                      "Nurture",
                    ].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Est. Value (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={leadFormData.rough_deal_size}
                    onChange={(e) =>
                      setLeadFormData({
                        ...leadFormData,
                        rough_deal_size: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              {/* Gate Criteria */}
              <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                  Qualification Gates (Need 4/4 to Promote)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center space-x-3 text-slate-300">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-brand-lime rounded border-slate-600 bg-slate-800"
                      checked={leadFormData.decision_maker_identified}
                      onChange={(e) =>
                        setLeadFormData({
                          ...leadFormData,
                          decision_maker_identified: e.target.checked,
                        })
                      }
                    />
                    <span>Decision Maker Identified</span>
                  </label>
                  <label className="flex items-center space-x-3 text-slate-300">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-brand-lime rounded border-slate-600 bg-slate-800"
                      checked={leadFormData.deal_size_known}
                      onChange={(e) =>
                        setLeadFormData({
                          ...leadFormData,
                          deal_size_known: e.target.checked,
                        })
                      }
                    />
                    <span>Deal Size Known</span>
                  </label>
                  <label className="flex items-center space-x-3 text-slate-300">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-brand-lime rounded border-slate-600 bg-slate-800"
                      checked={leadFormData.use_case_understood}
                      onChange={(e) =>
                        setLeadFormData({
                          ...leadFormData,
                          use_case_understood: e.target.checked,
                        })
                      }
                    />
                    <span>Use Case Understood</span>
                  </label>
                  <label className="flex items-center space-x-3 text-slate-300">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-brand-lime rounded border-slate-600 bg-slate-800"
                      checked={leadFormData.commercial_trajectory}
                      onChange={(e) =>
                        setLeadFormData({
                          ...leadFormData,
                          commercial_trajectory: e.target.checked,
                        })
                      }
                    />
                    <span>Commercial Trajectory</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsLeadModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Lead
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
