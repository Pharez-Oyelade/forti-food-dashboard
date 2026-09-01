import { useState } from 'react';
import { Card, Button, StatusBadge, LoadingSpinner } from '@/components/common';
import { Edit2, Trash2, CheckCircle, Plus, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SECTIONS } from '../../../../shared/constants.js';
import { useContacts, useDeleteContact, useConvertContact, useCreateContact, useUpdateContact } from '@/hooks/useContacts';
import ContactModal from './ContactModal';

export default function CRMContactView() {
  const { canWrite, canDelete } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const { data: contacts = [], isLoading } = useContacts();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const convertContact = useConvertContact();

  const handleOpenModal = (contact = null) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleSubmit = (formData) => {
    const mutation = editingContact
      ? updateContact.mutateAsync({ id: editingContact._id, data: formData })
      : createContact.mutateAsync(formData);

    mutation.then(() => setIsModalOpen(false));
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      deleteContact.mutate(id);
    }
  };

  const handleConvert = (id) => {
    if (window.confirm('Convert this Contact into a Lead?')) {
      convertContact.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-10"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <Users size={20} className="text-brand-lime" />
          CRM Contacts
        </h2>
        {canWrite(SECTIONS.PIPELINE) && (
          <Button variant="primary" icon={Plus} onClick={() => handleOpenModal()}>
            Add Contact
          </Button>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="p-3">Company Name</th>
                <th className="p-3">Contact Person</th>
                <th className="p-3">Email / Phone</th>
                <th className="p-3">Source</th>
                <th className="p-3">Stage</th>
                <th className="p-3">Rep</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-slate-500">
                    No contacts found
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact._id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="p-3 font-medium text-slate-200">{contact.company_name}</td>
                    <td className="p-3 text-slate-300">{contact.contact_name}</td>
                    <td className="p-3 text-slate-400 text-sm">
                      {contact.email && <div>{contact.email}</div>}
                      {contact.phone && <div>{contact.phone}</div>}
                      {!contact.email && !contact.phone && '-'}
                    </td>
                    <td className="p-3 text-slate-300">{contact.customer_source}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-700 text-slate-300">
                        {contact.contact_stage}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-sm">{contact.owner?.name}</td>
                    <td className="p-3 text-right space-x-2">
                      {canWrite(SECTIONS.PIPELINE) && (
                        <button
                          onClick={() => handleConvert(contact._id)}
                          title="Convert to Lead"
                          aria-label="Convert contact to lead"
                          className="text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {canWrite(SECTIONS.PIPELINE) && (
                        <button
                          onClick={() => handleOpenModal(contact)}
                          aria-label="Edit contact"
                          className="text-slate-400 hover:text-brand-lime transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {canDelete(SECTIONS.PIPELINE) && (
                        <button
                          onClick={() => handleDelete(contact._id)}
                          aria-label="Delete contact"
                          className="text-slate-400 hover:text-red-500 transition-colors"
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

      {isModalOpen && (
        <ContactModal
          contact={editingContact}
          onSubmit={handleSubmit}
          onClose={() => setIsModalOpen(false)}
          isPending={createContact.isPending || updateContact.isPending}
        />
      )}
    </div>
  );
}
