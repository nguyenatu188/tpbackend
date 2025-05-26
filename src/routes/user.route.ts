import express from 'express'
import { searchUsers, getUserProfile, uploadAvatar, updateUserProfile, followUser, unfollowUser, getFollowers, getFollowing } from '../controllers/userController.js'
import protectRoute from '../middleware/protectRoute.js'
import upload from '../middleware/upload.js'

const router = express.Router()

// Gắn route GET /search → gọi hàm searchUsers
router.get('/search', protectRoute,searchUsers)
router.get('/profile/:username', protectRoute, getUserProfile)
router.put('/profile/avatar', protectRoute, upload.single('avatar'), uploadAvatar)
router.put('/profile', protectRoute, updateUserProfile)

router.post('/follow/:userId', protectRoute, followUser)
router.delete('/unfollow/:userId', protectRoute, unfollowUser)
router.get('/followers', protectRoute, getFollowers)
router.get('/following', protectRoute, getFollowing)

export default router
