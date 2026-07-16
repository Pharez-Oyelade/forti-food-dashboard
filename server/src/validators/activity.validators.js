import { z } from 'zod';
import { ACTIVITY_TYPES, ACTIVITY_OUTCOMES } from '../../../shared/constants.js';

const baseSchema = {
  activity_type: z.enum(Object.values(ACTIVITY_TYPES)),
  subject: z.string().min(1, 'Subject is required'),
  notes: z.string().optional().nullable(),
  deal: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid deal ID').optional().nullable(),
  grant: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid grant ID').optional().nullable(),
  contact_name: z.string().optional().nullable(),
  contact_company: z.string().optional().nullable(),
  outcome: z.enum(Object.values(ACTIVITY_OUTCOMES)).optional(),
  follow_up_date: z.string().datetime().optional().nullable(),
  activity_date: z.string().datetime().optional(),
};

export const createActivitySchema = z.object(baseSchema);
export const updateActivitySchema = z.object(baseSchema).partial();
