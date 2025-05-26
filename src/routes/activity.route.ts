import express from 'express'
import { 
  getActivities,
  addActivity,
  updateActivity,
  deleteActivity 
} from '../controllers/activity.controller.js'
import protectRoute from '../middleware/protectRoute.js'

const router = express.Router()

router.get('/:tripId/', protectRoute, getActivities)
router.post('/:tripId/', protectRoute, addActivity)
router.put('/:tripId/:activityId', protectRoute, updateActivity)
router.delete('/:tripId/:activityId', protectRoute, deleteActivity)

export default router
