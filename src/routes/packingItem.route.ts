import { Router } from 'express';
import { getItemsByTripId, addPackingItem, deletePackingItem, getItemsByCategory } from '../controllers/packingItem.controller.js';
import protectRoute from '../middleware/protectRoute.js';

const router = Router();

// Get PackingItems by tripId
router.get('/trip/:tripId', protectRoute, getItemsByTripId);

// Get PackingItems by categoryId
router.get('/category/:categoryId', protectRoute, getItemsByCategory);

// Add a new PackingItem
router.post('/', protectRoute, addPackingItem);

// Delete a PackingItem by ID
router.delete('/:id', protectRoute, deletePackingItem);

export default router;