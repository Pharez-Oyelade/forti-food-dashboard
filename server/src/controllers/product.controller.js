import { Product } from '../models/Product.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { INVENTORY_STATUS } from '../../../shared/constants.js';

export const getSummary = async (req, res, next) => {
  try {
    const products = await Product.find({});
    let total_skus = 0, total_stock_value = 0, depleted_count = 0, expiry_risks = 0;
    let total_sell_through = 0, products_with_sell_through = 0;

    for (const p of products) {
      total_skus++;
      total_stock_value += (p.units_on_hand * p.unit_cost) || 0;
      if (p.status === INVENTORY_STATUS.DEPLETED || p.units_on_hand === 0) depleted_count++;
      if (p.status === INVENTORY_STATUS.EXPIRED || p.status === INVENTORY_STATUS.AT_RISK) expiry_risks++;
      if (p.sell_through_rate != null) {
        total_sell_through += p.sell_through_rate;
        products_with_sell_through++;
      }
    }

    res.json({
      success: true,
      data: {
        total_skus, total_stock_value, depleted_count, expiry_risks,
        avg_sell_through: products_with_sell_through > 0 ? total_sell_through / products_with_sell_through : 0,
      },
    });
  } catch (err) { next(err); }
};

export const getMovements = async (req, res, next) => {
  try {
    const movements = await InventoryMovement.find({}).populate('product', 'product_name sku').sort('-date');
    res.json({ success: true, data: movements });
  } catch (err) { next(err); }
};

export const createMovement = async (req, res, next) => {
  try {
    const movement = await InventoryMovement.create(req.body);
    const product = await Product.findById(movement.product);

    if (product) {
      const outboundTypes = ['SALE', 'DEMO', 'MARKETING', 'REGULATORY'];
      if (outboundTypes.includes(movement.type)) {
        product.units_on_hand -= movement.quantity;
        if (movement.type === 'SALE') product.units_sold_to_date += movement.quantity;

        if (product.batches?.length > 0) {
          let remaining = movement.quantity;
          product.batches.sort((a, b) => {
            if (!a.expiry_date) return 1;
            if (!b.expiry_date) return -1;
            return new Date(a.expiry_date) - new Date(b.expiry_date);
          });
          for (const batch of product.batches) {
            if (remaining <= 0) break;
            if (batch.units_on_hand > 0) {
              const deduct = Math.min(batch.units_on_hand, remaining);
              batch.units_on_hand -= deduct;
              remaining -= deduct;
            }
          }
        }
      } else if (movement.type === 'RETURN') {
        product.units_on_hand += movement.quantity;
      }
      await product.save();
    }

    res.status(201).json({ success: true, data: movement });
  } catch (err) { next(err); }
};

export const receiveStock = async (req, res, next) => {
  try {
    const { batch_number, units_received, expiry_date } = req.body;

    if (!batch_number || !units_received || units_received <= 0) {
      return res.status(400).json({ success: false, message: 'batch_number and units_received (> 0) are required' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.batches.push({ batch_number, units_received, units_on_hand: units_received, expiry_date: expiry_date || null });
    product.units_received += units_received;
    product.units_on_hand += units_received;

    await InventoryMovement.create({
      product: product._id, quantity: units_received, type: 'RECEIVE', batch_number,
      notes: `Restocked: ${units_received} units (${batch_number})${expiry_date ? ', expires ' + new Date(expiry_date).toLocaleDateString() : ''}`,
    });

    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
};

export const getExpiryTimeline = async (req, res, next) => {
  try {
    const products = await Product.find({ expiry_date: { $ne: null } })
      .sort('expiry_date')
      .select('product_name sku units_on_hand expiry_date status shelf_life_months sell_through_rate');
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
};

export const getAlerts = async (req, res, next) => {
  try {
    const products = await Product.find({}).select('product_name sku units_on_hand batches status expiry_date');
    const alerts = [];

    for (const product of products) {
      if (product.units_on_hand <= 0) {
        alerts.push({ id: `${product._id}-depleted`, type: 'DEPLETED', message: `${product.product_name} (${product.sku}) is completely out of stock.`, product_id: product._id });
      }
      if (product.status === INVENTORY_STATUS.EXPIRED) {
        alerts.push({ id: `${product._id}-expired`, type: 'EXPIRED', message: `${product.product_name} has EXPIRED. ${product.units_on_hand} units remaining.`, product_id: product._id });
      } else if (product.status === INVENTORY_STATUS.AT_RISK) {
        const daysToExpiry = product.expiry_date
          ? Math.ceil((new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
          : 999;
        alerts.push({ id: `${product._id}-risk`, type: 'AT_RISK', message: `${product.product_name} expires in ${daysToExpiry} days. ${product.units_on_hand} units at risk.`, product_id: product._id });
      }
      if (product.status === INVENTORY_STATUS.REORDER) {
        alerts.push({ id: `${product._id}-reorder`, type: 'REORDER', message: `${product.product_name} (${product.sku}) is below reorder point.`, product_id: product._id });
      }
    }

    const typeOrder = { EXPIRED: 1, DEPLETED: 2, REORDER: 3, AT_RISK: 4 };
    alerts.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

    res.json({ success: true, data: alerts });
  } catch (err) { next(err); }
};

export const listProducts = async (req, res, next) => {
  try {
    const products = await Product.find({}).sort('-createdAt');
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

export const createProduct = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (payload.units_received > 0 || payload.units_on_hand > 0 || payload.expiry_date) {
      payload.batches = [{
        batch_number: payload.batch_number || 'Initial Batch',
        units_received: payload.units_received || 0,
        units_on_hand: payload.units_on_hand || 0,
        expiry_date: payload.expiry_date || null,
      }];
    }
    const product = await Product.create(payload);
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    Object.assign(product, req.body);
    await product.save();
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
};
