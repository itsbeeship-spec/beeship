import { z } from 'zod';
import prisma from '../config/db.js';
import { clearCache } from '../middlewares/cache.js';
import { getUploadPresignedUrl, getDownloadPresignedUrl, uploadFileToS3 } from '../config/s3.js';

// Schema validating S3 upload requests
export const presignUploadSchema = z.object({
  body: z.object({
    title: z.string()
      .min(3, 'Title must be at least 3 characters long')
      .max(100, 'Title cannot exceed 100 characters')
      .trim(),
    fileName: z.string()
      .min(3, 'Filename must be at least 3 characters long')
      .regex(/^[\w\-. ]+$/, 'Filename contains invalid or insecure characters') // prevents traversal attacks
      .trim(),
    fileSize: z.number()
      .positive('File size must be greater than 0')
      .max(52428800, 'File size exceeds maximum allowed limit (50MB)'), // 50MB ceiling
    mimeType: z.string().refine((val) => {
      const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'application/json', 'text/plain'];
      return allowed.includes(val);
    }, 'MIME type not allowed. Supported: PDF, PNG, JPEG, JSON, TXT'),
  }),
});

/**
 * Get all document metadata
 */
export const getDocuments = async (req, res, next) => {
  try {
    const {
      search,
      page = '1',
      limit = '10',
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    const where = {
      userId: req.user.id,
    };

    if (search) {
      const searchLower = search.trim();
      where.OR = [
        { title: { contains: searchLower, mode: 'insensitive' } },
        { mimeType: { contains: searchLower, mode: 'insensitive' } },
      ];
    }

    const allowedSortFields = ['createdAt', 'title', 'fileSize', 'mimeType'];
    const orderByField = allowedSortFields.includes(sort) ? sort : 'createdAt';
    const orderByOrder = ['asc', 'desc'].includes(order.toLowerCase()) ? order.toLowerCase() : 'desc';

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { [orderByField]: orderByOrder },
        skip: skipNum,
        take: limitNum,
      }),
      prisma.document.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: documents,
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
 * Generate upload pre-signed link and store document payload in database
 */
export const createPresignedUpload = async (req, res, next) => {
  const { title, fileName, fileSize, mimeType } = req.body;

  try {
    const datePrefix = new Date().toISOString().split('T')[0];
    const userSafeId = req.user.id.substring(0, 8);
    const safeName = fileName.replace(/\s+/g, '-');
    const s3Key = `uploads/${userSafeId}/${datePrefix}-${Date.now()}-${safeName}`;

    // Write database log
    const doc = await prisma.document.create({
      data: {
        title,
        s3Key,
        s3Url: `https://${process.env.AWS_BUCKET_NAME || 'beeship-storage-bucket'}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${s3Key}`,
        fileSize,
        mimeType,
        userId: req.user.id,
      },
    });

    // Create Presigned upload S3 link
    const uploadUrl = await getUploadPresignedUrl(s3Key, mimeType);

    // Invalidate Redis query caches for getDocuments list
    await clearCache('beeship:cache:/api/documents*');

    res.json({
      success: true,
      data: {
        document: doc,
        uploadUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate download pre-signed S3 link for a record
 */
export const createPresignedDownload = async (req, res, next) => {
  const { id } = req.params;

  try {
    const doc = await prisma.document.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: { message: 'Document not found or inaccessible.' },
      });
    }

    const downloadUrl = await getDownloadPresignedUrl(doc.s3Key);

    res.json({
      success: true,
      data: {
        document: doc,
        downloadUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle direct multi-part file upload, uploading buffer to S3
 */
export const uploadDocumentDirectly = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: 'No file uploaded.' },
    });
  }

  try {
    const file = req.file;
    const datePrefix = new Date().toISOString().split('T')[0];
    const userSafeId = req.user.id.substring(0, 8);
    const safeName = file.originalname.replace(/\s+/g, '-');
    const s3Key = `kyc/${userSafeId}/${datePrefix}-${Date.now()}-${safeName}`;

    // Upload directly to S3
    await uploadFileToS3(s3Key, file.buffer, file.mimetype);

    const s3Url = `https://${process.env.AWS_BUCKET_NAME || 'beeship-storage'}.s3.eu-north-1.amazonaws.com/${s3Key}`;

    res.json({
      success: true,
      data: {
        s3Key,
        s3Url,
      },
    });
  } catch (error) {
    next(error);
  }
};
