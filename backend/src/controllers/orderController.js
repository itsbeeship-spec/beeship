import { z } from 'zod';
import axios from 'axios';
import prisma from '../config/db.js';
import redis from '../config/redis.js';
import * as shippingService from '../services/shippingService.js';
import { getDownloadPresignedUrl } from '../config/s3.js';
import { sendOrderStatusNotification } from '../services/notificationService.js';
import { updateShopifyOrderFulfillment, cancelShopifyOrder } from './shopifyController.js';

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

// In-memory cache for presigned S3 label URLs (TTL: 12 hours) to avoid repetitive S3 network calls
const labelUrlCache = new Map();

const signOrderLabelUrl = async (order) => {
  if (!order || !order.labelUrl) return order;
  if (order.labelUrl.includes("X-Amz-Signature") || order.labelUrl.includes("AWSAccessKeyId")) {
    return order;
  }
  const match = order.labelUrl.match(/amazonaws\.com\/(.+)$/);
  const key = match ? match[1] : null;
  if (key) {
    const cached = labelUrlCache.get(key);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      order.labelUrl = cached.url;
      return order;
    }
    try {
      const signedUrl = await getDownloadPresignedUrl(key, 86400);
      labelUrlCache.set(key, { url: signedUrl, expiresAt: now + 12 * 3600 * 1000 });
      order.labelUrl = signedUrl;
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
        where.status = { in: ['fulfilled', 'booked', 'Booked'] };
      } else if (status === 'shipped') {
        where.status = { not: 'unfulfilled' };
      } else if (status === 'cancelled') {
        where.status = { in: ['cancelled', 'Cancelled'] };
      } else if (status === 'ndr') {
        where.status = { in: ['ndr', 'NDR', 'action required', 'action taken', 'Action Required', 'Action Taken', 'exception', 'EXCEPTION'] };
      } else if (status === 'rto') {
        where.status = { in: ['rto', 'RTO'] };
      } else {
        where.status = { equals: status, mode: 'insensitive' };
      }
    } else {
      // Default for Orders Page ("All Orders" tab): Exclude active transit/delivered/completed shipments
      where.status = {
        notIn: ['in transit', 'out for delivery', 'delivered', 'ndr', 'NDR', 'rto', 'RTO']
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
// Resolve zone based on source and destination pincodes
const resolveZone = (src, dest) => {
  src = String(src).trim();
  dest = String(dest).trim();
  if (src === dest) return "withinCity";
  const metroPrefixes = ["110", "400", "560", "700", "600", "500"];
  const srcIsMetro = metroPrefixes.some(p => src.startsWith(p));
  const destIsMetro = metroPrefixes.some(p => dest.startsWith(p));
  if (srcIsMetro && destIsMetro) return "metroToMetro";
  if (dest.startsWith("78") || dest.startsWith("79") || dest.startsWith("18") || dest.startsWith("19")) {
    return "northEastAndJk";
  }
  if (src.slice(0, 2) === dest.slice(0, 2)) return "withinState";
  return "restOfIndia";
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

    // 1. Calculate shipping fee (freight + COD charges) using the zone & weight
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        userId: req.user.id,
        name: pickupWarehouse || "Primary Warehouse"
      }
    });
    const warehousePincode = warehouse?.pincode || "110001";
    const zone = resolveZone(warehousePincode, existing.pincode || "400001");

    const targetCourier = courierPartner || 'Delhivery Surface (DS)';
    const globalRate = await prisma.billingRate.findFirst({
      where: { userId: "GLOBAL", courier: { contains: targetCourier.split(' ')[0] } }
    }) || await prisma.billingRate.findFirst({
      where: { userId: "GLOBAL", courier: "Delhivery Surface (DS)" }
    });

    const userRates = await prisma.billingRate.findMany({
      where: { userId: req.user.id }
    });

    const userRate = userRates.find(r => r.courier !== "ALL" && r.courier !== "All Couriers" && (
      r.courier.trim().toLowerCase() === targetCourier.trim().toLowerCase() ||
      r.courier.toLowerCase().includes(targetCourier.toLowerCase()) ||
      targetCourier.toLowerCase().includes(r.courier.toLowerCase())
    ));

    const allOverride = userRates.find(r => r.courier === "ALL" || r.courier === "All Couriers");
    const rateCard = userRate || allOverride || globalRate;

    let baseFreightPrice = rateCard.withinCity;
    if (zone === "withinState") baseFreightPrice = rateCard.withinState;
    else if (zone === "metroToMetro") baseFreightPrice = rateCard.metroToMetro;
    else if (zone === "restOfIndia") baseFreightPrice = rateCard.restOfIndia;
    else if (zone === "northEastAndJk") baseFreightPrice = rateCard.northEastAndJk;

    const physicalWeight = parseFloat(existing.weight || 0.5);
    const l = parseFloat(existing.length || 0);
    const w = parseFloat(existing.breadth || 0); // breadth is width in order model
    const h = parseFloat(existing.height || 0);
    const volumetricWeight = (l * w * h) / 5000;
    const finalWeight = Math.max(physicalWeight, volumetricWeight);

    const slabs = Math.max(1, Math.ceil(finalWeight / 0.5));
    const freightCharge = baseFreightPrice * slabs;

    let codCharge = 0;
    if (existing.method === "COD") {
      const percentCharge = ((existing.collectableAmount || 0) * rateCard.codPercent) / 100;
      codCharge = Math.max(rateCard.codCharges, percentCharge);
    }

    const totalCost = freightCharge + codCharge;

    // 2. Retrieve current wallet balance and verify sufficient funds
    const aggregateResult = await prisma.walletTransaction.aggregate({
      where: { userId: req.user.id, status: "Success" },
      _sum: { amount: true }
    });
    const currentBalance = 8420.00 + (aggregateResult._sum.amount || 0);

    if (currentBalance < totalCost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Required: ₹${totalCost.toFixed(2)}, Available: ₹${currentBalance.toFixed(2)}. Please recharge your wallet.`
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

    // 3. Deduct shipping charges from wallet
    const txId = "TXN-SHIP-" + Math.floor(100000 + Math.random() * 900000);
    await prisma.walletTransaction.create({
      data: {
        txId,
        type: "shipping",
        awb: bookingResult.awbNumber,
        description: `AWB-${bookingResult.awbNumber} Freight & COD Charges`,
        amount: -totalCost,
        status: "Success",
        userId: req.user.id
      }
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

/**
 * Schedule Pickup for booked shipments (supports single or bulk)
 */
export const schedulePickup = async (req, res, next) => {
  try {
    const { awbNumbers, orderIds } = req.body;
    const targetAwbs = Array.isArray(awbNumbers) ? awbNumbers : [];
    const targetIds = Array.isArray(orderIds) ? orderIds : [];

    if (targetAwbs.length === 0 && targetIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one AWB number or Order ID must be provided to schedule pickup."
      });
    }

    const whereOr = [];
    if (targetAwbs.length > 0) {
      whereOr.push({ awbNumber: { in: targetAwbs } });
    }
    if (targetIds.length > 0) {
      const cleanIds = targetIds.map(id => id.startsWith("#") ? id.slice(1) : id);
      whereOr.push({ orderId: { in: cleanIds } });
    }

    const updateResult = await prisma.order.updateMany({
      where: {
        userId: req.user.id,
        OR: whereOr
      },
      data: {
        status: "pending pickup"
      }
    });

    // Trigger live courier pickup API call (Delhivery / multi-courier)
    try {
      const shippedOrders = await prisma.order.findMany({
        where: {
          userId: req.user.id,
          OR: whereOr
        },
        select: { pickupWarehouse: true, vendor: true }
      });

      const groupedCounts = {};
      shippedOrders.forEach(o => {
        const wh = o.pickupWarehouse || "Primary Warehouse";
        const v = o.vendor || "Delhivery";
        const key = `${v}|||${wh}`;
        groupedCounts[key] = (groupedCounts[key] || 0) + 1;
      });

      Object.entries(groupedCounts).forEach(([key, count]) => {
        const [vendor, wh] = key.split("|||");
        shippingService.requestPickup({ courierPartner: vendor, pickupLocation: wh, packageCount: count })
          .catch(err => console.warn("Pickup request note:", err.message));
      });
    } catch (pickupErr) {
      console.warn("Pickup request trigger note:", pickupErr.message);
    }

    res.json({
      success: true,
      message: `Pickup schedule request successfully processed for ${updateResult.count} shipment(s).`,
      count: updateResult.count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel orders in bulk or single, updating DB and syncing cancellation to Shopify
 */
export const cancelOrders = async (req, res, next) => {
  try {
    const { orderIds, awbNumbers } = req.body;
    const targetAwbs = Array.isArray(awbNumbers) ? awbNumbers : [];
    const targetIds = Array.isArray(orderIds) ? orderIds : [];

    if (targetAwbs.length === 0 && targetIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one Order ID or AWB number must be provided for cancellation."
      });
    }

    const whereOr = [];
    if (targetAwbs.length > 0) {
      whereOr.push({ awbNumber: { in: targetAwbs } });
    }
    if (targetIds.length > 0) {
      const cleanIds = targetIds.map(id => id.startsWith("#") ? id.slice(1) : id);
      whereOr.push({ id: { in: cleanIds } });
      whereOr.push({ orderId: { in: cleanIds } });
    }

    // Find orders to cancel for user & shopify sync
    const ordersToCancel = await prisma.order.findMany({
      where: {
        userId: req.user.id,
        OR: whereOr
      }
    });

    if (ordersToCancel.length === 0) {
      return res.status(404).json({ success: false, message: "No matching orders found to cancel." });
    }

    const orderDbIds = ordersToCancel.map(o => o.id);

    // Update status in PostgreSQL DB to cancelled
    await prisma.order.updateMany({
      where: { id: { in: orderDbIds } },
      data: { status: 'cancelled' }
    });

    // Fetch user for Shopify API sync
    const fullUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { shopifyShop: true, shopifyAccessToken: true }
    });

    // Sync cancellation to Shopify, send notifications, and refund shipping charges
    for (const order of ordersToCancel) {
      sendOrderStatusNotification(order, 'cancelled').catch(err => console.warn("Cancel notification note:", err.message));
      cancelShopifyOrder({ user: fullUser, order }).catch(err => console.warn("Shopify cancel sync note:", err.message));

      // Calculate and issue wallet refund if order was previously shipped/fulfilled
      const refundAmount = (order.shippingCharges || 0) + (order.codCharges || 0);
      if (refundAmount > 0 && order.awbNumber) {
        const existingRefund = await prisma.walletTransaction.findFirst({
          where: {
            userId: req.user.id,
            type: "refund",
            awb: order.awbNumber,
            status: "Success"
          }
        });

        if (!existingRefund) {
          const refundTxId = "TXN-REFUND-" + Math.floor(100000 + Math.random() * 900000);
          await prisma.walletTransaction.create({
            data: {
              txId: refundTxId,
              type: "refund",
              awb: order.awbNumber,
              description: `Refund for Cancelled AWB-${order.awbNumber}`,
              amount: refundAmount,
              status: "Success",
              userId: req.user.id
            }
          });
          console.log(`[Wallet] Refunded ₹${refundAmount} to user ${req.user.id} for AWB ${order.awbNumber}`);
        }
      }
    }

    res.json({
      success: true,
      message: `Successfully cancelled ${ordersToCancel.length} order(s) and synced with Shopify.`,
      count: ordersToCancel.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public Order Tracking Lookup (No auth required)
 */
export const getPublicOrderTracking = async (req, res, next) => {
  const { query } = req.query;

  if (!query || query.trim() === "") {
    return res.status(400).json({ success: false, message: "Tracking query parameter is required." });
  }

  try {
    const cleanQuery = query.trim();

    // Look up order in database by AWB number or Order ID
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { awbNumber: cleanQuery },
          { orderId: cleanQuery },
          { id: cleanQuery }
        ]
      },
      select: {
        orderId: true,
        status: true,
        vendor: true,
        awbNumber: true,
        city: true,
        createdAt: true
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "No active shipment found matching this query." });
    }

    // Capitalize status string dynamically for clean display
    const rawStatus = order.status || "booked";
    const displayStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        status: displayStatus,
        carrier: order.vendor || "Delhivery Surface (DS)",
        awbNumber: order.awbNumber || "-",
        destination: order.city || "-",
        date: order.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit NDR Action (Re-attempt or RTO) for an order
 */
export const submitNDRAction = async (req, res, next) => {
  try {
    const { awbNumber, orderId, action, remark, newPhone, addressNotes } = req.body;

    if (!awbNumber && !orderId) {
      return res.status(400).json({ success: false, message: "AWB number or Order ID is required." });
    }

    const cleanAwb = awbNumber ? String(awbNumber).trim() : null;
    const cleanOrderId = orderId ? String(orderId).replace(/^#/, '').trim() : null;

    // Find order by AWB or Order ID
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(cleanAwb ? [
            { awbNumber: cleanAwb },
            { awbNumber: { equals: cleanAwb, mode: 'insensitive' } }
          ] : []),
          ...(cleanOrderId ? [
            { orderId: cleanOrderId },
            { orderId: { equals: cleanOrderId, mode: 'insensitive' } },
            { orderId: `#${cleanOrderId}` },
            { id: cleanOrderId }
          ] : [])
        ]
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: `Order not found for AWB: ${awbNumber || orderId}` });
    }

    const targetAction = (action || "reattempt").toLowerCase();
    const newStatus = targetAction === "reattempt" ? "Action Taken" : "RTO";

    let noteParts = [];
    if (remark && remark.trim()) noteParts.push(remark.trim());
    if (newPhone && newPhone.trim()) noteParts.push(`Phone: ${newPhone.trim()}`);
    if (addressNotes && addressNotes.trim()) noteParts.push(`Address Note: ${addressNotes.trim()}`);
    
    const noteText = noteParts.length > 0 
      ? noteParts.join(" | ") 
      : (targetAction === "reattempt" ? "Re-attempt requested by seller" : "RTO requested by seller");

    const instructionNote = `NDR_INSTRUCTION: ${noteText}`;
    const existingTags = Array.isArray(order.tags) ? order.tags : [];
    const updatedTags = [...existingTags.filter(t => typeof t === "string" && !t.startsWith("NDR_INSTRUCTION:")), instructionNote];

    // 1. Call Delhivery service to transmit NDR instruction to courier API
    if (order.awbNumber) {
      await shippingService.delhivery.updateNDRAction({
        awbNumber: order.awbNumber,
        action: targetAction,
        remark,
        newPhone,
        addressNotes
      }).catch(err => console.warn("[NDR Action API Note]:", err.message));
    }

    // 2. Update order in database
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        tags: updatedTags,
        ...(newPhone ? { phone: newPhone } : {}),
        ...(addressNotes ? { address: addressNotes } : {})
      }
    });

    return res.status(200).json({
      success: true,
      message: `NDR instruction (${newStatus}) submitted successfully to courier.`,
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

