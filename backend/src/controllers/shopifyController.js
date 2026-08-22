import jwt from 'jsonwebtoken';
import axios from 'axios';
import prisma from '../config/db.js';

/**
 * Initiate Shopify OAuth flow by generating redirect URL
 */
export const initiateAuth = async (req, res, next) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ success: false, message: 'Shop domain parameter is required.' });
    }

    // Validate shopify domain format
    const shopRegex = /^[a-zA-Z0-9.-]+\.myshopify\.com$/;
    if (!shopRegex.test(shop)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Shopify store domain. It must end with .myshopify.com' 
      });
    }

    const apiKey = process.env.SHOPIFY_API_KEY || 'mock-api-key';
    const redirectUri = process.env.SHOPIFY_REDIRECT_URI || 'http://localhost:5000/api/shopify/callback';
    const scopes = 'read_orders,write_orders,read_products';

    // Create a secure state token that encodes the user's ID
    const stateToken = jwt.sign(
      { userId: req.user.id }, 
      process.env.JWT_SECRET || 'super-secret-key-beeship-1234567890-secure', 
      { expiresIn: '15m' }
    );

    // Build the authorize redirect URL
    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${stateToken}`;

    // If opened directly in browser tab, redirect straight to Shopify OAuth page
    if (req.headers.accept?.includes('text/html') || req.query.redirect === 'true') {
      return res.redirect(authUrl);
    }

    res.json({
      success: true,
      authUrl
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Shopify OAuth Callback
 * Shopify redirects the user's browser here with code, shop, and state.
 */
export const callback = async (req, res, next) => {
  const { code, shop, state } = req.query;
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

  try {
    if (!code || !shop || !state) {
      throw new Error('Required authorization parameters missing.');
    }

    // Verify state token to get user ID
    let decoded;
    try {
      decoded = jwt.verify(state, process.env.JWT_SECRET || 'super-secret-key-beeship-1234567890-secure');
    } catch (err) {
      throw new Error('Security check failed: OAuth state is invalid or has expired.');
    }

    const userId = decoded.userId;

    const apiKey = process.env.SHOPIFY_API_KEY;
    const apiSecret = process.env.SHOPIFY_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('Shopify API Key or Secret is not configured on the server.');
    }

    // Exchange auth code for permanent access token
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    const response = await axios.post(tokenUrl, {
      client_id: apiKey,
      client_secret: apiSecret,
      code
    });

    const accessToken = response.data.access_token;

    if (!accessToken) {
      throw new Error('Failed to retrieve access token from Shopify.');
    }

    // Save Shopify details to the user database record
    await prisma.user.update({
      where: { id: userId },
      data: {
        shopifyShop: shop,
        shopifyAccessToken: accessToken
      }
    });

    // ─── Automatic Webhook Registration ──────────────────────────────────────────
    // Determine the base backend URL dynamically from env variables
    const backendBaseUrl = process.env.BACKEND_URL || (process.env.SHOPIFY_REDIRECT_URI || '').replace('/api/shopify/callback', '');
    const webhookAddress = `${backendBaseUrl}/api/shopify/webhooks/orders-create`;

    console.log(`🔗 Attempting to register orders/create webhook for ${shop} at ${webhookAddress}...`);

    try {
      // Register orders/create topic webhook via Shopify Admin REST API
      const webhookRegisterUrl = `https://${shop}/admin/api/2023-10/webhooks.json`;
      await axios.post(webhookRegisterUrl, {
        webhook: {
          topic: 'orders/create',
          address: webhookAddress,
          format: 'json'
        }
      }, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });
      console.log(`🟢 Successfully registered orders/create webhook for ${shop}`);
    } catch (webhookErr) {
      // In local development, if backend URL is http://localhost (not HTTPS), Shopify will reject it.
      // We wrap it in try-catch so it doesn't fail the whole connection flow.
      console.warn(
        `⚠️ Webhook registration skipped or failed for ${shop}:`,
        webhookErr.response?.data || webhookErr.message
      );
    }
    // ─────────────────────────────────────────────────────────────────────────────

    // Success redirect
    res.redirect(`${clientOrigin}/settings?tab=channels&shopify=success`);
  } catch (error) {
    console.error('Shopify OAuth Error:', error.message);
    res.redirect(`${clientOrigin}/settings?tab=channels&shopify=error&message=${encodeURIComponent(error.message)}`);
  }
};

/**
 * Get current Shopify connection status
 */
export const getStatus = async (req, res, next) => {
  try {
    // Re-query user to get fresh Shopify data (auth middleware might exclude these fields)
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { shopifyShop: true, shopifyAccessToken: true }
    });

    const isConnected = !!(user && user.shopifyShop && user.shopifyAccessToken);

    res.json({
      success: true,
      connected: isConnected,
      shop: isConnected ? user.shopifyShop : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Disconnect Shopify integration
 */
export const disconnect = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        shopifyShop: null,
        shopifyAccessToken: null
      }
    });

    res.json({
      success: true,
      message: 'Shopify store disconnected successfully.'
    });
  } catch (error) {
    next(error);
  }
};
