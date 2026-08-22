import express from 'express';
import { auth } from '../middlewares/auth.js';
import { getSellerTickets, createSellerTicket } from '../controllers/supportAdminController.js';

const router = express.Router();

// Apply authentication middleware
router.use(auth);

// GET /api/support/tickets
router.get('/tickets', getSellerTickets);

// POST /api/support/tickets
router.post('/tickets', createSellerTicket);

export default router;
