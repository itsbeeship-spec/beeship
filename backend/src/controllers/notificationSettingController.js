import prisma from '../config/db.js';
import redis from '../config/redis.js';

/**
 * Get notification settings for the current user (creates defaults if not found)
 */
export const getNotificationSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cacheKey = `beeship:settings:notification:${userId}`;
    let settings = null;

    if (redis && redis.status === 'ready') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        settings = JSON.parse(cached);
      }
    }

    if (!settings) {
      settings = await prisma.notificationSetting.findUnique({
        where: { userId }
      });

      if (!settings) {
        settings = await prisma.notificationSetting.create({
          data: {
            userId,
            smsBrandName: "",
            smsUseChannelName: false,
            waBrandName: "",
            waUseChannelName: false,
            smsBooked: true,
            smsInTransit: false,
            smsOutForDelivery: true,
            smsDelivered: true,
            smsCancelled: false,
            smsNdr: true,
            waBooked: false,
            waInTransit: false,
            waOutForDelivery: true,
            waDelivered: false,
            waCancelled: false,
            waNdr: false
          }
        });
      }

      if (redis && redis.status === 'ready') {
        await redis.setex(cacheKey, 86400, JSON.stringify(settings)); // 24 hours TTL
      }
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save or update notification settings
 */
export const updateNotificationSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      smsBrandName,
      smsUseChannelName,
      waBrandName,
      waUseChannelName,
      smsBooked,
      smsInTransit,
      smsOutForDelivery,
      smsDelivered,
      smsCancelled,
      smsNdr,
      waBooked,
      waInTransit,
      waOutForDelivery,
      waDelivered,
      waCancelled,
      waNdr
    } = req.body;

    const updated = await prisma.notificationSetting.upsert({
      where: { userId },
      update: {
        smsBrandName: smsBrandName !== undefined ? smsBrandName : "",
        smsUseChannelName: smsUseChannelName !== undefined ? smsUseChannelName : false,
        waBrandName: waBrandName !== undefined ? waBrandName : "",
        waUseChannelName: waUseChannelName !== undefined ? waUseChannelName : false,
        smsBooked: smsBooked !== undefined ? smsBooked : true,
        smsInTransit: smsInTransit !== undefined ? smsInTransit : false,
        smsOutForDelivery: smsOutForDelivery !== undefined ? smsOutForDelivery : true,
        smsDelivered: smsDelivered !== undefined ? smsDelivered : true,
        smsCancelled: smsCancelled !== undefined ? smsCancelled : false,
        smsNdr: smsNdr !== undefined ? smsNdr : true,
        waBooked: waBooked !== undefined ? waBooked : false,
        waInTransit: waInTransit !== undefined ? waInTransit : false,
        waOutForDelivery: waOutForDelivery !== undefined ? waOutForDelivery : true,
        waDelivered: waDelivered !== undefined ? waDelivered : false,
        waCancelled: waCancelled !== undefined ? waCancelled : false,
        waNdr: waNdr !== undefined ? waNdr : false
      },
      create: {
        userId,
        smsBrandName: smsBrandName !== undefined ? smsBrandName : "",
        smsUseChannelName: smsUseChannelName !== undefined ? smsUseChannelName : false,
        waBrandName: waBrandName !== undefined ? waBrandName : "",
        waUseChannelName: waUseChannelName !== undefined ? waUseChannelName : false,
        smsBooked: smsBooked !== undefined ? smsBooked : true,
        smsInTransit: smsInTransit !== undefined ? smsInTransit : false,
        smsOutForDelivery: smsOutForDelivery !== undefined ? smsOutForDelivery : true,
        smsDelivered: smsDelivered !== undefined ? smsDelivered : true,
        smsCancelled: smsCancelled !== undefined ? smsCancelled : false,
        smsNdr: smsNdr !== undefined ? smsNdr : true,
        waBooked: waBooked !== undefined ? waBooked : false,
        waInTransit: waInTransit !== undefined ? waInTransit : false,
        waOutForDelivery: waOutForDelivery !== undefined ? waOutForDelivery : true,
        waDelivered: waDelivered !== undefined ? waDelivered : false,
        waCancelled: waCancelled !== undefined ? waCancelled : false,
        waNdr: waNdr !== undefined ? waNdr : false
      }
    });

    if (redis && redis.status === 'ready') {
      const cacheKey = `beeship:settings:notification:${userId}`;
      await redis.del(cacheKey);
    }

    res.status(200).json({
      success: true,
      message: "Notification settings updated successfully.",
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
