import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import { getActivitiesByTripId, getPackingItemsByTripId } from '../controllers/tripdetail.controller.js';

const router = express.Router();

// Lấy danh sách activities theo tripId
router.get('/:tripId/activities', protectRoute, getActivitiesByTripId);

//packing items
// Lấy danh sách packing items theo tripId
router.get('/:tripId/packing', protectRoute, getPackingItemsByTripId);
router.post('/:tripId/packing', protectRoute, getPackingItemsByTripId);


export default router;