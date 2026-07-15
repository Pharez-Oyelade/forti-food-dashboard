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
  EXPIRY_RISK: 'Expiry Risk',
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
