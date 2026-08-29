import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { fieldFilter } from '../middleware/fieldFilter.js';
import { createProductSchema, updateProductSchema } from '../validators/product.validators.js';
import { ACCESS_LEVELS, SECTIONS } from '../../../shared/constants.js';
import * as product from '../controllers/product.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(SECTIONS.INVENTORY, ACCESS_LEVELS.VIEW));

router.get('/summary', fieldFilter(SECTIONS.INVENTORY), product.getSummary);
router.get('/movements', fieldFilter(SECTIONS.INVENTORY), product.getMovements);
router.post('/movements', authorize(SECTIONS.INVENTORY, ACCESS_LEVELS.EDIT), product.createMovement);
router.post('/:id/receive-stock', authorize(SECTIONS.INVENTORY, ACCESS_LEVELS.EDIT), product.receiveStock);
router.get('/expiry-timeline', fieldFilter(SECTIONS.INVENTORY), product.getExpiryTimeline);
router.get('/alerts', fieldFilter(SECTIONS.INVENTORY), product.getAlerts);
router.get('/', fieldFilter(SECTIONS.INVENTORY), product.listProducts);
router.get('/:id', fieldFilter(SECTIONS.INVENTORY), product.getProduct);
router.post('/', authorize(SECTIONS.INVENTORY, ACCESS_LEVELS.EDIT), validate(createProductSchema), product.createProduct);
router.put('/:id', authorize(SECTIONS.INVENTORY, ACCESS_LEVELS.EDIT), validate(updateProductSchema), product.updateProduct);
router.delete('/:id', authorize(SECTIONS.INVENTORY, ACCESS_LEVELS.FULL), product.deleteProduct);

export default router;
