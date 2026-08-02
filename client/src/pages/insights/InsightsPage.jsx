import { useState, useEffect } from "react";
import { get, post, put, del } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, Button, StatusBadge, LoadingSpinner } from "@/components/common";
import { Plus, Edit2, Trash2, AlertTriangle, Target, Briefcase, Users, Layout, Activity, PenTool, Bot } from "lucide-react";
import { toast } from "react-toastify";
import { SECTIONS } from "../../../../shared/constants";

export default function InsightsPage() {
  const { canWrite, canDelete } = useAuth();
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGap, setEditingGap] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "MEDIUM",
    status: "OPEN",
    department_tags: [],
    owner: "Unassigned",
  });

  const departmentOptions = ["Sales", "Inventory", "Programs", "Marketing", "Finance", "Operations", "General"];

  const fetchGaps = async () => {
    try {
      setLoading(true);
      const res = await get("/gaps");
      if (res.success) {
        setGaps(res.data);
      }
    } catch (err) {
      toast.error("Failed to load business gaps");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, []);

  const handleOpenModal = (gap = null) => {
    if (gap) {
      setEditingGap(gap);
      setFormData({
        title: gap.title,
        description: gap.description,
        severity: gap.severity,
        status: gap.status,
        department_tags: gap.department_tags || [],
        owner: gap.owner || "Unassigned",
      });
    } else {
      setEditingGap(null);
      setFormData({
        title: "",
        description: "",
        severity: "MEDIUM",
        status: "OPEN",
        department_tags: [],
        owner: "Unassigned",
      });
    }
    setIsModalOpen(true);
  };

  const handleTagToggle = (tag) => {
    setFormData((prev) => {
      if (prev.department_tags.includes(tag)) {
        return { ...prev, department_tags: prev.department_tags.filter(t => t !== tag) };
      } else {
        return { ...prev, department_tags: [...prev.department_tags, tag] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGap) {
        await put(`/gaps/${editingGap._id}`, formData);
        toast.success("Gap updated successfully");
      } else {
        await post("/gaps", formData);
        toast.success("Gap logged successfully");
      }
      setIsModalOpen(false);
      fetchGaps();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save gap");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this gap record?")) {
      try {
        await del(`/gaps/${id}`);
        toast.success("Gap deleted");
        fetchGaps();
      } catch (err) {
        toast.error("Failed to delete gap");
      }
    }
  };

  const severityColor = (severity) => {
    switch (severity) {
      case "HIGH": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "MEDIUM": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "LOW": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default: return "bg-slate-700/50 text-slate-300 border-slate-700";
    }
  };

  const renderColumn = (status, title, icon) => {
    const columnGaps = gaps.filter((g) => g.status === status);
    return (
      <div className="flex flex-col gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold flex items-center gap-2 text-slate-200">
            {icon}
            {title}
          </h3>
          <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-xs">
            {columnGaps.length}
          </span>
        </div>
        
        {columnGaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-800/20 rounded-lg border border-dashed border-slate-700 h-32">
            <p className="text-sm text-slate-500">No {status.toLowerCase()} gaps</p>
          </div>
        ) : (
          columnGaps.map((gap) => (
            <div key={gap._id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors group relative cursor-pointer" onClick={() => canWrite(SECTIONS.BUSINESS_GAPS) && handleOpenModal(gap)}>
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${severityColor(gap.severity)}`}>
                  {gap.severity}
                </span>
                
                {canDelete(SECTIONS.BUSINESS_GAPS) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(gap._id);
                    }}
                    className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              
              <h4 className="text-sm font-semibold text-slate-200 mb-1 leading-snug flex items-start gap-2">
                {gap.title}
                {gap.is_automated && (
                  <span title="Automated System Alert">
                    <Bot size={14} className="text-brand-lime flex-shrink-0 mt-0.5" />
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-400 line-clamp-2 mb-3">{gap.description}</p>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {gap.department_tags.map(tag => (
                  <span key={tag} className="text-[10px] bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-700/50">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-brand-lime/20 flex items-center justify-center text-[10px] text-brand-lime border border-brand-lime/30">
                    {gap.owner !== "Unassigned" ? gap.owner.charAt(0).toUpperCase() : "?"}
                  </div>
                  <span className="text-xs text-slate-300 truncate max-w-[100px]">{gap.owner}</span>
                </div>
                
                {gap.status === "RESOLVED" && gap.resolved_at && (
                  <span className="text-[10px] text-emerald-400">
                    {new Date(gap.resolved_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  if (loading) return <div className="flex justify-center p-10"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 flex items-center gap-2">
            <Target className="text-brand-lime" /> Business Gaps & Insights
          </h1>
          <p className="text-sm text-slate-400 mt-1">Track operational failures, strategic insights, and assign ownership.</p>
        </div>
        {canWrite(SECTIONS.BUSINESS_GAPS) && (
          <Button variant="primary" icon={Plus} onClick={() => handleOpenModal()}>
            Log Business Gap
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderColumn("OPEN", "Open Gaps", <AlertTriangle size={16} className="text-amber-400" />)}
        {renderColumn("IN_PROGRESS", "In Progress", <Activity size={16} className="text-blue-400" />)}
        {renderColumn("RESOLVED", "Resolved", <PenTool size={16} className="text-emerald-400" />)}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
            <h2 className="text-xl font-bold text-slate-100 mb-6">
              {editingGap ? "Edit Business Gap" : "Log New Gap"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Gap Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-brand-lime"
                  placeholder="e.g., Lead decay rate is too high"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description & Impact</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand-lime"
                  placeholder="Explain the operational failure and impact..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-brand-lime"
                  >
                    <option value="HIGH">High (Critical Impact)</option>
                    <option value="MEDIUM">Medium (Moderate Impact)</option>
                    <option value="LOW">Low (Minor Impact)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-brand-lime"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Affected Departments</label>
                <div className="flex flex-wrap gap-2">
                  {departmentOptions.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        formData.department_tags.includes(tag)
                          ? "bg-brand-lime text-slate-900"
                          : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Assigned Owner (Name/Title)</label>
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-brand-lime"
                  placeholder="e.g., Head of Sales"
                />
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editingGap ? "Update Gap" : "Log Gap"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
