import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { get, post, put, del } from '@/services/api';
import { Card, Button, StatusBadge, LoadingSpinner } from '@/components/common';
import { GRANT_TYPES, GRANT_STATUSES, SECTIONS } from '../../../../shared/constants';
import { Plus, Edit2, Trash2, Award } from 'lucide-react';
import { toast } from 'react-toastify';

export default function GrantsPipelinePage() {
  const { canWrite, canDelete } = useAuth();
  
  const [grants, setGrants] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrant, setEditingGrant] = useState(null);
  const [formData, setFormData] = useState({
    program_name: '', funder_organisation: '', type: GRANT_TYPES.GRANT,
    status: GRANT_STATUSES.RESEARCHING, award_amount: 0, currency: 'USD'
  });

  const fetchGrants = async () => {
    try {
      setLoading(true);
      const [grantsRes, summaryRes] = await Promise.all([
        get('/grants'),
        get('/grants/summary')
      ]);
      setGrants(grantsRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (err) {
      toast.error('Failed to load grants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrants();
  }, []);

  const handleOpenModal = (grant = null) => {
    if (grant) {
      setEditingGrant(grant);
      setFormData({
        program_name: grant.program_name,
        funder_organisation: grant.funder_organisation,
        type: grant.type,
        status: grant.status,
        award_amount: grant.award_amount || 0,
        currency: grant.currency || 'USD',
      });
    } else {
      setEditingGrant(null);
      setFormData({
        program_name: '', funder_organisation: '', type: GRANT_TYPES.GRANT,
        status: GRANT_STATUSES.RESEARCHING, award_amount: 0, currency: 'USD'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGrant) {
        await put(`/grants/${editingGrant._id}`, formData);
        toast.success('Grant updated');
      } else {
        await post('/grants', formData);
        toast.success('Grant added');
      }
      setIsModalOpen(false);
      fetchGrants();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save grant');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this grant?')) {
      try {
        await del(`/grants/${id}`);
        toast.success('Grant deleted');
        fetchGrants();
      } catch (err) {
        toast.error('Failed to delete grant');
      }
    }
  };

  const formatCurrency = (val, cur = 'USD') => {
    if (val == null) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(val);
  };

  if (loading) return <div className="flex justify-center p-10"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Grants & Partnerships Pipeline</h1>
          <p className="text-slate-400 text-sm">Track inbound funding and accelerator opportunities</p>
        </div>
        {canWrite(SECTIONS.PIPELINE) && (
          <Button variant="primary" icon={Plus} onClick={() => handleOpenModal()}>Add Grant</Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center space-x-4">
          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-brand-lime/10 text-brand-lime rounded-lg"><Award size={24} /></div>
          <div>
            <p className="text-sm text-slate-400">Total Opportunities</p>
            <p className="text-2xl font-bold text-slate-100">{summary?.total || 0}</p>
          </div>
        </Card>
      </div>

      {/* Grants Table */}
      <Card title="All Grants" className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-sm">
              <th className="p-3">Program Name</th>
              <th className="p-3">Funder/Organisation</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Amount</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {grants.length === 0 ? (
              <tr><td colSpan="6" className="p-4 text-center text-slate-500">No grants found</td></tr>
            ) : (
              grants.map(grant => (
                <tr key={grant._id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="p-3 font-medium text-slate-200">{grant.program_name}</td>
                  <td className="p-3 text-slate-400">{grant.funder_organisation}</td>
                  <td className="p-3">{grant.type}</td>
                  <td className="p-3">
                    <StatusBadge status={
                      grant.status === GRANT_STATUSES.ACCEPTED ? 'Green' : 
                      grant.status === GRANT_STATUSES.REJECTED ? 'Red' : 'Amber'
                    } type="rag" label={grant.status} />
                  </td>
                  <td className="p-3 font-mono">{formatCurrency(grant.award_amount, grant.currency)}</td>
                  <td className="p-3 text-right space-x-2">
                    {canWrite(SECTIONS.PIPELINE) && (
                      <button onClick={() => handleOpenModal(grant)} className="text-slate-400 hover:text-brand-lime">
                        <Edit2 size={16} />
                      </button>
                    )}
                    {canDelete(SECTIONS.PIPELINE) && (
                      <button onClick={() => handleDelete(grant._id)} className="text-slate-400 hover:text-red-500">
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
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-semibold mb-4 text-slate-100">{editingGrant ? 'Edit Grant' : 'New Grant'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Program Name</label>
                <input required className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none" value={formData.program_name} onChange={e => setFormData({...formData, program_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Funder / Organisation</label>
                <input required className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none" value={formData.funder_organisation} onChange={e => setFormData({...formData, funder_organisation: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Type</label>
                  <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    {Object.values(GRANT_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Status</label>
                  <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    {Object.values(GRANT_STATUSES).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Award Amount</label>
                  <input type="number" min="0" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none" value={formData.award_amount} onChange={e => setFormData({...formData, award_amount: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Currency</label>
                  <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                    {['USD', 'NGN', 'GBP', 'EUR'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Save Grant</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
