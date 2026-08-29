import { useState } from 'react';
import { Button } from '@/components/common';
import { CONTACT_STAGES, CUSTOMER_SOURCES } from '../../../../shared/constants.js';

const INITIAL_FORM = {
  company_name: '',
  contact_name: '',
  email: '',
  phone: '',
  customer_source: CUSTOMER_SOURCES.OUTBOUND,
  contact_stage: CONTACT_STAGES.NEW,
};

const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-brand-lime focus:outline-none';

export default function ContactModal({ contact, onSubmit, onClose, isPending }) {
  const [form, setForm] = useState(contact ? {
    company_name: contact.company_name,
    contact_name: contact.contact_name,
    email: contact.email || '',
    phone: contact.phone || '',
    customer_source: contact.customer_source,
    contact_stage: contact.contact_stage,
  } : INITIAL_FORM);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl">
        <h2 id="contact-modal-title" className="text-xl font-semibold mb-4 text-slate-100">
          {contact ? 'Edit Contact' : 'New Contact'}
        </h2>
        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="company-name">Company Name</label>
              <input id="company-name" required className={inputCls} value={form.company_name} onChange={e => set('company_name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="contact-name">Contact Name</label>
              <input id="contact-name" required className={inputCls} value={form.contact_name} onChange={e => set('contact_name', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="email">Email</label>
              <input id="email" type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="phone">Phone</label>
              <input id="phone" type="tel" className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="source">Source</label>
              <select id="source" className={inputCls} value={form.customer_source} onChange={e => set('customer_source', e.target.value)}>
                {Object.values(CUSTOMER_SOURCES).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="stage">Stage</label>
              <select id="stage" className={inputCls} value={form.contact_stage} onChange={e => set('contact_stage', e.target.value)}>
                {Object.values(CONTACT_STAGES).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isPending}>{isPending ? 'Saving...' : 'Save Contact'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
