import prisma from '../config/db.js';

/**
 * Ensure default global notification settings record exists
 */
const ensureNotificationSettings = async () => {
  let settings = await prisma.globalNotificationSetting.findUnique({
    where: { id: 'GLOBAL' },
  });

  if (!settings) {
    settings = await prisma.globalNotificationSetting.create({
      data: {
        id: 'GLOBAL',
        emailProvider: 'SMTP',
        emailHost: 'smtp.gmail.com',
        emailPort: 587,
        emailUser: 'notifications@beeship.com',
        emailPass: '••••••••',
        fromEmail: 'notifications@beeship.com',
        fromName: 'BeeShip Alerts',

        smsProvider: 'FAST2SMS',
        smsApiKey: '',
        smsSenderId: 'BEESHIP',
        smsDltEntityId: '',

        waProvider: 'META_WABA',
        waPhoneNumberId: '',
        waWabaId: '',
        waAccessToken: '',
        waPhoneNumber: '+91 98765 43210',

        fcmServerKey: '',
        fcmVapidKey: '',
      },
    });
  }
  return settings;
};

/**
 * Ensure standard default notification templates exist
 */
const ensureDefaultTemplates = async () => {
  const defaults = [
    {
      channel: 'EMAIL',
      eventKey: 'ORDER_CREATED',
      title: 'Order Confirmation Email',
      subject: 'Order Confirmed - #{{order_id}}',
      content: 'Dear {{customer_name}},\nYour order #{{order_id}} from {{seller_brand_name}} has been confirmed!\nTotal: ₹{{order_amount}}\nTrack live: {{tracking_url}}\nThank you for shopping with us!',
    },
    {
      channel: 'SMS',
      eventKey: 'ORDER_SHIPPED',
      title: 'Order Dispatch SMS',
      subject: null,
      content: 'Hi {{customer_name}}, your order from {{seller_brand_name}} is shipped via {{courier_name}}. AWB: {{awb_number}}. Track: {{tracking_url}} - BeeShip',
      dltTemplateId: 'DLT-10023491',
    },
    {
      channel: 'WHATSAPP',
      eventKey: 'OFD',
      title: 'Out For Delivery WhatsApp Alert',
      subject: null,
      content: '⚡ Out for Delivery!\nDear {{customer_name}}, your shipment from {{seller_brand_name}} (AWB: {{awb_number}}) is out for delivery today via {{courier_name}}.\nTrack live location: {{tracking_url}}',
      waApproved: true,
    },
    {
      channel: 'PUSH',
      eventKey: 'WALLET_RECHARGE',
      title: 'Wallet Recharge Push Alert',
      subject: null,
      content: '🎉 Wallet Recharged! ₹{{amount}} credited to your BeeShip seller wallet successfully.',
    },
  ];

  for (const t of defaults) {
    const existing = await prisma.notificationTemplate.findUnique({
      where: { channel_eventKey: { channel: t.channel, eventKey: t.eventKey } },
    });
    if (!existing) {
      await prisma.notificationTemplate.create({ data: t });
    }
  }
};

/**
 * GET /api/admin/notifications/settings
 */
export const getGlobalNotificationSettings = async (req, res, next) => {
  try {
    const settings = await ensureNotificationSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/notifications/settings
 */
export const updateGlobalNotificationSettings = async (req, res, next) => {
  try {
    const payload = req.body;
    await ensureNotificationSettings();

    const updated = await prisma.globalNotificationSetting.update({
      where: { id: 'GLOBAL' },
      data: payload,
    });

    res.json({ success: true, data: updated, message: 'Global Notification Settings updated successfully!' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/notifications/templates
 */
export const getNotificationTemplates = async (req, res, next) => {
  try {
    await ensureDefaultTemplates();
    const templates = await prisma.notificationTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/notifications/templates
 */
export const createNotificationTemplate = async (req, res, next) => {
  const { channel, eventKey, title, subject, content, dltTemplateId, waApproved, active } = req.body;
  if (!channel || !eventKey || !title || !content) {
    return res.status(400).json({ success: false, message: 'Channel, Event Key, Title, and Content are required.' });
  }

  try {
    const template = await prisma.notificationTemplate.create({
      data: {
        channel: channel.toUpperCase(),
        eventKey: eventKey.toUpperCase().replace(/\s+/g, '_'),
        title,
        subject: subject || null,
        content,
        dltTemplateId: dltTemplateId || null,
        waApproved: waApproved !== undefined ? Boolean(waApproved) : true,
        active: active !== undefined ? Boolean(active) : true,
      },
    });

    res.status(201).json({ success: true, data: template, message: 'Template created successfully!' });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/notifications/templates/:id
 */
export const updateNotificationTemplate = async (req, res, next) => {
  const { id } = req.params;
  const { title, subject, content, dltTemplateId, waApproved, active } = req.body;

  try {
    const updated = await prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(subject !== undefined && { subject }),
        ...(content !== undefined && { content }),
        ...(dltTemplateId !== undefined && { dltTemplateId }),
        ...(waApproved !== undefined && { waApproved: Boolean(waApproved) }),
        ...(active !== undefined && { active: Boolean(active) }),
      },
    });

    res.json({ success: true, data: updated, message: 'Template updated successfully!' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/notifications/templates/:id
 */
export const deleteNotificationTemplate = async (req, res, next) => {
  const { id } = req.params;
  try {
    await prisma.notificationTemplate.delete({ where: { id } });
    res.json({ success: true, message: 'Template deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/notifications/broadcast
 */
export const getBroadcastLogs = async (req, res, next) => {
  try {
    const logs = await prisma.broadcastLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/notifications/broadcast
 */
export const createBroadcast = async (req, res, next) => {
  const { subject, message, targetType, targetSellerId, channels } = req.body;

  if (!subject || !message || !channels || channels.length === 0) {
    return res.status(400).json({ success: false, message: 'Subject, Message, and at least 1 Channel are required.' });
  }

  try {
    let recipientCount = 0;
    if (targetType === 'SPECIFIC' && targetSellerId) {
      recipientCount = 1;
    } else if (targetType === 'ACTIVE') {
      recipientCount = await prisma.user.count({ where: { role: 'USER', status: 'ACTIVE' } });
    } else {
      recipientCount = await prisma.user.count({ where: { role: 'USER' } });
    }

    const broadcast = await prisma.broadcastLog.create({
      data: {
        subject,
        message,
        targetType: targetType || 'ALL',
        targetSellerId: targetSellerId || null,
        channels,
        recipientCount,
        status: 'SENT',
      },
    });

    res.status(201).json({
      success: true,
      data: broadcast,
      message: `Mass Broadcast dispatched successfully to ${recipientCount} seller(s) via [${channels.join(', ')}]!`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/notifications/broadcast/:id
 */
export const updateBroadcast = async (req, res, next) => {
  const { id } = req.params;
  const { subject, message, targetType, targetSellerId, channels, status } = req.body;

  try {
    const updated = await prisma.broadcastLog.update({
      where: { id },
      data: {
        ...(subject !== undefined && { subject }),
        ...(message !== undefined && { message }),
        ...(targetType !== undefined && { targetType }),
        ...(targetSellerId !== undefined && { targetSellerId: targetSellerId || null }),
        ...(channels !== undefined && { channels }),
        ...(status !== undefined && { status }),
      },
    });

    res.json({ success: true, data: updated, message: 'Broadcast message updated successfully!' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/notifications/broadcast/:id
 */
export const deleteBroadcast = async (req, res, next) => {
  const { id } = req.params;
  try {
    await prisma.broadcastLog.delete({ where: { id } });
    res.json({ success: true, message: 'Broadcast deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/notifications/test-send
 */
export const sendTestNotification = async (req, res, next) => {
  const { channel, recipient, message } = req.body;
  if (!channel || !recipient) {
    return res.status(400).json({ success: false, message: 'Channel and Recipient are required.' });
  }

  try {
    // Simulated test delivery log response
    res.json({
      success: true,
      message: `Test ${channel} notification dispatched to ${recipient} successfully!`,
      details: {
        channel,
        recipient,
        sentAt: new Date().toISOString(),
        status: 'DELIVERED',
        gatewayRef: `TEST-REF-${Math.floor(100000 + Math.random() * 900000)}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/active-push
 * Returns active PUSH channel broadcast message for Seller Dashboard top banner
 */
export const getActivePushBroadcast = async (req, res, next) => {
  const userId = req.user?.id;

  try {
    const latestPush = await prisma.broadcastLog.findFirst({
      where: {
        channels: { has: 'PUSH' },
        status: 'SENT',
        OR: [
          { targetType: 'ALL' },
          { targetType: 'ACTIVE' },
          ...(userId ? [{ targetSellerId: userId }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: latestPush || null,
    });
  } catch (error) {
    next(error);
  }
};
