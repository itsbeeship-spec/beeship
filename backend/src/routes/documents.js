import express from 'express';
import multer from 'multer';
import { auth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { cacheMiddleware } from '../middlewares/cache.js';
import { 
  getDocuments, 
  createPresignedUpload, 
  createPresignedDownload, 
  uploadDocumentDirectly,
  presignUploadSchema 
} from '../controllers/documentController.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Apply auth middleware to protect all document operations
router.use(auth);

// GET /api/documents (Cached for 15 seconds)
router.get('/', cacheMiddleware(15), getDocuments);

// POST /api/documents/presign-upload (Validate schema, then generate link)
router.post('/presign-upload', validate(presignUploadSchema), createPresignedUpload);

// GET /api/documents/:id/presign-download
router.get('/:id/presign-download', createPresignedDownload);

// POST /api/documents/upload (Direct multipart upload to S3)
router.post('/upload', upload.single('file'), uploadDocumentDirectly);

export default router;
