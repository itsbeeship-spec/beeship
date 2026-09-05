import express from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import documentsRouter from './documents.js';
import ordersRouter from './orders.js';
import adminRouter from './admin.js';
import billingRouter from './billing.js';
import warehouseRouter from './warehouse.js';
import shopifyRouter from './shopify.js';
import invoiceSettingRouter from './invoiceSetting.js';
import labelSettingRouter from './labelSetting.js';
import notificationSettingRouter from './notificationSetting.js';
import autoAssignRuleRouter from './autoAssignRule.js';
import delhiveryWebhookRouter from './delhiveryWebhook.js';
import couponRouter from './couponRoutes.js';
import sellerSupportRouter from './sellerSupport.js';
import reportsRouter from './reports.js';

const router = express.Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/documents', documentsRouter);
router.use('/orders', ordersRouter);
router.use('/admin', adminRouter);
router.use('/billing', billingRouter);
router.use('/warehouse', warehouseRouter);
router.use('/shopify', shopifyRouter);
router.use('/invoice-settings', invoiceSettingRouter);
router.use('/label-settings', labelSettingRouter);
router.use('/notification-settings', notificationSettingRouter);
router.use('/auto-assign-rules', autoAssignRuleRouter);
router.use('/webhooks/delhivery', delhiveryWebhookRouter);
router.use('/coupons', couponRouter);
router.use('/support', sellerSupportRouter);
router.use('/reports', reportsRouter);

export default router;

