import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put, del } from '@/services/api';
import { toast } from 'react-toastify';
import { leadKeys } from './usePipeline';

export const contactKeys = {
  all: ['contacts'],
  list: () => [...contactKeys.all, 'list'],
};

export function useContacts() {
  return useQuery({
    queryKey: contactKeys.list(),
    queryFn: () => get('/contacts').then(r => r.data ?? []),
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => post('/contacts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.all });
      toast.success('Contact created successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create contact'),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => put(`/contacts/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.all });
      toast.success('Contact updated successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update contact'),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => del(`/contacts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.all });
      toast.success('Contact deleted');
    },
    onError: () => toast.error('Failed to delete contact'),
  });
}

export function useConvertContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => post(`/contacts/${id}/convert`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.all });
      qc.invalidateQueries({ queryKey: leadKeys.all });
      toast.success('Contact converted to Lead successfully!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to convert contact'),
  });
}
