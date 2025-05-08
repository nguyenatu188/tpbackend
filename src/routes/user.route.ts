import express from 'express';
import { searchUsers, getUserProfile } from '../controllers/userController.js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

// Gắn route GET /search → gọi hàm searchUsers
router.get('/search', protectRoute,searchUsers);
router.get('/profile/:username', protectRoute, getUserProfile);


export default router;
