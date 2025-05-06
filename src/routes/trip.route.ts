import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { addNewTrip, deleteTrip, getTripsByUser, updateTripPrivacy } from "../controllers/trip.controller.js"

const router = express.Router()

router.get("/", protectRoute , getTripsByUser)
router.post("/", protectRoute , addNewTrip)
router.delete("/:id", protectRoute, deleteTrip)
router.patch('/:id/privacy', protectRoute ,updateTripPrivacy)

export default router