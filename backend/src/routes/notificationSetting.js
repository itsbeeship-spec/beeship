import express from 'express';
import { auth } from '../middlewares/auth.js';
import { getNotificationSettings, updateNotificationSettings } from '../controllers/notificationSettingController.js';
import { getActivePushBroadcast } from '../controllers/notificationAdminController.js';

const router = express.Router();

// GET /api/notification-settings (Retrieve preferences)
router.get('/', auth, getNotificationSettings);

// PUT /api/notification-settings (Update preferences)
router.put('/', auth, updateNotificationSettings);

// GET /api/notification-settings/active-push (Get active push announcement banner)
router.get('/active-push', auth, getActivePushBroadcast);

export default router;
