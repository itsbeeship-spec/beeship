import express from 'express';
import { handleDelhiveryWebhook } from '../controllers/delhiveryWebhookController.js';

const router = express.Router();

router.post('/', handleDelhiveryWebhook);

export default router;
