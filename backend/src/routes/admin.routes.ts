import { Router } from "express";
import * as admin from "../controllers/admin.controller.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/stats", asyncHandler(admin.dashboardStats));
router.get("/users", asyncHandler(admin.listUsers));
router.get("/loans", asyncHandler(admin.allActiveLoans));

export default router;
