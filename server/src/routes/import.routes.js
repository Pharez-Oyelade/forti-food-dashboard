import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { Deal } from '../models/Deal.js';
import { Product } from '../models/Product.js';
import { InstagramMetric } from '../models/InstagramMetric.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ACCESS_LEVELS, SECTIONS } from '../../../shared/constants.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

// Target sheets and start rows (where actual headers are)
const SHEET_CONFIG = {
  SALES: {
    sheetName: '2.  QUALIFIED PIPELINE TRACKER  –  Beyond Discovery Only',
    headerRow: 2, // 1-indexed, so row 2
    mapKeys: { dealname: 'deal_name', account: 'company', stage: 'deal_stage', value: 'value_naira', segment: 'segment' }
  },
  INVENTORY: {
    sheetName: '2. Stock by SKU',
    headerRow: 2, // "SKU | Category | Received B1..."
    mapKeys: { sku: 'sku', productname: 'product_name', category: 'category', onhand: 'units_on_hand' }
  },
  SOCIAL: {
    sheetName: 'Weekly Log',
    headerRow: 2, // "Week Ending | Total Followers..."
    mapKeys: { weekending: 'week_ending', totalfollowers: 'total_followers', engagementrate: 'engagement_rate' }
  }
};

function normalizeHeader(h) {
  if (!h) return '';
  return h.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

// 1. PREVIEW IMPORT (Accepts .xlsx via multipart)
router.post('/preview', authorize(SECTIONS.USER_MGMT, ACCESS_LEVELS.FULL), upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { type } = req.body;
    const config = SHEET_CONFIG[type];
    
    if (!config) {
      return res.status(400).json({ success: false, message: 'Invalid import type' });
    }

    // Read the workbook from buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    
    // Find the exact sheet or a closely matching one
    const sheetName = workbook.SheetNames.find(s => s.trim() === config.sheetName) || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      return res.status(400).json({ success: false, message: `Could not find sheet: ${config.sheetName}` });
    }

    // Convert sheet to JSON array of arrays
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    // Find headers (adjust for 0-index)
    const headerRowIdx = config.headerRow - 1;
    if (rawData.length <= headerRowIdx) {
      return res.status(400).json({ success: false, message: 'File is too short or empty' });
    }

    const rawHeaders = rawData[headerRowIdx];
    const dataRows = rawData.slice(headerRowIdx + 1);

    // Build mapping dictionary
    const mapping = {};
    rawHeaders.forEach((h, i) => {
      const norm = normalizeHeader(h);
      // Check predefined mapKeys
      for (const [key, dbField] of Object.entries(config.mapKeys)) {
        if (norm.includes(key)) {
          mapping[h] = dbField;
          break;
        }
      }
      // Fallbacks
      if (!mapping[h] && norm) {
        if (norm.includes('price')) mapping[h] = 'unit_price';
        if (norm.includes('cost')) mapping[h] = 'unit_cost';
        if (norm.includes('probability')) mapping[h] = 'probability_pct';
      }
    });

    const parsedRows = dataRows.map((row, index) => {
      const mappedRow = {};
      const errors = [];
      let hasData = false;

      rawHeaders.forEach((header, idx) => {
        const val = row[idx];
        if (val !== undefined && val !== '') hasData = true;
        if (mapping[header]) {
          mappedRow[mapping[header]] = val.toString().trim();
        }
      });

      if (!hasData) return null; // skip empty rows

      // Basic Validation based on type
      if (type === 'SALES') {
        if (!mappedRow.deal_name && !mappedRow.company) errors.push('Missing Deal Name or Company');
        if (mappedRow.value_naira) {
          mappedRow.value_naira = Number(mappedRow.value_naira.replace(/[^0-9.-]+/g,""));
        }
      } else if (type === 'INVENTORY') {
        if (!mappedRow.sku) errors.push('Missing SKU');
        if (mappedRow.units_on_hand) {
          mappedRow.units_on_hand = Number(mappedRow.units_on_hand.toString().replace(/[^0-9.-]+/g,""));
        }
      }

      return {
        _originalIndex: index + config.headerRow + 1, // Excel row number (1-based + headers)
        data: mappedRow,
        isValid: errors.length === 0,
        errors
      };
    }).filter(r => r !== null);

    res.json({
      success: true,
      data: {
        sheetTargeted: sheetName,
        headers: rawHeaders,
        mappedHeaders: mapping,
        rows: parsedRows
      }
    });
  } catch (error) {
    next(error);
  }
});

// 2. COMMIT IMPORT
router.post('/commit', authorize(SECTIONS.USER_MGMT, ACCESS_LEVELS.FULL), async (req, res, next) => {
  try {
    const { type, rows } = req.body;
    if (!SHEET_CONFIG[type] || !Array.isArray(rows)) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i].data;
      try {
        if (type === 'SALES') {
          await Deal.findOneAndUpdate(
            { deal_name: row.deal_name || "Unknown Deal", company: row.company },
            { $set: row },
            { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
          );
        } else if (type === 'INVENTORY') {
          await Product.findOneAndUpdate(
            { sku: row.sku },
            { $set: row },
            { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
          );
        } else if (type === 'SOCIAL') {
          await InstagramMetric.findOneAndUpdate(
            { week_ending: new Date(row.week_ending) },
            { $set: row },
            { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
          );
        }
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push(`Row ${rows[i]._originalIndex || i+1}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `Import complete. ${successCount} imported successfully. ${errorCount} failed.`,
      data: { successCount, errorCount, errors }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
