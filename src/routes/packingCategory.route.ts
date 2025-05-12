import { Router } from 'express'
import { getAllPackingCategories, createPackingCategory } from "../controllers/packingCategory.controller.js"
import protectRoute from '../middleware/protectRoute.js'

const router = Router()

router.get('/getAllPackingCategories', protectRoute, getAllPackingCategories)
router.post('/createPackingCategory', protectRoute, createPackingCategory)

export default router
