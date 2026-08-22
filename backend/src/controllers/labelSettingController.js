import prisma from '../config/db.js';
import redis from '../config/redis.js';
import { getDownloadPresignedUrl } from '../config/s3.js';

// Helper to sign S3 logoUrl if configured
const signLabelLogoUrl = async (settings) => {
  if (!settings) return null;
  const copy = { ...settings };
  if (copy.logoUrl) {
    if (copy.logoUrl.includes("X-Amz-Signature") || copy.logoUrl.includes("AWSAccessKeyId")) {
      return copy;
    }
    const match = copy.logoUrl.match(/amazonaws\.com\/(.+)$/);
    const key = match ? match[1] : null;
    if (key) {
      try {
        copy.logoUrl = await getDownloadPresignedUrl(key, 86400);
      } catch (err) {
        console.error("Error signing S3 key:", key, err);
      }
    }
  }
  return copy;
};

/**
 * Get label settings for the current user (creates defaults if not found)
 */
export const getLabelSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cacheKey = `beeship:settings:label:${userId}`;
    let settings = null;

    if (redis && redis.status === 'ready') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        settings = JSON.parse(cached);
      }
    }

    if (!settings) {
      settings = await prisma.labelSetting.findUnique({
        where: { userId }
      });

      if (!settings) {
        settings = await prisma.labelSetting.create({
          data: {
            userId,
            showLogo: true,
            logoUrl: "",
            useChannelLogo: false,
            showSupportContact: true,
            supportEmail: "",
            supportMobile: "",
            hideCustomerMobile: false,
            hideSku: false,
            hideProduct: false,
            hideQty: false,
            hideTotalAmount: false,
            hideDiscountAmount: false,
            hideOrderAmount: false,
            showCodAmount: true,
            showPrepaidAmount: false,
            trimSkuUpto: 20,
            trimProductNameUpto: 50,
            showLineItemsCount: 5,
            labelSize: "4x6"
          }
        });
      }

      if (redis && redis.status === 'ready') {
        await redis.setex(cacheKey, 86400, JSON.stringify(settings)); // Cache for 24 hours
      }
    }

    const signedSettings = await signLabelLogoUrl(settings);

    res.status(200).json({
      success: true,
      data: signedSettings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save or update label settings
 */
export const updateLabelSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      showLogo,
      logoUrl,
      useChannelLogo,
      showSupportContact,
      supportEmail,
      supportMobile,
      hideCustomerMobile,
      hideSku,
      hideProduct,
      hideQty,
      hideTotalAmount,
      hideDiscountAmount,
      hideOrderAmount,
      showCodAmount,
      showPrepaidAmount,
      trimSkuUpto,
      trimProductNameUpto,
      showLineItemsCount,
      labelSize
    } = req.body;

    const updated = await prisma.labelSetting.upsert({
      where: { userId },
      update: {
        showLogo: showLogo !== undefined ? showLogo : true,
        logoUrl: logoUrl || "",
        useChannelLogo: useChannelLogo !== undefined ? useChannelLogo : false,
        showSupportContact: showSupportContact !== undefined ? showSupportContact : true,
        supportEmail: supportEmail || "",
        supportMobile: supportMobile || "",
        hideCustomerMobile: hideCustomerMobile !== undefined ? hideCustomerMobile : false,
        hideSku: hideSku !== undefined ? hideSku : false,
        hideProduct: hideProduct !== undefined ? hideProduct : false,
        hideQty: hideQty !== undefined ? hideQty : false,
        hideTotalAmount: hideTotalAmount !== undefined ? hideTotalAmount : false,
        hideDiscountAmount: hideDiscountAmount !== undefined ? hideDiscountAmount : false,
        hideOrderAmount: hideOrderAmount !== undefined ? hideOrderAmount : false,
        showCodAmount: showCodAmount !== undefined ? showCodAmount : true,
        showPrepaidAmount: showPrepaidAmount !== undefined ? showPrepaidAmount : false,
        trimSkuUpto: trimSkuUpto !== undefined ? parseInt(trimSkuUpto, 10) : 20,
        trimProductNameUpto: trimProductNameUpto !== undefined ? parseInt(trimProductNameUpto, 10) : 50,
        showLineItemsCount: showLineItemsCount !== undefined ? parseInt(showLineItemsCount, 10) : 5,
        labelSize: labelSize || "4x6"
      },
      create: {
        userId,
        showLogo: showLogo !== undefined ? showLogo : true,
        logoUrl: logoUrl || "",
        useChannelLogo: useChannelLogo !== undefined ? useChannelLogo : false,
        showSupportContact: showSupportContact !== undefined ? showSupportContact : true,
        supportEmail: supportEmail || "",
        supportMobile: supportMobile || "",
        hideCustomerMobile: hideCustomerMobile !== undefined ? hideCustomerMobile : false,
        hideSku: hideSku !== undefined ? hideSku : false,
        hideProduct: hideProduct !== undefined ? hideProduct : false,
        hideQty: hideQty !== undefined ? hideQty : false,
        hideTotalAmount: hideTotalAmount !== undefined ? hideTotalAmount : false,
        hideDiscountAmount: hideDiscountAmount !== undefined ? hideDiscountAmount : false,
        hideOrderAmount: hideOrderAmount !== undefined ? hideOrderAmount : false,
        showCodAmount: showCodAmount !== undefined ? showCodAmount : true,
        showPrepaidAmount: showPrepaidAmount !== undefined ? showPrepaidAmount : false,
        trimSkuUpto: trimSkuUpto !== undefined ? parseInt(trimSkuUpto, 10) : 20,
        trimProductNameUpto: trimProductNameUpto !== undefined ? parseInt(trimProductNameUpto, 10) : 50,
        showLineItemsCount: showLineItemsCount !== undefined ? parseInt(showLineItemsCount, 10) : 5,
        labelSize: labelSize || "4x6"
      }
    });

    if (redis && redis.status === 'ready') {
      const cacheKey = `beeship:settings:label:${userId}`;
      await redis.del(cacheKey);
    }

    const signedSettings = await signLabelLogoUrl(updated);

    res.status(200).json({
      success: true,
      message: "Label settings updated successfully.",
      data: signedSettings
    });
  } catch (error) {
    next(error);
  }
};
