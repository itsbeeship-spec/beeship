import express from 'express';
import { auth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { 
  getOrders, 
  getOrderById,
  createOrder, 
  bulkUploadOrders, 
  syncShopifyOrders, 
  updateOrderTags,
  updateOrder,
  getCouriers,
  shipOrder,
  assignVendor,
  schedulePickup,
  cancelOrders,
  submitNDRAction,
  handleWeightDiscrepancy,
  updateWeightDiscrepancyAction,
  orderSchema, 
  bulkOrdersSchema,
  getPublicOrderTracking
} from '../controllers/orderController.js';

const router = express.Router();

// GET /api/orders/public/track (Public endpoint — no auth required)
router.get('/public/track', getPublicOrderTracking);

// POST /api/orders/weight-discrepancy (Record weight discrepancy for orders)
router.post('/weight-discrepancy', handleWeightDiscrepancy);

// Apply auth middleware to protect all other order routes
router.use(auth);

// POST /api/orders/weight-action (Accept charge or raise dispute on weight discrepancy)
router.post('/weight-action', updateWeightDiscrepancyAction);

// GET /api/orders
router.get('/', getOrders);

// GET /api/orders/couriers (Get available courier partners)
router.get('/couriers', getCouriers);

// GET /api/orders/:id (Get single order details)
router.get('/:id', getOrderById);

// POST /api/orders (Create single order)
router.post('/', validate(orderSchema), createOrder);

// PUT /api/orders/:id (Update single order)
router.put('/:id', validate(orderSchema), updateOrder);

// POST /api/orders/bulk (Bulk upload orders)
router.post('/bulk', validate(bulkOrdersSchema), bulkUploadOrders);

// POST /api/orders/sync-shopify (Simulate Shopify sync)
router.post('/sync-shopify', syncShopifyOrders);

// PATCH /api/orders/:id/tags (Update order tags)
router.patch('/:id/tags', updateOrderTags);

// POST /api/orders/:id/ship (Ship single order)
router.post('/:id/ship', shipOrder);

// POST /api/orders/assign-vendor (Assign vendor to orders)
router.post('/assign-vendor', assignVendor);

// POST /api/orders/schedule-pickup (Schedule pickup for orders)
router.post('/schedule-pickup', schedulePickup);

// POST /api/orders/cancel (Cancel orders in bulk or single)
router.post('/cancel', cancelOrders);

// POST /api/orders/ndr-action (Submit NDR instruction for re-attempt or RTO)
router.post('/ndr-action', submitNDRAction);

export default router;

