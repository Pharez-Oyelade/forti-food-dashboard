import { z } from 'zod';
import { GRANT_TYPES, GRANT_STATUSES } from '../../../shared/constants.js';

const baseSchema = {
  program_name: z.string().min(1, 'Program name is required'),
  funder_organisation: z.string().min(1, 'Funder organisation is required'),
  type: z.enum(Object.values(GRANT_TYPES)).optional().nullable(),
  focus_area: z.string().optional().nullable(),
  status: z.enum(Object.values(GRANT_STATUSES)).optional(),
  award_amount: z.number().min(0).optional(),
  currency: z.enum(['USD', 'NGN', 'GBP', 'EUR']).optional(),
  application_deadline: z.string().datetime().optional().nullable(),
  is_rolling: z.boolean().optional(),
  decision_date: z.string().datetime().optional().nullable(),
  eligibility_notes: z.string().optional().nullable(),
  assigned_to: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional().nullable(),
  notes: z.string().optional().nullable(),
};

export const createGrantSchema = z.object(baseSchema);
export const updateGrantSchema = z.object(baseSchema).partial();
