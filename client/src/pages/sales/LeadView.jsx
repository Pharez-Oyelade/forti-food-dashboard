import { Edit2, Trash2, CheckCircle } from 'lucide-react';
import { Card } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { SECTIONS } from '../../../../shared/constants.js';

const formatCurrency = (val) => val != null ? `₦${val.toLocaleString()}` : '-';

export default function LeadView({ leads, summary, canSeeMoney, onEdit, onDelete, onConvert }) {
  const { canWrite, canDelete } = useAuth();
  const canWritePipeline = canWrite(SECTIONS.PIPELINE);
  const canDeletePipeline = canDelete(SECTIONS.PIPELINE);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Active Leads">
          <div className="text-3xl font-bold text-brand-lime">{summary?.total_leads || 0}</div>
        </Card>
        <Card title="Ready to Promote">
          <div className="text-3xl font-bold text-emerald-400">{summary?.ready_to_promote || 0}</div>
        </Card>
      </div>

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
                  <td colSpan="8" className="p-4 text-center text-slate-500">No leads found</td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead._id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-medium text-slate-200">{lead.lead_name}</td>
                    <td className="p-3 text-slate-400">{lead.segment || '-'}</td>
                    <td className="p-3">{lead.lead_stage}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${lead.qualification_score === 4 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                        {lead.qualification_score} / 4
                      </span>
                    </td>
                    {canSeeMoney && <td className="p-3">{formatCurrency(lead.rough_deal_size)}</td>}
                    <td className="p-3">
                      {lead.is_stalled
                        ? <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400">STALLED</span>
                        : <span className="px-2 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400">ACTIVE</span>
                      }
                    </td>
                    <td className="p-3 text-slate-400">{lead.owner?.name || 'Unassigned'}</td>
                    <td className="p-3 text-right space-x-2">
                      {canWritePipeline && lead.is_ready_to_promote && (
                        <button onClick={() => onConvert(lead._id)} title="Convert to Deal" aria-label="Convert lead to deal" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {canWritePipeline && (
                        <button onClick={() => onEdit(lead)} aria-label="Edit lead" className="text-slate-400 hover:text-brand-lime transition-colors">
                          <Edit2 size={16} />
                        </button>
                      )}
                      {canDeletePipeline && (
                        <button onClick={() => onDelete(lead._id)} aria-label="Delete lead" className="text-slate-400 hover:text-red-500 transition-colors">
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
  );
}
