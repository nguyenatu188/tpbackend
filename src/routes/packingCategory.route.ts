import { Router } from 'express';
import { getCategoriesByTripId, addPackingCategory, deletePackingCategory } from '../controllers/packingCategory.controller.js';
import protectRoute from '../middleware/protectRoute.js';

const router = Router();

// Get PackingCategories by tripId
router.get('/:tripId', protectRoute, getCategoriesByTripId);

// Add a new PackingCategory
router.post('/', protectRoute, addPackingCategory);

// Delete a PackingCategory by ID
router.delete('/:id', protectRoute, deletePackingCategory);

export default router;