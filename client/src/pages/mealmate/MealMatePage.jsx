import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { get, post, put, del } from "@/services/api";
import { Card, Button, StatusBadge, LoadingSpinner } from "@/components/common";
import { SECTIONS } from "../../../../shared/constants";
import { Plus, Edit2, Trash2, Heart } from "lucide-react";
import { toast } from "react-toastify";

export default function MealMatePage() {
  const { hasPermission, canWrite, canDelete } = useAuth();

  const [schools, setSchools] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

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
    meals_delivered: 0,
  });

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const [schoolsRes, summaryRes] = await Promise.all([
        get("/schools"),
        get("/schools/summary"),
      ]);
      setSchools(schoolsRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (err) {
      toast.error("Failed to load schools");
    } finally {
      setLoading(false);
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
        meals_delivered: 0,
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
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <h1 className="text-2xl font-semibold text-slate-100 flex items-center gap-2">
          <Heart className="text-brand-lime" /> My Meal Mate Framework
        </h1>
        {canWrite(SECTIONS.MEALMATE) && (
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

      {/* Schools Table */}
      <Card title="School Priority List">
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
            {schools.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-4 text-center text-slate-500">
                  No schools found
                </td>
              </tr>
            ) : (
              schools.map((school) => (
                <tr
                  key={school._id}
                  className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="p-3 font-medium text-slate-200">
                    {school.school_name}
                  </td>
                  <td className="p-3 text-slate-400">{school.location}</td>
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
                    required
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
                        pupil_count: Number(e.target.value),
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
                        meals_delivered: Number(e.target.value),
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
                        need_score: Number(e.target.value),
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
                        readiness_score: Number(e.target.value),
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
