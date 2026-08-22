import express from 'express';
import { auth } from '../middlewares/auth.js';
import { initiateAuth, callback, getStatus, disconnect } from '../controllers/shopifyController.js';
import { verifyShopifyWebhook } from '../middlewares/shopifyWebhookMiddleware.js';
import { handleOrderCreateWebhook } from '../controllers/shopifyWebhookController.js';

const router = express.Router();

// Public callback route (Shopify redirects browser here, authenticated via 'state' query param)
router.get('/callback', callback);

// Shopify Webhook Endpoint (HMAC verified, publicly accessible for Shopify calls)
router.post('/webhooks/orders-create', verifyShopifyWebhook, handleOrderCreateWebhook);

// Protected routes (require user login session/token)
router.get('/auth', auth, initiateAuth);
router.get('/status', auth, getStatus);
router.post('/disconnect', auth, disconnect);

export default router;
