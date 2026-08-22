import prisma from '../config/db.js';

/**
 * Handles Shopify orders/create webhook callback.
 * Real-time order creation event from Shopify.
 */
export const handleOrderCreateWebhook = async (req, res, next) => {
  const shopifyOrder = req.body;
  const shopDomain = req.shopifyShop || req.headers['x-shopify-shop-domain'];

  try {
    if (!shopDomain) {
      console.warn('⚠️ Webhook received but X-Shopify-Shop-Domain header is missing.');
      return res.status(400).json({ success: false, message: 'Shop domain header missing.' });
    }

    console.log(`📥 Received orders/create webhook for shop: ${shopDomain}, Order ID: ${shopifyOrder.id}`);

    // 1. Locate the registered user linked to this Shopify shop
    const user = await prisma.user.findFirst({
      where: { shopifyShop: shopDomain },
      select: { id: true }
    });

    if (!user) {
      console.warn(`⚠️ Shopify Webhook: No registered user found matching shop: ${shopDomain}. Skipping.`);
      // Return 200 so Shopify knows we processed it and doesn't retry/disable the webhook
      return res.status(200).json({ success: true, message: 'Shop not registered in our system.' });
    }

    const userPrefix = user.id.slice(-4);
    const orderNum = shopifyOrder.order_number || shopifyOrder.id;
    const uniqueOrderId = `SHPFY-${userPrefix}-${orderNum}`;

    // 2. Check if the order has already been synchronized previously
    const existingOrder = await prisma.order.findUnique({
      where: { orderId: uniqueOrderId }
    });

    if (existingOrder) {
      console.log(`ℹ️ Shopify Webhook: Order ${uniqueOrderId} already exists in database. Skipping duplicate.`);
      return res.status(200).json({ success: true, message: 'Order already synchronized.' });
    }

    // 3. Extract customer, products and address details
    const customerName = [
      shopifyOrder.customer?.first_name,
      shopifyOrder.customer?.last_name
    ].filter(Boolean).join(' ').trim() || shopifyOrder.billing_address?.name || 'Shopify Customer';

    const productNames = shopifyOrder.line_items?.map(item => item.title).join(', ') || 'Shopify Product';

    // Detect Cash on Delivery (COD) payment method
    const gateway = (shopifyOrder.gateway || '').toLowerCase();
    const paymentGatewayNames = (shopifyOrder.payment_gateway_names || []).map(g => g.toLowerCase());
    const isCOD = gateway.includes('cash') || gateway.includes('cod') || paymentGatewayNames.some(g => g.includes('cash') || g.includes('cod'));
    const method = isCOD ? 'COD' : 'Prepaid';

    const shipAddr = shopifyOrder.shipping_address || shopifyOrder.billing_address || {};
    const billAddr = shopifyOrder.billing_address || shipAddr;

    const shippingCharges = shopifyOrder.shipping_lines ? shopifyOrder.shipping_lines.reduce((total, line) => total + parseFloat(line.price || '0.0'), 0) : 0.0;
    const discount = parseFloat(shopifyOrder.total_discounts || '0.0');
    const taxAmount = parseFloat(shopifyOrder.total_tax || '0.0');

    // 4. Save mapped order into the local Postgres database
    const savedOrder = await prisma.order.create({
      data: {
        orderId: uniqueOrderId,
        userId: user.id,
        customer: customerName,
        product: productNames.substring(0, 199),
        amount: parseFloat(shopifyOrder.total_price || '0.0'),
        status: 'unfulfilled',
        method,
        phone: shipAddr.phone || shopifyOrder.customer?.phone || '',
        address: [shipAddr.address1, shipAddr.address2].filter(Boolean).join(', '),
        pincode: shipAddr.zip || '',
        city: shipAddr.city || '',
        state: shipAddr.province || '',
        billingSame: false,
        billingAddress: [billAddr.address1, billAddr.address2].filter(Boolean).join(', '),
        billingPhone: billAddr.phone || '',
        billingPincode: billAddr.zip || '',
        billingCity: billAddr.city || '',
        billingState: billAddr.province || '',
        products: shopifyOrder.line_items ? shopifyOrder.line_items.map(item => ({
          name: item.title,
          price: parseFloat(item.price || '0.0'),
          quantity: item.quantity,
          sku: item.sku || ''
        })) : null,
        shippingCharges,
        discount,
        taxAmount,
        weight: shopifyOrder.total_weight ? parseFloat(shopifyOrder.total_weight) / 1000 : 0.5, // Convert grams to KG
        tags: ['Shopify', 'Webhook', ...(shopifyOrder.tags ? shopifyOrder.tags.split(',').map(t => t.trim()) : [])],
        collectableAmount: method === 'COD' ? parseFloat(shopifyOrder.total_price || '0.0') : 0.0
      }
    });

    console.log(`🟢 Successfully saved order ${uniqueOrderId} to database in real-time.`);

    res.status(200).json({
      success: true,
      message: 'Webhook processed and order saved successfully.',
      order: savedOrder
    });
  } catch (error) {
    console.error('🔴 Shopify Webhook Processing Error:', error.message);
    // Even if it fails, return 200 to prevent webhook throttling, but log the stack trace
    res.status(200).json({ success: false, error: error.message });
  }
};
