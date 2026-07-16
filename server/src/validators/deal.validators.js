import { z } from 'zod';
import { DEAL_STAGES, RAG_STATUS } from '../../../shared/constants.js';

export const createDealSchema = z.object({
  deal_name: z.string().min(1, 'Deal name is required'),
  company: z.string().min(1, 'Company is required'),
  contact_person: z.string().optional(),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  deal_stage: z.enum(Object.values(DEAL_STAGES)).optional(),
  value_naira: z.number().min(0).optional(),
  probability_pct: z.number().min(0).max(100).optional(),
  expected_close_date: z.string().datetime().optional(),
  next_follow_up: z.string().datetime().optional(),
  rag_status: z.enum(Object.values(RAG_STATUS)).optional(),
  notes: z.string().optional(),
  assigned_to: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional(),
  source: z.string().optional(),
});

export const updateDealSchema = createDealSchema.partial();
