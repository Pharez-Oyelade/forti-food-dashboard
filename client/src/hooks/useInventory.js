import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put, del } from '@/services/api';
import { toast } from 'react-toastify';

export const inventoryKeys = {
  all: ['inventory'],
  products: () => [...inventoryKeys.all, 'products'],
  summary: () => [...inventoryKeys.all, 'summary'],
  movements: () => [...inventoryKeys.all, 'movements'],
  alerts: () => [...inventoryKeys.all, 'alerts'],
};

export function useProducts() {
  return useQuery({
    queryKey: inventoryKeys.products(),
    queryFn: () => get('/products').then(r => r.data ?? []),
  });
}

export function useInventorySummary() {
  return useQuery({
    queryKey: inventoryKeys.summary(),
    queryFn: () => get('/products/summary').then(r => r.data ?? null),
  });
}

export function useInventoryMovements() {
  return useQuery({
    queryKey: inventoryKeys.movements(),
    queryFn: () => get('/products/movements').then(r => r.data ?? []),
  });
}

export function useInventoryAlerts() {
  return useQuery({
    queryKey: inventoryKeys.alerts(),
    queryFn: () => get('/products/alerts').then(r => r.data ?? []),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => post('/products', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success('Product created successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create product'),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => put(`/products/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success('Product updated successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update product'),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => del(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success('Product deleted');
    },
    onError: () => toast.error('Failed to delete product'),
  });
}

export function useLogMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => post('/products/movements', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success('Movement logged successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to log movement'),
  });
}

export function useReceiveStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => post(`/products/${id}/receive-stock`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success('Stock received successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to receive stock'),
  });
}
