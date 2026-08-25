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
  orderSchema, 
  bulkOrdersSchema 
} from '../controllers/orderController.js';

const router = express.Router();

// Apply auth middleware to protect all order routes
router.use(auth);

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

export default router;
