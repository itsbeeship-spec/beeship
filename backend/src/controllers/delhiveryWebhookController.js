import { PrismaClient } from '@prisma/client';
import { sendOrderStatusNotification } from '../services/notificationService.js';
import { updateShopifyFulfillmentEvent, markShopifyOrderPaid, cancelShopifyOrder } from './shopifyController.js';

const prisma = new PrismaClient();

/**
 * Maps Delhivery / courier status terms to BeeShip's order statuses
 */
export const mapDelhiveryStatus = (delhiveryStatus) => {
  if (!delhiveryStatus) return null;
  const status = String(delhiveryStatus).toLowerCase().trim();

  // NDR (Non Delivery Report / Failed Attempt / Exception)
  if (
    status.includes("ndr") || 
    status.includes("failed delivery attempt") || 
    status.includes("undelivered") ||
    status.includes("failed") ||
    status.includes("attempted") ||
    status.includes("refused") ||
    status.includes("unreachable") ||
    status.includes("door locked") ||
    status.includes("door closed") ||
    status.includes("consignee") ||
    status.includes("address") ||
    status.includes("exception") ||
    status.includes("rescheduled") ||
    status.includes("deferred") ||
    status.includes("phone off") ||
    status === "ex"
  ) {
    return "ndr";
  }

  // Delivered (Must check after undelivered / failed attempt)
  if (status.includes("delivered") || status === "dl") {
    return "delivered";
  }
  
  // Out for Delivery
  if (
    status.includes("out for delivery") || 
    status.includes("out_for_delivery") ||
    status.includes("ofd")
  ) {
    return "out for delivery";
  }

  // In Transit
  if (
    status.includes("in transit") || 
    status.includes("dispatched") || 
    status.includes("shipped") || 
    status.includes("in-transit") || 
    status.includes("transit") ||
    status === "ud"
  ) {
    return "in transit";
  }
  
  // RTO (Returned to Origin)
  if (
    status.includes("rto") || 
    status.includes("returned") || 
    status.includes("return to origin") ||
    status.includes("return_to_origin") ||
    status === "rt"
  ) {
    return "rto";
  }
  
  // Cancelled
  if (status.includes("cancelled") || status.includes("void") || status.includes("canceled")) {
    return "cancelled";
  }
  
  // Pending Pickup
  if (
    status.includes("pending pickup") || 
    status.includes("pickup queued") || 
    status.includes("pickup_scheduled") ||
    status.includes("pickup scheduled")
  ) {
    return "pending pickup";
  }

  // Booked / Manifested (Initial state)
  if (
    status.includes("booked") || 
    status.includes("manifested") ||
    status.includes("created") ||
    status.includes("label generated")
  ) {
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
    } else if (payload.data && Array.isArray(payload.data)) {
      updates = payload.data;
    } else {
      updates = [payload];
    }

    let processedCount = 0;

    for (const update of updates) {
      // Robust field extraction for various payload versions
      const rawAwb = 
        update.AWB || 
        update.awb || 
        update.waybill || 
        update.Waybill || 
        update.wbn || 
        update.Wbn || 
        update.tracking_number || 
        update.trackingNumber || 
        update.Shipment?.AWB || 
        update.Shipment?.awb || 
        update.Shipment?.Waybill || 
        update.Shipment?.waybill;

      const awb = rawAwb ? String(rawAwb).trim() : null;
      
      const statusInfo = 
        update.Status || 
        update.status || 
        update.Shipment?.Status || 
        update.Shipment?.status || 
        update.ScanDetail?.ScanType || 
        update.ScanDetail?.Scan || 
        update.ScanType || 
        update.scan_type;

      let rawStatus = typeof statusInfo === "string" 
        ? statusInfo 
        : (statusInfo?.Status || statusInfo?.status || statusInfo?.Instructions || statusInfo?.instructions || statusInfo?.ScanType || statusInfo?.Scan);

      // Extract additional reason/instructions if available
      const extraReason = update.Instructions || update.instructions || update.Reason || update.reason || update.NdrReason || update.ndrReason;
      if (extraReason && typeof extraReason === "string" && !rawStatus?.toLowerCase().includes(extraReason.toLowerCase())) {
        rawStatus = rawStatus ? `${rawStatus} ${extraReason}` : extraReason;
      }

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
        // Update database order status safely
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: { status: mappedStatus }
        });

        console.log(`[Delhivery Webhook] Order #${order.orderId} status updated from "${currentStatus}" to "${mappedStatus}"`);
        
        // Dispatch notifications safely if active
        try {
          await sendOrderStatusNotification(updatedOrder, mappedStatus);
        } catch (notifErr) {
          console.warn("[Delhivery Webhook] Notification dispatch note:", notifErr.message);
        }

        // Sync live fulfillment tracking event (In Transit, Out for Delivery, Delivered, NDR) back to Shopify
        try {
          const fullUser = await prisma.user.findUnique({
            where: { id: order.userId },
            select: { shopifyShop: true, shopifyAccessToken: true }
          });
          if (fullUser) {
            updateShopifyFulfillmentEvent({ user: fullUser, order: updatedOrder, status: mappedStatus })
              .catch(err => console.warn("[Delhivery Webhook] Shopify event sync note:", err.message));

            // If delivered and method is COD, mark payment as Paid on Shopify
            if (mappedStatus === 'delivered') {
              markShopifyOrderPaid({ user: fullUser, order: updatedOrder })
                .catch(err => console.warn("[Delhivery Webhook] Shopify payment mark note:", err.message));
            }

            // If cancelled by courier, sync cancellation back to Shopify and issue refund
            if (mappedStatus === 'cancelled') {
              cancelShopifyOrder({ user: fullUser, order: updatedOrder })
                .catch(err => console.warn("[Delhivery Webhook] Shopify cancel sync note:", err.message));
            }
          }
        } catch (shopifyErr) {
          console.warn("[Delhivery Webhook] Shopify sync note:", shopifyErr.message);
        }

        // Issue wallet refund if cancelled by courier
        if (mappedStatus === 'cancelled') {
          try {
            const refundAmount = (updatedOrder.shippingCharges || 0) + (updatedOrder.codCharges || 0);
            if (refundAmount > 0 && updatedOrder.awbNumber) {
              const existingRefund = await prisma.walletTransaction.findFirst({
                where: {
                  userId: updatedOrder.userId,
                  type: "refund",
                  awb: updatedOrder.awbNumber,
                  status: "Success"
                }
              });

              if (!existingRefund) {
                const refundTxId = "TXN-REFUND-" + Math.floor(100000 + Math.random() * 900000);
                await prisma.walletTransaction.create({
                  data: {
                    txId: refundTxId,
                    type: "refund",
                    awb: updatedOrder.awbNumber,
                    description: `Refund for Cancelled AWB-${updatedOrder.awbNumber} (via Webhook)`,
                    amount: refundAmount,
                    status: "Success",
                    userId: updatedOrder.userId
                  }
                });
                console.log(`[Wallet Webhook] Refunded ₹${refundAmount} to user ${updatedOrder.userId} for AWB ${updatedOrder.awbNumber}`);
              }
            }
          } catch (refundErr) {
            console.warn("[Delhivery Webhook] Wallet refund note:", refundErr.message);
          }
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
    return res.status(200).json({ success: false, error: error.message });
  }
};

