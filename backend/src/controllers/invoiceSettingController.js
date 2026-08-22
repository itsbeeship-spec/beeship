import prisma from '../config/db.js';
import redis from '../config/redis.js';
import { getDownloadPresignedUrl } from '../config/s3.js';

// Helper to sign S3 URLs if they point to our storage bucket
const signSettingsUrls = async (settings) => {
  if (!settings) return null;
  const copy = { ...settings };
  
  const getPresigned = async (url) => {
    if (!url) return "";
    // If it's already a presigned URL, return as is
    if (url.includes("X-Amz-Signature") || url.includes("AWSAccessKeyId")) {
      return url;
    }
    const match = url.match(/amazonaws\.com\/(.+)$/);
    const key = match ? match[1] : null;
    if (key) {
      try {
        // Sign for 24 hours (86400 seconds)
        return await getDownloadPresignedUrl(key, 86400);
      } catch (err) {
        console.error("Error signing S3 key:", key, err);
      }
    }
    return url;
  };

  copy.logoUrl = await getPresigned(copy.logoUrl);
  copy.signatureUrl = await getPresigned(copy.signatureUrl);
  return copy;
};

/**
 * Get invoice settings for the current user (creates defaults if not found)
 */
export const getInvoiceSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cacheKey = `beeship:settings:invoice:${userId}`;
    let settings = null;

    if (redis && redis.status === 'ready') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        settings = JSON.parse(cached);
      }
    }

    if (!settings) {
      settings = await prisma.invoiceSetting.findUnique({
        where: { userId }
      });

      if (!settings) {
        settings = await prisma.invoiceSetting.create({
          data: {
            userId,
            showCompanyName: true,
            invoicePrefix: "",
            hideConsigneeAddress: false,
            hideWarehouseAddress: false,
            logoUrl: "",
            signatureUrl: "",
            pageSize: "A4"
          }
        });
      }

      if (redis && redis.status === 'ready') {
        await redis.setex(cacheKey, 86400, JSON.stringify(settings)); // 24 hours TTL
      }
    }

    const signedSettings = await signSettingsUrls(settings);

    res.status(200).json({
      success: true,
      data: signedSettings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save or update invoice settings
 */
export const updateInvoiceSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      showCompanyName,
      invoicePrefix,
      hideConsigneeAddress,
      hideWarehouseAddress,
      logoUrl,
      signatureUrl,
      pageSize
    } = req.body;

    const updated = await prisma.invoiceSetting.upsert({
      where: { userId },
      update: {
        showCompanyName: showCompanyName !== undefined ? showCompanyName : true,
        invoicePrefix: invoicePrefix || "",
        hideConsigneeAddress: hideConsigneeAddress !== undefined ? hideConsigneeAddress : false,
        hideWarehouseAddress: hideWarehouseAddress !== undefined ? hideWarehouseAddress : false,
        logoUrl: logoUrl || "",
        signatureUrl: signatureUrl || "",
        pageSize: pageSize || "A4"
      },
      create: {
        userId,
        showCompanyName: showCompanyName !== undefined ? showCompanyName : true,
        invoicePrefix: invoicePrefix || "",
        hideConsigneeAddress: hideConsigneeAddress !== undefined ? hideConsigneeAddress : false,
        hideWarehouseAddress: hideWarehouseAddress !== undefined ? hideWarehouseAddress : false,
        logoUrl: logoUrl || "",
        signatureUrl: signatureUrl || "",
        pageSize: pageSize || "A4"
      }
    });

    if (redis && redis.status === 'ready') {
      const cacheKey = `beeship:settings:invoice:${userId}`;
      await redis.del(cacheKey);
    }

    const signedSettings = await signSettingsUrls(updated);

    res.status(200).json({
      success: true,
      message: "Invoice settings updated successfully.",
      data: signedSettings
    });
  } catch (error) {
    next(error);
  }
};
