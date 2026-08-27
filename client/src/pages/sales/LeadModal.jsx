import { useState } from 'react';
import { Button } from '@/components/common';

const INITIAL_FORM = {
  lead_name: '', segment: '', country: 'Nigeria', lead_source: '', lead_stage: 'New',
  rough_deal_size: '', decision_maker_identified: false, deal_size_known: false,
  use_case_understood: false, commercial_trajectory: false,
};

const SEGMENTS = ['Defence', 'Humanitarian', 'Corporate', 'Government', 'NGO', 'Retail', 'Other'];
const LEAD_STAGES = ['New', 'Contacted', 'Discovery', 'Qualified', 'Disqualified', 'Nurture'];

const GATES = [
  ['decision_maker_identified', 'Decision Maker Identified'],
  ['deal_size_known', 'Deal Size Known'],
  ['use_case_understood', 'Use Case Understood'],
  ['commercial_trajectory', 'Commercial Trajectory'],
];

const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none';

export default function LeadModal({ lead, onSubmit, onClose, isPending }) {
  const [form, setForm] = useState(lead ? {
    lead_name: lead.lead_name, segment: lead.segment || '',
    country: lead.country || 'Nigeria', lead_source: lead.lead_source || '',
    lead_stage: lead.lead_stage, rough_deal_size: lead.rough_deal_size || '',
    decision_maker_identified: lead.decision_maker_identified,
    deal_size_known: lead.deal_size_known,
    use_case_understood: lead.use_case_understood,
    commercial_trajectory: lead.commercial_trajectory,
  } : INITIAL_FORM);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-2xl shadow-2xl">
        <h2 id="lead-modal-title" className="text-xl font-semibold mb-4 text-slate-100">
          {lead ? 'Edit Lead' : 'New Lead'}
        </h2>
        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="lead-name">Lead Name</label>
              <input id="lead-name" required className={inputCls} value={form.lead_name} onChange={e => set('lead_name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="lead-segment">Segment</label>
              <select id="lead-segment" className={inputCls} value={form.segment} onChange={e => set('segment', e.target.value)}>
                <option value="">Select Segment...</option>
                {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="lead-stage">Stage</label>
              <select id="lead-stage" className={inputCls} value={form.lead_stage} onChange={e => set('lead_stage', e.target.value)}>
                {LEAD_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="lead-value">Est. Value (₦)</label>
              <input id="lead-value" type="number" min="0" className={inputCls} value={form.rough_deal_size} onChange={e => set('rough_deal_size', e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          </div>

          <fieldset className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <legend className="text-sm font-semibold text-slate-300 uppercase tracking-wider px-1">Qualification Gates (Need 4/4 to Promote)</legend>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {GATES.map(([key, label]) => (
                <label key={key} className="flex items-center space-x-3 text-slate-300 cursor-pointer">
                  <input type="checkbox" className="h-5 w-5 rounded border-slate-600 bg-slate-800 accent-lime-400"
                    checked={form[key]} onChange={e => set(key, e.target.checked)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isPending}>{isPending ? 'Saving...' : 'Save Lead'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
