import express from 'express';
import { auth } from '../middlewares/auth.js';
import { 
  getRules, 
  createRule, 
  updateRule, 
  toggleRule, 
  deleteRule 
} from '../controllers/autoAssignRuleController.js';

const router = express.Router();

// GET /api/auto-assign-rules - Retrieve all rules
router.get('/', auth, getRules);

// POST /api/auto-assign-rules - Create new rule
router.post('/', auth, createRule);

// PUT /api/auto-assign-rules/:id - Update rule
router.put('/:id', auth, updateRule);

// PATCH /api/auto-assign-rules/:id/toggle - Toggle enable/disable
router.patch('/:id/toggle', auth, toggleRule);

// DELETE /api/auto-assign-rules/:id - Delete rule
router.delete('/:id', auth, deleteRule);

export default router;
