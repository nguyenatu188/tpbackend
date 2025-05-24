import { Router } from 'express'
import { getAllPackingCategories, createPackingCategory, deletePackingCategory, getPackingCategoriesInTripId } from "../controllers/packingCategory.controller.js"
import protectRoute from '../middleware/protectRoute.js'

const router = Router()

router.get('/getAllPackingCategories', protectRoute, getAllPackingCategories)
router.get('/getPackingCategoriesInTripId', protectRoute, getPackingCategoriesInTripId)
router.post('/createPackingCategory', protectRoute, createPackingCategory)
router.put('/updatePackingCategory/:id', protectRoute, createPackingCategory) 
router.delete('/deletePackingCategory/:id', protectRoute, deletePackingCategory)

export default router
