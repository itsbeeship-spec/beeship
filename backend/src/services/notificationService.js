import prisma from '../config/db.js';

/**
 * Sends order status notification via SMS or WhatsApp if enabled in settings
 * @param {Object} order - The updated Order object from DB
 * @param {String} newStatus - The new status (Booked, In Transit, Out for Delivery, Delivered, Cancelled, NDR)
 */
export const sendOrderStatusNotification = async (order, newStatus) => {
  try {
    if (!order || !order.userId) return;

    // 1. Fetch user's notification preferences
    const settings = await prisma.notificationSetting.findUnique({
      where: { userId: order.userId }
    });

    if (!settings) return; // No settings configured yet, skip sending

    // Map order database status strings to matching settings fields
    const statusMap = {
      'booked': { sms: 'smsBooked', wa: 'waBooked', label: 'Booked' },
      'fulfilled': { sms: 'smsBooked', wa: 'waBooked', label: 'Booked' }, // 'fulfilled' represents booked shipment
      'in transit': { sms: 'smsInTransit', wa: 'waInTransit', label: 'In Transit' },
      'out for delivery': { sms: 'smsOutForDelivery', wa: 'waOutForDelivery', label: 'Out for Delivery' },
      'delivered': { sms: 'smsDelivered', wa: 'waDelivered', label: 'Delivered' },
      'cancelled': { sms: 'smsCancelled', wa: 'waCancelled', label: 'Cancelled' },
      'ndr': { sms: 'smsNdr', wa: 'waNdr', label: 'NDR' },
      'rto': { sms: 'smsRto', wa: 'waRto', label: 'RTO' }
    };

    const statusConfig = statusMap[newStatus.toLowerCase()] || statusMap['booked'];
    const displayStatus = statusConfig.label;

    // Check customer phone number
    const destinationPhone = order.phone || "";
    if (!destinationPhone) {
      console.log(`[Notification Service] Skipping send. Customer phone is missing for Order ID: ${order.orderId}`);
      return;
    }

    // 2. Resolve SMS details
    const smsEnabled = settings[statusConfig.sms];
    if (smsEnabled) {
      const smsBrand = settings.smsUseChannelName ? (order.channel || "BeeShip") : (settings.smsBrandName || "BeeShip");
      const smsText = `Dear ${order.customer}, your order #${order.invoiceNo || order.orderId} from ${smsBrand} is now ${displayStatus}. Track here: https://beeship.in/track/${order.awbNumber || order.orderId}`;
      
      // Execute SMS dispatch
      await sendSmsApi(destinationPhone, smsText, smsBrand);
    }

    // 3. Resolve WhatsApp details
    const waEnabled = settings[statusConfig.wa];
    if (waEnabled) {
      const waBrand = settings.waUseChannelName ? (order.channel || "BeeShip") : (settings.waBrandName || "BeeShip");
      const waText = `Dear ${order.customer}, your order #${order.invoiceNo || order.orderId} from ${waBrand} has been updated to ${displayStatus}. You can track it here: https://beeship.in/track/${order.awbNumber || order.orderId}`;
      
      // Execute WhatsApp dispatch
      await sendWhatsAppApi(destinationPhone, waText, waBrand);
    }

  } catch (error) {
    console.error("[Notification Service] Error executing notifications trigger:", error);
  }
};

/**
 * ==========================================
 * FUTURE API KEY PLACEMENTS
 * ==========================================
 */

/**
 * STUB: SMS Gateway Dispatch (e.g., Msg91, Twilio)
 * TODO FOR USER: Replace this function body to call your actual SMS API service.
 */
const sendSmsApi = async (phone, text, brand) => {
  // 1. Log simulation output in terminal logs
  console.log(`\n--- [SMS TRIGGERED] ---`);
  console.log(`To: ${phone}`);
  console.log(`Brand: ${brand}`);
  console.log(`Message: "${text}"`);
  console.log(`-----------------------\n`);

  /**
   * --- HOW TO CONNECT YOUR REAL SMS API: ---
   * Uncomment and customize the code below when you have API keys.
   * 
   * Example using Axios to hit Msg91/Twilio:
   * 
   * try {
   *   const apiKey = process.env.SMS_GATEWAY_API_KEY;
   *   const response = await axios.post("https://api.msg91.com/api/v5/flow/", {
   *     flow_id: "your_flow_id",
   *     sender: "BEESHIP",
   *     mobiles: phone,
   *     brand: brand,
   *     message: text
   *   }, {
   *     headers: { authkey: apiKey }
   *   });
   *   return response.data;
   * } catch (error) {
   *   console.error("SMS API dispatch failed:", error.response?.data || error.message);
   * }
   */
  return { success: true, provider: "Mock Log" };
};

/**
 * STUB: WhatsApp Business API Dispatch (e.g., Meta WhatsApp Cloud API)
 * TODO FOR USER: Replace this function body to call your actual Meta WhatsApp Cloud API.
 */
const sendWhatsAppApi = async (phone, text, brand) => {
  // 1. Log simulation output in terminal logs
  console.log(`\n--- [WHATSAPP TRIGGERED] ---`);
  console.log(`To: ${phone}`);
  console.log(`Brand: ${brand}`);
  console.log(`Message: "${text}"`);
  console.log(`----------------------------\n`);

  /**
   * --- HOW TO CONNECT YOUR REAL WHATSAPP CLOUD API: ---
   * Uncomment and customize the code below when you have Meta Cloud API access.
   * 
   * Example using Meta HTTP Post request:
   * 
   * try {
   *   const token = process.env.META_WA_ACCESS_TOKEN;
   *   const phoneId = process.env.META_WA_PHONE_NUMBER_ID; // Your single business phone ID
   *   
   *   const response = await axios.post(
   *     `https://graph.facebook.com/v17.0/${phoneId}/messages`,
   *     {
   *       messaging_product: "whatsapp",
   *       to: phone,
   *       type: "template",
   *       template: {
   *         name: "order_status_update", // Pre-approved Meta Template
   *         language: { code: "en_US" },
   *         components: [
   *           {
   *             type: "body",
   *             parameters: [
   *               { type: "text", text: brand },
   *               { type: "text", text: text }
   *             ]
   *           }
   *         ]
   *       }
   *     },
   *     {
   *       headers: { Authorization: `Bearer ${token}` }
   *     }
   *   );
   *   return response.data;
   * } catch (error) {
   *   console.error("WhatsApp API dispatch failed:", error.response?.data || error.message);
   * }
   */
  return { success: true, provider: "Mock Log" };
};
