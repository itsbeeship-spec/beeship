import { z } from 'zod';
import axios from 'axios';
import prisma from '../config/db.js';
import redis from '../config/redis.js';
import * as shippingService from '../services/shippingService.js';
import { getDownloadPresignedUrl } from '../config/s3.js';
import { sendOrderStatusNotification } from '../services/notificationService.js';
import { updateShopifyOrderFulfillment } from './shopifyController.js';

// Helper to safely generate concurrent-safe unique order IDs
const generateUniqueOrderId = async () => {
  let orderSeq;
  if (redis && redis.status === 'ready') {
    const exists = await redis.exists('beeship:counters:order_seq');
    if (!exists) {
      const totalCount = await prisma.order.count();
      await redis.setnx('beeship:counters:order_seq', 9800 + totalCount);
    }
    orderSeq = await redis.incr('beeship:counters:order_seq');
  } else {
    const totalCount = await prisma.order.count();
    const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    orderSeq = `${9800 + totalCount + 1}-${randHex}`;
  }
  return `ORD-${orderSeq}`;
};

// Helper to safely generate multiple concurrent-safe unique order IDs in bulk
const generateUniqueOrderIds = async (count) => {
  const ids = [];
  if (redis && redis.status === 'ready') {
    const exists = await redis.exists('beeship:counters:order_seq');
    if (!exists) {
      const totalCount = await prisma.order.count();
      await redis.setnx('beeship:counters:order_seq', 9800 + totalCount);
    }
    for (let i = 0; i < count; i++) {
      const orderSeq = await redis.incr('beeship:counters:order_seq');
      ids.push(`ORD-${orderSeq}`);
    }
  } else {
    const totalCount = await prisma.order.count();
    const randSeed = Math.random().toString(36).substring(2, 6).toUpperCase();
    let currentId = 9800 + totalCount + 1;
    for (let i = 0; i < count; i++) {
      ids.push(`ORD-${currentId++}-${randSeed}-${i}`);
    }
  }
  return ids;
};

// Helper to sign private S3 labelUrl
const signOrderLabelUrl = async (order) => {
  if (!order || !order.labelUrl) return order;
  if (order.labelUrl.includes("X-Amz-Signature") || order.labelUrl.includes("AWSAccessKeyId")) {
    return order;
  }
  const match = order.labelUrl.match(/amazonaws\.com\/(.+)$/);
  const key = match ? match[1] : null;
  if (key) {
    try {
      order.labelUrl = await getDownloadPresignedUrl(key, 86400);
    } catch (err) {
      console.error("Error signing S3 label key:", key, err);
    }
  }
  return order;
};

// Validation schemas for order requests
export const orderSchema = z.object({
  body: z.object({
    customer: z.string().min(2, 'Customer name must be at least 2 characters long').max(100).trim(),
    product: z.string().min(2, 'Product description must be at least 2 characters').max(200).trim(),
    amount: z.number().nonnegative('Order amount must be non-negative'),
    status: z.enum(['fulfilled', 'unfulfilled', 'cancelled']).default('unfulfilled'),
    method: z.enum(['COD', 'Prepaid']).default('COD'),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    pincode: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    companyName: z.string().optional().nullable(),
    gstNumber: z.string().optional().nullable(),
    billingSame: z.boolean().optional().nullable(),
    billingAddress: z.string().optional().nullable(),
    billingPhone: z.string().optional().nullable(),
    billingPincode: z.string().optional().nullable(),
    billingCity: z.string().optional().nullable(),
    billingState: z.string().optional().nullable(),
    billingCompanyName: z.string().optional().nullable(),
    billingGstNumber: z.string().optional().nullable(),
    products: z.any().optional().nullable(),
    shippingCharges: z.number().optional().nullable(),
    codCharges: z.number().optional().nullable(),
    discount: z.number().optional().nullable(),
    taxAmount: z.number().optional().nullable(),
    weight: z.number().optional().nullable(),
    length: z.string().optional().nullable(),
    breadth: z.string().optional().nullable(),
    height: z.string().optional().nullable(),
    collectableAmount: z.number().optional().nullable(),
  }),
});

export const bulkOrdersSchema = z.object({
  body: z.object({
    orders: z.array(
      z.object({
        customer: z.string().min(2).max(100).trim(),
        product: z.string().min(2).max(200).trim(),
        amount: z.number().positive(),
        status: z.enum(['fulfilled', 'unfulfilled', 'cancelled']).default('unfulfilled'),
        method: z.enum(['COD', 'Prepaid']).default('COD'),
      })
    ).min(1, 'At least one order must be provided for upload'),
  }),
});

/**
 * Get all orders
 */
export const getOrders = async (req, res, next) => {
  try {
    const {
      search,
      status,
      start_date,
      end_date,
      method,
      vendor,
      channel,
      sort = 'createdAt',
      order = 'desc',
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skipNum = (pageNum - 1) * limitNum;

    // Build Prisma query condition
    const where = {
      userId: req.user.id,
    };

    // 1. Search filter
    if (search) {
      const searchLower = search.trim();
      where.OR = [
        { customer: { contains: searchLower, mode: 'insensitive' } },
        { product: { contains: searchLower, mode: 'insensitive' } },
        { orderId: { contains: searchLower, mode: 'insensitive' } },
      ];
    }

    // 2. Status filter
    if (status && status !== 'all') {
      if (status === 'unfulfilled') {
        where.status = 'unfulfilled';
      } else if (status === 'booked') {
        where.status = { in: ['fulfilled', 'booked'] };
      } else if (status === 'shipped') {
        where.status = { not: 'unfulfilled' };
      } else if (status === 'cancelled') {
        where.status = 'cancelled';
      } else {
        where.status = status;
      }
    } else {
      // Default for Orders Page ("All Orders" tab): Exclude active transit/delivered/completed shipments
      where.status = {
        notIn: ['in transit', 'out for delivery', 'delivered', 'ndr', 'rto']
      };
    }

    // 3. Method (Payment Method) filter
    if (method && method !== 'all') {
      where.method = method;
    }

    // 4. Vendor filter
    if (vendor && vendor !== 'all') {
      where.vendor = { contains: vendor, mode: 'insensitive' };
    }

    // 5. Channel filter
    if (channel && channel !== 'all') {
      if (channel === 'manual') {
        where.tags = { has: 'Manual' };
      } else if (channel === 'shopify') {
        where.NOT = {
          tags: { has: 'Manual' },
        };
      }
    }

    // 6. Date Range filter
    if (start_date || end_date) {
      where.createdAt = {};
      if (start_date) {
        where.createdAt.gte = new Date(start_date);
      }
      if (end_date) {
        const end = new Date(end_date);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // 7. Validate sort column
    const allowedSortFields = ['createdAt', 'amount', 'customer', 'product', 'orderId', 'status'];
    const orderByField = allowedSortFields.includes(sort) ? sort : 'createdAt';
    const orderByOrder = ['asc', 'desc'].includes(order.toLowerCase()) ? order.toLowerCase() : 'desc';

    // 8. Execute queries concurrently
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { [orderByField]: orderByOrder },
        skip: skipNum,
        take: limitNum,
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);
    const signedOrders = await Promise.all(orders.map(o => signOrderLabelUrl(o)));

    res.json({
      success: true,
      data: signedOrders,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single order by orderId
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findFirst({
      where: {
        orderId: id,
        userId: req.user.id
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const signedOrder = await signOrderLabelUrl(order);
    res.status(200).json({
      success: true,
      data: signedOrder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a single custom order
 */
export const createOrder = async (req, res, next) => {
  const { 
    customer, product, amount, status, method,
    phone, address, pincode, city, state, companyName, gstNumber,
    billingSame, billingAddress, billingPhone, billingPincode, billingCity, billingState, billingCompanyName, billingGstNumber,
    products, shippingCharges, codCharges, discount, taxAmount, weight, length, breadth, height, collectableAmount
  } = req.body;

  try {
    const orderId = await generateUniqueOrderId();

    const order = await prisma.order.create({
      data: {
        orderId,
        userId: req.user.id,
        customer,
        product,
        amount,
        status,
        method,
        phone,
        address,
        pincode,
        city,
        state,
        companyName,
        gstNumber,
        billingSame: billingSame !== undefined ? billingSame : true,
        billingAddress,
        billingPhone,
        billingPincode,
        billingCity,
        billingState,
        billingCompanyName,
        billingGstNumber,
        products: products ? JSON.parse(JSON.stringify(products)) : null,
        shippingCharges: shippingCharges || 0.0,
        codCharges: codCharges || 0.0,
        discount: discount || 0.0,
        taxAmount: taxAmount || 0.0,
        weight: weight || 0.0,
        length,
        breadth,
        height,
        collectableAmount: collectableAmount || 0.0
      },
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk upload orders
 */
export const bulkUploadOrders = async (req, res, next) => {
  const { orders } = req.body;

  try {
    const orderIds = await generateUniqueOrderIds(orders.length);

    const formattedOrders = orders.map((o, idx) => ({
      orderId: orderIds[idx],
      userId: req.user.id,
      customer: o.customer,
      product: o.product,
      amount: o.amount,
      status: o.status,
      method: o.method,
    }));

    // Create many transaction
    const created = await prisma.order.createMany({
      data: formattedOrders,
    });

    res.status(201).json({
      success: true,
      count: created.count,
      data: formattedOrders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sync Shopify Orders - Fetch live from Shopify REST API if connected, otherwise fallback to simulation
 */
export const syncShopifyOrders = async (req, res, next) => {
  try {
    // 1. Fetch user to check Shopify credentials
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { shopifyShop: true, shopifyAccessToken: true }
    });

    // 2. If no credentials exist, fallback to simulation/mock sync
    if (!user || !user.shopifyShop || !user.shopifyAccessToken) {
      const mockNames = ['Vikram Malhotra', 'Ananya Iyer', 'Kabir Mehta', 'Ishita Sen'];
      const mockProducts = ['Premium Gaming Mouse RGB', 'Mechanical Keyboard Red Switch', 'USB-C Fast Charging Hub', '1080p Web Camera AutoFocus'];
      const mockAmounts = [3299, 5499, 1899, 4200];
      const mockMethods = ['Prepaid', 'COD'];

      const newSyncCount = 2;
      const syncedOrders = [];

      const orderIds = await generateUniqueOrderIds(newSyncCount);

      for (let i = 0; i < newSyncCount; i++) {
        const idx = Math.floor(Math.random() * mockNames.length);
        const methodIdx = Math.floor(Math.random() * mockMethods.length);
        
        const order = await prisma.order.create({
          data: {
            orderId: orderIds[i],
            userId: req.user.id,
            customer: mockNames[idx],
            product: mockProducts[idx],
            amount: mockAmounts[idx],
            status: 'unfulfilled',
            method: mockMethods[methodIdx],
            tags: ['Shopify', 'Mock'],
          },
        });
        syncedOrders.push(order);
      }

      return res.json({
        success: true,
        message: `Simulation Mode: Synced ${newSyncCount} mock orders. Connect Shopify in Settings > Channels for real sync!`,
        data: syncedOrders,
      });
    }

    // 3. If connected, fetch live orders from Shopify
    const shopifyUrl = `https://${user.shopifyShop}/admin/api/2023-10/orders.json?status=any&fulfillment_status=unfulfilled`;
    
    const shopifyRes = await axios.get(shopifyUrl, {
      headers: {
        'X-Shopify-Access-Token': user.shopifyAccessToken,
        'Content-Type': 'application/json'
      }
    });

    const shopifyOrders = shopifyRes.data.orders || [];
    const syncedOrders = [];
    let newSyncCount = 0;

    for (const shopifyOrder of shopifyOrders) {
      const userPrefix = user.id.slice(-4);
      const orderNum = shopifyOrder.order_number || shopifyOrder.id;
      const uniqueOrderId = `SHPFY-${userPrefix}-${orderNum}`;

      // Check if order already exists in our system
      const existingOrder = await prisma.order.findUnique({
        where: { orderId: uniqueOrderId }
      });

      if (!existingOrder) {
        // Map Shopify order fields to BeeShip schema
        const customerName = [
          shopifyOrder.customer?.first_name,
          shopifyOrder.customer?.last_name
        ].filter(Boolean).join(' ').trim() || shopifyOrder.billing_address?.name || 'Shopify Customer';

        const productNames = shopifyOrder.line_items?.map(item => item.title).join(', ') || 'Shopify Product';

        // Detect if payment method is COD
        const gateway = (shopifyOrder.gateway || '').toLowerCase();
        const paymentGatewayNames = (shopifyOrder.payment_gateway_names || []).map(g => g.toLowerCase());
        const isCOD = gateway.includes('cash') || gateway.includes('cod') || paymentGatewayNames.some(g => g.includes('cash') || g.includes('cod'));
        const method = isCOD ? 'COD' : 'Prepaid';

        // Parse addresses
        const shipAddr = shopifyOrder.shipping_address || shopifyOrder.billing_address || {};
        const billAddr = shopifyOrder.billing_address || shipAddr;

        const shippingCharges = shopifyOrder.shipping_lines ? shopifyOrder.shipping_lines.reduce((total, line) => total + parseFloat(line.price || '0.0'), 0) : 0.0;
        const discount = parseFloat(shopifyOrder.total_discounts || '0.0');
        const taxAmount = parseFloat(shopifyOrder.total_tax || '0.0');

        const order = await prisma.order.create({
          data: {
            orderId: uniqueOrderId,
            userId: req.user.id,
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
            weight: shopifyOrder.total_weight ? parseFloat(shopifyOrder.total_weight) / 1000 : 0.0, // Convert grams to KG
            tags: ['Shopify', ...(shopifyOrder.tags ? shopifyOrder.tags.split(',').map(t => t.trim()) : [])],
            collectableAmount: method === 'COD' ? parseFloat(shopifyOrder.total_price || '0.0') : 0.0
          }
        });

        syncedOrders.push(order);
        newSyncCount++;
      }
    }

    res.json({
      success: true,
      message: `${newSyncCount} new orders synced from Shopify store!`,
      data: syncedOrders,
    });
  } catch (error) {
    console.error('Shopify Sync Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: `Failed to sync Shopify orders: ${error.message}`
    });
  }
};

/**
 * Update Order Tags
 */
export const updateOrderTags = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({ success: false, message: "Tags must be an array of strings" });
    }

    // Verify ownership of the order first
    const order = await prisma.order.findFirst({
      where: { orderId: id, userId: req.user.id },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or access denied" });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { tags },
    });

    res.json({
      success: true,
      message: "Order tags updated successfully",
      order: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing custom order
 */
export const updateOrder = async (req, res, next) => {
  const { id } = req.params;
  const { 
    customer, product, amount, status, method,
    phone, address, pincode, city, state, companyName, gstNumber,
    billingSame, billingAddress, billingPhone, billingPincode, billingCity, billingState, billingCompanyName, billingGstNumber,
    products, shippingCharges, codCharges, discount, taxAmount, weight, length, breadth, height, collectableAmount
  } = req.body;

  try {
    // Verify ownership of the order first
    const existing = await prisma.order.findFirst({
      where: { orderId: id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or access denied',
      });
    }

    const updated = await prisma.order.update({
      where: { id: existing.id },
      data: {
        customer,
        product,
        amount,
        status,
        method,
        phone,
        address,
        pincode,
        city,
        state,
        companyName,
        gstNumber,
        billingSame: billingSame !== undefined ? billingSame : true,
        billingAddress,
        billingPhone,
        billingPincode,
        billingCity,
        billingState,
        billingCompanyName,
        billingGstNumber,
        products: products ? JSON.parse(JSON.stringify(products)) : null,
        shippingCharges: shippingCharges || 0.0,
        codCharges: codCharges || 0.0,
        discount: discount || 0.0,
        taxAmount: taxAmount || 0.0,
        weight: weight || 0.0,
        length,
        breadth,
        height,
        collectableAmount: collectableAmount || 0.0
      },
    });

    // Trigger Order Status Notifications if status has changed
    if (status && status.toLowerCase() !== (existing.status || "").toLowerCase()) {
      await sendOrderStatusNotification(updated, status);
    }

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available courier partners (pluggable API)
 */
export const getCouriers = async (req, res, next) => {
  const { orderId } = req.query;

  try {
    let originPincode = "110001"; // Default pickup warehouse pincode
    let destPincode = "400001"; // Default customer destination pincode
    let weight = 0.5;
    let cod = false;

    // Fetch actual order details if orderId is provided
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          userId: req.user.id,
          OR: [
            { id: orderId },
            { orderId: orderId }
          ]
        }
      });
      if (order) {
        if (order.pincode) destPincode = order.pincode;
        if (order.weight) weight = order.weight;
        cod = order.method === "COD";
      }
    }

    let rates = await shippingService.getLiveRates({
      originPincode,
      destPincode,
      weight,
      cod
    });

    // Fallback if live rates service returned empty list
    if (!rates || rates.length === 0) {
      rates = [
        { id: "delhivery", name: "Delhivery Surface (DS)", price: 78, edd: "3-4 days", avatar: "D", rating: "4.8" },
        { id: "xpressbees", name: "Xpressbees Express", price: 85, edd: "2-3 days", avatar: "X", rating: "4.6" },
        { id: "amazon", name: "Amazon Shipping", price: 92, edd: "2-3 days", avatar: "A", rating: "4.9" },
        { id: "bluedart", name: "Bluedart Surface", price: 110, edd: "1-2 days", avatar: "B", rating: "4.7" }
      ];
    }

    res.json({
      success: true,
      data: rates
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ship order and mark status as fulfilled with courier partner
 */
export const shipOrder = async (req, res, next) => {
  const { id } = req.params;
  const { courierPartner, pickupWarehouse, rtoWarehouse } = req.body;

  try {
    // Verify ownership of the order first by checking both db id and orderId
    const existing = await prisma.order.findFirst({
      where: {
        userId: req.user.id,
        OR: [
          { id: id },
          { orderId: id }
        ]
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or access denied',
      });
    }

    // Call shippingService to book shipment with Delhivery, Xpressbees, Amazon, or Bluedart
    const bookingResult = await shippingService.bookShipment({
      courierPartner,
      order: existing,
      pickupWarehouse,
      rtoWarehouse
    });

    // Update order status, courier vendor, AWB tracking ID, label URL, and selected warehouses
    const updated = await prisma.order.update({
      where: { id: existing.id },
      data: {
        status: 'fulfilled',
        vendor: bookingResult.courierPartner || courierPartner || 'Auto Assigned',
        awbNumber: bookingResult.awbNumber,
        labelUrl: bookingResult.labelUrl,
        pickupWarehouse: pickupWarehouse || 'Primary Warehouse',
        rtoWarehouse: rtoWarehouse || 'Primary Warehouse',
      },
    });

    // Trigger Order Status Notifications for Booked status
    await sendOrderStatusNotification(updated, 'Booked');

    // Push AWB tracking number & fulfillment status back to Shopify if store is connected
    const fullUser = await prisma.user.findUnique({
      where: { id: updated.userId || req.user.id },
      select: { shopifyShop: true, shopifyAccessToken: true }
    });
    updateShopifyOrderFulfillment({ user: fullUser, order: updated }).catch(err => console.warn("Shopify fulfillment sync note:", err.message));

    res.json({
      success: true,
      message: `Order #${id} shipped successfully using ${bookingResult.courierPartner}! Tracking ID (AWB): ${bookingResult.awbNumber}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign vendor to orders (supports bulk or single)
 */
export const assignVendor = async (req, res, next) => {
  try {
    const { orderIds, vendor } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: "orderIds must be a non-empty array of strings" });
    }
    if (!vendor) {
      return res.status(400).json({ success: false, message: "Vendor name must be specified" });
    }

    const cleanIds = orderIds.map(id => id.startsWith("#") ? id.slice(1) : id);

    const updatedResult = await prisma.order.updateMany({
      where: {
        orderId: { in: cleanIds },
        userId: req.user.id
      },
      data: {
        vendor: vendor
      }
    });

    res.json({
      success: true,
      message: `Successfully assigned vendor "${vendor}" to ${updatedResult.count} orders.`,
      count: updatedResult.count
    });
  } catch (error) {
    next(error);
  }
};
