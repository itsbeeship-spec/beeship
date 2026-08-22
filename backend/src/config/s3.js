import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock-access-key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock-secret-key',
  },
});

/**
 * Generate a pre-signed URL to upload a file directly to S3 from the browser
 */
export const getUploadPresignedUrl = async (key, contentType, expires = 3600) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME || 'beeship-storage-bucket',
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn: expires });
};

/**
 * Generate a pre-signed URL to download/view a file from S3
 */
export const getDownloadPresignedUrl = async (key, expires = 3600) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME || 'beeship-storage-bucket',
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: expires });
};

/**
 * Delete an object from S3
 */
export const deleteFileFromS3 = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME || 'beeship-storage-bucket',
    Key: key,
  });
  return s3Client.send(command);
};

/**
 * Upload raw buffer data directly to S3 from backend
 */
export const uploadFileToS3 = async (key, fileBuffer, contentType) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME || 'beeship-storage-bucket',
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });
  return s3Client.send(command);
};

export default s3Client;
