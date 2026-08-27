import { useState } from 'react';
import { Button } from '@/components/common';
import { DEAL_STAGES, RAG_STATUS, FORECAST_CATEGORIES } from '../../../../shared/constants.js';

const INITIAL_FORM = {
  deal_name: '', company: '', segment: '',
  deal_stage: DEAL_STAGES.PROSPECTING, value_naira: '', probability_pct: '',
  contract_term_months: '', forecast_category: FORECAST_CATEGORIES.PIPELINE,
  rag_status: RAG_STATUS.AMBER, risk_reason: '', lost_reason: '',
  vendor_compliance: { pencom: false, tax_clearance: false, cac: false },
};

const SEGMENTS = ['Defence', 'Humanitarian', 'Corporate', 'Government', 'NGO', 'Retail', 'Other'];

const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none';

export default function DealModal({ deal, onSubmit, onClose, isPending }) {
  const [form, setForm] = useState(deal ? {
    deal_name: deal.deal_name, company: deal.company || '',
    segment: deal.segment || '', deal_stage: deal.deal_stage,
    value_naira: deal.value_naira || '', probability_pct: deal.probability_pct || '',
    contract_term_months: deal.contract_term_months || '',
    forecast_category: deal.forecast_category || FORECAST_CATEGORIES.PIPELINE,
    rag_status: deal.rag_status, risk_reason: deal.risk_reason || '',
    lost_reason: deal.lost_reason || '',
    vendor_compliance: deal.vendor_compliance || { pencom: false, tax_clearance: false, cac: false },
  } : INITIAL_FORM);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setCompliance = (key, val) => setForm(f => ({ ...f, vendor_compliance: { ...f.vendor_compliance, [key]: val } }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="deal-modal-title">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl">
        <h2 id="deal-modal-title" className="text-xl font-semibold mb-4 text-slate-100">
          {deal ? 'Edit Deal' : 'New Deal'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="deal-name">Deal Name</label>
            <input id="deal-name" required className={inputCls} value={form.deal_name} onChange={e => set('deal_name', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="company">Company</label>
              <input id="company" required className={inputCls} value={form.company} onChange={e => set('company', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="segment">Segment</label>
              <select id="segment" className={inputCls} value={form.segment} onChange={e => set('segment', e.target.value)}>
                <option value="">Select Segment...</option>
                {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="stage">Stage</label>
              <select id="stage" className={inputCls} value={form.deal_stage} onChange={e => set('deal_stage', e.target.value)}>
                {Object.values(DEAL_STAGES).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="rag">RAG Status</label>
              <select id="rag" className={inputCls} value={form.rag_status} onChange={e => set('rag_status', e.target.value)}>
                {Object.values(RAG_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="value">Value (₦)</label>
              <input id="value" type="number" min="0" className={inputCls} value={form.value_naira} onChange={e => set('value_naira', e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="prob">Probability (%)</label>
              <input id="prob" type="number" min="0" max="100" className={inputCls} value={form.probability_pct} onChange={e => set('probability_pct', e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="forecast">Forecast Category</label>
              <select id="forecast" className={inputCls} value={form.forecast_category} onChange={e => set('forecast_category', e.target.value)}>
                {Object.values(FORECAST_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="term">Contract Term (Months)</label>
              <input id="term" type="number" min="0" className={inputCls} value={form.contract_term_months} onChange={e => set('contract_term_months', e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          </div>

          {(form.deal_stage === DEAL_STAGES.CLOSED_LOST || [RAG_STATUS.RED, RAG_STATUS.AMBER].includes(form.rag_status)) && (
            <div className="grid grid-cols-2 gap-4">
              {form.deal_stage === DEAL_STAGES.CLOSED_LOST && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1" htmlFor="lost">Lost Reason</label>
                  <input id="lost" className={inputCls} value={form.lost_reason} onChange={e => set('lost_reason', e.target.value)} />
                </div>
              )}
              {[RAG_STATUS.RED, RAG_STATUS.AMBER].includes(form.rag_status) && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1" htmlFor="risk">Risk Reason</label>
                  <input id="risk" className={inputCls} value={form.risk_reason} onChange={e => set('risk_reason', e.target.value)} />
                </div>
              )}
            </div>
          )}

          <fieldset className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <legend className="text-sm font-semibold text-slate-300 uppercase tracking-wider px-1">Vendor Compliance</legend>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[['pencom', 'PENCOM'], ['tax_clearance', 'Tax Clearance'], ['cac', 'CAC']].map(([key, label]) => (
                <label key={key} className="flex items-center space-x-3 text-slate-300 cursor-pointer">
                  <input type="checkbox" className="h-5 w-5 rounded border-slate-600 bg-slate-800 accent-lime-400"
                    checked={form.vendor_compliance?.[key] || false}
                    onChange={e => setCompliance(key, e.target.checked)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isPending}>{isPending ? 'Saving...' : 'Save Deal'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
