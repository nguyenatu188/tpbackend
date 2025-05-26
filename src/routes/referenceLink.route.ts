import express from 'express'
import protectRoute from '../middleware/protectRoute.js'
import { addReferenceLink, deleteReferenceLink, getReferenceLinksByTrip } from '../controllers/referenceLink.controller.js'

const router = express.Router()

router.get('/:tripId', protectRoute, getReferenceLinksByTrip)
router.post('/:id', protectRoute, addReferenceLink)
router.delete('/:id', protectRoute, deleteReferenceLink)

export default router
