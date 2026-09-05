import prisma from '../config/db.js';

/**
 * GET /api/reports/analytics
 * Real merchant-level shipping and order analytics
 */
export const getMerchantAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      dateFilter.gte = s;
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      dateFilter.lte = e;
    }

    const where = {
      userId,
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
    };

    // 1. Fetch orders for this merchant within date range
    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        orderId: true,
        amount: true,
        shippingCharges: true,
        codCharges: true,
        status: true,
        method: true,
        vendor: true,
        awbNumber: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    const totalOrders = orders.length;

    // Zero-state check if fresh user has 0 orders
    if (totalOrders === 0) {
      return res.json({
        success: true,
        data: {
          totalOrders: 0,
          totalShipments: 0,
          totalRevenue: 0,
          totalShippingSpend: 0,
          avgDeliveryDays: 0,
          ndrRatio: 0,
          rtoRatio: 0,
          codRatio: 0,
          prepaidRatio: 0,
          statusBreakdown: {
            unfulfilled: 0,
            delivered: 0,
            inTransit: 0,
            outForDelivery: 0,
            pendingPickup: 0,
            ndr: 0,
            rto: 0,
            cancelled: 0,
          },
          courierDistribution: []
        }
      });
    }

    // Counts by method
    let codCount = 0;
    let prepaidCount = 0;
    let totalRevenue = 0;
    let totalShippingSpend = 0;

    // Status counts
    let unfulfilledCount = 0;
    let deliveredCount = 0;
    let inTransitCount = 0;
    let outForDeliveryCount = 0;
    let pendingPickupCount = 0;
    let ndrCount = 0;
    let rtoCount = 0;
    let cancelledCount = 0;

    // Delivery duration calculation for fulfilled/delivered orders
    let totalDeliveryHours = 0;
    let deliveredDurationCount = 0;

    // Courier partner distribution
    const courierMap = {};

    orders.forEach(o => {
      totalRevenue += (o.amount || 0);

      // Method
      if (String(o.method || "").toUpperCase() === 'COD') {
        codCount++;
      } else {
        prepaidCount++;
      }

      // Status classification
      const st = String(o.status || '').toLowerCase().trim();
      const hasAwb = Boolean(o.awbNumber && String(o.awbNumber).trim().length > 0);
      const isShipped = hasAwb || (st !== 'unfulfilled' && st !== 'cancelled');

      if (isShipped) {
        totalShippingSpend += (o.shippingCharges || 0) + (o.codCharges || 0);
      }

      if (st === 'delivered') {
        deliveredCount++;
        const diffMs = new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime();
        if (diffMs > 0) {
          totalDeliveryHours += diffMs / (1000 * 60 * 60);
          deliveredDurationCount++;
        }
      } else if (st === 'out for delivery' || st === 'out_for_delivery') {
        outForDeliveryCount++;
      } else if (st === 'in transit' || st === 'in-transit' || st === 'shipped' || st === 'dispatched') {
        inTransitCount++;
      } else if (st === 'pending pickup' || st === 'pending_pickup' || st === 'booked' || st === 'fulfilled') {
        pendingPickupCount++;
      } else if (st === 'ndr' || st === 'exception' || st.includes('action')) {
        ndrCount++;
      } else if (st.includes('rto')) {
        rtoCount++;
      } else if (st === 'cancelled') {
        cancelledCount++;
      } else if (st === 'unfulfilled') {
        unfulfilledCount++;
      } else {
        // Fallback: If has AWB, it is booked/in transit, otherwise it is unfulfilled
        if (hasAwb) {
          inTransitCount++;
        } else {
          unfulfilledCount++;
        }
      }

      // Courier partner (only for real booked shipments)
      if (isShipped && st !== 'cancelled') {
        const vendorName = o.vendor || 'Delhivery Surface (DS)';
        courierMap[vendorName] = (courierMap[vendorName] || 0) + 1;
      }
    });

    const totalShipments = deliveredCount + inTransitCount + outForDeliveryCount + pendingPickupCount + ndrCount + rtoCount;
    const avgDays = deliveredDurationCount > 0
      ? (totalDeliveryHours / deliveredDurationCount / 24).toFixed(1)
      : 0;

    const ndrRatio = totalShipments > 0
      ? ((ndrCount / totalShipments) * 100).toFixed(1)
      : 0;

    const rtoRatio = totalShipments > 0
      ? ((rtoCount / totalShipments) * 100).toFixed(1)
      : 0;

    const codRatio = totalOrders > 0
      ? Math.round((codCount / totalOrders) * 100)
      : 0;
    const prepaidRatio = totalOrders > 0 ? (100 - codRatio) : 0;

    // Courier list
    const activeShipmentsCount = Object.values(courierMap).reduce((a, b) => a + b, 0);
    const courierDistribution = Object.entries(courierMap).map(([partner, volume]) => ({
      partner,
      volume,
      share: activeShipmentsCount > 0 ? Math.round((volume / activeShipmentsCount) * 100) : 0
    })).sort((a, b) => b.volume - a.volume);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalShipments,
        totalRevenue: Math.round(totalRevenue),
        totalShippingSpend: Math.round(totalShippingSpend),
        avgDeliveryDays: Number(avgDays),
        ndrRatio: Number(ndrRatio),
        rtoRatio: Number(rtoRatio),
        codRatio,
        prepaidRatio,
        statusBreakdown: {
          unfulfilled: unfulfilledCount,
          delivered: deliveredCount,
          inTransit: inTransitCount,
          outForDelivery: outForDeliveryCount,
          pendingPickup: pendingPickupCount,
          ndr: ndrCount,
          rto: rtoCount,
          cancelled: cancelledCount,
        },
        courierDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/export-orders
 * Return JSON order rows for client-side instant reliable CSV creation
 */
export const getMerchantExportOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, status } = req.query;

    const dateFilter = {};
    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      dateFilter.gte = s;
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      dateFilter.lte = e;
    }

    let statusCondition = undefined;
    if (status && status !== 'all') {
      const cleanStatus = status.toLowerCase();
      if (cleanStatus === 'delivered') {
        statusCondition = { equals: 'delivered', mode: 'insensitive' };
      } else if (cleanStatus === 'in transit') {
        statusCondition = { in: ['in transit', 'shipped', 'dispatched'] };
      } else if (cleanStatus === 'out for delivery') {
        statusCondition = { equals: 'out for delivery', mode: 'insensitive' };
      } else if (cleanStatus === 'pending pickup' || cleanStatus === 'booked') {
        statusCondition = { in: ['fulfilled', 'booked', 'pending pickup', 'pickup scheduled', 'pickup_scheduled'] };
      } else if (cleanStatus === 'unfulfilled') {
        statusCondition = { equals: 'unfulfilled', mode: 'insensitive' };
      } else if (cleanStatus === 'ndr') {
        statusCondition = { in: ['ndr', 'exception', 'action required'] };
      } else if (cleanStatus === 'rto') {
        statusCondition = { contains: 'rto', mode: 'insensitive' };
      } else if (cleanStatus === 'cancelled') {
        statusCondition = { in: ['cancelled', 'canceled', 'void'] };
      } else {
        statusCondition = { equals: status, mode: 'insensitive' };
      }
    }

    const where = {
      userId,
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      ...(statusCondition ? { status: statusCondition } : {})
    };

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 2000
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/export
 * Download actual order history CSV report
 */
export const exportMerchantReportCsv = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, status } = req.query;

    const dateFilter = {};
    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      dateFilter.gte = s;
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      dateFilter.lte = e;
    }

    let statusCondition = undefined;
    if (status && status !== 'all') {
      const cleanStatus = status.toLowerCase();
      if (cleanStatus === 'delivered') {
        statusCondition = { equals: 'delivered', mode: 'insensitive' };
      } else if (cleanStatus === 'in transit') {
        statusCondition = { in: ['in transit', 'shipped', 'dispatched'] };
      } else if (cleanStatus === 'out for delivery') {
        statusCondition = { equals: 'out for delivery', mode: 'insensitive' };
      } else if (cleanStatus === 'pending pickup' || cleanStatus === 'booked') {
        statusCondition = { in: ['fulfilled', 'booked', 'pending pickup', 'pickup scheduled', 'pickup_scheduled'] };
      } else if (cleanStatus === 'unfulfilled') {
        statusCondition = { equals: 'unfulfilled', mode: 'insensitive' };
      } else if (cleanStatus === 'ndr') {
        statusCondition = { in: ['ndr', 'exception', 'action required'] };
      } else if (cleanStatus === 'rto') {
        statusCondition = { contains: 'rto', mode: 'insensitive' };
      } else if (cleanStatus === 'cancelled') {
        statusCondition = { in: ['cancelled', 'canceled', 'void'] };
      } else {
        statusCondition = { equals: status, mode: 'insensitive' };
      }
    }

    const where = {
      userId,
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      ...(statusCondition ? { status: statusCondition } : {})
    };

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const headers = [
      'Order ID',
      'AWB Number',
      'Customer',
      'Phone',
      'City',
      'State',
      'Pincode',
      'Payment Method',
      'Order Amount',
      'Shipping Charges',
      'Courier Partner',
      'Status',
      'Date'
    ];

    const rows = orders.map(o => [
      `"${o.orderId}"`,
      `"${o.awbNumber || '-'}"`,
      `"${(o.customer || '').replace(/"/g, '""')}"`,
      `"${o.phone || '-'}"`,
      `"${(o.city || '').replace(/"/g, '""')}"`,
      `"${(o.state || '').replace(/"/g, '""')}"`,
      `"${o.pincode || '-'}"`,
      `"${o.method}"`,
      `"${o.amount}"`,
      `"${(o.shippingCharges || 0) + (o.codCharges || 0)}"`,
      `"${o.vendor || '-'}"`,
      `"${o.status}"`,
      `"${new Date(o.createdAt).toLocaleDateString('en-GB')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="BeeShip_Report_${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

