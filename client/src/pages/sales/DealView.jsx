import { useState } from 'react';
import { Edit2, Trash2, CheckCircle } from 'lucide-react';
import { Card, StatusBadge } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { DEAL_STAGES, SECTIONS } from '../../../../shared/constants.js';

const formatCurrency = (val) => val != null ? `₦${val.toLocaleString()}` : '-';

function DealsTable({ deals, title, canWrite, canDelete, canSeeMoney, onEdit, onDelete }) {
  if (deals.length === 0) return null;
  return (
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
            {deals.map((deal) => (
              <tr key={deal._id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                <td className="p-3 font-medium text-slate-200">{deal.deal_name}</td>
                <td className="p-3 text-slate-400">{deal.segment || '-'}</td>
                <td className="p-3">{deal.deal_stage}</td>
                {canSeeMoney && <td className="p-3">{formatCurrency(deal.value_naira)}</td>}
                <td className="p-3">{deal.probability_pct}%</td>
                <td className="p-3"><StatusBadge status={deal.rag_status} type="rag" /></td>
                <td className="p-3 text-slate-400">{deal.assigned_to?.name || 'Unassigned'}</td>
                <td className="p-3 text-right space-x-2">
                  {canWrite && (
                    <button onClick={() => onEdit(deal)} className="text-slate-400 hover:text-brand-lime transition-colors" aria-label="Edit deal">
                      <Edit2 size={16} />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => onDelete(deal._id)} className="text-slate-400 hover:text-red-500 transition-colors" aria-label="Delete deal">
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function DealView({ deals, summary, onEdit, onDelete }) {
  const { canWrite, canDelete } = useAuth();
  const canSeeMoney = summary?.total_value !== undefined;
  const canWritePipeline = canWrite(SECTIONS.PIPELINE);
  const canDeletePipeline = canDelete(SECTIONS.PIPELINE);

  const activeDeals = deals.filter(d =>
    d.deal_stage !== DEAL_STAGES.CLOSED_WON && d.deal_stage !== DEAL_STAGES.CLOSED_LOST && d.deal_stage !== DEAL_STAGES.CANCELLED
  );
  const closedDeals = deals.filter(d =>
    d.deal_stage === DEAL_STAGES.CLOSED_WON || d.deal_stage === DEAL_STAGES.CLOSED_LOST || d.deal_stage === DEAL_STAGES.CANCELLED
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Deals">
          <div className="text-3xl font-bold text-brand-lime">{summary?.total_deals || 0}</div>
        </Card>
        {canSeeMoney && (
          <>
            <Card title="Total Pipeline Value">
              <div className="text-3xl font-bold text-slate-100">{formatCurrency(summary?.total_value)}</div>
            </Card>
            <Card title="Weighted Pipeline">
              <div className="text-3xl font-bold text-emerald-400">{formatCurrency(summary?.weighted_value)}</div>
            </Card>
          </>
        )}
      </div>
      <DealsTable deals={activeDeals} title="Active Pipeline" canWrite={canWritePipeline} canDelete={canDeletePipeline} canSeeMoney={canSeeMoney} onEdit={onEdit} onDelete={onDelete} />
      <DealsTable deals={closedDeals} title="Closed Deals" canWrite={canWritePipeline} canDelete={canDeletePipeline} canSeeMoney={canSeeMoney} onEdit={onEdit} onDelete={onDelete} />
    </>
  );
}
