import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { get, post, put, del } from "@/services/api";
import { Card, Button, StatusBadge, LoadingSpinner } from "@/components/common";
import { SECTIONS } from "../../../../shared/constants";
import { Plus, Edit2, Trash2, Heart, RefreshCw, Settings2 } from "lucide-react";
import { toast } from "react-toastify";

export default function MealMatePage() {
  const { hasPermission, canWrite, canDelete } = useAuth();

  const [schools, setSchools] = useState([]);
  const [summary, setSummary] = useState(null);
  const [fundingSummary, setFundingSummary] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("Operations");
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState(1500);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [formData, setFormData] = useState({
    school_name: "",
    location: "",
    pupil_count: 0,
    need_score: 0,
    readiness_score: 0,
    status: "Identified",
    meals_delivered: "",
  });

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const [schoolsRes, summaryRes, fundingRes, subsRes] = await Promise.all([
        get("/schools"),
        get("/schools/summary"),
        get("/mealmate/funding/summary"),
        get("/mealmate/subscribers"),
      ]);
      setSchools(schoolsRes.data || []);
      setSummary(summaryRes.data || null);
      setFundingSummary(fundingRes.data || null);
      setSubscribers(subsRes.data || []);
    } catch (err) {
      toast.error("Failed to load schools");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncPayments = async () => {
    try {
      setSyncing(true);
      await post("/mealmate/sync-payments");
      toast.success("Payments synchronized with Stripe and Paystack");
      fetchSchools();
    } catch (err) {
      toast.error("Payment sync is currently a stub for future implementation");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleOpenModal = (school = null) => {
    if (school) {
      setEditingSchool(school);
      setFormData({
        school_name: school.school_name,
        location: school.location,
        pupil_count: school.pupil_count || 0,
        need_score: school.need_score || 0,
        readiness_score: school.readiness_score || 0,
        status: school.status || "Identified",
        meals_delivered: school.meals_delivered || 0,
      });
    } else {
      setEditingSchool(null);
      setFormData({
        school_name: "",
        location: "",
        pupil_count: 0,
        need_score: 0,
        readiness_score: 0,
        status: "Identified",
        meals_delivered: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchool) {
        await put(`/schools/${editingSchool._id}`, formData);
        toast.success("School updated");
      } else {
        await post("/schools", formData);
        toast.success("School created");
      }
      setIsModalOpen(false);
      fetchSchools();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save school");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this school?")) {
      try {
        await del(`/schools/${id}`);
        toast.success("School deleted");
        fetchSchools();
      } catch (err) {
        toast.error("Failed to delete school");
      }
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-10">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-3 md:items-center">
        <h1 className="text-2xl font-semibold text-slate-100 flex items-center gap-2">
          {/* <Heart className="text-brand-lime" />  */}
          My Meal Mate Framework
        </h1>
        {canWrite(SECTIONS.MEALMATE) && activeTab === "Operations" && (
          <div className="flex space-x-3">
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => handleOpenModal()}
            >
              Add School
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-slate-700">
        <button
          className={`pb-2 px-1 font-medium transition-colors ${
            activeTab === "Operations"
              ? "text-brand-lime border-b-2 border-brand-lime"
              : "text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("Operations")}
        >
          Operations
        </button>
        <button
          className={`pb-2 px-1 font-medium transition-colors ${
            activeTab === "Funding"
              ? "text-brand-lime border-b-2 border-brand-lime"
              : "text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("Funding")}
        >
          Funding (B2C)
        </button>
      </div>

      {activeTab === "Operations" ? (
        <>
          {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Schools">
          <div className="text-3xl font-bold text-slate-100">
            {summary?.total_schools || 0}
          </div>
        </Card>
        <Card title="Vetted Schools">
          <div className="text-3xl font-bold text-brand-lime">
            {summary?.vetted_schools || 0}
          </div>
        </Card>
        <Card title="Supported Schools">
          <div className="text-3xl font-bold text-brand-lime">
            {summary?.supported_schools || 0}
          </div>
        </Card>
        <Card title="Meals Delivered">
          <div className="text-3xl font-bold text-amber-500">
            {summary?.total_meals_delivered || 0}
          </div>
        </Card>
      </div>

      {/* Supported Schools Table */}
      <Card title="Active Supported Schools">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="p-3">School Name</th>
                <th className="p-3">Location</th>
                <th className="p-3 text-right">Pupil Count</th>
                <th className="p-3 text-right">Meals Delivered</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.filter(s => s.status === 'Supported').length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-slate-500">
                    No supported schools found
                  </td>
                </tr>
              ) : (
                schools.filter(s => s.status === 'Supported').map((school) => (
                  <tr
                    key={school._id}
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-medium text-slate-200">
                      {school.school_name}
                    </td>
                    <td className="p-3 text-slate-400">{school.location || '-'}</td>
                    <td className="p-3 text-right">{school.pupil_count}</td>
                    <td className="p-3 text-right text-brand-lime font-bold">
                      {school.meals_delivered.toLocaleString()}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {canWrite(SECTIONS.MEALMATE) && (
                        <button
                          onClick={() => handleOpenModal(school)}
                          className="text-slate-400 hover:text-brand-lime transition-colors cursor-pointer"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {canDelete(SECTIONS.MEALMATE) && (
                        <button
                          onClick={() => handleDelete(school._id)}
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

      {/* Priority Pipeline Table */}
      <Card title="Prospective Priority Pipeline">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="p-3">School Name</th>
                <th className="p-3">Location</th>
                <th className="p-3 text-right">Pupil Count</th>
                <th className="p-3 text-right">Priority Score</th>
                <th className="p-3 text-right">Meals Delivered</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.filter(s => s.status !== 'Supported').length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-slate-500">
                    No prospective schools found
                  </td>
                </tr>
              ) : (
                schools
                  .filter(s => s.status !== 'Supported')
                  .sort((a, b) => b.priority_score - a.priority_score)
                  .map((school) => (
                  <tr
                    key={school._id}
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-medium text-slate-200">
                      {school.school_name}
                    </td>
                    <td className="p-3 text-slate-400">{school.location || '-'}</td>
                    <td className="p-3 text-right">{school.pupil_count}</td>
                    <td className="p-3 text-right">
                      <span className="bg-slate-800 px-2 py-1 rounded-md text-brand-lime font-mono">
                        {school.priority_score}/100
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-300">
                      {school.meals_delivered}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={school.status} type="school" />
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {canWrite(SECTIONS.MEALMATE) && (
                        <button
                          onClick={() => handleOpenModal(school)}
                          className="text-slate-400 hover:text-brand-lime transition-colors cursor-pointer"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {canDelete(SECTIONS.MEALMATE) && (
                        <button
                          onClick={() => handleDelete(school._id)}
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
      </>) : (
      <>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setDisplayCurrency("USD")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  displayCurrency === "USD" ? "bg-brand-lime text-brand-dark" : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                USD
              </button>
              <button
                onClick={() => setDisplayCurrency("NGN")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  displayCurrency === "NGN" ? "bg-brand-lime text-brand-dark" : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                NGN
              </button>
            </div>

            <div className="flex items-center bg-slate-800 rounded-md px-3 py-1 space-x-2">
              <Settings2 size={14} className="text-slate-400" />
              <span className="text-sm text-slate-400">Rate: ₦</span>
              <input 
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value) || 1500)}
                className="bg-transparent text-sm text-slate-200 w-16 outline-none focus:text-brand-lime"
              />
            </div>
          </div>
          
          <Button variant="secondary" icon={RefreshCw} onClick={handleSyncPayments} disabled={syncing}>
            {syncing ? "Syncing..." : "Sync Stripe/Paystack"}
          </Button>
        </div>

        {/* Funding KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card title="Active Subscribers">
            <div className="text-3xl font-bold text-slate-100">
              {fundingSummary?.activeSubscribers || 0}
            </div>
          </Card>
          <Card title="At-Risk (Churn)">
            <div className="text-3xl font-bold text-red-500">
              {fundingSummary?.atRiskSubscribers || 0}
            </div>
          </Card>
          <Card title="Monthly Rec. Revenue">
            <div className="text-3xl font-bold text-brand-lime">
              {displayCurrency === "USD" ? "$" : "₦"}
              {displayCurrency === "USD" 
                ? ((fundingSummary?.monthlySubRevenueUsd || 0) + (fundingSummary?.monthlySubRevenueNgn || 0) / exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 })
                : ((fundingSummary?.monthlySubRevenueNgn || 0) + (fundingSummary?.monthlySubRevenueUsd || 0) * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 })
              }
            </div>
          </Card>
          <Card title="Total One-off Donations">
            <div className="text-3xl font-bold text-emerald-400">
              {displayCurrency === "USD" ? "$" : "₦"}
              {displayCurrency === "USD" 
                ? ((fundingSummary?.totalDonationsUsd || 0) + (fundingSummary?.totalDonationsNgn || 0) / exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 })
                : ((fundingSummary?.totalDonationsNgn || 0) + (fundingSummary?.totalDonationsUsd || 0) * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 })
              }
            </div>
          </Card>
        </div>

        {/* Subscribers Table */}
        <Card title="Subscriber List">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-sm">
                  <th className="p-3">Email</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-right">Last Payment</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-slate-500">
                      No subscribers found
                    </td>
                  </tr>
                ) : (
                  subscribers.map((sub) => (
                    <tr
                      key={sub._id}
                      className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3 font-medium text-slate-200">
                        {sub.email}
                        <div className="text-xs text-slate-500">{sub.channel}</div>
                      </td>
                      <td className="p-3 text-right text-brand-lime">
                        {sub.currency === 'USD' ? '$' : '₦'}{sub.amount.toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-slate-300">
                        {sub.last_payment_date ? new Date(sub.last_payment_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs rounded-md ${
                          sub.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' :
                          sub.status === 'At-Risk' ? 'bg-amber-500/20 text-amber-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {sub.status}
                        </span>
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
              {editingSchool ? "Edit School" : "New School"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">
                    School Name
                  </label>
                  <input
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.school_name}
                    onChange={(e) =>
                      setFormData({ ...formData, school_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Location
                  </label>
                  <input
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="Identified">Identified</option>
                    <option value="Vetted">Vetted</option>
                    <option value="Supported">Supported</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Pupil Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.pupil_count}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pupil_count: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Meals Delivered
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.meals_delivered}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        meals_delivered: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Need Score (max 70)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="70"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.need_score}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        need_score: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Readiness Score (max 30)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.readiness_score}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        readiness_score: e.target.value === '' ? '' : Number(e.target.value),
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
                  Save School
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
