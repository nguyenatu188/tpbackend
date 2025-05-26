import { Router } from 'express';
import {
  getAllPackingItems,
  getPackingItemsByCategory,
  createPackingItem,
  updatePackingItem,
  deletePackingItem,
} from '../controllers/packingItem.js';

const router = Router();

// Lấy tất cả packing items theo tripId
router.get('/getAllPackingItems', getAllPackingItems);

// Lấy packing items theo categoryId và tripId
router.get('/getPackingItemsByCategory', getPackingItemsByCategory);

// Tạo packing item mới
router.post('/createPackingItem', createPackingItem);

// Cập nhật packing item theo id
router.put('/updatePackingItem/:id', updatePackingItem);

// Xóa packing item theo id
router.delete('/deletePackingItem/:id', deletePackingItem);

export default router;