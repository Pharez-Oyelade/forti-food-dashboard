import { useState } from 'react';
import { Plus, Upload, Target } from 'lucide-react';
import { Button, LoadingSpinner, ImportWizard } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { SECTIONS } from '../../../../shared/constants.js';
import { useDeals, useDealSummary, useLeads, useLeadSummary, useCreateDeal, useUpdateDeal, useDeleteDeal, useCreateLead, useUpdateLead, useDeleteLead, useConvertLead } from '@/hooks/usePipeline';
import DealView from './DealView';
import LeadView from './LeadView';
import DealModal from './DealModal';
import LeadModal from './LeadModal';

export default function SalesPipelinePage() {
  const { canWrite } = useAuth();
  const [activeTab, setActiveTab] = useState('deals');
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const [dealToEdit, setDealToEdit] = useState(null);
  const [leadToEdit, setLeadToEdit] = useState(null);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: dealSummaryData } = useDealSummary();
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: leadSummaryData } = useLeadSummary();

  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const convertLead = useConvertLead();

  const summary = dealSummaryData?.summary ?? null;
  const leadsSummary = leadSummaryData?.summary ?? null;
  const canSeeMoney = summary?.total_value !== undefined;

  const openDealModal = (deal = null) => { setDealToEdit(deal); setIsDealModalOpen(true); };
  const openLeadModal = (lead = null) => { setLeadToEdit(lead); setIsLeadModalOpen(true); };

  const handleDealSubmit = (data) => {
    const mutation = dealToEdit ? updateDeal.mutateAsync({ id: dealToEdit._id, data }) : createDeal.mutateAsync(data);
    mutation.then(() => setIsDealModalOpen(false));
  };

  const handleLeadSubmit = (data) => {
    const mutation = leadToEdit ? updateLead.mutateAsync({ id: leadToEdit._id, data }) : createLead.mutateAsync(data);
    mutation.then(() => setIsLeadModalOpen(false));
  };

  const handleDeleteDeal = (id) => {
    if (window.confirm('Delete this deal?')) deleteDeal.mutate(id);
  };

  const handleDeleteLead = (id) => {
    if (window.confirm('Delete this lead?')) deleteLead.mutate(id);
  };

  const handleConvertLead = (id) => {
    if (window.confirm('Convert this Lead to a Deal?')) {
      convertLead.mutate(id, { onSuccess: () => setActiveTab('deals') });
    }
  };

  if (dealsLoading || leadsLoading) {
    return <div className="flex justify-center p-10"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-3 md:items-center">
        <h1 className="text-2xl font-semibold text-slate-100">Sales Pipeline</h1>
        {canWrite(SECTIONS.PIPELINE) && (
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" icon={Upload} onClick={() => setIsImportWizardOpen(true)}>
              Import {activeTab === 'deals' ? 'Deals' : 'Leads'}
            </Button>
            <Button variant="secondary" icon={Target} onClick={() => openLeadModal()}>Add Lead</Button>
            <Button variant="primary" icon={Plus} onClick={() => openDealModal()}>Add Deal</Button>
          </div>
        )}
      </div>

      <ImportWizard
        isOpen={isImportWizardOpen}
        onClose={() => setIsImportWizardOpen(false)}
        importType={activeTab === 'deals' ? 'SALES' : 'LEADS'}
        title={activeTab === 'deals' ? 'Import Qualified Deals' : 'Import Leads'}
        onImportSuccess={() => {}}
      />

      <div className="flex space-x-4 border-b border-slate-700" role="tablist">
        {[['deals', 'Qualified Deals'], ['leads', 'Leads & Prospecting']].map(([tab, label]) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`pb-2 px-1 font-medium transition-colors ${activeTab === tab ? 'text-brand-lime border-b-2 border-brand-lime' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'deals'
        ? <DealView deals={deals} summary={summary} onEdit={openDealModal} onDelete={handleDeleteDeal} />
        : <LeadView leads={leads} summary={leadsSummary} canSeeMoney={canSeeMoney} onEdit={openLeadModal} onDelete={handleDeleteLead} onConvert={handleConvertLead} />
      }

      {isDealModalOpen && (
        <DealModal
          deal={dealToEdit}
          onSubmit={handleDealSubmit}
          onClose={() => setIsDealModalOpen(false)}
          isPending={createDeal.isPending || updateDeal.isPending}
        />
      )}

      {isLeadModalOpen && (
        <LeadModal
          lead={leadToEdit}
          onSubmit={handleLeadSubmit}
          onClose={() => setIsLeadModalOpen(false)}
          isPending={createLead.isPending || updateLead.isPending}
        />
      )}
    </div>
  );
}
