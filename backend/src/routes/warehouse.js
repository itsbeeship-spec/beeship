import express from 'express';
import { auth } from '../middlewares/auth.js';
import {
  getWarehouses,
  addWarehouse,
  setDefaultWarehouse,
  deleteWarehouse,
  updateWarehouse,
} from '../controllers/warehouseController.js';

const router = express.Router();

router.get('/', auth, getWarehouses);
router.post('/', auth, addWarehouse);
router.put('/:id/default', auth, setDefaultWarehouse);
router.put('/:id', auth, updateWarehouse);
router.delete('/:id', auth, deleteWarehouse);

export default router;
