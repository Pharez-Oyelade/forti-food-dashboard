import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { get, post, put, del } from '@/services/api';
import { Card, Button, StatusBadge, LoadingSpinner } from '@/components/common';
import BDPerformanceCard from '@/components/dashboard/BDPerformanceCard';
import { ACTIVITY_TYPES, ACTIVITY_OUTCOMES, SECTIONS } from '../../../../shared/constants';
import { Plus, Edit2, Trash2, Clock, Activity } from 'lucide-react';
import { toast } from 'react-toastify';

export default function BDDashboardPage() {
  const { user, canWrite, canDelete } = useAuth();
  
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formData, setFormData] = useState({
    activity_type: ACTIVITY_TYPES.CALL, subject: '', notes: '', 
    contact_name: '', contact_company: '', outcome: ACTIVITY_OUTCOMES.PENDING
  });

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const [activitiesRes, summaryRes] = await Promise.all([
        get('/activities'),
        get('/activities/summary')
      ]);
      setActivities(activitiesRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (err) {
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleOpenModal = (activity = null) => {
    if (activity) {
      setEditingActivity(activity);
      setFormData({
        activity_type: activity.activity_type,
        subject: activity.subject,
        notes: activity.notes || '',
        contact_name: activity.contact_name || '',
        contact_company: activity.contact_company || '',
        outcome: activity.outcome,
      });
    } else {
      setEditingActivity(null);
      setFormData({
        activity_type: ACTIVITY_TYPES.CALL, subject: '', notes: '', 
        contact_name: '', contact_company: '', outcome: ACTIVITY_OUTCOMES.PENDING
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingActivity) {
        await put(`/activities/${editingActivity._id}`, formData);
        toast.success('Activity updated');
      } else {
        await post('/activities', formData);
        toast.success('Activity logged');
      }
      setIsModalOpen(false);
      fetchActivities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save activity');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this activity?')) {
      try {
        await del(`/activities/${id}`);
        toast.success('Activity deleted');
        fetchActivities();
      } catch (err) {
        toast.error('Failed to delete activity');
      }
    }
  };

  if (loading) return <div className="flex justify-center p-10"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">BD Dashboard</h1>
          <p className="text-slate-400 text-sm">Activity hub and performance metrics</p>
        </div>
        {canWrite(SECTIONS.PIPELINE) && (
          <Button variant="primary" icon={Plus} onClick={() => handleOpenModal()}>Log Activity</Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center space-x-4">
          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-brand-lime/10 text-brand-lime rounded-lg"><Activity size={24} /></div>
          <div>
            <p className="text-sm text-slate-400">Total Activities</p>
            <p className="text-2xl font-bold text-slate-100">{summary?.total || 0}</p>
          </div>
        </Card>
        <Card className="flex items-center space-x-4">
           <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-blue-500/10 text-blue-400 rounded-lg"><Clock size={24} /></div>
           <div>
             <p className="text-sm text-slate-400">Recent Logs</p>
             <p className="text-2xl font-bold text-slate-100">{activities.slice(0,5).length}</p>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activities Table */}
        <Card title="Recent Activities" className="lg:col-span-2">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="p-3">Type</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Outcome</th>
                <th className="p-3">Rep</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activities.length === 0 ? (
                <tr><td colSpan="6" className="p-4 text-center text-slate-500">No activities found</td></tr>
              ) : (
                activities.slice(0, 10).map(act => (
                  <tr key={act._id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="p-3 font-medium text-slate-300">{act.activity_type}</td>
                    <td className="p-3 text-slate-200">{act.subject}</td>
                    <td className="p-3 text-slate-400">{act.contact_name} {act.contact_company && `(${act.contact_company})`}</td>
                    <td className="p-3"><StatusBadge status={act.outcome === ACTIVITY_OUTCOMES.POSITIVE ? 'Green' : act.outcome === ACTIVITY_OUTCOMES.NEGATIVE ? 'Red' : 'Amber'} type="rag" label={act.outcome} /></td>
                    <td className="p-3 text-slate-400 text-sm">{act.logged_by?.name}</td>
                    <td className="p-3 text-right space-x-2">
                      {canWrite(SECTIONS.PIPELINE) && (
                        <button onClick={() => handleOpenModal(act)} className="text-slate-400 hover:text-brand-lime">
                          <Edit2 size={16} />
                        </button>
                      )}
                      {canDelete(SECTIONS.PIPELINE) && (
                        <button onClick={() => handleDelete(act._id)} className="text-slate-400 hover:text-red-500">
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

        {/* BD Performance Card */}
        <div className="lg:col-span-1 space-y-6">
          <BDPerformanceCard />
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-semibold mb-4 text-slate-100">{editingActivity ? 'Edit Activity' : 'Log Activity'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Type</label>
                  <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none" value={formData.activity_type} onChange={e => setFormData({...formData, activity_type: e.target.value})}>
                    {Object.values(ACTIVITY_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Outcome</label>
                  <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none" value={formData.outcome} onChange={e => setFormData({...formData, outcome: e.target.value})}>
                    {Object.values(ACTIVITY_OUTCOMES).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Subject</label>
                <input required className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Contact Name</label>
                  <input className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none" value={formData.contact_name} onChange={e => setFormData({...formData, contact_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Contact Company</label>
                  <input className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none" value={formData.contact_company} onChange={e => setFormData({...formData, contact_company: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Notes</label>
                <textarea className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 h-24 focus:border-brand-lime focus:outline-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Save Activity</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
