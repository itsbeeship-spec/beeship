import express from 'express';
import { auth } from '../middlewares/auth.js';
import {
  getBillingRates,
  calculateB2CShippingCost,
  getWalletTransactions,
  addRechargeTransaction,
  getPayouts,
} from '../controllers/billingController.js';
import {
  createRazorpayOrder,
  verifyRazorpayPayment
} from '../controllers/razorpayController.js';

const router = express.Router();

router.get('/rates', auth, getBillingRates);
router.post('/calculator', auth, calculateB2CShippingCost);
router.get('/transactions', auth, getWalletTransactions);
router.post('/recharge', auth, addRechargeTransaction);
router.get('/payouts', auth, getPayouts);

// Razorpay Wallet integration endpoints
router.post('/razorpay/create-order', auth, createRazorpayOrder);
router.post('/razorpay/verify-payment', auth, verifyRazorpayPayment);

export default router;
