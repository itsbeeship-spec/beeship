import { PrismaClient } from '@prisma/client';
import { sendOrderStatusNotification } from '../services/notificationService.js';
import { updateShopifyFulfillmentEvent, markShopifyOrderPaid } from './shopifyController.js';

const prisma = new PrismaClient();

/**
 * Maps Delhivery status terms to BeeShip's order statuses
 */
export const mapDelhiveryStatus = (delhiveryStatus) => {
  if (!delhiveryStatus) return null;
  const status = delhiveryStatus.toLowerCase().trim();

  // NDR (Non Delivery Report / Failed Attempt)
  if (
    status.includes("ndr") || 
    status.includes("failed delivery attempt") || 
    status.includes("undelivered") ||
    status.includes("failed")
  ) {
    return "ndr";
  }

  // Delivered (Must check after undelivered)
  if (status.includes("delivered") || status === "dl") {
    return "delivered";
  }
  
  // In Transit
  if (
    status.includes("in transit") || 
    status.includes("dispatched") || 
    status.includes("shipped") || 
    status.includes("in-transit") || 
    status === "ud"
  ) {
    return "in transit";
  }
  
  // Out for Delivery
  if (status.includes("out for delivery") || status.includes("out_for_delivery")) {
    return "out for delivery";
  }
  
  // RTO (Returned to Origin)
  if (
    status.includes("rto") || 
    status.includes("returned") || 
    status.includes("return to origin") ||
    status === "rt"
  ) {
    return "rto";
  }
  
  // Cancelled
  if (status.includes("cancelled") || status.includes("void")) {
    return "cancelled";
  }
  
  // Booked (Initial state)
  if (status.includes("booked") || status.includes("pending") || status.includes("manifested")) {
    return "booked";
  }
  
  return null; 
};

/**
 * Express handler for Delhivery's POST Push Webhook
 */
export const handleDelhiveryWebhook = async (req, res, next) => {
  try {
    const payload = req.body;
    console.log("[Delhivery Webhook] Received payload:", JSON.stringify(payload, null, 2));

    if (!payload) {
      return res.status(400).json({ success: false, message: "Empty payload received" });
    }

    // Standardize payload to an array of updates
    let updates = [];
    if (Array.isArray(payload)) {
      updates = payload;
    } else if (payload.shipments && Array.isArray(payload.shipments)) {
      updates = payload.shipments;
    } else if (payload.Shipment) {
      updates = [payload];
    } else {
      updates = [payload];
    }

    let processedCount = 0;

    for (const update of updates) {
      // Robust field extraction for various payload versions
      const rawAwb = update.AWB || update.awb || update.Shipment?.AWB || update.Shipment?.awb;
      const awb = rawAwb ? String(rawAwb).trim() : null;
      
      const statusInfo = update.Status || update.status || update.Shipment?.Status || update.Shipment?.status;
      const rawStatus = typeof statusInfo === "string" ? statusInfo : (statusInfo?.Status || statusInfo?.status);
      
      if (!awb) {
        console.warn("[Delhivery Webhook] Skipping entry: AWB not found in update", update);
        continue;
      }

      if (!rawStatus) {
        console.warn("[Delhivery Webhook] Skipping entry: Status not found in update", update);
        continue;
      }

      console.log(`[Delhivery Webhook] Processing AWB: ${awb}, Raw Status: ${rawStatus}`);

      // Find the corresponding order by AWB (flexible trim / insensitive match)
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { awbNumber: awb },
            { awbNumber: { equals: awb, mode: 'insensitive' } }
          ]
        }
      });

      if (!order) {
        console.warn(`[Delhivery Webhook] Order not found for AWB: ${awb}`);
        continue;
      }

      const mappedStatus = mapDelhiveryStatus(rawStatus);
      if (!mappedStatus) {
        console.log(`[Delhivery Webhook] Status "${rawStatus}" could not be mapped. Skipping order status update.`);
        continue;
      }

      const currentStatus = order.status;
      if (mappedStatus !== currentStatus) {
        // Update database order status
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: { status: mappedStatus }
        });

        console.log(`[Delhivery Webhook] Order #${order.orderId} status updated from "${currentStatus}" to "${mappedStatus}"`);
        
        // Dispatch notifications if any templates are active
        await sendOrderStatusNotification(updatedOrder, mappedStatus);

        // Sync live fulfillment tracking event (In Transit, Out for Delivery, Delivered) back to Shopify
        const fullUser = await prisma.user.findUnique({
          where: { id: order.userId },
          select: { shopifyShop: true, shopifyAccessToken: true }
        });
        updateShopifyFulfillmentEvent({ user: fullUser, order: updatedOrder, status: mappedStatus })
          .catch(err => console.warn("[Delhivery Webhook] Shopify event sync note:", err.message));

        // If delivered and method is COD, mark payment as Paid on Shopify
        if (mappedStatus === 'delivered') {
          markShopifyOrderPaid({ user: fullUser, order: updatedOrder })
            .catch(err => console.warn("[Delhivery Webhook] Shopify payment mark note:", err.message));
        }
      } else {
        console.log(`[Delhivery Webhook] Order #${order.orderId} is already in status "${currentStatus}". No DB update needed.`);
      }

      processedCount++;
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${processedCount} shipment status updates successfully.`
    });
  } catch (error) {
    console.error("[Delhivery Webhook] Process Error:", error);
    // Send 200/202 to avoid Delhivery retrying endlessly due to a coding crash, but log error
    return res.status(200).json({ success: false, error: error.message });
  }
};
