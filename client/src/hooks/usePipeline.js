import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put, del } from '@/services/api';
import { toast } from 'react-toastify';

// ─── Query Keys ───────────────────────────────────────────────────────────────
// Centralising keys here means any component can invalidate the right cache
// without string-matching across the codebase.
export const dealKeys = {
  all: ['deals'],
  list: () => [...dealKeys.all, 'list'],
  summary: () => [...dealKeys.all, 'summary'],
};

export const leadKeys = {
  all: ['leads'],
  list: () => [...leadKeys.all, 'list'],
  summary: () => [...leadKeys.all, 'summary'],
};

// ─── Deals ────────────────────────────────────────────────────────────────────
export function useDeals() {
  return useQuery({
    queryKey: dealKeys.list(),
    queryFn: () => get('/deals').then(r => r.data ?? []),
  });
}

export function useDealSummary() {
  return useQuery({
    queryKey: dealKeys.summary(),
    queryFn: () => get('/deals/summary').then(r => r.data ?? null),
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => post('/deals', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dealKeys.all });
      toast.success('Deal created successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create deal'),
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => put(`/deals/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dealKeys.all });
      toast.success('Deal updated successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update deal'),
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => del(`/deals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dealKeys.all });
      toast.success('Deal deleted');
    },
    onError: () => toast.error('Failed to delete deal'),
  });
}

// ─── Leads ────────────────────────────────────────────────────────────────────
export function useLeads() {
  return useQuery({
    queryKey: leadKeys.list(),
    queryFn: () => get('/leads').then(r => r.data ?? []),
  });
}

export function useLeadSummary() {
  return useQuery({
    queryKey: leadKeys.summary(),
    queryFn: () => get('/leads/summary').then(r => r.data ?? null),
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => post('/leads', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadKeys.all });
      toast.success('Lead created successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create lead'),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => put(`/leads/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadKeys.all });
      toast.success('Lead updated successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update lead'),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => del(`/leads/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadKeys.all });
      toast.success('Lead deleted');
    },
    onError: () => toast.error('Failed to delete lead'),
  });
}

export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => post(`/leads/${id}/convert`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadKeys.all });
      qc.invalidateQueries({ queryKey: dealKeys.all });
      toast.success('Lead converted to Deal!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to convert lead'),
  });
}
