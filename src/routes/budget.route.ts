import { Router } from "express";
import { getBudget } from "../controllers/budget.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = Router();

// Route: GET /budget?tripId=<tripId>
router.get("/", protectRoute, getBudget);

export default router;