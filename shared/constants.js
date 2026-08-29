/**
 * Forti Foods — Shared Constants
 * Used by both client and server
 */

// ── Permission Access Levels ──
export const ACCESS_LEVELS = {
  NONE: 'none',
  VIEW: 'view',
  VIEW_RESTRICTED: 'view_restricted', // view with field exclusions
  VIEW_OWN: 'view_own',
  EDIT: 'edit',                       // create + read + update
  EDIT_OWN: 'edit_own',              // edit only own records
  EDIT_RULES: 'edit_rules',          // special: can edit threshold rules
  FULL: 'full',                       // full CRUD + manage
};

// ── Sections ──
export const SECTIONS = {
  INVENTORY: 'inventory',
  PIPELINE: 'pipeline',
  MEALMATE: 'mealmate',
  SOCIAL: 'social',
  BUSINESS_GAPS: 'business_gaps',
  USER_MGMT: 'user_mgmt',
};

// ── Role Names ──
export const ROLE_NAMES = {
  FOUNDER_ADMIN: 'Founder/Admin',
  BI_OPS_ANALYST: 'BI & Ops Analyst',
  INVENTORY_LEAD: 'Inventory Lead',
  SALES_BD_LEAD: 'Sales/BD Lead',
  REP: 'Rep',
  MARKETING_LEAD: 'Marketing Lead',
  PROGRAM_COORDINATOR: 'Program Coordinator',
  VIEWER_STAKEHOLDER: 'Viewer/Stakeholder',
};

// ── Inventory Statuses ──
export const INVENTORY_STATUS = {
  OK: 'OK',
  DEPLETED: 'Depleted',
  SLOW_MOVER: 'Slow Mover',
  AT_RISK: 'At Risk',
  EXPIRED: 'Expired',
  REORDER: 'Reorder',
};

// ── Deal Stages ──
export const DEAL_STAGES = {
  PROSPECTING: 'Prospecting',
  QUALIFICATION: 'Qualification',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
};

// ── Deal RAG Status ──
export const RAG_STATUS = {
  RED: 'Red',
  AMBER: 'Amber',
  GREEN: 'Green',
};

// ── Forecast Categories ──
export const FORECAST_CATEGORIES = {
  COMMIT: 'Commit',
  BEST_CASE: 'Best Case',
  PIPELINE: 'Pipeline',
  OMITTED: 'Omitted',
};

// ── BD Activity Types ──
export const ACTIVITY_TYPES = {
  CALL: 'Call',
  EMAIL: 'Email',
  MEETING: 'Meeting',
  FOLLOW_UP: 'Follow-up',
  PROPOSAL_SENT: 'Proposal Sent',
  SITE_VISIT: 'Site Visit',
  OTHER: 'Other',
};

// ── BD Activity Outcomes ──
export const ACTIVITY_OUTCOMES = {
  POSITIVE: 'Positive',
  NEUTRAL: 'Neutral',
  NEGATIVE: 'Negative',
  NO_RESPONSE: 'No Response',
  PENDING: 'Pending',
};

// ── Grant Types ──
export const GRANT_TYPES = {
  ACCELERATOR: 'Accelerator',
  GRANT: 'Grant',
  COMPETITION: 'Competition',
  FELLOWSHIP: 'Fellowship',
  AWARD: 'Award',
  MENTORSHIP: 'Mentorship',
  OTHER: 'Other',
};

// ── Grant Statuses ──
export const GRANT_STATUSES = {
  RESEARCHING: 'Researching',
  NOT_YET_ELIGIBLE: 'Not Yet Eligible',
  IN_PROGRESS: 'In Progress',
  SUBMITTED: 'Submitted',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  WAITLISTED: 'Waitlisted',
};

// ── School Statuses ──
export const SCHOOL_STATUS = {
  IDENTIFIED: 'Identified',
  VETTED: 'Vetted',
  SUPPORTED: 'Supported',
};

// ── Social Platforms ──
export const PLATFORMS = {
  INSTAGRAM: 'Instagram',
};

// ── Flag Severities ──
export const FLAG_SEVERITY = {
  WARNING: 'warning',
  CRITICAL: 'critical',
};

// ── Threshold Operators ──
export const OPERATORS = {
  LT: 'lt',
  GT: 'gt',
  EQ: 'eq',
  LTE: 'lte',
  GTE: 'gte',
};

// ── Field Restrictions per role ──
// Fields to EXCLUDE when access level is 'view_restricted'
export const FIELD_RESTRICTIONS = {
  inventory: ['unit_cost', 'stock_value_at_cost'],
  pipeline: ['value_naira'],
};

// ── Helper: Check if access level can read ──
export function canRead(level) {
  return level && level !== ACCESS_LEVELS.NONE;
}

// ── Helper: Check if access level can write ──
export function canWrite(level) {
  return [
    ACCESS_LEVELS.EDIT,
    ACCESS_LEVELS.EDIT_OWN,
    ACCESS_LEVELS.EDIT_RULES,
    ACCESS_LEVELS.FULL,
  ].includes(level);
}

// ── Helper: Check if access level can delete ──
export function canDelete(level) {
  return level === ACCESS_LEVELS.FULL;
}

// ── Helper: Check if view is restricted ──
export function isRestricted(level) {
  return level === ACCESS_LEVELS.VIEW_RESTRICTED;
}

// ── CRM Contact Stages ──
export const CONTACT_STAGES = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  MEETING_SET: 'Meeting Set',
  QUALIFIED: 'Qualified',
  UNQUALIFIED: 'Unqualified',
};

// ── Customer Sources ──
export const CUSTOMER_SOURCES = {
  INBOUND: 'Inbound',
  OUTBOUND: 'Outbound',
  REFERRAL: 'Referral',
  EVENT: 'Event',
  OTHER: 'Other',
};
