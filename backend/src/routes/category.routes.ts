import { Router } from "express";
import * as categories from "../controllers/category.controller.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", asyncHandler(categories.listCategories));
router.post("/", requireAuth, requireRole("ADMIN"), asyncHandler(categories.createCategory));
router.delete("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(categories.deleteCategory));

export default router;
