import crypto from 'crypto';

/**
 * Express middleware to verify Shopify's HMAC signature for webhooks
 */
export const verifyShopifyWebhook = (req, res, next) => {
  const hmacHeader = req.headers['x-shopify-hmac-sha256'];
  const shopHeader = req.headers['x-shopify-shop-domain'];

  if (!hmacHeader) {
    return res.status(401).json({ 
      success: false, 
      message: 'Missing Shopify HMAC signature header' 
    });
  }

  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    console.error('🔴 SHOPIFY_API_SECRET is not configured on the server');
    return res.status(500).json({ 
      success: false, 
      message: 'Server configuration error: Shopify API secret is missing' 
    });
  }

  const rawBody = req.rawBody;
  if (!rawBody) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing request body buffer' 
    });
  }

  // Calculate the SHA256 HMAC digest in Base64
  const generatedHash = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');

  // Verify HMAC safely to prevent timing attacks
  try {
    const a = Buffer.from(hmacHeader, 'utf8');
    const b = Buffer.from(generatedHash, 'utf8');

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid Shopify HMAC signature' 
      });
    }
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Failed to verify signature' 
    });
  }

  // Attach the shop domain to the request for the controller
  req.shopifyShop = shopHeader;
  next();
};
