import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { addNewTrip, deleteTrip, getPublicTripsByUser, getTripsByUser, updateTripPrivacy, updateTripDetails, getTripsByCity, getTripById } from "../controllers/trip.controller.js"

const router = express.Router()

router.get("/", protectRoute , getTripsByUser)
router.post("/", protectRoute , addNewTrip)
router.delete("/:id", protectRoute, deleteTrip)
router.patch('/:id/privacy', protectRoute ,updateTripPrivacy)
router.patch('/:id', protectRoute, updateTripDetails)
router.get("/city", protectRoute, getTripsByCity);
router.get("/:id", protectRoute, getTripById);

export default router
