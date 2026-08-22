import express from 'express';
import { auth } from '../middlewares/auth.js';
import { getInvoiceSettings, updateInvoiceSettings } from '../controllers/invoiceSettingController.js';

const router = express.Router();

// GET /api/invoice-settings (Retrieve settings)
router.get('/', auth, getInvoiceSettings);

// PUT /api/invoice-settings (Update settings)
router.put('/', auth, updateInvoiceSettings);

export default router;
