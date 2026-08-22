import express from 'express';
import { auth } from '../middlewares/auth.js';
import { isAdmin } from '../middlewares/isAdmin.js';
import {
  getFeaturedCoupon,
  validateCoupon,
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/couponController.js';

const router = express.Router();

// Public / Seller Endpoints (requires login)
router.get('/featured', auth, getFeaturedCoupon);
router.post('/validate', auth, validateCoupon);

// Super Admin CRUD Endpoints
router.get('/admin/list', auth, isAdmin, getAdminCoupons);
router.post('/admin/create', auth, isAdmin, createCoupon);
router.put('/admin/:id', auth, isAdmin, updateCoupon);
router.delete('/admin/:id', auth, isAdmin, deleteCoupon);

export default router;
