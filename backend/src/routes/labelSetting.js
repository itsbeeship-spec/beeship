import express from 'express';
import { auth } from '../middlewares/auth.js';
import { getLabelSettings, updateLabelSettings } from '../controllers/labelSettingController.js';

const router = express.Router();

// GET /api/label-settings (Retrieve preferences)
router.get('/', auth, getLabelSettings);

// PUT /api/label-settings (Update preferences)
router.put('/', auth, updateLabelSettings);

export default router;
