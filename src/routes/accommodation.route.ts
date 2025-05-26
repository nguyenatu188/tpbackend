import express from "express";
import {
  createAccommodation,
  getAccommodations,
  deleteAccommodation,
  updateAccommodation
} from "../controllers/accommodation.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

// <url>/api/accommodations
// Tạo mới một accommodation (id từ query parameter)
router.post("/createAccommodation", protectRoute, createAccommodation);

// <url>/api/accommodations
// Lấy danh sách accommodations theo tripId
router.get("/getAccommodations", protectRoute, getAccommodations);
// <url>/api/accommodations/updateAccommodation
// Cập nhật một accommodation (id từ query parameter)
router.put("/updateAccommodation", protectRoute, updateAccommodation);

// <url>/api/accommodations/deleteAccommodation
// Xóa một accommodation (id từ query parameter)
router.delete("/deleteAccommodation", protectRoute, deleteAccommodation);

export default router;