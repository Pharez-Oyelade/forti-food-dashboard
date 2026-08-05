import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { get, post, put, del } from "@/services/api";
import { Card, Button, LoadingSpinner } from "@/components/common";
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "react-toastify";
import { SECTIONS } from "../../../../shared/constants";

export default function SocialMediaPage() {
  const { canWrite, canDelete } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState(null);
  const [formData, setFormData] = useState({
    week_ending: "",
    total_followers: "",
    new_followers: "",
    weekly_reach: "",
    impressions: "",
    engagement_rate: "",
    posts_published: "",
    stories_published: "",
    total_likes: "",
    total_comments: "",
    top_post_caption: "",
    top_post_likes: "",
  });

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const [metricsRes, summaryRes] = await Promise.all([
        get("/marketing"),
        get("/marketing/summary")
      ]);
      setMetrics(metricsRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (err) {
      toast.error("Failed to load marketing metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleOpenModal = (metric = null) => {
    if (metric) {
      setEditingMetric(metric);
      setFormData({
        week_ending: metric.week_ending ? metric.week_ending.split("T")[0] : "",
        total_followers: metric.total_followers,
        new_followers: metric.new_followers,
        weekly_reach: metric.weekly_reach,
        impressions: metric.impressions,
        engagement_rate: metric.engagement_rate,
        posts_published: metric.posts_published,
        stories_published: metric.stories_published,
        total_likes: metric.total_likes,
        total_comments: metric.total_comments,
        top_post_caption: metric.top_post_caption || "",
        top_post_likes: metric.top_post_likes,
      });
    } else {
      setEditingMetric(null);
      setFormData({
        week_ending: "",
        total_followers: "",
        new_followers: "",
        weekly_reach: "",
        impressions: "",
        engagement_rate: "",
        posts_published: "",
        stories_published: "",
        total_likes: "",
        total_comments: "",
        top_post_caption: "",
        top_post_likes: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMetric) {
        await put(`/marketing/${editingMetric._id}`, formData);
        toast.success("Metrics updated");
      } else {
        await post("/marketing", formData);
        toast.success("Metrics logged successfully");
      }
      setIsModalOpen(false);
      fetchMetrics();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save metrics");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this week's metrics?")) {
      try {
        await del(`/marketing/${id}`);
        toast.success("Metrics deleted");
        fetchMetrics();
      } catch (err) {
        toast.error("Failed to delete metrics");
      }
    }
  };

  if (loading) return (
    <div className="flex justify-center p-10">
      <LoadingSpinner size="lg" />
    </div>
  );

  const { latest, deltas } = summary || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Social Media Tracker</h1>
          <p className="text-sm text-slate-400">Weekly performance and engagement metrics</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {canWrite(SECTIONS.SOCIAL) && (
            <Button variant="primary" icon={Plus} onClick={() => handleOpenModal()}>
              Log Metrics
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Followers">
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-brand-lime">
              {latest?.total_followers?.toLocaleString() || 0}
            </div>
            {deltas?.followers != null && (
              <div className={`flex items-center text-sm font-semibold ${deltas.followers >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {deltas.followers >= 0 ? <TrendingUp size={16} className="mr-1"/> : <TrendingDown size={16} className="mr-1"/>}
                {deltas.followers > 0 ? '+' : ''}{deltas.followers} this week
              </div>
            )}
          </div>
        </Card>
        
        <Card title="Weekly Reach">
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-slate-100">
              {latest?.weekly_reach?.toLocaleString() || 0}
            </div>
            {deltas?.reach != null && (
              <div className={`flex items-center text-sm font-semibold ${deltas.reach >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {deltas.reach >= 0 ? <TrendingUp size={16} className="mr-1"/> : <TrendingDown size={16} className="mr-1"/>}
                {deltas.reach > 0 ? '+' : ''}{deltas.reach} vs last week
              </div>
            )}
          </div>
        </Card>

        <Card title="Engagement Rate">
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-blue-400">
              {latest?.engagement_rate ? `${latest.engagement_rate}%` : '0%'}
            </div>
            {deltas?.engagement != null && (
              <div className={`flex items-center text-sm font-semibold ${deltas.engagement >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {deltas.engagement >= 0 ? <TrendingUp size={16} className="mr-1"/> : <TrendingDown size={16} className="mr-1"/>}
                {deltas.engagement > 0 ? '+' : ''}{deltas.engagement.toFixed(1)}% vs last week
              </div>
            )}
          </div>
        </Card>

        <Card title="Total Impressions">
          <div className="text-3xl font-bold text-slate-100">
            {latest?.impressions?.toLocaleString() || 0}
          </div>
        </Card>
      </div>

      {/* Metrics Table */}
      <Card title="Historical Performance" className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-sm">
              <th className="p-3">Week Ending</th>
              <th className="p-3 text-right">Followers</th>
              <th className="p-3 text-right">New Followers</th>
              <th className="p-3 text-right">Reach</th>
              <th className="p-3 text-right">Engagement</th>
              <th className="p-3 text-center">Posts/Stories</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {metrics.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-4 text-center text-slate-500">
                  No metrics recorded yet
                </td>
              </tr>
            ) : (
              metrics.slice().reverse().map((m) => (
                <tr
                  key={m._id}
                  className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="p-3 font-medium text-slate-200">
                    {new Date(m.week_ending).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right text-slate-300">{m.total_followers?.toLocaleString()}</td>
                  <td className="p-3 text-right text-brand-lime">+{m.new_followers}</td>
                  <td className="p-3 text-right text-slate-300">{m.weekly_reach?.toLocaleString()}</td>
                  <td className="p-3 text-right text-blue-400">{m.engagement_rate}%</td>
                  <td className="p-3 text-center text-slate-400">{m.posts_published} / {m.stories_published}</td>
                  <td className="p-3 text-right space-x-2">
                    {canWrite(SECTIONS.SOCIAL) && (
                      <button
                        onClick={() => handleOpenModal(m)}
                        className="text-slate-400 hover:text-brand-lime transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    {canDelete(SECTIONS.SOCIAL) && (
                      <button
                        onClick={() => handleDelete(m._id)}
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
      </Card>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-semibold mb-4 text-slate-100">
              {editingMetric ? "Edit Metrics" : "Log Weekly Metrics"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">
                    Week Ending (Date)
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none [color-scheme:dark]"
                    value={formData.week_ending}
                    onChange={(e) =>
                      setFormData({ ...formData, week_ending: e.target.value })
                    }
                  />
                </div>
                
                {/* Audience Section */}
                <div className="col-span-2 mt-4"><h3 className="text-brand-lime font-semibold border-b border-slate-700 pb-1">Audience</h3></div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Total Followers</label>
                  <input type="number" required min="0" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.total_followers} onChange={(e) => setFormData({ ...formData, total_followers: e.target.value === '' ? '' : Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">New Followers</label>
                  <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.new_followers} onChange={(e) => setFormData({ ...formData, new_followers: e.target.value === '' ? '' : Number(e.target.value) })} />
                </div>

                {/* Reach Section */}
                <div className="col-span-2 mt-4"><h3 className="text-brand-lime font-semibold border-b border-slate-700 pb-1">Reach & Engagement</h3></div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Weekly Reach</label>
                  <input type="number" required min="0" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.weekly_reach} onChange={(e) => setFormData({ ...formData, weekly_reach: e.target.value === '' ? '' : Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Impressions</label>
                  <input type="number" min="0" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.impressions} onChange={(e) => setFormData({ ...formData, impressions: e.target.value === '' ? '' : Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Engagement Rate (%)</label>
                  <input type="number" step="0.1" required min="0" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.engagement_rate} onChange={(e) => setFormData({ ...formData, engagement_rate: e.target.value === '' ? '' : Number(e.target.value) })} />
                </div>

                {/* Activity Section */}
                <div className="col-span-2 mt-4"><h3 className="text-brand-lime font-semibold border-b border-slate-700 pb-1">Content Activity</h3></div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Posts Published</label>
                  <input type="number" min="0" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.posts_published} onChange={(e) => setFormData({ ...formData, posts_published: e.target.value === '' ? '' : Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Stories Published</label>
                  <input type="number" min="0" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.stories_published} onChange={(e) => setFormData({ ...formData, stories_published: e.target.value === '' ? '' : Number(e.target.value) })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">Top Post Caption / Theme</label>
                  <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none"
                    value={formData.top_post_caption} onChange={(e) => setFormData({ ...formData, top_post_caption: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-700 mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Metrics
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
