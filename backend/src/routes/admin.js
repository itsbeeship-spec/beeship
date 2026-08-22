import express from 'express';
import { validate } from '../middlewares/validate.js';
import { auth } from '../middlewares/auth.js';
import { isAdmin } from '../middlewares/isAdmin.js';
import { isSuperAdmin } from '../middlewares/isSuperAdmin.js';
import {
  getPendingKyc,
  updateKycStatus,
  verifyKycSchema,
  listStaff,
  createStaff,
  createStaffSchema,
  deleteStaff,
  updateStaffRole,
  getDashboardStats,
  listSellers,
  getSellerDetails,
  updateSellerProfile,
  toggleSellerStatus,
  resetSellerPassword,
  forceLogoutSeller,
  deleteSellerAccount,
  listAdmins,
  createAdmin,
  updateAdmin,
  toggleAdminStatus,
  changeAdminRole,
  forceLogoutAdmin,
  deleteAdminAccount,
  getAdminOrders,
  getAdminOrderDetails,
  updateAdminOrderStatus,
  cancelAdminOrder,
  reassignAdminOrderCourier,
  retryAdminOrderShipment,
  getAdminCouriers,
  toggleAdminCourierStatus,
  getAdminRules,
  createAdminRule,
  toggleAdminRule,
  deleteAdminRule,
  getAdminTransactions,
  adjustAdminWallet,
  getAdminPayouts,
  createAdminPayout,
  getAdminFinanceStats,
} from '../controllers/adminController.js';
import {
  listActivityLogs,
  getActivityLog,
  getActivityLogFilters,
} from '../controllers/activityLogController.js';
import {
  updateBillingRate,
  getAdminMerchants,
  getMerchantBillingRates,
  updateMerchantBillingRate,
} from '../controllers/billingController.js';
import {
  getGlobalNotificationSettings,
  updateGlobalNotificationSettings,
  getNotificationTemplates,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
  getBroadcastLogs,
  createBroadcast,
  updateBroadcast,
  deleteBroadcast,
  sendTestNotification,
} from '../controllers/notificationAdminController.js';
import {
  getRevenueReport,
  getSellersReport,
  getOrdersReport,
  getShipmentsReport,
  getCouriersReport,
  getWalletReport,
  getCODReport,
  getNDRReport,
  getRTOReport,
  getSupportReport,
} from '../controllers/reportsAdminController.js';
import {
  getAdminSupportTickets,
  updateAdminSupportTicket,
  getAdminLiveChatQueue,
  getAdminAssignRules,
  updateAdminAssignRules,
  getAdminSupportReports,
} from '../controllers/supportAdminController.js';

const router = express.Router();

router.use(auth);

// ─── Admin routes (ADMIN + SUPER_ADMIN) ────────────────────────────────────

// Admin Stats
router.get('/dashboard/stats', isAdmin, getDashboardStats);

// Admin KYC Management APIs
router.get('/kyc/pending', isAdmin, getPendingKyc);
router.put('/kyc/:userId/verify', isAdmin, validate(verifyKycSchema), updateKycStatus);

router.get('/orders', isAdmin, getAdminOrders);
router.get('/orders/:id', isAdmin, getAdminOrderDetails);
router.put('/orders/:id/status', isAdmin, updateAdminOrderStatus);
router.post('/orders/:id/cancel', isAdmin, cancelAdminOrder);
router.put('/orders/:id/reassign', isAdmin, reassignAdminOrderCourier);
router.post('/orders/:id/retry', isAdmin, retryAdminOrderShipment);

// Admin Courier & Rules APIs
router.get('/couriers', isAdmin, getAdminCouriers);
router.put('/couriers/:courierName/toggle', isAdmin, toggleAdminCourierStatus);
router.get('/rules', isAdmin, getAdminRules);
router.post('/rules', isAdmin, createAdminRule);
router.put('/rules/:id/toggle', isAdmin, toggleAdminRule);
router.delete('/rules/:id', isAdmin, deleteAdminRule);

// Admin Billing Rates APIs
router.put('/billing/rates/:id', isAdmin, updateBillingRate);
router.get('/billing/merchants', isAdmin, getAdminMerchants);
router.get('/billing/rates/merchant/:userId', isAdmin, getMerchantBillingRates);
router.put('/billing/rates/merchant/:userId', isAdmin, updateMerchantBillingRate);

// Admin Wallet & Settlement Payout APIs
router.get('/finance/transactions', isAdmin, getAdminTransactions);
router.post('/finance/wallet/adjust', isAdmin, adjustAdminWallet);
router.get('/finance/payouts', isAdmin, getAdminPayouts);
router.post('/finance/payouts', isAdmin, createAdminPayout);
router.get('/finance/stats', isAdmin, getAdminFinanceStats);

// Sellers Management APIs (ADMIN + SUPER_ADMIN general view/edit)
router.get('/sellers', isAdmin, listSellers);
router.get('/sellers/:userId', isAdmin, getSellerDetails);
router.put('/sellers/:userId', isAdmin, updateSellerProfile);

// ─── Notification Settings & Management APIs ─────────────────────────────
router.get('/notifications/settings', isAdmin, getGlobalNotificationSettings);
router.put('/notifications/settings', isAdmin, updateGlobalNotificationSettings);
router.get('/notifications/templates', isAdmin, getNotificationTemplates);
router.post('/notifications/templates', isAdmin, createNotificationTemplate);
router.put('/notifications/templates/:id', isAdmin, updateNotificationTemplate);
router.delete('/notifications/templates/:id', isAdmin, deleteNotificationTemplate);
router.get('/notifications/broadcast', isAdmin, getBroadcastLogs);
router.post('/notifications/broadcast', isAdmin, createBroadcast);
router.put('/notifications/broadcast/:id', isAdmin, updateBroadcast);
router.delete('/notifications/broadcast/:id', isAdmin, deleteBroadcast);
router.post('/notifications/test-send', isAdmin, sendTestNotification);

// ─── Reports & Analytics APIs ───────────────────────────────────────────────
router.get('/reports/revenue', isAdmin, getRevenueReport);
router.get('/reports/sellers', isAdmin, getSellersReport);
router.get('/reports/orders', isAdmin, getOrdersReport);
router.get('/reports/shipments', isAdmin, getShipmentsReport);
router.get('/reports/couriers', isAdmin, getCouriersReport);
router.get('/reports/wallet', isAdmin, getWalletReport);
router.get('/reports/cod', isAdmin, getCODReport);
router.get('/reports/ndr', isAdmin, getNDRReport);
router.get('/reports/rto', isAdmin, getRTOReport);
router.get('/reports/support', isAdmin, getSupportReport);

// ─── Support Center APIs ────────────────────────────────────────────────────
router.get('/support/tickets', isAdmin, getAdminSupportTickets);
router.put('/support/tickets/:id', isAdmin, updateAdminSupportTicket);
router.get('/support/chat', isAdmin, getAdminLiveChatQueue);
router.get('/support/assign-rules', isAdmin, getAdminAssignRules);
router.put('/support/assign-rules', isAdmin, updateAdminAssignRules);
router.get('/support/reports', isAdmin, getAdminSupportReports);

// ─── SUPER_ADMIN only routes ────────────────────────────────────────────────

// Staff Management APIs
router.get('/staff', isSuperAdmin, listStaff);
router.post('/staff', isSuperAdmin, validate(createStaffSchema), createStaff);
router.delete('/staff/:staffId', isSuperAdmin, deleteStaff);
router.patch('/staff/:staffId/role', isSuperAdmin, updateStaffRole);

// Seller Account Controls (SUPER_ADMIN only)
router.patch('/sellers/:userId/status', isSuperAdmin, toggleSellerStatus);
router.patch('/sellers/:userId/reset-password', isSuperAdmin, resetSellerPassword);
router.post('/sellers/:userId/force-logout', isSuperAdmin, forceLogoutSeller);
router.delete('/sellers/:userId', isSuperAdmin, deleteSellerAccount);

// Admin Account Controls (SUPER_ADMIN only)
router.get('/admins', isSuperAdmin, listAdmins);
router.post('/admins', isSuperAdmin, createAdmin);
router.put('/admins/:adminId', isSuperAdmin, updateAdmin);
router.patch('/admins/:adminId/status', isSuperAdmin, toggleAdminStatus);
router.patch('/admins/:adminId/role', isSuperAdmin, changeAdminRole);
router.post('/admins/:adminId/force-logout', isSuperAdmin, forceLogoutAdmin);
router.delete('/admins/:adminId', isSuperAdmin, deleteAdminAccount);

// Activity Logs (SUPER_ADMIN only)
router.get('/activity-logs', isSuperAdmin, listActivityLogs);
router.get('/activity-logs/filters', isSuperAdmin, getActivityLogFilters);
router.get('/activity-logs/:id', isSuperAdmin, getActivityLog);

export default router;

