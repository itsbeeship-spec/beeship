import express from 'express';
import { auth } from '../middlewares/auth.js';
import {
  getMerchantAnalytics,
  exportMerchantReportCsv,
  getMerchantExportOrders
} from '../controllers/reportsController.js';

const router = express.Router();

router.use(auth);

// GET /api/reports/analytics
router.get('/analytics', getMerchantAnalytics);

// GET /api/reports/export-orders
router.get('/export-orders', getMerchantExportOrders);

// GET /api/reports/export
router.get('/export', exportMerchantReportCsv);

export default router;
