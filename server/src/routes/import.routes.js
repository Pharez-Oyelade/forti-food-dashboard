import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { Deal } from '../models/Deal.js';
import { Product } from '../models/Product.js';
import { InstagramMetric } from '../models/InstagramMetric.js';
import { School } from '../models/School.js';
import { Subscriber } from '../models/Subscriber.js';
import { Lead } from '../models/Lead.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

const IMPORT_CONFIG = {
  SALES: {
    model: Deal,
    uniqueKey: 'deal_name',
    expectedFields: [
      { key: 'deal_name', label: 'Deal Name', required: true },
      { key: 'company', label: 'Company', required: false },
      { key: 'contact_person', label: 'Contact Name', required: false },
      { key: 'contact_email', label: 'Contact Email', required: false },
      { key: 'contact_phone', label: 'Contact Phone', required: false },
      { key: 'deal_stage', label: 'Deal Stage', required: false },
      { key: 'value_naira', label: 'Value (₦)', required: false, type: 'number' },
      { key: 'probability_pct', label: 'Probability (%)', required: false, type: 'number' },
      { key: 'expected_close_date', label: 'Expected Close Date', required: false, type: 'date' },
      { key: 'contract_term_months', label: 'Contract Term (Months)', required: false, type: 'number' },
      { key: 'segment', label: 'Segment', required: false },
      { key: 'source', label: 'Source', required: false },
      { key: 'rep_name', label: 'Rep / Owner Name', required: false }
    ]
  },
  INVENTORY: {
    model: Product,
    uniqueKey: 'product_name',
    expectedFields: [
      { key: 'product_name', label: 'Product Name', required: true },
      { key: 'sku', label: 'SKU', required: false },
      { key: 'category', label: 'Category', required: false },
      { key: 'unit_cost', label: 'Unit Cost', required: false, type: 'number' },
      { key: 'unit_price', label: 'Unit Price', required: false, type: 'number' },
      { key: 'units_on_hand', label: 'Units On Hand', required: false, type: 'number' }
    ]
  },
  SOCIAL: {
    model: InstagramMetric,
    uniqueKey: 'week_ending',
    expectedFields: [
      { key: 'week_ending', label: 'Week Ending (Date)', required: true, type: 'date' },
      { key: 'total_followers', label: 'Total Followers', required: true, type: 'number' },
      { key: 'engagement_rate', label: 'Engagement Rate', required: false, type: 'number' },
      { key: 'impressions', label: 'Impressions', required: false, type: 'number' }
    ]
  },
  SCHOOLS: {
    model: School,
    uniqueKey: 'school_name',
    expectedFields: [
      { key: 'school_name', label: 'School Name', required: true },
      { key: 'location', label: 'Location', required: false },
      { key: 'pupil_count', label: 'Students', required: false, type: 'number' },
      { key: 'need_score', label: 'Need Score', required: false, type: 'number' },
      { key: 'readiness_score', label: 'Readiness', required: false, type: 'number' },
      { key: 'status', label: 'Status', required: false },
      { key: 'meals_delivered', label: 'Meals Delivered', required: false, type: 'number' }
    ]
  },
  SUBSCRIBERS: {
    model: Subscriber,
    uniqueKey: 'email',
    expectedFields: [
      { key: 'email', label: 'Email', required: true },
      { key: 'amount', label: 'Amount', required: true, type: 'number' },
      { key: 'name', label: 'Name', required: false },
      { key: 'plan', label: 'Plan', required: false },
      { key: 'currency', label: 'Currency', required: false },
      { key: 'channel', label: 'Channel', required: false },
      { key: 'status', label: 'Status', required: false },
      { key: 'last_payment_date', label: 'Last Payment (Date)', required: false, type: 'date' }
    ]
  },
  LEADS: {
    model: Lead,
    uniqueKey: 'lead_name',
    expectedFields: [
      { key: 'lead_name', label: 'Lead Name', required: true },
      { key: 'company', label: 'Company', required: false },
      { key: 'segment', label: 'Segment', required: false },
      { key: 'country', label: 'Country', required: false },
      { key: 'lead_source', label: 'Lead Source', required: false },
      { key: 'lead_stage', label: 'Stage', required: false },
      { key: 'rough_deal_size', label: 'Rough Deal Size', required: false, type: 'number' },
      { key: 'decision_maker_identified', label: 'Gate 1: Decision Maker Identified', required: false, type: 'boolean' },
      { key: 'deal_size_known', label: 'Gate 2: Deal Size Known', required: false, type: 'boolean' },
      { key: 'use_case_understood', label: 'Gate 3: Use Case Understood', required: false, type: 'boolean' },
      { key: 'commercial_trajectory', label: 'Gate 4: Commercial Trajectory', required: false, type: 'boolean' },
      { key: 'rep_name', label: 'Rep / Owner Name', required: false }
    ]
  }
};

// Helper to parse dates from Excel numbers or strings
function parseExcelDate(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    // Excel date serial
    return new Date(Math.round((val - 25569) * 86400 * 1000));
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// 1. ANALYZE FILE (Step 1)
router.post('/analyze', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { type } = req.body;
    const config = IMPORT_CONFIG[type];
    
    if (!config) return res.status(400).json({ success: false, message: 'Invalid import type' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    
    const sheetsData = {};
    
    sheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      // Get raw rows (up to 30 for preview)
      const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      sheetsData[sheetName] = rawData.slice(0, 30);
    });

    res.json({
      success: true,
      data: {
        sheetNames,
        expectedFields: config.expectedFields,
        sheetsData
      }
    });
  } catch (error) {
    next(error);
  }
});

// 2. VALIDATE & PREVIEW (Step 4)
router.post('/validate', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { type, sheetName, headerRowIndex, mappings } = req.body;
    const config = IMPORT_CONFIG[type];
    
    if (!config || !sheetName || headerRowIndex === undefined || !mappings) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let parsedMappings;
    try {
      parsedMappings = JSON.parse(mappings);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid mappings JSON' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) return res.status(400).json({ success: false, message: 'Sheet not found' });

    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    const headerIdx = parseInt(headerRowIndex, 10);
    
    if (rawData.length <= headerIdx) {
      return res.status(400).json({ success: false, message: 'Header row index out of bounds' });
    }

    const rawHeaders = rawData[headerIdx];
    const dataRows = rawData.slice(headerIdx + 1);

    const parsedRows = dataRows.map((row, index) => {
      const mappedRow = {};
      const errors = [];
      let hasData = false;

      rawHeaders.forEach((header, colIdx) => {
        let val = row[colIdx];
        if (val !== undefined && val !== '') hasData = true;
        
        const targetField = parsedMappings[header];
        if (targetField) {
          // Type casting based on expectedFields
          const fieldDef = config.expectedFields.find(f => f.key === targetField);
          if (fieldDef && val !== undefined && val !== '') {
            if (fieldDef.type === 'number') {
              val = Number(val.toString().replace(/[^0-9.-]+/g, ""));
              if (isNaN(val)) val = null;
            } else if (fieldDef.type === 'date') {
              val = parseExcelDate(val);
            } else if (fieldDef.type === 'boolean') {
              const str = val.toString().trim().toLowerCase();
              val = ['yes', 'true', '1', 'y'].includes(str);
            } else {
              val = val.toString().trim();
              
              // Normalize deal/lead stages if possible to avoid enum validation errors
              if (targetField === 'deal_stage') {
                const s = val.toLowerCase();
                if (s.includes('qualif')) val = 'Qualification';
                else if (s.includes('propos')) val = 'Proposal';
                else if (s.includes('negotiat')) val = 'Negotiation';
                else if (s.includes('won')) val = 'Closed Won';
                else if (s.includes('lost')) val = 'Closed Lost';
                else if (s.includes('prospect')) val = 'Prospecting';
              } else if (targetField === 'lead_stage') {
                const s = val.toLowerCase();
                if (s.includes('disqualif')) val = 'Disqualified';
                else if (s.includes('qualif')) val = 'Qualified';
                else if (s.includes('contact')) val = 'Contacted';
                else if (s.includes('discover')) val = 'Discovery';
                else if (s.includes('nurtur')) val = 'Nurture';
                else if (s.includes('new')) val = 'New';
              }
            }
          } else if (fieldDef && val === '') {
            if (fieldDef.type === 'number' || fieldDef.type === 'date') val = null;
            else if (fieldDef.type === 'boolean') val = false;
            else val = undefined; // omit empty strings to prevent overwriting with blanks and enum errors
          }
          
          if (val !== undefined) {
            mappedRow[targetField] = val;
          }
        }
      });

      if (!hasData) return null;

      // Validation check
      config.expectedFields.forEach(field => {
        if (field.required && (mappedRow[field.key] === undefined || mappedRow[field.key] === null || mappedRow[field.key] === '')) {
          errors.push(`Missing required field: ${field.label}`);
        }
      });

      return {
        _originalIndex: index + headerIdx + 1,
        data: mappedRow,
        isValid: errors.length === 0,
        errors
      };
    }).filter(r => r !== null);

    res.json({
      success: true,
      data: { rows: parsedRows }
    });
  } catch (error) {
    next(error);
  }
});

// 3. COMMIT IMPORT
router.post('/commit', async (req, res, next) => {
  try {
    const { type, rows } = req.body;
    const config = IMPORT_CONFIG[type];
    
    if (!config || !Array.isArray(rows)) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const Model = config.model;
    const users = await User.find({}).lean();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i].data;
      try {
        // Find by uniqueKey
        const query = {};
        if (row[config.uniqueKey]) {
           query[config.uniqueKey] = row[config.uniqueKey];
        } else {
           throw new Error(`Missing unique key: ${config.uniqueKey}`);
        }
        
        // Handle User references for Leads/Deals
        let repId = req.user._id;
        if (row.rep_name) {
          const repString = row.rep_name.toString().toLowerCase();
          const match = users.find(u => u.name.toLowerCase().includes(repString) || u.email.toLowerCase().includes(repString));
          if (match) repId = match._id;
          delete row.rep_name;
        }

        if (type === 'LEADS') {
           row.owner = repId;
        } else if (type === 'SALES') {
           row.assigned_to = repId;
        }

        let existingDoc = await Model.findOne(query);
        if (existingDoc) {
          Object.assign(existingDoc, row);
          await existingDoc.save();
        } else {
          // If inserting, ensure we apply the query parameters as well in case it's not in row
          await Model.create({ ...query, ...row });
        }
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push(`Row ${rows[i]._originalIndex || i+1}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `Import complete. ${successCount} imported, ${errorCount} failed.`,
      data: { successCount, errorCount, errors }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
